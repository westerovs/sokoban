import {gsap} from 'gsap'
import {Assets, Container, Graphics, NineSliceSprite, Sprite, Text, Texture} from 'pixi.js'
import type {DestroyOptions, FederatedPointerEvent} from 'pixi.js'
import Locator from '../../../engine/Locator.ts'
import {popupColors, primaryFontStyle} from '../../../styles.js'
import ButtonAnimator from '../../../utils/animations/ButtonAnimator.js'
import GameUtils from '../../../utils/gameUtils/GameUtils.js'
import LoadingSpinner from './LoadingSpinner.js'

// Создаёт базовое модальное окно и управляет его показом, скрытием и содержимым.

type Offset = {
  x: number
  y: number
}

type NineSlice = {
  left: number
  top: number
  right: number
  bottom: number
}

type BaseModalOptions = {
  label?: string
  w?: number
  h?: number
  crossOffset?: Offset
  isSprite?: boolean
  spriteTexture?: string
  nineSlice?: NineSlice
  forceUpdateAdaptive?: boolean
  isNeedHeader?: boolean
  isNeedCloseButton?: boolean
  beginFill?: number
  borderFill?: number
}

/*
 * При создании BaseModal оно автоматически попадает в Ui слой modalLayer во время вызова show
 * */

export default class BaseModal extends Container {
  #rect!: Graphics | NineSliceSprite
  view: BaseModal | null = this
  btnClose: Sprite | null = null

  w = 430
  h = 500
  pivotCenter = true
  text = ''
  beginFill = popupColors.body
  borderFill = popupColors.border
  lineWidth = 10
  #padding = this.lineWidth * 2

  #crossOffset: Offset
  #isSprite: boolean
  #spriteTexture: string
  #nineSlice: NineSlice
  #forceUpdateAdaptive: boolean
  #isNeedCloseButton: boolean
  // additional features
  #isNeedHeader: boolean
  #header: Container | null = null
  #headerText: Text | null = null
  #loadingSpinner: LoadingSpinner | null = null

  // Сохраняет настройки модального окна и запускает его инициализацию.
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
  }: BaseModalOptions = {}) {
    super({label: label ?? '', eventMode: 'static'})

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

  // Обновляет адаптивное расположение модального окна.
  updateAdaptive = () => {
    if (!this.#forceUpdateAdaptive) return
    Locator.uiLayer.resizeAdaptive(this)
  }

  // Показывает модальное окно в слое интерфейса.
  async show() {
    if (!Locator.uiLayer.openModal(this)) return

    if (this.view) this.view.visible = true
    await gsap.fromTo(this, {alpha: 0}, {alpha: 1})
    return true
  }

  // Запускает индикатор загрузки.
  animateLoadingStart() {
    this.#loadingSpinner?.start()
  }

  // Останавливает индикатор загрузки.
  animateLoadingEnd() {
    this.#loadingSpinner?.stop()
  }

  // Скрывает и уничтожает модальное окно.
  async hide() {
    if (this.destroyed) return

    Locator.soundManager.play('sfx_btnClick')
    this.#setEvents(false)
    await gsap.to(this, {alpha: 0, duration: 0.1, visible: false})

    Locator.uiLayer.closeModal(this)
    this.destroy()
  }

  // Освобождает ресурсы модального окна.
  override destroy(_options?: DestroyOptions) {
    if (this.destroyed) return

    this.animateLoadingEnd()
    this.#setEvents(false)
    Locator.uiLayer.closeModal(this)

    this.parent?.removeChild(this)

    const options = typeof _options === 'object' ? {..._options, children: true} : {children: true}
    super.destroy(options)

    this.view = null
    this.btnClose = null
    this.#loadingSpinner = null
  }

  // Создаёт представление и подключает события модального окна.
  #init = () => {
    this.#create()

    this.hitArea = {contains: () => true}
    this.#setEvents(true)

    if (this.#isNeedCloseButton) {
      ButtonAnimator.initOverHandler([this.btnClose])
    }
  }

  // Включает или отключает события закрытия модального окна.
  #setEvents = (bool: boolean) => {
    if (bool) {
      this.view?.on('pointertap', this.#handleClick)
      document.addEventListener('keydown', this.#handleKeys)
      return
    }

    this.view?.off('pointertap', this.#handleClick)
    document.removeEventListener('keydown', this.#handleKeys)
  }

  // Закрывает окно при нажатии на крестик или за пределами окна.
  #handleClick = ({target, global}: FederatedPointerEvent) => {
    if (this.destroyed) return

    const isCloseButtonClick = target === this.btnClose
    const isOutsideClick = !this.#rect.getBounds().containsPoint(global.x, global.y)
    if (!isCloseButtonClick && !isOutsideClick) return

    this.hide()
  }

  // Закрывает видимое окно клавишей Escape.
  #handleKeys = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase()
    if (key === 'escape' && this.visible) return this.hide()
  }

  // ---------- view
  // Создаёт все визуальные части модального окна.
  #create = () => {
    this.#createRectBody()
    this.#createHeader()
    this.#createBtnClose()
    this.#createLoadingSpinner()

    if (this.#forceUpdateAdaptive) this.updateAdaptive()
  }

  // Создаёт фон модального окна.
  #createRectBody = () => {
    const {x, y, lineWidth, beginFill, borderFill} = this
    const {left, top, right, bottom} = this.#nineSlice

    const rect = this.#createRect(left, top, right, bottom)

    rect.label = 'baseModalRectBody'
    rect.eventMode = 'static'

    if (rect instanceof NineSliceSprite) {
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

  // Создаёт фон нужного типа.
  #createRect(left: number, top: number, right: number, bottom: number) {
    if (!this.#isSprite) return new Graphics()

    return new NineSliceSprite({
      texture: Assets.get(this.#spriteTexture) ?? Texture.WHITE,
      leftWidth: left,
      topHeight: top,
      rightWidth: right,
      bottomHeight: bottom,
    })
  }

  // Создаёт кнопку закрытия модального окна.
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

  // Создаёт индикатор загрузки.
  #createLoadingSpinner = () => {
    this.#loadingSpinner = new LoadingSpinner()
    this.addChild(this.#loadingSpinner)
  }

  // --------- additional features
  // Создаёт заголовок модального окна.
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

export type {
  BaseModalOptions,
}
