import i18next from 'i18next'
import {Container, Graphics, Rectangle, Sprite, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import {fitTextWidth} from '@/game/utils/fitTextWidth.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import type {LocationSelectionState} from '../../menuTypes.js'
import {CATALOG_COLORS} from './locationCatalogTheme.js'

// Отображает одну компактную строку открытой или закрытой локации.

export default class LocationCatalogRow extends Container {
  #art: Sprite | null = null
  #artMask: Graphics | null = null
  #background!: Graphics
  #lock: Sprite | null = null
  #state: LocationSelectionState
  #subtitle!: Text
  #title!: Text

  constructor(state: LocationSelectionState, previousTitle: string, onSelect: (locationId: string) => void) {
    super({label: `location-catalog-row-${state.id}`})
    this.#state = state
    this.#init(previousTitle, onSelect)
  }

  // Вписывает превью и подписи в актуальный размер строки.
  resize = (width: number, height: number) => {
    const isLarge = height > 180
    const previewSize = Math.min(isLarge ? 140 : 94, height - 16)
    const textX = previewSize + 26
    const textWidth = width - textX - 18
    this.#title.style.fontSize = isLarge ? 50 : 33
    this.#subtitle.style.fontSize = isLarge ? 32 : 23
    this.hitArea = new Rectangle(0, 0, width, height)
    this.#drawBackground(width, height)
    this.#layoutPreview(previewSize, height)
    this.#title.position.set(textX, height / 2 - 18)
    this.#subtitle.position.set(textX, height / 2 + 20)
    fitTextWidth(this.#title, textWidth)
    fitTextWidth(this.#subtitle, textWidth)
  }

  // Создаёт визуальные части строки и подключает выбор доступной локации.
  #init = (previousTitle: string, onSelect: (locationId: string) => void) => {
    this.#createBackground()
    this.#createPreview()
    this.#createTexts(previousTitle)
    this.eventMode = this.#state.isUnlocked ? 'static' : 'none'
    this.cursor = this.#state.isUnlocked ? 'pointer' : 'default'
    this.interactiveChildren = false
    this.on('pointertap', () => onSelect(this.#state.id))
  }

  // Создаёт векторную подложку строки.
  #createBackground = () => {
    this.#background = new Graphics({label: `${this.label}-background`})
    this.addChild(this.#background)
  }

  // Показывает изображение только для открытой локации, а для закрытой — замок.
  #createPreview = () => {
    if (!this.#state.isUnlocked) {
      this.#lock = GameUtils.createSprite('icon-lock', {label: `${this.label}-lock`})
      this.addChild(this.#lock)
      return
    }

    this.#art = GameUtils.createSprite(this.#state.cardTexture, {label: `${this.label}-art`})
    this.#artMask = new Graphics({label: `${this.label}-art-mask`})
    this.#art.mask = this.#artMask
    this.addChild(this.#art, this.#artMask)
  }

  // Создаёт заголовок и состояние прогресса локации.
  #createTexts = (previousTitle: string) => {
    this.#title = this.#createText(`${this.label}-title`, 33, CATALOG_COLORS.ink)
    this.#subtitle = this.#createText(`${this.label}-subtitle`, 23, CATALOG_COLORS.muted)
    this.#title.text = i18next.t(this.#state.titleKey)
    this.#subtitle.text = this.#state.isUnlocked
      ? i18next.t('locationSelect.progress', {
          completed: this.#state.completedCount,
          total: this.#state.totalCount,
        })
      : i18next.t('locationSelect.lockedAfter', {location: previousTitle})
    this.addChild(this.#title, this.#subtitle)
  }

  // Создаёт левостороннюю подпись в стиле каталога.
  #createText = (label: string, fontSize: number, fill: number) => {
    const text = new Text({label, style: {...primaryFontStyle, fill, fontSize}})
    text.anchor.set(0, 0.5)
    return text
  }

  // Рисует состояние строки с зелёной рамкой текущей локации.
  #drawBackground = (width: number, height: number) => {
    this.#background
      .clear()
      .roundRect(0, 0, width, height, 25)
      .fill(this.#state.isUnlocked ? CATALOG_COLORS.background : CATALOG_COLORS.locked)
      .stroke({color: this.#state.isCurrent ? CATALOG_COLORS.selected : CATALOG_COLORS.border, width: 2})
  }

  // Масштабирует превью по принципу cover либо центрирует замок.
  #layoutPreview = (size: number, height: number) => {
    if (this.#lock) {
      this.#lock.scale.set(46 / Math.max(this.#lock.texture.width, this.#lock.texture.height))
      this.#lock.position.set(12 + size / 2, height / 2)
      return
    }
    if (!this.#art || !this.#artMask) return

    const scale = Math.max(size / this.#art.texture.width, size / this.#art.texture.height)
    this.#art.scale.set(scale)
    this.#art.position.set(12 + size / 2, height / 2)
    this.#artMask
      .clear()
      .roundRect(12, (height - size) / 2, size, size, 22)
      .fill(0xffffff)
  }
}
