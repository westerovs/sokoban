import {gsap} from 'gsap'
import type {Container} from 'pixi.js'
import Locator from '@/game/engine/Locator.js'
import type Game from '@/game/Game.js'
import {GAME_STYLES} from '@/game/styles.js'

// Плавно показывает и скрывает слои игрового интерфейса.

export default class UIFader {
  #game: Game
  #refs: Record<string, any>

  // Сохраняет игру и её ссылки на элементы интерфейса.
  constructor(game: Game) {
    this.#game = game
    this.#refs = game.refs
  }

  // Показывает UI-слой и дополнительные элементы.
  show = async (additionalItems: Container[] = []) => {
    const targets = [Locator.uiLayer.stateUiLayer, ...additionalItems].filter(Boolean)
    const fade = this.#game?.refs?.fade

    await gsap.timeline().to(fade, {alpha: 0}).fromTo(targets, {alpha: 0}, {alpha: 1, visible: true}, '<').set(fade, {visible: false})
  }

  // Скрывает UI-слой и дополнительные элементы.
  hide = async (additionalItems: Container[] = []) => {
    const targets = [Locator.uiLayer.stateUiLayer, ...additionalItems].filter(Boolean)
    const fade = this.#game?.refs?.fade

    await gsap.timeline().to(fade, {alpha: GAME_STYLES.fadeHalfAlpha, visible: true}).to(targets, {alpha: 0}, '<')
  }
}
