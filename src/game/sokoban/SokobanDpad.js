import {gsap} from 'gsap'
import {Circle, Container, Graphics} from 'pixi.js'

const DPAD_SIZE = 190
const DPAD_RADIUS = DPAD_SIZE / 2
const DPAD_SIDE_PADDING = 34
const DPAD_BOTTOM_PADDING = 110
const BUTTON_DISTANCE = 52
const BUTTON_HIT_RADIUS = 38
const ARROW_COLOR = 0x172b38
const BUTTON_DIRECTIONS = Object.freeze({
  up: Object.freeze({x: 0, y: -BUTTON_DISTANCE, angle: 0}),
  right: Object.freeze({x: BUTTON_DISTANCE, y: 0, angle: Math.PI / 2}),
  down: Object.freeze({x: 0, y: BUTTON_DISTANCE, angle: Math.PI}),
  left: Object.freeze({x: -BUTTON_DISTANCE, y: 0, angle: -Math.PI / 2}),
})

export default class SokobanDpad extends Container {
  #onMove
  #buttons = []
  #pressTimelines = new Map()
  #isEnabled = false

  constructor(onMove) {
    super({label: 'sokoban-dpad', zIndex: 5})

    this.#onMove = onMove
    this.#init()
  }

  setEnabled(isEnabled) {
    this.#isEnabled = isEnabled
    this.#updateInteraction()
  }

  setVisible(isVisible) {
    this.visible = isVisible
    this.#updateInteraction()
  }

  layout({width, height}) {
    const availableSize = Math.min(width, height)
    const displaySize = Math.min(DPAD_SIZE, Math.max(150, availableSize * 0.22))
    const scale = displaySize / DPAD_SIZE

    this.scale.set(scale)
    this.position.set(width - DPAD_SIDE_PADDING - displaySize / 2, height - DPAD_BOTTOM_PADDING - displaySize / 2)
  }

  destroy(options) {
    this.#pressTimelines.forEach((timeline) => timeline.kill())
    this.#pressTimelines.clear()
    super.destroy(options)
  }

  #init() {
    this.addChild(this.#createBackground())
    this.#buttons = Object.entries(BUTTON_DIRECTIONS).map(([direction, layout]) => {
      return this.#createButton(direction, layout)
    })
    this.addChild(...this.#buttons)
    this.#updateInteraction()
  }

  #createBackground() {
    return new Graphics({label: 'sokoban-dpad-background'})
      .circle(0, 0, DPAD_RADIUS)
      .fill({color: 0xf4edc5, alpha: 0.82})
      .stroke({color: 0x172b38, alpha: 0.9, width: 4})
  }

  #createButton(direction, {x, y, angle}) {
    const button = new Container({label: `sokoban-dpad-${direction}`})
    const highlight = new Graphics({label: `sokoban-dpad-${direction}-highlight`}).circle(0, 0, 34).fill(0xf2b632)
    const arrow = new Graphics({label: `sokoban-dpad-${direction}-arrow`})
      .roundRect(-13, -3, 26, 31, 8)
      .fill(0xffffff)
      .poly([0, -30, -25, 0, 25, 0], true)
      .fill(0xffffff)

    highlight.alpha = 0
    arrow.tint = ARROW_COLOR
    button.position.set(x, y)
    button.rotation = angle
    button.hitArea = new Circle(0, 0, BUTTON_HIT_RADIUS)
    button.cursor = 'pointer'
    button.on('pointerdown', (event) => this.#handlePress(event, button, highlight, arrow, direction))
    button.addChild(highlight, arrow)
    return button
  }

  #handlePress(event, button, highlight, arrow, direction) {
    event.stopPropagation()
    this.#animatePress(button, highlight, arrow)
    this.#onMove(direction)
  }

  #animatePress(button, highlight, arrow) {
    this.#pressTimelines.get(button)?.kill()
    highlight.alpha = 0.92
    arrow.tint = 0xffffff
    button.scale.set(1.12)

    const timeline = gsap
      .timeline({onComplete: () => this.#pressTimelines.delete(button)})
      .to(button.scale, {x: 1, y: 1, duration: 0.2, ease: 'power2.out'})
      .set(arrow, {tint: ARROW_COLOR}, 0.22)
      .to(highlight, {alpha: 0, duration: 0.42}, 0.04)

    this.#pressTimelines.set(button, timeline)
  }

  #updateInteraction() {
    const eventMode = this.visible && this.#isEnabled ? 'static' : 'none'

    this.alpha = this.#isEnabled ? 1 : 0.55
    this.#buttons.forEach((button) => {
      button.eventMode = eventMode
    })
  }
}
