import Locator from '../../../../engine/Locator.ts'

// todo перенести сюда логику
export default class StateCompleteLevel {
  #game = Locator.game
  #refs = this.#game.refs
  #storage = Locator.storage
  #level
  #stage
  #completeLevel
  #clearLevel
  
  #isLevelCompleted = false
  #isWin = false
  #isFail = false
  
  constructor(level) {
    this.#level = level
    this.#stage = this.#game.app.stage
    
    this.init()
  }
  
  init = () => {

  }
  
  #setEvents = (bool) => {

  }
  
  #runNextPart = async () => {

  }
  
  #winAction = async () => {
 
  }
  
  exit = async () => {

  }
}
