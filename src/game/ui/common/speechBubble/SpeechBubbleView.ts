import {gsap} from 'gsap'
import type {DestroyOptions, Sprite, TextStyleOptions} from 'pixi.js'
import {Container, NineSliceSprite, Text, Texture} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {WORLD} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {primaryFontStyle} from '@/game/styles.js'
import GameUtils, {eventToggle} from '@/game/utils/gameUtils/GameUtils.js'

// Отображает адаптивное облако речи с аватаром и анимацией появления.

export default class SpeechBubbleView extends Container {
  #game = Locator.game
  #message: string
  #avatar!: Sprite
  #bubbleRect!: Container
  #speechText!: Text
  #customPosY: number | null = null
  #padding = 20 // Внутренний отступ текста
  innerBody!: NineSliceSprite

  // Сохраняет сообщение и создаёт скрытое облако речи.
  constructor({textMessage = ''}: {textMessage?: string} = {}) {
    super({label: 'speechBubbleView'})

    this.#message = textMessage
    this.visible = false
    this.zIndex = 3

    this.#init()
  }

  // Возвращает контейнер тела облака.
  get bubbleRect() {
    return this.#bubbleRect
  }

  // Создаёт анимацию появления облака.
  animateBubble = () => {
    return gsap
      .timeline()
      .from(this.#bubbleRect, {x: '-=80', y: '+=70', alpha: 0, angle: -40, ease: 'back.out', duration: 1}, '<')
      .from(this.#bubbleRect.scale, {x: 0, y: 0, ease: 'back.out', duration: 1}, '<')
  }

  // Заменяет текст и пересчитывает размеры облака.
  setText = (text: string) => {
    this.#speechText.text = text
    this.#updateBubble()
    this.#resize()
  }

  // Устанавливает пользовательскую вертикальную позицию.
  setPositionY(y: number) {
    this.#customPosY = y
    this.#resize()
  }

  // Возвращает автоматическое вертикальное позиционирование.
  setDefaultPositionY = () => {
    this.#customPosY = null
    this.#resize()
  }

  // Создаёт визуальные элементы и подключает изменение размера.
  #init = () => {
    Locator.uiLayer.stateUiLayer.addChild(this)

    this.#setEvents(true)
    this.#createAvatar()
    this.#createSpeechBubble()
    this.#createSpeechText()
    this.#updateBubble()
    this.#resize()
  }

  // Включает или отключает игровые события облака.
  #setEvents = (bool: boolean) => {
    const toggle = eventToggle(bool)

    this.#game[toggle.gameOnOff](GAME_EVENTS.gameResize, this.#resize)
  }

  // Создаёт изображение аватара.
  #createAvatar = () => {
    const avatar = GameUtils.createSprite('speech-bubble-avatar', {label: 'speech-bubble-avatar', anchorX: 0, anchorY: 0})
    this.#avatar = avatar
    this.addChild(avatar)
  }

  // Создаёт растягиваемое тело и уголок облака.
  #createSpeechBubble = () => {
    const bubbleRect = new Container({label: 'speech-bubble-body'})
    this.#bubbleRect = bubbleRect
    bubbleRect.position.set(250, 70)

    const texture = Texture.from('speech-bubble-rect')
    const innerBody = new NineSliceSprite({
      label: 'innerBody',
      texture,
      leftWidth: 10,
      topHeight: 10,
      rightWidth: 10,
      bottomHeight: 10,
    })
    this.innerBody = innerBody

    innerBody.width = texture.width
    innerBody.height = texture.height
    bubbleRect.addChild(innerBody)

    const corner = GameUtils.createSprite('speech-bubble-rect-corner', {label: 'speech-bubble-corner', anchorX: 0, anchorY: 0})
    corner.position.set(-(corner.width - 5), 20)
    bubbleRect.addChild(corner)

    this.addChild(bubbleRect)
  }

  // Создаёт текст внутри тела облака.
  #createSpeechText = () => {
    const innerBody = this.#bubbleRect.getChildByLabel('innerBody')!

    const style: TextStyleOptions = {
      ...primaryFontStyle,
      wordWrap: true,
      wordWrapWidth: innerBody.width - this.#padding,
      align: 'center',
      fontSize: 30,
    }

    this.#speechText = new Text({label: 'speech-bubble-text', text: this.#message, style})
    this.#speechText.position.set(10)

    this.#bubbleRect.addChild(this.#speechText)
  }

  // Подгоняет фон облака под текущий текст.
  #updateBubble = () => {
    const {width, height} = this.#speechText.getLocalBounds()

    this.#speechText.position.set(this.#padding)
    this.innerBody.width = width + this.#padding * 2
    this.innerBody.height = height + this.#padding * 2
  }

  // Адаптирует масштаб и позицию облака к размеру интерфейса.
  #resize = () => {
    const paddingX = 20

    const uiData = Locator.uiLayer.uiData
    const uiWidth = uiData.width - paddingX

    this.scale.set(1)
    this.pivot.set(this.width / 2, this.height / 2)

    if (WORLD.isPortrait && this.width > uiWidth) {
      const factor = uiWidth / this.width
      this.scale.set(factor)
    }

    const centerX = paddingX / 2 + uiWidth / 2
    const defaultY = uiData.height / 2 - 120

    const posY = this.#customPosY ?? defaultY
    this.position.set(centerX, posY)
  }

  // Освобождает облако и отписывает его от событий.
  destroy(_options?: DestroyOptions) {
    const options = typeof _options === 'object' ? {..._options, children: true} : {children: true}
    super.destroy(options)
    this.#setEvents(false)
  }
}
