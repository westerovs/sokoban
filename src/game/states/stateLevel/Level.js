import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import CrazyGames from '@/game/engine/special/CrazyGames.js'
import LocalStorage from '@/game/engine/storage/LocalStorage.js'
import PromoManager from '@/game/features/promotionCards/PromoManager.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import LevelConfig from '@/game/gameConfig/levels/LevelConfig.js'
import EntityManager from '@/game/levelRuntime/entities/EntityManager.js'
import SystemManager from '@/game/levelRuntime/systems/SystemManager.js'
import ClearLevel from '@/game/modules/ClearLevel.js'
import YaMetrika from '@/game/modules/metrika/YaMetrika.js'
import ModulesInitializer from '@/game/modules/ModulesInitializer.js'
import SokobanGame from '@/game/sokoban/gameplay/SokobanGame.js'
import Confetti from '@/game/ui/common/emitters/confetti/Confetti.js'
import {STOPWATCH_LABELS} from '@/game/ui/level/clock/Stopwatch.js'
import CompleteLevel from '@/game/ui/level/completeLevelScreen/CompleteLevel.js'
import GameUtils, {eventToggle} from '@/game/utils/gameUtils/GameUtils.js'
import StateIntro from './states/intro/StateIntro.js'

/**
 * Координирует жизненный цикл игрового уровня и подключает режим Sokoban.
 */

export default class Level {
  #storage = Locator.storage
  #stateIntro
  #clearLevel
  #completeLevel
  #isLevelCompleted = false
  game = Locator.game
  refs = this.game.refs
  stage = this.game.app.stage
  entityManager
  systemManager
  config
  modulesInitializer
  levelConfig
  sokobanGame

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(state) {
    this.state = state
  }

  // Инициализирует внутреннее состояние и зависимости.
  async init() {
    this.#prepareScene()
    this.#initComponents()
    this.#setEvents(true)
    this.#initConfig()

    await this.#initEntityManager()
    this.#initSystemManager()
    this.#createSokobanGame()
    this.#initModules()
    // this.#hintsController.init()
    await this.#stateIntro.execute()

    this.#unlockScene()
    SdkManager.gameplayStart()
    SdkManager.gameReady()
    this.#testing()
  }

  // Выполняет отдельную операцию `exit`.
  exit = async (props = {}) => {
    CrazyGames.hideAllAdaptiveBanners()
    SdkManager.gameplayStop()
    await this.game.clearLevelCache()

    this.#lockScene()
    this.sokobanGame?.setInputEnabled(false)
    this.game.emit(GAME_EVENTS.completeLevel, props)
    this.#setEvents(false)
    this.#sendEarlyExitMetrika()
    this.#destroyLevel()
  }

  // Выполняет отдельную операцию `prepareScene`.
  #prepareScene() {
    this.#lockScene()
    Locator.uiLayer.stateUiLayer.visible = false
    this.game.level = this
    this.game.levelType = null
  }

  // Выполняет отдельную операцию `lockScene`.
  #lockScene() {
    this.stage.interactiveChildren = false
  }

  // Выполняет отдельную операцию `unlockScene`.
  #unlockScene() {
    this.stage.interactiveChildren = true
    this.game.gameContainer.eventMode = 'static'
    this.sokobanGame.setInputEnabled(true)
  }

  // Выполняет отдельную операцию `initComponents`.
  #initComponents() {
    this.#stateIntro = new StateIntro(this)
    // this.#hintsController = new HintsController(this)
    this.#clearLevel = new ClearLevel(this)
    this.#completeLevel = new CompleteLevel(this)
    new Confetti().init()
    this.modulesInitializer = new ModulesInitializer()
    this.levelConfig = new LevelConfig()
  }

  // Выполняет отдельную операцию `initConfig`.
  #initConfig() {
    this.config = this.levelConfig.getConfig()
    this.game.levelType = this.config.levelType
  }

  // Выполняет отдельную операцию `initEntityManager`.
  async #initEntityManager() {
    this.entityManager = new EntityManager(this.config)
    await this.entityManager.createEntities()
  }

  // Выполняет отдельную операцию `initSystemManager`.
  #initSystemManager() {
    this.systemManager = new SystemManager(this)
    this.systemManager.initSystems()
  }

  // Создаёт данные или представление для операции `createSokobanGame`.
  #createSokobanGame() {
    this.sokobanGame = new SokobanGame({
      map: this.config.map,
      appearance: this.config.appearance,
      levelNumber: this.config.locationLevelNumber,
      pushRecord: this.config.pushRecord,
      canMove: this.#canMove,
      onMove: this.#notifyMove,
      onComplete: this.#requestWin,
    })

    this.refs.sokobanGame = this.sokobanGame
    this.game.view.addChild(this.sokobanGame)
    this.sokobanGame.attachHud()
  }

  // Выполняет отдельную операцию `initModules`.
  #initModules() {
    this.modulesInitializer.init({
      stopwatch: {
        game: this.game,
        label: STOPWATCH_LABELS.level,
      },
    })
  }

  // Обновляет состояние через операцию `setEvents`.
  #setEvents(isEnabled) {
    const toggle = eventToggle(isEnabled)

    this.game[toggle.gameOnOff](GAME_EVENTS.completeLevelWin, this.#winAction)
    this.game[toggle.gameOnOff](GAME_EVENTS.LEVEL.forceNextLevel, this.#forceNextLevel)
    this.game[toggle.gameOnOff](GAME_EVENTS.gameResize, this.#resize)
  }

  // Проверяет условие, описанное операцией `canMove`.
  #canMove = () => {
    return !Locator.options.isVisible
  }

  // Выполняет отдельную операцию `notifyMove`.
  #notifyMove = () => {
    this.game.emit(GAME_EVENTS.startHit)
  }

  // Выполняет отдельную операцию `requestWin`.
  #requestWin = () => {
    this.game.emit(GAME_EVENTS.completeLevelWin)
  }

  // Пересчитывает размеры и расположение представления.
  #resize = () => {
    this.sokobanGame?.resize()
  }

  // Выполняет отдельную операцию `winAction`.
  #winAction = async () => {
    if (this.#isLevelCompleted) return

    this.#isLevelCompleted = true
    this.sokobanGame.setInputEnabled(false)
    this.sokobanGame.hideInterface()
    SdkManager.gameplayStop()
    this.game.emit(GAME_EVENTS.completeLevel)
    this.systemManager.removeAllSystems()

    await GameUtils.showVkOkAdAfterLevelStart()

    CrazyGames.showCrazyGamesBanner()
    // await new LevelResultsReward().init()

    this.game.view.createCompleteLevelView()
    const completionResult = this.levelConfig.updateSavedLevel()
    this.#completeLevel.init(completionResult)
  }

  // Выполняет отдельную операцию `sendEarlyExitMetrika`.
  #sendEarlyExitMetrika() {
    if (this.#isLevelCompleted) return

    const stopwatch = this.modulesInitializer.getMod('stopwatch')
    YaMetrika.earlyExit(this.config, this.#storage, stopwatch?.seconds ?? 0)
  }

  // Выполняет отдельную операцию `destroyLevel`.
  #destroyLevel() {
    this.#destroySokobanGame()
    this.systemManager.removeAllSystems()
    this.#clearLevel.clear(this.entityManager.entities, this.systemManager.systems)
  }

  // Выполняет отдельную операцию `destroySokobanGame`.
  #destroySokobanGame() {
    if (!this.sokobanGame) return

    this.game.view.removeChild(this.sokobanGame)
    this.sokobanGame.destroy({children: true})
    this.sokobanGame = null
    this.refs.sokobanGame = null
  }

  // Выполняет отдельную операцию `testing`.
  #testing() {
    if (!LocalStorage.isDebug) return
    if (LocalStorage.testPromo) PromoManager.testRender()
  }

  // Выполняет отдельную операцию `forceNextLevel`.
  #forceNextLevel = async () => {
    this.#isLevelCompleted = true
    this.sokobanGame.setInputEnabled(false)
    this.game.emit(GAME_EVENTS.completeLevel)
    this.systemManager.removeAllSystems()
    this.#destroySokobanGame()

    this.levelConfig.updateSavedLevel()
  }
}
