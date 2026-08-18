import Locator from '../engine/Locator.ts'
import {gsap} from 'gsap'
import i18next from 'i18next'
import SdkManager from '../engine/SdkManager.js'
import {ADAPTER_EVENTS} from '../gameConfig/gameEvents.js'

export default class GamePause {
  #game = Locator.game
  #wrapper
  #canvas
  #isPaused = false
  
  constructor() {
    this.#wrapper = document.querySelector('#canvas-wrapper')
    this.#canvas = this.#wrapper.querySelector('canvas')
    this.#init()
  }
  
  #init = () => {
    this.#setEvents()
  }
  
  #setPause = () => {
    if (this.#isPaused) return
    this.#isPaused = true
    
    if (this.#canvas) this.#canvas.classList.add('game-pause-filter')
    this.#setInteractiveApp(true)
    this.#createTextPause()
    SdkManager.gameplayStop()
  }
  
  #setResume = () => {
    if (!this.#isPaused) return
    this.#isPaused = false
    
    if (this.#canvas) this.#canvas.classList.remove('game-pause-filter')
    setTimeout(() => this.#setInteractiveApp(false), 150)
    
    const textPause = this.#wrapper.querySelector('.game-pause-text')
    if (textPause) textPause.remove()
    
    SdkManager.gameplayStart()
  }
  
  #createTextPause = () => {
    const textPause = document.createElement('p')
    textPause.innerText = `${i18next.t('pause')}`
    textPause.classList.add('game-pause-text')
    this.#wrapper.appendChild(textPause)
  }
  
  #setInteractiveApp = (isPause) => {
    if (isPause) {
      this.#game.app.stop()
      gsap.globalTimeline.pause()
      this.#game.app.stage.interactiveChildren = false
    } else {
      this.#game.app.start()
      gsap.globalTimeline.resume()
      this.#game.app.stage.interactiveChildren = true
    }
  }
  
  #setEvents = () => {
    SdkManager.adapter.on(ADAPTER_EVENTS.PAUSE_EVENT, this.#setPause)
    SdkManager.adapter.on(ADAPTER_EVENTS.RESUME_EVENT, this.#setResume)
  }
}
