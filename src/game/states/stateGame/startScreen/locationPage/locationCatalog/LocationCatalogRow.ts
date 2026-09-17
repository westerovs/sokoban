import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container, Rectangle, Sprite, Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {primaryFontStyle} from '@/game/styles.ts'
import {fitTextWidth} from '@/game/utils/fitTextWidth.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import type {LocationSelectionState} from '../../menuTypes.js'
import {CATALOG_COLORS} from './locationCatalogTheme.js'

// Отображает одну компактную строку открытой или закрытой локации.

const CONTENT_PADDING = 40 // Общий горизонтальный отступ содержимого дощечки
const LOCK_GAP = 12 // Расстояние между названием и замком
const LOCKED_BOARD_TINT = 0x91846d // Затемнение заблокированной дощечки
const SHAKE_OFFSET = 6 // Амплитуда горизонтального встряхивания
const SHAKE_DURATION = 0.045 // Длительность одного шага встряхивания

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

  // Вписывает деревянную подложку и содержимое в размер строки.
  resize = (width: number, height: number) => {
    const scale = Math.min(width / this.#background.texture.width, height / this.#background.texture.height)
    this.hitArea = new Rectangle(0, 0, width, height)
    this.#background.scale.set(scale)
    this.#background.position.set(width / 2, height / 2)
    this.#title.position.set(CONTENT_PADDING, height / 2)
    this.#layoutLock(height)
    this.#layoutProgress(width, height)
  }

  // Создаёт визуальные части строки и подключает выбор доступной локации.
  #init = (onSelect: (locationId: string) => void) => {
    this.#createBackground()
    this.#createLock()
    this.#createTitle()
    this.#createProgress()
    this.eventMode = 'static'
    this.cursor = this.#state.isUnlocked ? 'pointer' : 'default'
    this.interactiveChildren = false
    this.on('pointertap', () => this.#handlePress(onSelect))
  }

  // Создаёт деревянную подложку строки.
  #createBackground = () => {
    this.#background = GameUtils.createSprite('board', {label: `${this.label}-background`})
    this.#background.tint = this.#getBackgroundTint()
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
    this.#progress.position.set(width - CONTENT_PADDING, height / 2)
  }

  // Ставит замок непосредственно после названия закрытой локации.
  #layoutLock = (height: number) => {
    if (!this.#lock) return

    this.#lock.position.set(this.#title.x + this.#title.width + LOCK_GAP + this.#lock.width / 2, height / 2)
  }

  // Возвращает оттенок дощечки для текущего состояния локации.
  #getBackgroundTint = () => {
    if (!this.#state.isUnlocked) return LOCKED_BOARD_TINT
    return this.#state.isCurrent ? 0xe6ffc4 : 0xffffff
  }

  // Открывает доступную локацию или встряхивает заблокированную.
  #handlePress = (onSelect: (locationId: string) => void) => {
    if (this.#state.isUnlocked) {
      onSelect(this.#state.id)
      return
    }

    this.#shakeLockedRow()
    Locator.soundManager.play('sfx_noAccess')
  }

  // Запускает короткое горизонтальное встряхивание закрытой дощечки.
  #shakeLockedRow = () => {
    gsap.killTweensOf(this)
    gsap
      .timeline()
      .to(this, {x: -SHAKE_OFFSET, duration: SHAKE_DURATION, ease: 'sine.inOut'})
      .to(this, {x: SHAKE_OFFSET, duration: SHAKE_DURATION * 2, ease: 'sine.inOut'})
      .to(this, {x: 0, duration: SHAKE_DURATION, ease: 'sine.inOut'})
  }
}
