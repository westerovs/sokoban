import {Container, Graphics, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'

const LOCATION_TAB_WIDTH = 250
const LOCATION_TAB_HEIGHT = 90

export default class LocationTab extends Container {
  #background!: Graphics
  #onSelect: (pageIndex: number) => void
  #pageIndex: number

  constructor(pageIndex: number, text: string, onSelect: (pageIndex: number) => void) {
    super({label: `location-tab-${pageIndex + 1}`})

    this.#onSelect = onSelect
    this.#pageIndex = pageIndex
    this.eventMode = 'static'
    this.cursor = 'pointer'

    this.#init(text)
  }

  setActive = (isActive: boolean) => {
    this.#updateBackground(isActive)
  }

  #init = (text: string) => {
    this.#createBackground()
    this.#createTitle(text)

    this.on('pointertap', this.#handleSelect)
  }

  #createBackground = () => {
    this.#background = new Graphics({label: `${this.label}-background`})
    this.addChild(this.#background)
  }

  #updateBackground = (isActive: boolean) => {
    const fill = isActive ? 0x718f2d : 0x17271d
    const border = isActive ? 0xe6e55d : 0x927642

    this.#background
      .clear()
      .roundRect(0, 0, LOCATION_TAB_WIDTH, LOCATION_TAB_HEIGHT, 20)
      .fill({
        color: fill,
        alpha: 0.96,
      })

    this.#background.pivot.set(LOCATION_TAB_WIDTH / 2, LOCATION_TAB_HEIGHT / 2)
    this.#background.stroke({color: border, width: 4})
  }

  #createTitle = (text: string) => {
    const title = new Text({
      label: `${this.label}-title`,
      text,
      style: {...primaryFontStyle, fill: 0xffe6a1, fontSize: 45},
    })
    title.anchor.set(0.5)
    this.addChild(title)
  }

  #handleSelect = () => {
    this.#onSelect(this.#pageIndex)
  }
}

export {
  LOCATION_TAB_WIDTH,
}
