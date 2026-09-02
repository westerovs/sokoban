import type {ContainerOptions, PointData, TextStyleOptions} from 'pixi.js'
import {Container, Sprite, Text} from 'pixi.js'
import {primaryFontStyle} from '../../styles.js'
import ButtonAnimator from '../../utils/animations/ButtonAnimator.js'
import GameUtils from '../../utils/gameUtils/GameUtils.js'

// Создаёт универсальную кнопку PixiJS из набора спрайтов и подписи.

type ButtonSpriteData = {
  key: string
  scale?: number | PointData
  [property: string]: unknown
}

type ButtonContainerOptions = {
  props?: ContainerOptions & {name?: string}
  spriteKeys?: Array<string | ButtonSpriteData>
  overHandler?: boolean
  initScale?: number
}

type CenterTextOptions = {
  text?: string | number
  style?: TextStyleOptions
  x?: number
  y?: number
  name?: string
}

export default class ButtonContainer extends Container {
  alignRight?: () => void
  #spriteKeys: Array<string | ButtonSpriteData>
  #overHandler: boolean
  #initScale: number
  #defaultTextStyle: TextStyleOptions = {
    ...primaryFontStyle,
    fill: 0x000000,
    fontSize: 40,
  }
  #innerText: Text | null = null

  // Сохраняет параметры кнопки и запускает её настройку.
  constructor({props = {}, spriteKeys = [], overHandler = true, initScale = 1}: ButtonContainerOptions = {}) {
    super()

    this.type = 'button'
    this.eventMode = 'static'
    this.cursor = 'pointer'

    const {label, name, ...containerProps} = props
    const buttonLabel = label ?? name
    Object.assign(this, containerProps)
    if (buttonLabel) this.label = buttonLabel
    this.#spriteKeys = spriteKeys
    this.#overHandler = overHandler
    this.#initScale = initScale

    this.#init()
  }

  get innerText() {
    return this.#innerText
  }

  // Добавляет текст по центру кнопки.
  addCenterText = ({text = '', style = this.#defaultTextStyle, x = 0, y = 0, name = 'innerText'}: CenterTextOptions = {}) => {
    const innerText = new Text({text, style})
    innerText.label = name
    innerText.anchor.set(0.5)
    innerText.position.set(x, y)
    this.#innerText = innerText

    this.addChild(innerText)
  }

  // Выполняет начальную настройку кнопки.
  #init = () => {
    this.#applyBaseSettings()
    this.#createSprites()
    this.#initOverHandler()
  }

  // Применяет исходный масштаб кнопки.
  #applyBaseSettings = () => {
    this.scale.set(this.#initScale)
  }

  // Создаёт и добавляет визуальные слои кнопки.
  #createSprites = () => {
    this.#spriteKeys.forEach((spriteData) => {
      this.addChild(this.#createSprite(spriteData))
    })
  }

  // Создаёт один визуальный слой кнопки.
  #createSprite = (spriteData: string | ButtonSpriteData): Sprite => {
    if (typeof spriteData === 'string') {
      return GameUtils.createSprite(spriteData)
    }

    const {key, scale, ...spriteProps} = spriteData

    const sprite = GameUtils.createSprite(key)

    Object.assign(sprite, spriteProps)

    if (scale !== undefined) {
      if (typeof scale === 'number') sprite.scale.set(scale)
      else sprite.scale.set(scale.x, scale.y)
    }

    return sprite
  }

  // Подключает анимацию наведения, если она разрешена.
  #initOverHandler = () => {
    if (!this.#overHandler) return
    ButtonAnimator.initOverHandler(this)
  }
}
