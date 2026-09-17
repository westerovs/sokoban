import {Container, Graphics, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'

const LOCATION_TAB_WIDTH = 500
const LOCATION_TAB_HEIGHT = 80
const SELECT_WIDTH = 300
const SELECT_HEIGHT = 60

export default class LocationTab extends Container {
  #background!: Graphics
  #title!: Text

  constructor(onOpenCatalog: () => void) {
    super({label: 'location-chapter-selector'})
    this.eventMode = 'passive'

    this.#init(onOpenCatalog)
  }

  // Обновляет номер текущей главы без пересоздания переключателя.
  setText = (text: string) => {
    this.#title.text = text
  }

  #init = (onOpenCatalog: () => void) => {
    this.#createBorder()
    this.#createSelect(onOpenCatalog)
    this.#createTitle()
  }

  #createBorder = () => {
    this.#background = new Graphics({label: `${this.label}-background`})
      .roundRect(-LOCATION_TAB_WIDTH / 2, -LOCATION_TAB_HEIGHT / 2, LOCATION_TAB_WIDTH, LOCATION_TAB_HEIGHT, 48)
      .fill({color: 0x12291b, alpha: 0.97})
      .stroke({color: 0xd9ef58, width: 5})
    this.addChild(this.#background)
  }

  #createTitle = () => {
    this.#title = new Text({
      label: `${this.label}-title`,
      text: '',
      style: {...primaryFontStyle, fill: 0xffe6a1, fontSize: 45},
      anchor: 0.5
    })
    this.addChild(this.#title)
  }

  #createSelect = (onOpenCatalog: () => void) => {
    const select = new Container({
      label: 'btn-select',
      eventMode: 'static',
      cursor: 'pointer',
    })

    this.#createSelectBackground(select)
    this.#createSelectArrow(select)

    select.position.set(0, 0)
    select.on('pointertap', onOpenCatalog)
    this.addChild(select)
  }

  #createSelectBackground = (select: Container<any>) => {
    const background = new Graphics()
      .roundRect(0, 0, SELECT_WIDTH, SELECT_HEIGHT, 16)
      .fill({color: 0x6d9f27})
    background.pivot.set(background.width / 2, background.height / 2)

    select.addChild(background)
  }

  #createSelectArrow = (select: Container<any>) => {
    const arrow = GameUtils.createSprite('tab-arrow')
    arrow.angle = 90
    arrow.position.set((SELECT_WIDTH / 2) - arrow.width, 0)

    select.addChild(arrow)
  }
}

export {LOCATION_TAB_WIDTH}
