import {Circle, Container, Graphics} from 'pixi.js'

// Отображает боковую кнопку перелистывания страниц с главами.

const LOCATION_PAGE_ARROW_RADIUS = 60
const ARROW_HALF_HEIGHT = 12
const ARROW_HALF_WIDTH = 7

type PageDirection = 'left' | 'right'

export default class LocationTabsArrow extends Container {
  #onSelect: () => void

  constructor(direction: PageDirection, onSelect: () => void) {
    super({label: `location-page-arrow-${direction}`})

    this.#onSelect = onSelect
    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.hitArea = new Circle(0, 0, LOCATION_PAGE_ARROW_RADIUS)

    this.#init(direction)
  }

  #init = (direction: PageDirection) => {
    this.#createBackground()
    this.#createArrow(direction)

    this.on('pointertap', this.#onSelect)
  }

  #createBackground = () => {
    const background = new Graphics({label: `${this.label}-background`})
      .circle(0, 0, LOCATION_PAGE_ARROW_RADIUS)
      .fill({color: 0x6d9f27})
      .stroke({color: 0xd7ee70, width: 4})

    this.addChild(background)
  }

  #createArrow = (direction: PageDirection) => {
    const arrow = new Graphics({label: `${this.label}-icon`})
      .moveTo(-ARROW_HALF_WIDTH, -ARROW_HALF_HEIGHT)
      .lineTo(ARROW_HALF_WIDTH, 0)
      .lineTo(-ARROW_HALF_WIDTH, ARROW_HALF_HEIGHT)
      .stroke({color: 0xffffff, width: 7, join: 'round', cap: 'round'})
    arrow.rotation = direction === 'left' ? Math.PI : 0

    this.addChild(arrow)
  }
}

export {
  LOCATION_PAGE_ARROW_RADIUS, // Радиус стрелки для внешних расчётов раскладки
}
