import {Container, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.js'
import Locator from '../../../../engine/Locator.ts'
import GameUtils from '../../../../utils/gameUtils/GameUtils.js'

// Отображает показатель игрока в адаптивной верхней панели.

const TOP_BAR_BASE_WIDTH = 640 // Базовая ширина верхней панели
const TOP_BAR_MIN_SCALE = 0.72 // Минимальный масштаб показателя

type StatBadgeOptions = {
  alignRight?: boolean
  basePosition?: {x: number; y: number}
  iconTexture: string
  label: string
}

export default class StatBadge extends Container {
  #iconTexture: string
  #alignRight: boolean
  #basePosition: {x: number; y: number}
  #text!: Text

  // Сохраняет настройки показателя и создаёт его содержимое.
  constructor({label, iconTexture, alignRight = false, basePosition = {x: 0, y: 0}}: StatBadgeOptions) {
    super({label})

    this.#iconTexture = iconTexture
    this.#alignRight = alignRight
    this.#basePosition = basePosition

    this.#init()
  }

  // Обновляет отображаемое значение.
  setText = (value: string | number) => {
    this.#text.text = value
  }

  // Выравнивает показатель относительно выбранной стороны экрана.
  alignRight = () => {
    if (!this.#alignRight) {
      this.#alignLeft()
      return
    }

    Locator.uiLayer.alignRight(this, {
      ...this.#basePosition,
    })
  }

  // Создаёт показатель и выполняет первое выравнивание.
  #init = () => {
    this.#create()
    this.alignRight()
  }

  // Создаёт фон, значок и текст показателя.
  #create = () => {
    const cover = GameUtils.createSprite('stat-badge', {label: `${this.label}-cover`})
    const icon = GameUtils.createSprite(this.#iconTexture, {label: `${this.label}-icon`})
    icon.x = -60

    this.#text = new Text({label: 'badgeText', text: '...', style: {...primaryFontStyle}})
    this.#text.anchor.set(0.5)
    this.#text.position.set(12, 0)

    this.addChild(cover, icon, this.#text)
  }

  // Размещает показатель у левого края с адаптивным масштабом.
  #alignLeft = () => {
    const {width} = Locator.uiLayer.uiData
    const scale = Math.min(1, Math.max(TOP_BAR_MIN_SCALE, (width - 40) / TOP_BAR_BASE_WIDTH))
    const x = 20 + (this.#basePosition.x - 20) * scale
    this.scale.set(scale)
    this.position.set(x, this.#basePosition.y)
  }
}
