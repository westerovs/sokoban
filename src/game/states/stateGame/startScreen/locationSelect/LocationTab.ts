import {Container, Graphics, Text} from 'pixi.js'
import {primaryFontStyle} from '../../../../styles.js'

// Отображает вкладку страницы со списком локаций.

export default class LocationTab extends Container {
  #background!: Graphics
  #onSelect: (pageIndex: number) => void
  #pageIndex: number

  // Сохраняет номер страницы и создаёт интерактивную вкладку.
  constructor(pageIndex: number, text: string, onSelect: (pageIndex: number) => void) {
    super({label: `location-tab-${pageIndex + 1}`})

    this.#onSelect = onSelect
    this.#pageIndex = pageIndex
    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.#init(text)
  }

  // Перерисовывает вкладку в активном или обычном состоянии.
  setActive = (isActive: boolean) => {
    const fill = isActive ? 0x718f2d : 0x17271d
    const border = isActive ? 0xe6e55d : 0x927642
    this.#background.clear().roundRect(-125, -28, 250, 56, 20).fill({color: fill, alpha: 0.96})
    this.#background.stroke({color: border, width: isActive ? 5 : 3})
  }

  // Создаёт фон и подпись вкладки.
  #init = (text: string) => {
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

  // Передаёт выбранную страницу контроллеру.
  #handleSelect = () => {
    this.#onSelect(this.#pageIndex)
  }
}
