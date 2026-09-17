import {Container, Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {primaryFontStyle} from '@/game/styles.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'

const TOP_BAR_BASE_WIDTH = 640
const TOP_BAR_MIN_SCALE = 0.72

type StatBadgeOptions = {
  alignRight?: boolean
  basePosition?: {x: number; y: number}
  iconTexture: string
  label: string
}

/**
* Создаёт бейдж который можно прикрепить к левой, или правой части экрана
* */

export default class StatBadge extends Container {
  #iconTexture: string
  #alignRight: boolean
  #basePosition: {x: number; y: number}
  #text!: Text

  constructor({label, iconTexture, alignRight = false, basePosition = {x: 0, y: 0}}: StatBadgeOptions) {
    super({label})

    this.#iconTexture = iconTexture
    this.#alignRight = alignRight
    this.#basePosition = basePosition

    this.#init()
  }

  setText = (value: string | number) => {
    this.#text.text = value
  }

  alignRight = () => {
    if (!this.#alignRight) {
      this.#alignLeft()
      return
    }

    Locator.uiLayer.alignRight(this, {
      ...this.#basePosition,
    })
  }

  #init = () => {
    this.#create()
    this.alignRight()
  }

  #create = () => {
    const cover = GameUtils.createSprite('stat-badge', {label: `${this.label}-cover`})
    const icon = GameUtils.createSprite(this.#iconTexture, {label: `${this.label}-icon`})
    icon.x = -60

    this.#text = new Text({label: 'badgeText', text: '...', style: {...primaryFontStyle}})
    this.#text.anchor.set(0.5)
    this.#text.position.set(12, 0)

    this.addChild(cover, icon, this.#text)
  }

  #alignLeft = () => {
    const {width} = Locator.uiLayer.uiData
    const scale = Math.min(1, Math.max(TOP_BAR_MIN_SCALE, (width - 40) / TOP_BAR_BASE_WIDTH))
    const x = 20 + (this.#basePosition.x - 20) * scale
    this.scale.set(scale)
    this.position.set(x, this.#basePosition.y)
  }
}
