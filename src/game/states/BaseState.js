import {GAME_STATES} from '../gameConfig/constants.js'
import {Logger} from '../utils/Logger.js'
import {GAME_EVENTS} from '../gameConfig/gameEvents.js'
import Locator from '../engine/Locator.ts'

export default class BaseState {
  isInitialized = false
  game = null
  view = null
  
  get initEventName() {
    return GAME_STATES.baseState
  }
  
  constructor(game) {
    this.game = game
    this.game.on(this.initEventName, this.checkInitialize)
  }
  
  checkInitialize = () => {
    if (this.isInitialized) return
    this.initialize()
  }
  
  initialize() {
    this.game.currentStateName = this.initEventName
    this.game.currentState = this
    this.game.emit(GAME_EVENTS.checkoutState, this.initEventName)
  }
  
  checkoutState() {
    Locator.soundManager.stopAll()
    Locator.options.setVisibleToggle(false)
  }
  
  update() {}
  
  resize() {}
  
  terminate() {}
}
