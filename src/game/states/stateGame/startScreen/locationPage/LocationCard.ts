import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container, Graphics, Sprite, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import type {LocationSelectionState} from '../menuTypes.js'
import LocationProgressView from './LocationProgressView.ts'

// Отображает карточку локации, её доступность и прогресс игрока.

const CARD_WIDTH = 250 // Ширина карточки
const CARD_HEIGHT = 350 // Высота карточки
const CARD_BACKGROUND_ALPHA = 0.7 // Прозрачность чёрной подложки карточки
const CARD_ART_HOVER_SCALE = 1.25 // Увеличение изображения карточки при наведении на 25%
const CARD_ART_ZOOM_DURATION = 0.25 // Длительность плавного зума изображения в секундах
const LOCKED_ART_TINT = 0x616161 // Затемнение изображения заблокированной карточки

export default class LocationCard extends Container {
  #background!: Sprite
  #backgroundMask!: Graphics
  #backgroundScale!: {x: number; y: number}
  #frame!: Graphics
  #location: LocationSelectionState
  #lockIcon!: Sprite
  #onSelect: (locationId: string) => void
  #progress!: LocationProgressView
  #title!: Text

  // Сохраняет данные локации и создаёт интерактивную карточку.
  constructor(location: LocationSelectionState, onSelect: (locationId: string) => void) {
    super({label: `location-card-${location.id}`})

    this.#location = location
    this.#onSelect = onSelect
    this.cursor = 'pointer'
    this.#init()
  }

  // Возвращает стабильный идентификатор локации.
  get locationId() {
    return this.#location.id
  }

  // Обновляет доступность, прогресс и визуальное состояние карточки.
  setState = (state: LocationSelectionState) => {
    this.#drawFrame(state)
    this.#progress.setState(state)
    this.#lockIcon.visible = !state.isUnlocked
    this.#background.tint = state.isUnlocked ? 0xffffff : LOCKED_ART_TINT
    this.eventMode = state.isUnlocked ? 'static' : 'none'
    this.alpha = state.isUnlocked ? 1 : 0.78
    if (!state.isUnlocked) this.#resetBackgroundScale()
  }

  // Создаёт все слои карточки и подписывает события.
  #init = () => {
    this.#frame = new Graphics({label: `${this.label}-frame`})
    this.addChild(this.#frame)
    this.#createBackground()
    this.#createTitle()
    this.#createProgress()
    this.#lockIcon = GameUtils.createSprite('icon-lock', {label: `${this.label}-lock`, scale: 1.5})
    this.addChild(this.#lockIcon)
    this.on('pointertap', this.#handleSelect)
    this.on('pointerenter', this.#handlePointerEnter)
    this.on('pointerleave', this.#handlePointerLeave)
  }

  // Создаёт изображение локации и маску скругления.
  #createBackground = () => {
    this.#background = GameUtils.createSprite(this.#location.cardTexture, {label: `${this.label}-art`})
    this.#background.width = CARD_WIDTH
    this.#background.height = CARD_HEIGHT
    this.#backgroundScale = {x: this.#background.scale.x, y: this.#background.scale.y}
    this.#backgroundMask = new Graphics({label: `${this.label}-art-mask`})
    this.#background.mask = this.#backgroundMask
    this.addChild(this.#background, this.#backgroundMask)
  }

  // Создаёт заголовок карточки.
  #createTitle = () => {
    this.#title = GameUtils.createText(i18next.t(this.#location.titleKey), {
      name: `${this.label}-title`,
      style: {
        ...primaryFontStyle,
        align: 'center',
        fill: 0xffefb0,
        fontSize: 28,
        stroke: {color: 0x102217, width: 5, join: 'round'},
      },
    })
    this.#title.position.set(0, -142)
    this.addChild(this.#title)
  }

  // Добавляет самостоятельное отображение прогресса локации.
  #createProgress = () => {
    this.#progress = new LocationProgressView(`${this.label}-progress`)
    this.#progress.position.set(0, 140)
    this.addChild(this.#progress)
  }

  // Рисует рамку согласно состоянию локации.
  #drawFrame = ({isCurrent}: LocationSelectionState) => {
    const color = isCurrent ? 0xd9ff5d : 0x000000
    const width = isCurrent ? 6 : 4

    this.#frame
      .clear()
      .roundRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 22)
      .fill({color: 0x000000, alpha: CARD_BACKGROUND_ALPHA})
      .stroke({color, width, alpha: 0.95})
    this.#drawBackgroundMask(width)
  }

  // Перерисовывает маску изображения под толщину рамки.
  #drawBackgroundMask = (frameWidth: number) => {
    const inset = frameWidth / 2

    this.#backgroundMask
      .clear()
      .roundRect(
        -CARD_WIDTH / 2 + inset,
        -CARD_HEIGHT / 2 + inset,
        CARD_WIDTH - frameWidth,
        CARD_HEIGHT - frameWidth,
        22 - inset,
      )
      .fill(0xffffff)
  }

  // Передаёт выбор локации контроллеру.
  #handleSelect = () => {
    this.#onSelect(this.#location.id)
  }

  // Увеличивает изображение при наведении.
  #handlePointerEnter = () => {
    this.#animateBackgroundScale(CARD_ART_HOVER_SCALE)
  }

  // Возвращает изображение к исходному масштабу.
  #handlePointerLeave = () => {
    this.#animateBackgroundScale(1)
  }

  // Анимирует масштаб изображения карточки.
  #animateBackgroundScale = (multiplier: number) => {
    gsap.to(this.#background.scale, {
      x: this.#backgroundScale.x * multiplier,
      y: this.#backgroundScale.y * multiplier,
      duration: CARD_ART_ZOOM_DURATION,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  // Немедленно восстанавливает исходный масштаб изображения.
  #resetBackgroundScale = () => {
    gsap.killTweensOf(this.#background.scale)
    this.#background.scale.set(this.#backgroundScale.x, this.#backgroundScale.y)
  }
}

export {
  CARD_HEIGHT, // Высота карточки для внешних расчётов раскладки
  CARD_WIDTH, // Ширина карточки для внешних расчётов раскладки
}
