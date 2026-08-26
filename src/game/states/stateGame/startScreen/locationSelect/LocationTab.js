import {Container, Graphics, Text} from 'pixi.js'
import {primaryFontStyle} from '../../../../styles.js'

export default class LocationTab extends Container {
  #background
  #onSelect
  #pageIndex

  constructor(pageIndex, text, onSelect) {
    super({label: `location-tab-${pageIndex + 1}`})

    this.#onSelect = onSelect
    this.#pageIndex = pageIndex
    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.#init(text)
  }

  setActive = (isActive) => {
    const fill = isActive ? 0x718f2d : 0x17271d
    const border = isActive ? 0xe6e55d : 0x927642
    this.#background.clear().roundRect(-125, -28, 250, 56, 20).fill({color: fill, alpha: 0.96})
    this.#background.stroke({color: border, width: isActive ? 5 : 3})
  }

  #init = (text) => {
    this.#background = new Graphics({label: `${this.label}-background`})
    const title = new Text({
      label: `${this.label}-title`,
      text,
      style: {...primaryFontStyle, fill: 0xffe6a1, fontSize: 24},
    })
    title.anchor.set(0.5)
    this.addChild(this.#background, title)
    this.on('pointertap', this.#handleSelect)
  }

  #handleSelect = () => {
    this.#onSelect(this.#pageIndex)
  }
}
