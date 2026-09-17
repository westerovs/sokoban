import {Circle, Container, Graphics} from 'pixi.js'

// Отображает боковую кнопку перелистывания страниц с главами.

const BUTTON_RADIUS = 31 // Радиус круглой кнопки перелистывания
const ARROW_HALF_HEIGHT = 12 // Половина высоты стрелки внутри кнопки
const ARROW_HALF_WIDTH = 7 // Половина ширины стрелки внутри кнопки

type PageDirection = 'left' | 'right'

export default class LocationPageArrow extends Container {
  #onSelect: () => void

  // Сохраняет обработчик и создаёт кнопку указанного направления.
  constructor(direction: PageDirection, onSelect: () => void) {
    super({label: `location-page-arrow-${direction}`})

    this.#onSelect = onSelect
    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.hitArea = new Circle(0, 0, BUTTON_RADIUS)
    this.#init(direction)
  }

  // Создаёт круглую подложку и направляющую стрелку.
  #init = (direction: PageDirection) => {
    const background = new Graphics({label: `${this.label}-background`})
      .circle(0, 0, BUTTON_RADIUS)
      .fill({color: 0x6d9f27})
      .stroke({color: 0xd7ee70, width: 4})
    const arrow = new Graphics({label: `${this.label}-icon`})
      .moveTo(-ARROW_HALF_WIDTH, -ARROW_HALF_HEIGHT)
      .lineTo(ARROW_HALF_WIDTH, 0)
      .lineTo(-ARROW_HALF_WIDTH, ARROW_HALF_HEIGHT)
      .stroke({color: 0xffffff, width: 7, join: 'round', cap: 'round'})
    arrow.rotation = direction === 'left' ? Math.PI : 0
    this.addChild(background, arrow)
    this.on('pointertap', this.#onSelect)
  }
}
