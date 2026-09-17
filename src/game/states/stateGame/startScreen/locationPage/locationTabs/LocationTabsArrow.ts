import {Circle, Container, Graphics} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'


const LOCATION_PAGE_ARROW_RADIUS = 30

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

  // Полностью скрывает стрелку, когда соседней страницы нет.
  setEnabled = (isEnabled: boolean) => {
    this.visible = isEnabled
    this.eventMode = isEnabled ? 'static' : 'none'
    this.cursor = isEnabled ? 'pointer' : 'default'
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
    const arrow = GameUtils.createSprite('tab-arrow')
    arrow.x = direction === 'left' ? -2 : 2
    arrow.scale.x = direction === 'left' ? -1 : 1

    this.addChild(arrow)
  }
}

export {
  LOCATION_PAGE_ARROW_RADIUS,
}
