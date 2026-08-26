import {gsap} from 'gsap'
import Locator from '../../engine/Locator.ts'
import SdkManager from '../../engine/SdkManager.js'
import {GAME_STATES} from '../../gameConfig/constants.js'
import {GAME_EVENTS} from '../../gameConfig/gameEvents.js'
import MagicDust from '../../ui/common/emitters/magicDust/MagicDust.js'
import BaseState from '../BaseState.js'
import GameView from './GameView.js'
import StartScreen from './startScreen/StartScreen.js'

export default class StateGame extends BaseState {
  #game = null
  #view = null
  #refs = null
  #controller = null
  #soundManager = null

  constructor(game) {
    super(game)
    this.#game = game
  }

  get initEventName() {
    return GAME_STATES.gameState
  }

  initialize() {
    super.initialize()
    this.#view = new GameView(this.#game)
    this.#game.gameContainer.addChild(this.#view)

    this.#game.view = this.#view
    this.#game.refs = this.#view.refs
    this.#refs = this.#view.refs
    this.game.stateName = this.initEventName
    this.isInitialized = true

    this.start()
  }

  async start() {
    this.stateStartScreen = new StartScreen(this)
    await this.stateStartScreen.init()
    await Locator.gameResize.resize()
    this.stateStartScreen.setInteractive(true)
    SdkManager.gameReady()

    new MagicDust(this.game, this.#view).init()
    this.#soundManager = Locator.soundManager
  }

  checkoutState = async (stateName) => {
    super.checkoutState()
    this.terminate()
    this.#game.emit(stateName)
  }

  terminate() {
    // events
    this.#game.emit(GAME_EVENTS.completeLevel)

    // Общая очистка
    gsap.killTweensOf('*')
    gsap.globalTimeline.clear()
    Locator.uiLayer.destroyStateUiLayerChildren()
    // view destroy
    this.#view.destroy({children: true})
    this.#view = null
    this.#controller = null

    if (this.stateStartScreen) {
      this.stateStartScreen?.setInteractive(false)
    }

    this.stateStartScreen = null
    this.isInitialized = false
  }
}
