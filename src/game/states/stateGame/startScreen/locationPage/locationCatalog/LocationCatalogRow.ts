import i18next from 'i18next'
import {Container, Rectangle, Sprite, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import {fitTextWidth} from '@/game/utils/fitTextWidth.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import type {LocationSelectionState} from '../../menuTypes.js'
import {CATALOG_COLORS} from './locationCatalogTheme.js'

// Отображает одну компактную строку открытой или закрытой локации.

export default class LocationCatalogRow extends Container {
  #background!: Sprite
  #lock: Sprite | null = null
  #progress: Text | null = null
  #state: LocationSelectionState
  #title!: Text

  constructor(state: LocationSelectionState, onSelect: (locationId: string) => void) {
    super({label: `location-catalog-row-${state.id}`})
    this.#state = state
    this.#init(onSelect)
  }

  // Вписывает деревянную подложку, название и замок в размер строки.
  resize = (width: number, height: number) => {
    const textX = 86
    const scale = Math.min(width / this.#background.texture.width, height / this.#background.texture.height)
    this.hitArea = new Rectangle(0, 0, width, height)
    this.#background.scale.set(scale)
    this.#background.position.set(width / 2, height / 2)
    this.#title.position.set(textX, height / 2)
    this.#lock?.position.set(48, height / 2)
    this.#layoutProgress(width, height)
    fitTextWidth(this.#title, this.#getTitleWidth(width, textX))
  }

  // Создаёт визуальные части строки и подключает выбор доступной локации.
  #init = (onSelect: (locationId: string) => void) => {
    this.#createBackground()
    this.#createLock()
    this.#createTitle()
    this.#createProgress()
    this.eventMode = this.#state.isUnlocked ? 'static' : 'none'
    this.cursor = this.#state.isUnlocked ? 'pointer' : 'default'
    this.interactiveChildren = false
    if (this.#state.isUnlocked) this.on('pointertap', () => onSelect(this.#state.id))
  }

  // Создаёт деревянную подложку строки.
  #createBackground = () => {
    this.#background = GameUtils.createSprite('board', {label: `${this.label}-background`})
    this.#background.tint = this.#state.isCurrent ? 0xe6ffc4 : 0xffffff
    this.#background.alpha = this.#state.isUnlocked ? 1 : 0.72
    this.addChild(this.#background)
  }

  // Показывает замок у недоступной локации.
  #createLock = () => {
    if (this.#state.isUnlocked) return

    this.#lock = GameUtils.createSprite('icon-lock', {label: `${this.label}-lock`, scale: 0.8})
    this.addChild(this.#lock)
  }

  // Создаёт название локации без вторичной подписи.
  #createTitle = () => {
    this.#title = this.#createText(`${this.label}-title`, 33, CATALOG_COLORS.ink)
    this.#title.text = i18next.t(this.#state.titleKey)
    this.addChild(this.#title)
  }

  // Создаёт прогресс для доступной локации.
  #createProgress = () => {
    if (!this.#state.isUnlocked) return

    this.#progress = this.#createText(`${this.label}-progress`, 22, CATALOG_COLORS.muted)
    this.#progress.anchor.set(1, 0.5)
    this.#progress.text = i18next.t('locationSelect.progress', {
      completed: this.#state.completedCount,
      total: this.#state.totalCount,
    })
    this.addChild(this.#progress)
  }

  // Создаёт левостороннюю подпись в стиле каталога.
  #createText = (label: string, fontSize: number, fill: number) => {
    const text = new Text({label, style: {...primaryFontStyle, fill, fontSize}})
    text.anchor.set(0, 0.5)
    return text
  }

  // Располагает прогресс у правого края дощечки.
  #layoutProgress = (width: number, height: number) => {
    if (!this.#progress) return

    fitTextWidth(this.#progress, 160)
    this.#progress.position.set(width - 26, height / 2)
  }

  // Возвращает свободную ширину названия перед прогрессом.
  #getTitleWidth = (width: number, textX: number) => {
    if (!this.#progress) return width - textX - 24

    return this.#progress.x - this.#progress.width - textX - 18
  }
}
