import {Application, EventEmitter} from 'pixi.js'
import GameContainer from '@/game/engine/GameContainer.js'
import UiLayer from '@/game/engine/uiLayer/UiLayer.ts'
// other
import {getGameResolution} from '@/game/gameConfig/resolutionConfig.mjs'
import LiveOpsController from './components/liveOpsController/LiveOpsController.js'
import SoundManager from './engine/audio/SoundManager.js'
import GameResize from './engine/GameResize.ts'
// Services
import Locator, {SERVICES} from './engine/Locator.ts'
import Storage from './engine/storage/Storage.js'
import {GAME_STATES} from './gameConfig/constants.js'
import GameConfig from './gameConfig/GameConfig.js'
import PaymentManager from './modules/PaymentManager.js'
// states
import GamePreload from './states/preload/gamePreload/GamePreload.js'
import LevelPreload from './states/preload/levelPreload/LevelPreload.js'
import StateGame from './states/stateGame/StateGame.js'
import StateLevel from './states/stateLevel/StateLevel.js'
import Options from './ui/common/options/Options.js'
import UIFader from './ui/UIFader.js'

// todo удалить инлайн поля game.refs, game.clearLevelCache

export default class Game extends EventEmitter {
  #app
  #states = []
  #stateAfterPreload = GAME_STATES.gameState
  #gameContainer
  #locale
  #currentStateName
  #adapter
  #view // у каждого стейта есть view-контейнер

  constructor(adapter) {
    super()

    this.#adapter = adapter
    this.#registerServices(adapter)
  }

  get app() {
    return this.#app
  }

  get states() {
    return this.#states
  }

  get gameContainer() {
    return this.#gameContainer
  }

  get stateAfterPreload() {
    return this.#stateAfterPreload
  }

  get locale() {
    return this.#locale
  }

  get currentStateName() {
    return this.#currentStateName
  }

  set currentStateName(stateName) {
    this.#currentStateName = stateName
  }

  get view() {
    return this.#view
  }

  set view(view) {
    this.#view = view
  }

  init = async () => {
    await this.#createApp()

    this.#initResize()
    this.#createGameLayers()

    this.#states = [new GamePreload(this, this.#adapter), new StateGame(this), new LevelPreload(this), new StateLevel(this)]

    this.#start()
  }

  #initResize = () => {
    Locator.register(SERVICES.GAME_RESIZE, new GameResize(this))
  }

  #createApp = async () => {
    this.#app = new Application()

    await this.#app.init({
      resizeTo: window,
      autoDensity: true,
      backgroundColor: 0x000000,
      backgroundAlpha: 1,
      resolution: getGameResolution(window.devicePixelRatio),
      antialias: false,
      preference: 'webgl',
    })

    const wrapper = document.body.querySelector('#canvas-wrapper')
    wrapper.appendChild(this.#app.canvas)
  }

  #createGameLayers = () => {
    this.#gameContainer = new GameContainer(this)
    this.#app.stage.addChild(this.#gameContainer)

    this.#gameContainer.addChild(Locator.uiLayer)
  }

  #registerServices = () => {
    Locator.register(SERVICES.GAME, this)
    Locator.register(SERVICES.UI_LAYER, new UiLayer())
    Locator.register(SERVICES.STORAGE, new Storage(this))
    Locator.register(SERVICES.GAME_CONFIG, new GameConfig())
    Locator.register(SERVICES.PAYMENT_MANAGER, new PaymentManager(this))
    Locator.register(SERVICES.OPTIONS, new Options(this))
    Locator.register(SERVICES.SOUND_MANAGER, new SoundManager(this))
    Locator.register(SERVICES.UI_FADER, new UIFader(this))
    Locator.register(SERVICES.LIVE_OPS, new LiveOpsController())
  }

  #start() {
    this.emit(GAME_STATES.preloadState)
  }
}
