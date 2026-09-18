import {Container, Sprite, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'

const ARROW_GAP = 4 // Расстояние между телом вкладки и боковой стрелкой

type PageDirection = 'left' | 'right'

type LocationTabCallbacks = {
  onNext: () => void
  onOpenCatalog: () => void
  onPrevious: () => void
}

export default class LocationNav extends Container {
  #leftArrow!: Sprite
  #rightArrow!: Sprite
  #select!: Container
  #title!: Text

  constructor({onNext, onOpenCatalog, onPrevious}: LocationTabCallbacks) {
    super({label: 'location-nav'})
    this.eventMode = 'passive'

    this.#init({onNext, onOpenCatalog, onPrevious})
  }

  // Обновляет номер текущей главы без пересоздания переключателя.
  setText = (text: string) => {
    this.#title.text = text
  }

  setNavigationState = (canGoPrevious: boolean, canGoNext: boolean) => {
    this.#setArrowEnabled(this.#leftArrow, canGoPrevious)
    this.#setArrowEnabled(this.#rightArrow, canGoNext)
  }

  #init = ({onNext, onOpenCatalog, onPrevious}: LocationTabCallbacks) => {
    this.#createSelect(onOpenCatalog)
    this.#createTitle()
    this.#leftArrow = this.#createArrowTab('left', onPrevious)
    this.#rightArrow = this.#createArrowTab('right', onNext)
  }

  #createTitle = () => {
    this.#title = new Text({
      label: `${this.label}-title`,
      text: '',
      style: {...primaryFontStyle, fill: 0xffe6a1, fontSize: 30},
      anchor: 0.5,
    })
    this.#title.x = -20
    this.addChild(this.#title)
  }

  #createSelect = (onOpenCatalog: () => void) => {
    this.#select = new Container({
      label: 'btn-select',
      eventMode: 'static',
      cursor: 'pointer',
    })

    this.#createSelectBackground()
    this.#select.on('pointertap', onOpenCatalog)
    this.addChild(this.#select)
  }

  #createSelectBackground = () => {
    const background = GameUtils.createSprite('select', {label: `${this.label}-background`})

    this.#select.addChild(background)
  }

  #createArrowTab = (direction: PageDirection, onSelect: () => void) => {
    const arrow = GameUtils.createSprite('tab-arrow', {
      interactive: true,
      label: `${this.label}-${direction}-arrow`,
    })
    const offset = this.#select.width / 2 + arrow.width / 2 + ARROW_GAP
    arrow.x = direction === 'left' ? -offset : offset
    arrow.scale.x = direction === 'left' ? 1 : -1
    arrow.on('pointertap', onSelect)
    this.addChild(arrow)

    return arrow
  }

  #setArrowEnabled = (arrow: Sprite, isEnabled: boolean) => {
    arrow.tint = isEnabled ? 0xFFFFFF : 0x5a5a5a
    arrow.eventMode = isEnabled ? 'static' : 'none'
    arrow.cursor = isEnabled ? 'pointer' : 'default'
  }
}
