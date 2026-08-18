import {gsap} from 'gsap'
import {GAME_STYLES} from '@/game/styles.js'
import Locator from '@/game/engine/Locator.js'

export default class UIFader {
  #game
  #refs
  
  constructor(game) {
    this.#game = game
    this.#refs = game.refs
  }
  
  show = async (additionalItems = []) => {
    const targets = [Locator.uiLayer.stateUiLayer, ...additionalItems].filter(Boolean)
    const fade = this.#game?.refs?.fade
    
    await gsap.timeline()
      .to(fade, {alpha: 0})
      .fromTo(targets, {alpha: 0}, {alpha: 1, visible: true}, '<')
      .set(fade, {visible: false})
  }
  
  hide = async (additionalItems = []) => {
    const targets = [Locator.uiLayer.stateUiLayer, ...additionalItems].filter(Boolean)
    const fade = this.#game?.refs?.fade
    
    await gsap.timeline()
      .to(fade, {alpha: GAME_STYLES.fadeHalfAlpha, visible: true})
      .to(targets, {alpha: 0}, '<')
  }
}
