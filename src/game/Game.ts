import type {Container} from 'pixi.js'
import {Application, EventEmitter} from 'pixi.js'
import GameContainer from '@/game/engine/GameContainer.js'
import UiLayer from '@/game/engine/uiLayer/UiLayer.ts'
// other
import {getGameResolution} from '@/game/gameConfig/resolutionConfig.js'
import LiveOpsController from './components/liveOpsController/LiveOpsController.js'
import SoundManager from './engine/audio/SoundManager.js'
import GameResize from './engine/GameResize.ts'
// Services
import Locator, {SERVICES} from './engine/Locator.ts'
import type {SdkAdapter} from './engine/sdkTypes.js'
import Storage from './engine/storage/Storage.js'
import {GAME_STATES} from './gameConfig/constants.js'
import GameConfig from './gameConfig/GameConfig.js'
import PaymentManager from './modules/PaymentManager.js'
import type BaseState from './states/BaseState.js'
// states
import GamePreload from './states/preload/gamePreload/GamePreload.js'
import LevelPreload from './states/preload/levelPreload/LevelPreload.js'
import StateGame from './states/stateGame/StateGame.js'
import StateLevel from './states/stateLevel/StateLevel.js'
import Options from './ui/common/options/Options.js'
import UIFader from './ui/UIFader.js'

// Создаёт приложение PixiJS, регистрирует сервисы и запускает игровые состояния.

export default class Game extends EventEmitter {
  refs: Record<string, any> = {}
  level: any = null
  levelType: string | null = null
  state: BaseState | null = null
  stateName: string | undefined
  currentState: BaseState | null = null
  clearLevelCache?: () => void
  #app!: Application
  #states: BaseState[] = []
  #stateAfterPreload = GAME_STATES.levelPreload
  #gameContainer!: GameContainer
  #locale: string | undefined
  #currentStateName: string | undefined
  #adapter: SdkAdapter
  #view!: Container // У каждого состояния есть собственный контейнер представления.
  #shouldOpenSelectedLocation = false

  // Сохраняет платформенный адаптер и регистрирует игровые сервисы.
  constructor(adapter: SdkAdapter) {
    super()

    this.#adapter = adapter
    this.#registerServices()
  }

  // Возвращает приложение PixiJS.
  get app() {
    return this.#app
  }

  // Возвращает зарегистрированные игровые состояния.
  get states() {
    return this.#states
  }

  // Возвращает корневой игровой контейнер.
  get gameContainer() {
    return this.#gameContainer
  }

  // Возвращает состояние, запускаемое после предзагрузки.
  get stateAfterPreload() {
    return this.#stateAfterPreload
  }

  // Возвращает текущую локаль игры.
  get locale() {
    return this.#locale
  }

  // Возвращает имя текущего состояния.
  get currentStateName() {
    return this.#currentStateName
  }

  // Сохраняет имя текущего состояния.
  set currentStateName(stateName: string | undefined) {
    this.#currentStateName = stateName
  }

  // Возвращает контейнер текущего состояния.
  get view() {
    return this.#view
  }

  // Сохраняет контейнер текущего состояния.
  set view(view: Container) {
    this.#view = view
  }

  // Запрашивает открытие выбранной локации при входе в меню.
  requestSelectedLocationOnStart = () => {
    this.#shouldOpenSelectedLocation = true
  }

  // Возвращает и сбрасывает запрос открытия выбранной локации.
  consumeSelectedLocationRequest = () => {
    const shouldOpen = this.#shouldOpenSelectedLocation
    this.#shouldOpenSelectedLocation = false
    return shouldOpen
  }

  // Создаёт приложение, слои и игровые состояния.
  init = async () => {
    await this.#createApp()

    this.#initResize()
    this.#createGameLayers()

    this.#states = [new GamePreload(this, this.#adapter), new StateGame(this), new LevelPreload(this), new StateLevel(this)]

    this.#start()
  }

  // Регистрирует сервис адаптивного изменения размеров.
  #initResize = () => {
    Locator.register(SERVICES.GAME_RESIZE, new GameResize(this))
  }

  // Создаёт и подключает canvas приложения PixiJS.
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

    const wrapper = document.body.querySelector<HTMLDivElement>('#canvas-wrapper')!
    wrapper.appendChild(this.#app.canvas)
  }

  // Создаёт корневые слои игровой сцены.
  #createGameLayers = () => {
    this.#gameContainer = new GameContainer(this)
    this.#app.stage.addChild(this.#gameContainer)

    this.#gameContainer.addChild(Locator.uiLayer)
  }

  // Регистрирует сервисы игры в локаторе.
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

  // Запускает состояние предзагрузки.
  #start() {
    this.emit(GAME_STATES.preloadState)
  }
}
