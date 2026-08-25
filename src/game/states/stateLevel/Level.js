import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import CrazyGames from '@/game/engine/special/CrazyGames.js'
import LocalStorage from '@/game/engine/storage/LocalStorage.js'
import LevelResultsReward from '@/game/features/levelResultsReward/LevelResultsReward.js'
import PromoManager from '@/game/features/promotionCards/PromoManager.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import LevelConfig from '@/game/gameConfig/LevelConfig.js'
import EntityManager from '@/game/levelRuntime/entities/EntityManager.js'
import SystemManager from '@/game/levelRuntime/systems/SystemManager.js'
import ClearLevel from '@/game/modules/ClearLevel.js'
import YaMetrika from '@/game/modules/metrika/YaMetrika.js'
import ModulesInitializer from '@/game/modules/ModulesInitializer.js'
import SokobanGame from '@/game/sokoban/SokobanGame.js'
import {STOPWATCH_LABELS} from '@/game/ui/level/clock/Stopwatch.js'
import CompleteLevel from '@/game/ui/level/completeLevelScreen/CompleteLevel.js'
import GameUtils, {eventToggle} from '@/game/utils/gameUtils/GameUtils.js'
import StateIntro from './states/intro/StateIntro.js'

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

  constructor(state) {
    this.state = state
  }

  async init() {
    this.#prepareScene()
    this.#setEvents(true)
    this.#initComponents()
    this.#initConfig()

    await this.#initEntityManager()
    this.#initSystemManager()
    this.#createSokobanGame()
    this.#initModules()
    await this.#stateIntro.execute()

    this.#unlockScene()
    SdkManager.gameplayStart()
    SdkManager.gameReady()
    this.#testing()
  }

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

  #prepareScene() {
    this.#lockScene()
    Locator.uiLayer.stateUiLayer.visible = false
    this.game.level = this
    this.game.levelType = null
  }

  #lockScene() {
    this.stage.interactiveChildren = false
  }

  #unlockScene() {
    this.stage.interactiveChildren = true
    this.game.gameContainer.eventMode = 'static'
    this.sokobanGame.setInputEnabled(true)
  }

  #initComponents() {
    this.#stateIntro = new StateIntro(this)
    this.#clearLevel = new ClearLevel(this)
    this.#completeLevel = new CompleteLevel(this)
    this.modulesInitializer = new ModulesInitializer()
    this.levelConfig = new LevelConfig()
  }

  #initConfig() {
    this.config = this.levelConfig.getConfig()
    this.game.levelType = this.config.levelType
  }

  async #initEntityManager() {
    this.entityManager = new EntityManager(this.config)
    await this.entityManager.createEntities()
  }

  #initSystemManager() {
    this.systemManager = new SystemManager(this)
    this.systemManager.initSystems()
  }

  #createSokobanGame() {
    this.sokobanGame = new SokobanGame({
      map: this.config.map,
      canMove: this.#canMove,
      onMove: this.#notifyMove,
      onComplete: this.#requestWin,
    })
    this.sokobanGame.zIndex = -1

    this.refs.sokobanGame = this.sokobanGame
    this.game.view.addChild(this.sokobanGame)
  }

  #initModules() {
    this.modulesInitializer.init({
      stopwatch: {
        game: this.game,
        label: STOPWATCH_LABELS.level,
      },
    })
  }

  #setEvents(isEnabled) {
    const toggle = eventToggle(isEnabled)

    this.game[toggle.gameOnOff](GAME_EVENTS.completeLevelWin, this.#winAction)
    this.game[toggle.gameOnOff](GAME_EVENTS.LEVEL.forceNextLevel, this.#forceNextLevel)
    this.game[toggle.gameOnOff](GAME_EVENTS.gameResize, this.#resize)
  }

  #canMove = () => {
    return !Locator.options.isVisible
  }

  #notifyMove = () => {
    this.game.emit(GAME_EVENTS.startHit)
  }

  #requestWin = () => {
    this.game.emit(GAME_EVENTS.completeLevelWin)
  }

  #resize = () => {
    this.sokobanGame?.resize()
  }

  #winAction = async () => {
    if (this.#isLevelCompleted) return

    this.#isLevelCompleted = true
    this.sokobanGame.setInputEnabled(false)
    SdkManager.gameplayStop()
    this.game.emit(GAME_EVENTS.completeLevel)
    this.systemManager.removeAllSystems()

    await Locator.uiFader.hide([this.sokobanGame])
    await GameUtils.showVkOkAdAfterLevelStart()

    CrazyGames.showCrazyGamesBanner()
    await new LevelResultsReward().init()

    this.#completeLevel.init()
    this.levelConfig.updateSavedLevel()
  }

  #sendEarlyExitMetrika() {
    if (this.#isLevelCompleted) return

    const stopwatch = this.modulesInitializer.getMod('stopwatch')
    YaMetrika.earlyExit(this.config, this.#storage, stopwatch?.seconds ?? 0)
  }

  #destroyLevel() {
    this.#destroySokobanGame()
    this.systemManager.removeAllSystems()
    this.#clearLevel.clear(this.entityManager.entities, this.systemManager.systems)
  }

  #destroySokobanGame() {
    this.sokobanGame?.destroy({children: true})
    this.sokobanGame = null
    this.refs.sokobanGame = null
  }

  #testing() {
    if (!LocalStorage.isDebug) return
    if (LocalStorage.testPromo) PromoManager.testRender()
  }

  #forceNextLevel = async () => {
    this.#isLevelCompleted = true
    this.sokobanGame.setInputEnabled(false)
    this.game.emit(GAME_EVENTS.completeLevel)
    this.systemManager.removeAllSystems()

    await Locator.uiFader.hide([this.sokobanGame])
    this.levelConfig.updateSavedLevel()
  }
}
