import YaMetrika from './YaMetrika.js'
import Locator from '../../engine/Locator.ts'
import {GAME_EVENTS} from '../../gameConfig/gameEvents.js'
import {Logger, MODULES} from '../../utils/Logger.js'

// подключается в MetrikaSystem
export default class MetrikaCounter {
  #game = Locator.game
  #hintCounter = 0
  #missClickCounter = 0
  
  init = () => {
    Logger.log(MODULES.Metrika, 'MetrikaCounter init')
    this.#setEvents(true)
  }
  
  destroy = () => {
    Logger.log(MODULES.Metrika, 'destroy')
    
    this.#setEvents(false)
    this.#hintCounter = 0
    this.#missClickCounter = 0
  }
  
  #setEvents = (bool) => {
    const status = bool ? 'on' : 'off'
    
    this.#game[status](GAME_EVENTS.completeLevel, this.#getResult)
    this.#game[status](GAME_EVENTS.STORAGE.usedHint, this.#updateHintCounter)
    this.#game[status](GAME_EVENTS.missClick, this.#updateMissClickCounter)
  }
  
  #getResult = () => {
    YaMetrika.hintCounter(Locator.storage, this.#hintCounter)
    YaMetrika.missClickCounter(Locator.storage, this.#missClickCounter)
  }
  
  #updateHintCounter = () => {
    this.#hintCounter++
  }
  
  #updateMissClickCounter = () => {
    this.#missClickCounter++
  }
}
