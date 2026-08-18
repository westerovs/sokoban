import {Graphics} from 'pixi.js'
import {GAME_STATES, WORLD} from '../../../gameConfig/constants.js'
import AdminPanel from './AdminPanel.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'
import LocalStorage from '../../../engine/storage/LocalStorage.js'
import Locator from '../../../engine/Locator.ts'

/*
 * Алгоритм работы: 3 клика по левой, 3 клика по правой, 1 клик по левой.
 * */

export default class AdminPanelButton {
  #game
  #storage
  #gameConfig
  
  #size = 100
  #parent
  #firstButton
  #secondButton
  
  #clicks = []
  #pattern = ['left', 'left', 'left', 'right', 'right', 'right', 'left']
  #resetTimeout = 4000
  #resetTimer = null
  
  constructor(game, storage, gameConfig) {
    this.#game = game
    this.#storage = storage
    this.#gameConfig = gameConfig
    this.#parent = Locator.uiLayer.globalUiLayer
    
    this.#setEvents(true)
    
    // test
    // this.#createAdminPanel()
  }
  
  #createButtons = () => {
    this.#firstButton = this.#createButton(this.#parent, {x: 0, y: WORLD.HEIGHT - this.#size})
    this.#firstButton.on('pointerup', this.#onPointerFirstBtn)
    
    this.#secondButton = this.#createButton(this.#parent, {
      x: Locator.uiLayer.uiData.width - this.#size, y: WORLD.HEIGHT - this.#size
    })
    this.#secondButton.on('pointerup', this.#onPointerSecondBtn)
    
    this.#resize()
  }
  
  #createButton = (parent, {x, y}) => {
    const isVisible = LocalStorage.isDebug ? 0.3 : 0
    
    const button = new Graphics()
    button.alpha = isVisible
    button.rect(0, 0, this.#size, this.#size).fill(0xFF0000)
    button.eventMode = 'static'
    button.position.set(x, y)
    button.label = 'adminBtn'
    this.#parent.addChild(button)
    
    return button
  }
  
  #resize = () => {
    if (!this.#secondButton) return
    this.#secondButton.x = Locator.uiLayer.uiData.width - this.#size
  }
  
  #setEvents = (bool) => {
    const status = bool ? 'on' : 'off'
    
    this.#game[status](GAME_EVENTS.checkoutState, this.#showAndHideButtons)
    this.#game[status](GAME_EVENTS.gameResize, this.#resize)
  }
  
  #showAndHideButtons = () => {
    if (this.#game.currentStateName === GAME_STATES.gameState) {
      this.#createButtons()
      this.#game.on(GAME_EVENTS.gameResize, this.#resize)
    }
    if (this.#game.currentStateName === GAME_STATES.levelState) {
      if (!this.#firstButton && !this.#secondButton) return
      
      this.#firstButton.off('pointerup', this.#onPointerFirstBtn)
      this.#secondButton.off('pointerup', this.#onPointerSecondBtn)
      this.#game.off(GAME_EVENTS.gameResize, this.#resize)
      
      this.#firstButton.destroy()
      this.#secondButton.destroy()
      this.#firstButton = null
      this.#secondButton = null
    }
  }
  
  #onPointerFirstBtn = () => this.#registerClick('left')
  
  #onPointerSecondBtn = () => this.#registerClick('right')
  
  #registerClick(btn) {
    this.#clicks.push(btn)
    
    clearTimeout(this.#resetTimer)
    this.#resetTimer = setTimeout(() => this.#clicks = [], this.#resetTimeout)
    
    if (this.#clicks.length > this.#pattern.length) {
      this.#clicks.shift()
    }
    
    if (this.#clicks.join(',') === this.#pattern.join(',')) {
      this.#clicks = []
      this.#createAdminPanel()
    }
  }
  
  #createAdminPanel = () => {
    new AdminPanel(this.#storage, this.#gameConfig)
  }
}
