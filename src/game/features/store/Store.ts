/* eslint-disable */

import {gsap} from 'gsap'
import {Container} from 'pixi.js'
import {GrayscaleFilter} from 'pixi-filters'
import PaymentAnimation from '../../components/PaymentAnimation.js'
import BtnRewardTimer from '../../components/rewardTimer/BtnRewardTimer.js'
import Locator from '../../engine/Locator.ts'
import SdkManager from '../../engine/SdkManager.js'
import {STORAGE_KEYS} from '../../engine/storage/defaultData.js'
import {GAME_NAMES, GAME_STATES} from '../../gameConfig/constants.js'
import {GAME_EVENTS} from '../../gameConfig/gameEvents.js'
import {rewardsCatalog} from '../../gameConfig/rewardsCatalog.js'
import {GAME_NAME} from '../../generatedAssets/buildMeta.js'
import {HINT_BUTTON_NAMES} from '../../modules/hints/HintsController.js'
import ButtonAnimator from '../../utils/animations/ButtonAnimator.js'
import {clearTimeLine} from '../../utils/animations/gsapUtils.js'
import GameUtils from '../../utils/gameUtils/GameUtils.js'
import LoadUtils from '../../utils/gameUtils/LoadUtils.js'
import StoreCard from './StoreCard.js'
import StoreView from './StoreView.js'
import type Game from '../../Game.js'
import type ButtonContainer from '../../components/buttons/ButtonContainer.js'

// Загружает ресурсы магазина и связывает его карточки с игровыми сервисами.

export default class Store {
  #game = Locator.game
  #refs: Record<string, Container>
  #view: StoreView
  #cardsContainer!: Container
  #buttons: ButtonContainer[] = []
  #storage = Locator.storage
  #cardsTimeLine: gsap.core.Timeline | null = null
  #btnTimer: BtnRewardTimer | null = null
  #paymentManager = Locator.paymentManager
  #paymentAnimation: PaymentAnimation | null = null
  #productID: string | null = null

  // Сохраняет представление и запускает его подготовку.
  constructor(view: StoreView) {
    this.#refs = (this.#game as Game & {refs: Record<string, Container>}).refs
    this.#view = view

    this.#init()
  }

  // async hide() {
  //   if (GAME_NAME === GAME_NAMES.hotel) return
  //
  //   await super.hide()
  //   this.#btnTimer.destroy()
  //
  //   this.#setInteractive(false)
  //   this.#setEvents(false)
  //   clearTimeLine(this.#cardsTimeLine, true)
  //
  //   this.#game.emit(GAME_EVENTS.STORE.hide)
  //   this.#cardsContainer.destroy({children: true})
  //   this.#productID = null
  //
  //   if (this.#paymentAnimation) {
  //     this.#paymentAnimation.destroy()
  //     this.#paymentAnimation = null
  //   }
  // }

  // Показывает магазин после загрузки его ресурсов.
  #init = async () => {
    const showPromise = this.#view.show()
    const spriteSheetLoaded = await this.#loadSpritesheet()
    if (!spriteSheetLoaded || this.#view.destroyed) return

    this.#view.createContent()
    const isShown = await showPromise
    if (!isShown) return this.#view.destroy()

    this.#cardsContainer = this.#view.cardsContainer
    // this.#setEvents(true)

    this.#buttons = this.#view.cards.map((card: StoreCard) => card.button)
    // this.#btnTimer = new BtnRewardTimer()

    // this.#view.interactiveChildren = false
    // this.#updateStoreCounters()
    // this.#setPricesToCards()
    // this.#checkAdPassPurchased()
    // this.#initBtnTimer()
    // await this.#cardsAnimation()
    // this.#setInteractive(true)
    // this.#view.interactiveChildren = true
  }

  // Загружает спрайтшиты товаров магазина.
  #loadSpritesheet = async () => {
    this.#view.animateLoadingStart()

    try {
      await Promise.all([LoadUtils.loadSpriteSheet({spriteSheetName: 'purchases'}), LoadUtils.loadSpriteSheet({spriteSheetName: 'store'})])
      return true
    } catch (error) {
      console.error('[Store]: failed to load store assets', error)
      if (!this.#view.destroyed) this.#view.destroy()
      return false
    } finally {
      if (!this.#view.destroyed) this.#view.animateLoadingEnd()
    }
  }

  // #setEvents = (bool) => {
  //   const status = bool ? 'on' : 'off'
  //   this.#game[status](GAME_EVENTS.STORAGE.hintsUpdated, this.#onPurchase)
  //   this.#game[status](GAME_EVENTS.paymentManager.hasNoAdsPass, this.#onPurchase)
  // }

  // получает из sdk цену и записывает её в карточку товара
  // #setPricesToCards = async () => {
  //   const catalog = await SdkManager.purchase.getCatalog()
  //   if (!catalog || !Object.keys(catalog).length) return
  //
  //   const isVkOk = GameUtils.isPlatformVkOk
  //
  //   Object.values(catalog).forEach(data => {
  //     const {id, price} = data
  //     const card = this.#cardsContainer.children.find(child => child.name === id)
  //
  //     if (!card) return
  //
  //     const priceText = card?.getChildByLabel('priceText', 2)
  //     const currency = SdkManager.purchase.getCurrency()
  //
  //     if (isVkOk) {
  //       priceText.text = `${price} \n ${currency}`
  //       priceText.style = {...priceText.style, fontSize: 16, align: 'center', lineHeight: 14}
  //       return
  //     }
  //
  //     priceText.text = `${price} ${currency}`
  //   })
  // }

  // проверяет куплен ли пропуск рекламы
  // #checkAdPassPurchased = () => {
  //   if (this.#storage.playerData.hasAdPass) {
  //     const btnNoAdPack = this.#buttons.find(button => button.parent.name === 'noAdPack')
  //
  //     const card = btnNoAdPack.parent
  //     const textBuy = card.getChildByLabel('isBuy')
  //
  //     btnNoAdPack.visible = false
  //     textBuy.visible = true
  //     card.interactiveChildren = false
  //
  //     const grayscale = new GrayscaleFilter(1)
  //     card.filters = [grayscale]
  //   }
  // }

  // #initBtnTimer = () => {
  //   const btnFree = this.#buttons.find(button => button.parent.name === 'free')
  //   this.#btnTimer.init(btnFree, 'store', HINT_BUTTON_NAMES.hints)
  // }

  // #cardsAnimation = () => {
  //   clearTimeLine(this.#cardsTimeLine, true)
  //
  //   return this.#cardsTimeLine = gsap.timeline()
  //     .fromTo(this.#cardsContainer.children.map(el => el.scale),
  //       {x: 0, y: 0},
  //       {x: 1, y: 1, stagger: 0.05, ease: 'back.out(1.3)'}, '<')
  // }

  // #updateStoreCounters = () => {
  //   const counterCoins = this.#view.getChildByLabel('counterCoins')
  //   const counterMagnifier = this.#view.getChildByLabel('counterMagnifier')
  //   const counterDarts = this.#view.getChildByLabel('counterDarts')
  //   const counterCompass = this.#view.getChildByLabel('counterCompass')
  //
  //   const coins = this.#storage.playerData[STORAGE_KEYS.coins]
  //   const hints = this.#storage.playerData[STORAGE_KEYS.hints]
  //   const darts = this.#storage.playerData[STORAGE_KEYS.hintDarts]
  //   const compass = this.#storage.playerData[STORAGE_KEYS.hintCompass]
  //
  //   this.#setCounterValue(counterCoins, coins)
  //   this.#setCounterValue(counterMagnifier, hints)
  //   this.#setCounterValue(counterDarts, darts)
  //   this.#setCounterValue(counterCompass, compass)
  //
  //   if (this.#game.stateName === GAME_STATES.gameState) {
  //     const {userCoins} = this.#refs
  //     const userCoinsText = userCoins.getChildByLabel('badgeText')
  //     userCoinsText.text = this.#storage.playerData.coins
  //   }
  // }

  // #setCounterValue = (counter, storageValue) => {
  //   const textCounter = counter.getChildByLabel('textCounter')
  //   textCounter.text = storageValue
  // }

  // #setInteractive = (bool) => {
  //   const action = bool ? 'on' : 'off'
  //   const eventMode = bool ? 'static' : 'none'
  //
  //   this.#cardsContainer.eventMode = eventMode
  //   this.#cardsContainer[action]('pointerup', this.#onPointerDownHandler)
  // }

  // #onPointerDownHandler = async ({target: button}) => {
  //   if (button.typeName !== 'button') return
  //
  //   const itemId = button.productID
  //   this.#productID = itemId
  //
  //   const storeCatalog = rewardsCatalog.store
  //   if (itemId === storeCatalog.free.id) return
  //
  //   await this.#paymentManager.onPurchase(itemId)
  // }

  // #onPurchase = async () => {
  //   gsap.to({}, {delay: 0.1, onComplete: () => {
  //       Locator.soundManager.play('sfx_victory')
  //     }})
  //
  //   this.#paymentAnimation = new PaymentAnimation({
  //     parent: this.#view,
  //     parentElements: [this.#cardsContainer],
  //     productID: this.#productID
  //   })
  //
  //   await this.#paymentAnimation.init()
  //   this.#updateStoreCounters()
  //   this.#checkAdPassPurchased()
  //   Locator.soundManager.play('sfx_store')
  //
  //   this.#productID = null
  // }
}
