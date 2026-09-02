import {gsap} from 'gsap'
import Locator from '../../engine/Locator.ts'
import SdkManager from '../../engine/SdkManager.js'
import {GAME_STATES} from '../../gameConfig/constants.js'
import {GAME_EVENTS} from '../../gameConfig/gameEvents.js'
import MagicDust from '../../ui/common/emitters/magicDust/MagicDust.js'
import BaseState from '../BaseState.js'
import GameView from './GameView.js'
import StartScreen from './startScreen/StartScreen.js'
import type Game from '../../Game.js'
import type SoundManager from '../../engine/audio/SoundManager.js'

// Управляет главным меню игры и переходом к загрузке уровня.

export default class StateGame extends BaseState {
  #game: Game
  #view: GameView | null = null
  #refs: Record<string, any> | null = null
  #controller: unknown = null
  #soundManager: SoundManager | null = null
  stateStartScreen: StartScreen | null = null

  // Сохраняет игру и регистрирует главное состояние.
  constructor(game: Game) {
    super(game)
    this.#game = game
  }

  // Возвращает событие запуска главного состояния.
  get initEventName() {
    return GAME_STATES.gameState
  }

  // Создаёт представление и запускает стартовый экран.
  initialize() {
    super.initialize()
    this.#view = new GameView()
    this.#game.gameContainer.addChild(this.#view)

    this.#game.view = this.#view
    this.#game.refs = this.#view.refs
    this.#refs = this.#view.refs
    this.game.stateName = this.initEventName
    this.isInitialized = true

    this.start()
  }

  // Инициализирует контроллер стартового экрана и сервисы меню.
  async start() {
    this.stateStartScreen = new StartScreen(this)
    await this.stateStartScreen.init()
    await Locator.gameResize.resize()
    this.stateStartScreen.setInteractive(true)
    SdkManager.gameReady()

    new MagicDust(this.game, this.#view!).init()
    this.#soundManager = Locator.soundManager
  }

  // Завершает главное состояние и запускает указанное состояние игры.
  checkoutState = async (stateName = GAME_STATES.levelPreload) => {
    super.checkoutState()
    this.terminate()
    this.#game.emit(stateName)
  }

  // Очищает события, анимации и визуальные элементы главного меню.
  terminate() {
    // events
    this.#game.emit(GAME_EVENTS.completeLevel)

    // Общая очистка
    gsap.killTweensOf('*')
    gsap.globalTimeline.clear()
    Locator.uiLayer.destroyStateUiLayerChildren()
    // view destroy
    this.#view?.destroy({children: true})
    this.#view = null
    this.#controller = null

    this.stateStartScreen?.setInteractive(false)

    this.stateStartScreen = null
    this.isInitialized = false
  }
}
