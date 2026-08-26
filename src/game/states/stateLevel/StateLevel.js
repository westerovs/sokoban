import {gsap} from 'gsap'
import Locator from '../../engine/Locator.ts'
import {GAME_STATES} from '../../gameConfig/constants.js'
import BaseState from '../BaseState.js'
import Level from './Level.js'
import LevelView from './LevelView.js'

export default class StateLevel extends BaseState {
  #game = null
  #view = null
  #refs = null
  #controller = null

  constructor(game) {
    super(game)
    this.#game = game
  }

  get initEventName() {
    return GAME_STATES.levelState
  }

  initialize() {
    super.initialize()

    this.game.state = this
    this.game.stateName = this.initEventName

    this.#view = new LevelView(this.#game)
    this.#game.gameContainer.addChild(this.#view)

    this.#game.view = this.#view
    this.#game.refs = this.#view.refs
    this.#refs = this.#view.refs
    this.isInitialized = true
    this.start()
  }

  async start() {
    this.level = new Level(this)
    await this.level.init()
    await Locator.gameResize.resize()
    Locator.soundManager.startLevelMusic()
  }

  runNextLevel = async () => {
    await this.level?.exit()

    this.terminate()
    this.#game.emit(GAME_STATES.levelPreload)
  }

  checkoutState = async (stateName) => {
    super.checkoutState()
    await this.level?.exit()

    this.terminate()
    this.#game.emit(stateName)
  }

  terminate() {
    Locator.soundManager.stopLevelMusic()

    // Общая очистка
    gsap.killTweensOf('*')
    gsap.globalTimeline.clear()
    Locator.uiLayer.destroyStateUiLayerChildren()
    // view destroy
    this.#view.destroy({children: true})
    this.#view = null
    this.#controller = null

    this.isInitialized = false
  }
}
