import {gsap} from 'gsap'
import {Container, NineSliceSprite, Text, Texture} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {WORLD} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {primaryFontStyle} from '@/game/styles.js'
import GameUtils, {eventToggle} from '@/game/utils/gameUtils/GameUtils.js'

export default class SpeechBubbleView extends Container {
  #game = Locator.game
  #message
  #avatar
  #bubbleRect
  #speechText
  #customPosY = null
  #padding = 20

  constructor({textMessage} = {}) {
    super()

    this.#message = textMessage
    this.label = 'speechBubbleView'
    this.visible = false
    this.zIndex = 3

    this.#init()
  }

  get bubbleRect() {
    return this.#bubbleRect
  }

  animateBubble = () => {
    return gsap
      .timeline()
      .from(this.#bubbleRect, {x: '-=80', y: '+=70', alpha: 0, angle: -40, ease: 'back.out', duration: 1}, '<')
      .from(this.#bubbleRect.scale, {x: 0, y: 0, ease: 'back.out', duration: 1}, '<')
  }

  setText = (text) => {
    this.#speechText.text = text
    this.#updateBubble()
    this.#resize()
  }

  setPositionY(y) {
    this.#customPosY = y
    this.#resize()
  }

  setDefaultPositionY = () => {
    this.#customPosY = null
    this.#resize()
  }

  #init = () => {
    Locator.uiLayer.stateUiLayer.addChild(this)

    this.#setEvents(true)
    this.#createAvatar()
    this.#createSpeechBubble()
    this.#createSpeechText()
    this.#updateBubble()
    this.#resize()
  }

  #setEvents = (bool) => {
    const toggle = eventToggle(bool)

    this.#game[toggle.gameOnOff](GAME_EVENTS.gameResize, this.#resize)
  }

  #createAvatar = () => {
    const avatar = GameUtils.createSprite('speech-bubble-avatar', {anchorX: 0, anchorY: 0})
    this.#avatar = avatar
    this.addChild(avatar)
  }

  #createSpeechBubble = () => {
    const bubbleRect = new Container()
    this.#bubbleRect = bubbleRect
    bubbleRect.position.set(250, 70)

    const texture = Texture.from('speech-bubble-rect')
    const innerBody = new NineSliceSprite({
      texture,
      leftWidth: 10,
      topHeight: 10,
      rightWidth: 10,
      bottomHeight: 10,
    })
    this.innerBody = innerBody

    innerBody.label = 'innerBody'
    innerBody.width = texture.width
    innerBody.height = texture.height
    bubbleRect.addChild(innerBody)

    const corner = GameUtils.createSprite('speech-bubble-rect-corner', {anchorX: 0, anchorY: 0})
    corner.position.set(-(corner.width - 5), 20)
    bubbleRect.addChild(corner)

    this.addChild(bubbleRect)
  }

  #createSpeechText = () => {
    const innerBody = this.#bubbleRect.getChildByLabel('innerBody')

    const style = {
      ...primaryFontStyle,
      wordWrap: true,
      wordWrapWidth: innerBody.width - this.#padding,
      align: 'center',
      fontSize: 30,
    }

    this.#speechText = new Text({text: this.#message, style})
    this.#speechText.position.set(10)

    this.#bubbleRect.addChild(this.#speechText)
  }

  #updateBubble = () => {
    const {width, height} = this.#speechText.getLocalBounds()

    this.#speechText.position.set(this.#padding)
    this.innerBody.width = width + this.#padding * 2
    this.innerBody.height = height + this.#padding * 2
  }

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

  destroy(_options) {
    super.destroy({
      ..._options,
      children: true,
    })
    this.#setEvents(false)
  }
}
