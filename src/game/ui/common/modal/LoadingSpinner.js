import {gsap} from 'gsap'
import {Container, Graphics} from 'pixi.js'
import {popupColors} from '../../../styles.js'

const SHOW_DELAY = 0.15
const ROTATION_DURATION = 0.8

export default class LoadingSpinner extends Container {
  #animation = null

  constructor() {
    super({label: 'modalLoadingSpinner'})

    this.visible = false
    this.#init()
  }

  start() {
    if (this.#animation) return

    this.#animation = gsap.to(this, {
      rotation: Math.PI * 2,
      duration: ROTATION_DURATION,
      delay: SHOW_DELAY,
      ease: 'none',
      repeat: -1,
      onStart: () => (this.visible = true),
    })
  }

  stop() {
    this.#animation?.kill()
    this.#animation = null
    this.rotation = 0
    this.visible = false
  }

  destroy(options) {
    this.stop()
    super.destroy({...options, children: true})
  }

  #init() {
    const arc = new Graphics({label: 'modalLoadingSpinnerArc'})
      .arc(0, 0, 32, -Math.PI / 2, Math.PI / 2)
      .stroke({width: 8, color: popupColors.border, cap: 'round'})

    this.addChild(arc)
  }
}
