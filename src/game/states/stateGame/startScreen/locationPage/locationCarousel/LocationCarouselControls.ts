import {Container, Graphics} from 'pixi.js'

const DOT_GAP = 32 // Расстояние между центрами индикаторов
const DOT_HIT_RADIUS = 14 // Радиус области нажатия индикатора
const DOT_RADIUS = 8 // Радиус видимой части индикатора
const ARROW_OFFSET = 92 // Отступ стрелок от центра ряда индикаторов
const ARROW_HIT_SIZE = 44 // Размер области нажатия стрелки

type LocationCarouselControlsOptions = {
  onNext: () => void
  onPrevious: () => void
  onSelect: (index: number) => void
}

export default class LocationCarouselControls extends Container {
  #dots!: Container
  #nextArrow!: Graphics
  #onNext: () => void
  #onPrevious: () => void
  #onSelect: (index: number) => void
  #previousArrow!: Graphics
  #selectedIndex = 0

  constructor({onNext, onPrevious, onSelect}: LocationCarouselControlsOptions) {
    super({label: 'location-carousel-controls'})

    this.#onNext = onNext
    this.#onPrevious = onPrevious
    this.#onSelect = onSelect
    this.#init()
  }

  setCount = (count: number) => {
    this.#dots.removeChildren().forEach((dot) => dot.destroy())
    const left = -((count - 1) * DOT_GAP) / 2
    for (let index = 0; index < count; index += 1) {
      this.#dots.addChild(this.#createDot(index, left + index * DOT_GAP))
    }
    this.setSelectedIndex(Math.min(this.#selectedIndex, Math.max(0, count - 1)), count)
  }

  setSelectedIndex = (index: number, count = this.#dots.children.length) => {
    this.#selectedIndex = index
    this.#drawDots()
    this.#setArrowEnabled(this.#previousArrow, index > 0)
    this.#setArrowEnabled(this.#nextArrow, index < count - 1)
  }

  #init = () => {
    this.#dots = new Container({label: 'location-carousel-dots'})
    this.#previousArrow = this.#createArrow(-1, this.#onPrevious)
    this.#nextArrow = this.#createArrow(1, this.#onNext)
    this.addChild(this.#previousArrow, this.#nextArrow, this.#dots)
  }

  #createArrow = (direction: -1 | 1, onSelect: () => void) => {
    const name = direction < 0 ? 'previous' : 'next'
    const arrow = new Graphics({label: `location-carousel-${name}`, x: direction * ARROW_OFFSET})
    const halfHitSize = ARROW_HIT_SIZE / 2
    arrow.rect(-halfHitSize, -halfHitSize, ARROW_HIT_SIZE, ARROW_HIT_SIZE).fill({color: 0xffffff, alpha: 0.001})
    arrow.poly(direction < 0 ? [-14, 0, 14, -23, 14, 23] : [14, 0, -14, -23, -14, 23], true)
    arrow.fill(0xffe8b0).stroke({color: 0x9b4d17, width: 4, join: 'round'})
    arrow.eventMode = 'static'
    arrow.cursor = 'pointer'
    arrow.on('pointertap', onSelect)
    return arrow
  }

  #createDot = (index: number, x: number) => {
    const dot = new Graphics({label: `location-carousel-dot-${index}`, x})
    dot.circle(0, 0, DOT_HIT_RADIUS).fill({color: 0xffffff, alpha: 0.001})
    dot.eventMode = 'static'
    dot.cursor = 'pointer'
    dot.on('pointertap', () => this.#onSelect(index))
    return dot
  }

  #drawDots = () => {
    this.#dots.children.forEach((child, index) => {
      const dot = child as Graphics
      dot.clear().circle(0, 0, DOT_HIT_RADIUS).fill({color: 0xffffff, alpha: 0.001})
      dot.circle(0, 0, DOT_RADIUS).fill(index === this.#selectedIndex ? 0xffd42a : 0x8c4b1d)
      dot.circle(0, 0, DOT_RADIUS).stroke({color: 0x5b2d0d, width: 2})
    })
  }

  #setArrowEnabled = (arrow: Graphics, enabled: boolean) => {
    arrow.alpha = enabled ? 1 : 0.35
    arrow.eventMode = enabled ? 'static' : 'none'
    arrow.cursor = enabled ? 'pointer' : 'default'
  }
}
