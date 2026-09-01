import {gsap} from 'gsap'
import {Circle, Container, Graphics} from 'pixi.js'

/**
 * Отображает экранную крестовину и передаёт удерживаемое направление движения.
 */

const DPAD_SIZE = 190 // Полный размер экранной крестовины
const DPAD_RADIUS = DPAD_SIZE / 2 // Радиус круглой подложки крестовины
const DPAD_SIDE_PADDING = 34 // Отступ крестовины от бокового края
const DPAD_BOTTOM_PADDING = 110 // Отступ крестовины от нижнего края
const BUTTON_DISTANCE = 52 // Расстояние кнопки направления от центра
const BUTTON_HIT_RADIUS = 38 // Радиус области нажатия одной кнопки
const ARROW_COLOR = 0x172b38 // Цвет стрелок управления
const BUTTON_DIRECTIONS = Object.freeze({
  up: Object.freeze({x: 0, y: -BUTTON_DISTANCE, angle: 0}), // Верхняя кнопка и угол её стрелки
  right: Object.freeze({x: BUTTON_DISTANCE, y: 0, angle: Math.PI / 2}), // Правая кнопка и угол её стрелки
  down: Object.freeze({x: 0, y: BUTTON_DISTANCE, angle: Math.PI}), // Нижняя кнопка и угол её стрелки
  left: Object.freeze({x: -BUTTON_DISTANCE, y: 0, angle: -Math.PI / 2}), // Левая кнопка и угол её стрелки
})

export default class SokobanDpad extends Container {
  #onHeldDirectionChange
  #buttons = []
  #pressTimelines = new Map()
  #activePointerId = null
  #activeButtonVisuals = null
  #isEnabled = false

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(onHeldDirectionChange) {
    super({label: 'sokoban-dpad', zIndex: 5})

    this.#onHeldDirectionChange = onHeldDirectionChange
    this.#init()
  }

  // Включает или отключает взаимодействие с элементом.
  setEnabled(isEnabled) {
    this.#isEnabled = isEnabled
    if (!isEnabled) this.#releaseActiveDirection()
    this.#updateInteraction()
  }

  // Изменяет видимость экранной крестовины.
  setVisible(isVisible) {
    this.visible = isVisible
    if (!isVisible) this.#releaseActiveDirection()
    this.#updateInteraction()
  }

  // Рассчитывает и применяет расположение представления.
  layout({width, height}) {
    const availableSize = Math.min(width, height)
    const displaySize = Math.min(DPAD_SIZE, Math.max(150, availableSize * 0.22))
    const scale = displaySize / DPAD_SIZE

    this.scale.set(scale)
    this.position.set(width - DPAD_SIDE_PADDING - displaySize / 2, height - DPAD_BOTTOM_PADDING - displaySize / 2)
  }

  // Освобождает обработчики, анимации и ресурсы экземпляра.
  destroy(options) {
    this.#releaseActiveDirection()
    this.#pressTimelines.forEach((timeline) => timeline.kill())
    this.#pressTimelines.clear()
    super.destroy(options)
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init() {
    this.addChild(this.#createBackground())
    this.#buttons = Object.entries(BUTTON_DIRECTIONS).map(([direction, layout]) => {
      return this.#createButton(direction, layout)
    })
    this.addChild(...this.#buttons)
    this.#updateInteraction()
  }

  // Создаёт круглую подложку экранной крестовины.
  #createBackground() {
    return new Graphics({label: 'sokoban-dpad-background'})
      .circle(0, 0, DPAD_RADIUS)
      .fill({color: 0xf4edc5, alpha: 0.82})
      .stroke({color: 0x172b38, alpha: 0.9, width: 4})
  }

  // Создаёт интерактивную кнопку с заданной иконкой.
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
    button.on('pointerup', (event) => this.#handleRelease(event))
    button.on('pointerupoutside', (event) => this.#handleRelease(event))
    button.on('pointercancel', (event) => this.#handleRelease(event))
    button.addChild(highlight, arrow)
    return button
  }

  // Активирует направление выбранной кнопки крестовины.
  #handlePress(event, button, highlight, arrow, direction) {
    event.stopPropagation()
    if (this.#activePointerId !== null) return

    this.#activePointerId = event.pointerId
    this.#activeButtonVisuals = {button, highlight, arrow}
    this.#animatePress(button, highlight, arrow)
    this.#onHeldDirectionChange(direction)
  }

  // Завершает активное нажатие крестовины.
  #handleRelease(event) {
    event.stopPropagation()
    if (event.pointerId !== this.#activePointerId) return

    this.#releaseActiveDirection()
  }

  // Сбрасывает активную кнопку и удерживаемое направление.
  #releaseActiveDirection() {
    if (this.#activePointerId === null) return

    const activeButtonVisuals = this.#activeButtonVisuals
    this.#activePointerId = null
    this.#activeButtonVisuals = null
    this.#animateRelease(activeButtonVisuals)
    this.#onHeldDirectionChange(null)
  }

  // Анимирует нажатие кнопки направления.
  #animatePress(button, highlight, arrow) {
    this.#pressTimelines.get(button)?.kill()
    highlight.alpha = 0.92
    arrow.tint = 0xffffff
    button.scale.set(1.12)

    const timeline = gsap
      .timeline({onComplete: () => this.#pressTimelines.delete(button)})
      .to(button.scale, {x: 1, y: 1, duration: 0.2, ease: 'power2.out'})

    this.#pressTimelines.set(button, timeline)
  }

  // Возвращает кнопку направления в обычное состояние.
  #animateRelease(activeButtonVisuals) {
    if (!activeButtonVisuals) return

    const {button, highlight, arrow} = activeButtonVisuals
    this.#pressTimelines.get(button)?.kill()
    arrow.tint = ARROW_COLOR

    const timeline = gsap
      .timeline({onComplete: () => this.#pressTimelines.delete(button)})
      .to(button.scale, {x: 1, y: 1, duration: 0.12, ease: 'power2.out'}, 0)
      .to(highlight, {alpha: 0, duration: 0.18, ease: 'power2.out'}, 0)

    this.#pressTimelines.set(button, timeline)
  }

  // Обновляет интерактивность всех кнопок крестовины.
  #updateInteraction() {
    const eventMode = this.visible && this.#isEnabled ? 'static' : 'none'

    this.alpha = this.#isEnabled ? 1 : 0.55
    this.#buttons.forEach((button) => {
      button.eventMode = eventMode
    })
  }
}
