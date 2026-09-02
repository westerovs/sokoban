import {gsap} from 'gsap'
import {Container, Text} from 'pixi.js'
import type {DestroyOptions, Sprite} from 'pixi.js'
import {rewardsCatalog} from '../gameConfig/rewardsCatalog.js'
import {primaryFontStyle} from '../styles.js'
import {destroyTimeLine} from '../utils/animations/gsapUtils.js'
import GameUtils from '../utils/gameUtils/GameUtils.js'

// Показывает анимацию полученного после покупки игрового ресурса.

type AnimationParent = Container & {
  frameSize: {
    halfH: number
    halfW: number
  }
}

type PaymentAnimationOptions = {
  parent: AnimationParent
  parentElements: gsap.TweenTarget
  productID: string
  isPromo?: boolean
}

export default class PaymentAnimation extends Container {
  #parent: AnimationParent
  #parentElements: gsap.TweenTarget
  #productID: string
  #textRewardCounter!: Text
  #timeline = gsap.timeline()
  #isPromo: boolean

  // Сохраняет параметры анимации покупки.
  constructor({parent, parentElements, productID, isPromo = false}: PaymentAnimationOptions) {
    super({label: 'payment-animation'})

    this.#parent = parent
    this.#parentElements = parentElements
    this.#productID = productID
    this.#isPromo = isPromo

    this.sortableChildren = true

    console.warn('---productID', productID)
  }

  // Проигрывает анимацию и удаляет её контейнер.
  init = async () => {
    await this.#animate()
    this.destroy()
  }

  // Останавливает таймлайн и уничтожает дочерние элементы.
  destroy(_options?: DestroyOptions) {
    destroyTimeLine(this.#timeline)
    const options = typeof _options === 'object' ? _options : {}
    super.destroy({...options, children: true})
  }

  // Собирает и последовательно проигрывает анимацию награды.
  #animate = async () => {
    const shine = this.#createShineIcon()
    this.#textRewardCounter = this.#createRewardCounter()
    const paymentIcon = this.#createPaymentIcon()
    this.#parent.addChild(this)

    this.#setPositionCenter(shine)

    await this.#timeline
      .set([this.#parentElements], {visible: false})
      .set(shine.scale, {x: 0, y: 0})
      .to(paymentIcon.scale, {x: 2, y: 2, yoyo: true, repeat: 8, ease: 'back.out(2.5)'}, '<')

      .to(this.#textRewardCounter, {alpha: 1, delay: 0.4}, '<')
      .to(this.#textRewardCounter, {y: '-=140', duration: 3, delay: 0.4}, '<')

      .to(shine.scale, {x: 1.8, y: 1.8, duration: 1}, '<')
      .to(shine, {angle: 360, repeat: 2, duration: 1.5, ease: 'linear'}, '<')
      .to([shine.scale, paymentIcon.scale], {x: 0, y: 0, ease: 'back.inOut(2.5)'})
      .to([paymentIcon, this.#textRewardCounter], {alpha: 0}, '<')
      .set([this.#parentElements], {visible: !this.#isPromo})
  }

  // Центрирует анимацию относительно родительского кадра.
  #setPositionCenter = (shine: Sprite) => {
    this.pivot.set(shine.texture.width / 2, shine.texture.height / 2)
    const frameSize = this.#parent.frameSize
    this.position.set(frameSize.halfW + shine.texture.width / 2, frameSize.halfH + 180)
  }

  // Создаёт фоновое свечение награды.
  #createShineIcon = () => {
    const shine = GameUtils.createSprite('glow-type1')
    this.addChild(shine)

    return shine
  }

  // Создаёт и настраивает иконку купленного продукта.
  #createPaymentIcon = () => {
    let textureKey = null

    // store
    const storeCatalog = rewardsCatalog.store
    const magnifiers = [
      storeCatalog.free.id,
      storeCatalog.smallPack.id,
      storeCatalog.mediumPack.id,
      storeCatalog.largePack.id,
      storeCatalog.extraLargePack.id,
    ]

    if (magnifiers.includes(this.#productID)) {
      textureKey = 'store-loupe-big'
      const product = Object.values(storeCatalog).find((item) => item.id === this.#productID)
      if (product && 'amount' in product) this.#textRewardCounter.text = `+${product.amount}`
    }
    if (this.#productID === storeCatalog.dartsHint.id) {
      textureKey = 'store-darts-big'
      this.#textRewardCounter.text = `+${storeCatalog.dartsHint.amount}`
    }
    if (this.#productID === storeCatalog.compassHint.id) {
      textureKey = 'store-compass-big'
      this.#textRewardCounter.text = `+${storeCatalog.compassHint.amount}`
    }
    if (this.#productID === storeCatalog.coinLarge.id) {
      textureKey = 'store-coinLarge'
      this.#textRewardCounter.text = `+${storeCatalog.coinLarge.amount}`
    }
    if (this.#productID === storeCatalog.coinXL.id) {
      textureKey = 'store-coinXL'
      this.#textRewardCounter.text = `+${storeCatalog.coinXL.amount}`
    }
    if (this.#productID === storeCatalog.noAdPack.id) {
      textureKey = 'icon-noAd'
      this.#textRewardCounter.text = ''
    }

    // promo
    const promoCatalog = rewardsCatalog.promo
    if (this.#productID === promoCatalog.promoStartedPack.id) {
      textureKey = 'promoStartedPack'
      this.#textRewardCounter.text = `+${promoCatalog.promoStartedPack.amount}`
    }
    if (this.#productID === promoCatalog.promoRemoveAdPack.id) {
      textureKey = 'promoRemoveAdPack'
      this.#textRewardCounter.text = ''
    }
    if (this.#productID === promoCatalog.promoMegaHintsPack.id) {
      textureKey = 'promoMegaHintsPack'
      this.#textRewardCounter.text = `+${promoCatalog.promoMegaHintsPack.amount}`
    }

    const icon = GameUtils.createSprite(textureKey as string)
    this.addChild(icon)

    return icon
  }

  // Создаёт текстовый счётчик полученной награды.
  #createRewardCounter = () => {
    const textRewardCounter = new Text({
      label: 'payment-reward-counter',
      text: '',
      style: {
        ...primaryFontStyle,
        fontSize: 100,
        fill: 0xffffff,
        dropShadow: {color: 0x000000},
        stroke: {color: 0x000000, width: 1},
      },
    })
    textRewardCounter.alpha = 0
    textRewardCounter.zIndex = 1
    textRewardCounter.anchor.set(0.5)

    this.addChild(textRewardCounter)

    return textRewardCounter
  }
}
