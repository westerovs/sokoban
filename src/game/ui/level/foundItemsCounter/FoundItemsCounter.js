import {Logger, MODULES} from '../../../utils/Logger.js'
import FoundItemsCounterView from './FoundItemsCounterView.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'
import SdkManager from '../../../engine/SdkManager.js'
import Locator from '../../../engine/Locator.ts'

export default class FoundItemsCounter {
  #game = Locator.game
  #refs = this.#game.refs
  #level
  #itemsRemaining = null
  #initItemsValue
  #foundItemsCounterView
  #counterText
  static itemsFound = 0
  
  constructor(level) {
    this.#level = level
    this.config = level.config
    
    this.#initItemsValue = this.#level.getMaxItems()
    this.#itemsRemaining = this.#initItemsValue
    
    this.#init()
  }
  
  static getFoundCount() {
    return FoundItemsCounter.itemsFound
  }
  
  clear = (log) => {
    if (log) Logger.log(MODULES.DestroyMessage,'[LevelCounter] module clear')
    
    this.#setEvents(false)
    this.#game.off(GAME_EVENTS.lvCounterStat, this.#getStats)
    
    this.#initItemsValue = 0
    this.#itemsRemaining = 0
    FoundItemsCounter.itemsFound = 0
    
    this.#clearView()
  }
  
  #init = () => {
    this.#setEvents(true)
    this.#createView()
  }
  
  #createView = () => {
    if (SdkManager.adapter.options.flags) {
      const parent = this.#refs.hudInner
      
      this.#foundItemsCounterView = new FoundItemsCounterView()
      this.#game.refs.foundItemsCounterView = this.#foundItemsCounterView
      parent.addChild(this.#foundItemsCounterView)
      
      this.#counterText = this.#foundItemsCounterView.getChildByLabel('counterText', 1)
      this.#counterText.text = this.#setLevelText(0)
    }
  }
  
  #clearView = () => {
    if (!this.#foundItemsCounterView) return
    
    this.#foundItemsCounterView.visible = false
    this.#counterText.text = ''
  }
  
  #setLevelText = (value) => {
    return value + `/${this.#initItemsValue}`
  }
  
  #setEvents = (bool = true) => {
    const status = bool ? 'on' : 'off'
    
    this.#game[status](GAME_EVENTS.endHit, this.#update)
    this.#game[status](GAME_EVENTS.completePartLevel, this.#reset)
  }
  
  #reset = () => {
    FoundItemsCounter.itemsFound = 0
    this.#initItemsValue = this.#level.getMaxItems()
    this.#itemsRemaining = this.#initItemsValue
    this.#updateView()
  }
  
  #update = () => {
    this.#itemsRemaining--
    FoundItemsCounter.itemsFound++
    
    this.#updateView()
    this.#checkMaxItems()
    this.#game.emit(GAME_EVENTS.lvCounterStat, this.#getStats())
  }
  
  #updateView = () => {
    if (!this.#foundItemsCounterView) return
    this.#counterText.text = this.#setLevelText(FoundItemsCounter.itemsFound)
  }
  
  #getStats = () => {
    return {
      maxItems: this.#level.getMaxItems(),
      itemsRemaining: this.#itemsRemaining,
      itemsFound: FoundItemsCounter.itemsFound,
    }
  }
  
  #checkMaxItems = () => {
    if (FoundItemsCounter.itemsFound >= this.#initItemsValue) {
      this.#game.emit(GAME_EVENTS.allItemsFound)
    }
  }
}
