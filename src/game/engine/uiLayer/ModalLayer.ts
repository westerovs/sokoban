import {Container} from 'pixi.js'
import FadeOverlay from './FadeOverlay.js'
import type {UiSize} from './UiLayer.js'

export default class ModalLayer extends Container {
  #fade!: FadeOverlay
  #view: Container | null = null

  constructor() {
    super({label: 'modalLayer', zIndex: 10})

    this.visible = false
    this.#init()
  }

  get view() {
    return this.#view
  }

  public open = (view: Container) => {
    if (this.#view && this.#view !== view) return false

    this.#view = view
    this.visible = true
    this.#fade.visible = true
    this.addChild(view)

    return true
  }

  public close = (view: Container) => {
    if (this.#view !== view) return

    view.removeFromParent()
    this.#view = null
    this.#fade.visible = false
    this.visible = false
  }

  public resize = (uiSize: UiSize) => {
    this.#fade.update(uiSize)
  }

  #init = () => {
    this.#fade = new FadeOverlay()
    this.#fade.label = 'modalFade'
    this.#fade.visible = false
    this.addChild(this.#fade)
  }
}
