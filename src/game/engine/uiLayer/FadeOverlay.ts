import {Graphics} from 'pixi.js'
import type {UiSize} from '@/game/engine/uiLayer/UiLayer'
import {GAME_STYLES} from '@/game/styles'

export default class FadeOverlay extends Graphics {
  readonly #color = 0x000000

  constructor() {
    super()

    this.label = 'uiFade'
    this.eventMode = 'static'
    this.alpha = GAME_STYLES.fadeHalfAlpha
  }

  update = ({width, height}: UiSize) => {
    this.clear().rect(0, 0, width, height).fill(this.#color)
  }
}
