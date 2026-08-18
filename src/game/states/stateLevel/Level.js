import {gsap} from 'gsap'
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
// modules
import ModulesInitializer from '@/game/modules/ModulesInitializer.js'
import StateIntro from '@/game/states/stateLevel/states/intro/StateIntro.js'
import {STOPWATCH_LABELS} from '@/game/ui/level/clock/Stopwatch.js'
import CompleteLevel from '@/game/ui/level/completeLevelScreen/CompleteLevel.js'
import GameUtils, {eventToggle} from '@/game/utils/gameUtils/GameUtils.js'

// todo states
export default class Level {
  #storage = Locator.storage
  #stateIntro
  #clearLevel
  #completeLevel
  #isLevelCompleted = false
  #isWin = false
  #isFail = false
  game = Locator.game
  refs = this.game.refs
  stage = this.game.app.stage
  // managers
  entityManager
  systemManager
  // main components
  storyTextData
  config
  modulesInitializer
  levelConfig

  constructor(state) {
    this.state = state
    this.stage.interactiveChildren = false
    Locator.uiLayer.stateUiLayer.visible = false
    this.game.level = this
    this.game.levelType = null
  }
  
  get aliveTargets() {
    return this.entityManager.createdHogItems
      .filter(item => item.isAlive && item.sprite && item.slotName)
  }
  
  async init() {
    this.#setEvents(true)
    this.#initComponents()
    
    this.config = this.levelConfig.getConfig()
    this.game.levelType = this.config.levelType

    await this.#initEntityManager()
    this.#initSystemManager()
    this.#initModules()
    
    Locator.options.setVisibleToggle(true)
    await this.#stateIntro.execute()

    this.unlockScene()
    SdkManager.gameReady()

    await this.#testing()
  }
  
  unlockScene = () => {
    this.stage.interactiveChildren = true
    this.game.gameContainer.eventMode = 'static'
    Locator.options.view.optionsToggleBtn.eventMode = 'static'
  }
  
  #initComponents = () => {
    this.#stateIntro = new StateIntro(this)
    this.modulesInitializer = new ModulesInitializer()
    this.#clearLevel = new ClearLevel(this)
    this.#completeLevel = new CompleteLevel(this)
    this.levelConfig = new LevelConfig()
    this.storyTextData = LevelConfig.getSpeechAndTextData()
  }
  
  #setEvents = (bool) => {
    const toggle = eventToggle(bool)
    
    this.game[toggle.gameOnOff](GAME_EVENTS.completeLevelWin, this.#winAction)
    this.game[toggle.gameOnOff](GAME_EVENTS.LEVEL.forceNextLevel, this.#forceNextLevel)
  }
  
  #initEntityManager = async () => {
    this.entityManager = new EntityManager(this.config)
    await this.entityManager.createEntities()
  }
  
  #initSystemManager = () => {
    this.systemManager = new SystemManager(this)
    this.systemManager.initSystems()
  }

  #initModules = () => {
    this.modulesInitializer.init({
      stopwatch: {game: this.game, label: STOPWATCH_LABELS.level}
    })
  }
  
  #winAction = async () => {
    if (this.#isFail) return
    if (this.#isLevelCompleted) return
    
    this.#isWin = true
    this.#isLevelCompleted = true
    
    SdkManager.gameplayStop()

    this.game.emit(GAME_EVENTS.completeLevel)
    
    this.systemManager.removeAllSystems()
    
    await Locator.uiFader.hide([this.refs.hudView])
    await GameUtils.showVkOkAdAfterLevelStart()
    
    CrazyGames.showCrazyGamesBanner()
    await new LevelResultsReward().init()
    
    this.#completeLevel.init()
    this.levelConfig.updateSavedLevel()
  }
  
  // exit срабатывает при win и fail, т.к в любом случае очистка уровня
  exit = async (props = {}) => {
    CrazyGames.hideAllAdaptiveBanners()
    SdkManager.gameplayStop()
    await this.game.clearLevelCache()
    
    this.stage.interactiveChildren = false
    
    this.game.emit(GAME_EVENTS.completeLevel, props)
    this.#setEvents(false)
    
    // статистика, если вышли до завершения уровня
    if (!this.#isLevelCompleted) {
      const stopwatch = this.modulesInitializer.getMod('stopwatch')
      const levelPlayTime = stopwatch.seconds
      YaMetrika.earlyExit(this.config, this.#storage, levelPlayTime)
    }
    
    this.refs?.characterSpine?.destroy()
    this.systemManager.removeAllSystems()
    
    this.#clearLevel.clear(this.entityManager.entities, this.systemManager.systems)
  }
  
  #testing = async () => {
    if (LocalStorage.isDebug) {
      if (LocalStorage.testPromo) PromoManager.testRender()
      // this.game.emit(GAME_EVENTS.completeLevelWin)
    }
  }
  
  // debug event
  #forceNextLevel = async () => {
    this.#isWin = true
    this.#isLevelCompleted = true
    this.game.emit(GAME_EVENTS.completeLevel)
    this.systemManager.removeAllSystems()
    
    await Locator.uiFader.hide([this.refs.hudView])
    this.levelConfig.updateSavedLevel()
  }
}
