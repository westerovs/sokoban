import {gsap} from 'gsap'
import {Assets, Container, Graphics, NineSliceSprite, Texture} from 'pixi.js'
import Locator from '../../../engine/Locator.ts'
import {popupColors, primaryFontStyle} from '../../../styles.js'
import ButtonAnimator from '../../../utils/animations/ButtonAnimator.js'
import GameUtils from '../../../utils/gameUtils/GameUtils.js'
import LoadingSpinner from './LoadingSpinner.js'

/*
 * При создании BaseModal оно автоматически попадает в Ui слой modalLayer во время вызова show
 * */

export default class BaseModal extends Container {
  #rect = Locator.game
  view = this
  btnClose

  label = 'baseModal'
  eventMode = 'static'
  x = 0
  y = 0
  w = 430
  h = 500
  pivotCenter = true
  text = ''
  beginFill = popupColors.body
  borderFill = popupColors.border
  lineWidth = 10
  #padding = this.lineWidth * 2

  #crossOffset
  #isSprite
  #spriteTexture
  #nineSlice
  #forceUpdateAdaptive
  #isNeedCloseButton
  // additional features
  #isNeedHeader
  #header = null
  #headerText = null
  #loadingSpinner = null

  constructor({
    label,
    w = 430,
    h = 500,
    crossOffset = {x: 0, y: 0},
    isSprite = false,
    spriteTexture = 'frame-main',
    nineSlice = {left: 0, top: 0, right: 0, bottom: 0},
    forceUpdateAdaptive = false,
    isNeedHeader = false,
    isNeedCloseButton = true,
    beginFill = popupColors.body,
    borderFill = popupColors.border,
  } = {}) {
    super()

    this.label = label
    this.visible = false

    this.w = w
    this.h = h
    this.#crossOffset = crossOffset
    this.#isSprite = isSprite

    this.#spriteTexture = spriteTexture
    this.#nineSlice = nineSlice
    this.#forceUpdateAdaptive = forceUpdateAdaptive
    this.#isNeedHeader = isNeedHeader
    this.#isNeedCloseButton = isNeedCloseButton
    this.beginFill = beginFill
    this.borderFill = borderFill

    this.#init()
  }

  get rect() {
    return this.#rect
  }

  get header() {
    return this.#header
  }

  get headerText() {
    return this.#headerText
  }

  get padding() {
    return this.#padding
  }

  updateAdaptive = () => {
    if (!this.#forceUpdateAdaptive) return
    Locator.uiLayer.resizeAdaptive(this)
  }

  async show() {
    if (!Locator.uiLayer.openModal(this)) return

    this.view.visible = true
    await gsap.fromTo(this, {alpha: 0}, {alpha: 1})
    return true
  }

  animateLoadingStart() {
    this.#loadingSpinner.start()
  }

  animateLoadingEnd() {
    this.#loadingSpinner.stop()
  }

  async hide() {
    if (this.destroyed) return

    Locator.soundManager.play('sfx_btnClick')
    this.#setEvents(false)
    await gsap.to(this, {alpha: 0, duration: 0.1, visible: false})

    Locator.uiLayer.closeModal(this)
    this.destroy()
  }

  destroy(_options) {
    if (this.destroyed) return

    this.animateLoadingEnd()
    this.#setEvents(false)
    Locator.uiLayer.closeModal(this)

    this.parent?.removeChild(this)

    super.destroy({..._options, children: true})

    this.view = null
    this.btnClose = null
    this.#loadingSpinner = null
  }

  #init = async () => {
    this.#create()

    this.hitArea = {contains: () => true}
    this.#setEvents(true)

    if (this.#isNeedCloseButton) {
      ButtonAnimator.initOverHandler([this.btnClose])
    }
  }

  #setEvents = (bool) => {
    const status = bool ? 'on' : 'off'
    const listener = bool ? 'addEventListener' : 'removeEventListener'

    this.view[status]('pointertap', this.#handleClick)
    document[listener]('keydown', this.#handleKeys)
  }

  #handleClick = ({target, global}) => {
    if (this.destroyed) return

    const isCloseButtonClick = target === this.btnClose
    const isOutsideClick = !this.#rect.getBounds().containsPoint(global.x, global.y)
    if (!isCloseButtonClick && !isOutsideClick) return

    this.hide()
  }

  #handleKeys = (event) => {
    const key = event.key.toLowerCase()
    if (key === 'escape' && this.visible) return this.hide()
  }

  // ---------- view
  #create = () => {
    this.#createRectBody()
    this.#createHeader()
    this.#createBtnClose()
    this.#createLoadingSpinner()

    if (this.#forceUpdateAdaptive) this.updateAdaptive()
  }

  #createRectBody = () => {
    const {x, y, lineWidth, beginFill, borderFill} = this
    const {left, top, right, bottom} = this.#nineSlice

    const rect = this.#isSprite
      ? new NineSliceSprite({
          texture: Assets.get(this.#spriteTexture) ?? Texture.WHITE,
          leftWidth: left,
          topHeight: top,
          rightWidth: right,
          bottomHeight: bottom,
        })
      : new Graphics()

    rect.label = 'baseModalRectBody'
    rect.eventMode = 'static'

    if (this.#isSprite) {
      rect.position.set(x, y)
      rect.width = this.w + lineWidth
      rect.height = this.h + lineWidth
    } else {
      rect
        .rect(x + lineWidth / 2, y + lineWidth / 2, this.w, this.h)
        .fill(beginFill)
        .stroke({width: lineWidth, color: borderFill})
    }

    if (this.pivotCenter) {
      rect.position.set(-(rect.width / 2) + x, -(rect.height / 2) + y)
    }

    this.#rect = rect

    this.addChild(rect)
  }

  #createBtnClose = () => {
    if (!this.#isNeedCloseButton) return

    const {w, h} = this
    const {x, y} = this.#crossOffset

    const btnClose = GameUtils.createSprite('btn-close', {
      name: 'btnClose',
      interactive: true,
    })
    btnClose.position.set(w / 2 - x, -(h / 2) - y)

    this.btnClose = btnClose
    this.addChild(btnClose)
  }

  #createLoadingSpinner = () => {
    this.#loadingSpinner = new LoadingSpinner()
    this.addChild(this.#loadingSpinner)
  }

  // --------- additional features
  #createHeader = () => {
    if (!this.#isNeedHeader) return

    const topPadding = 10
    const topBorderOffset = this.h / 2 + this.lineWidth / 2

    const header = new Container({label: 'baseModalHeader'})
    this.#header = header
    const sprite = GameUtils.createSprite('frame-header', {
      anchorY: 0,
      label: 'header',
    })
    header.position.set(0, -topBorderOffset + topPadding)

    this.#headerText = GameUtils.createText('...', {
      style: {...primaryFontStyle, fontSize: 50},
    })
    this.#headerText.y = sprite.height / 2

    header.addChild(sprite, this.#headerText)
    this.addChild(header)
  }
}
