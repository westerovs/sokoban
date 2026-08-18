import {Container, Text} from 'pixi.js'
import SkinCard from './SkinCard.js'
import Locator from '@/game/engine/Locator.ts'
import {createDebugRect, createRect} from '@/game/utils/commonUtils.js'
import {NEW_YEAR_SKIN_NAMES, SKIN_EVENTS, SKIN_NAMES} from './SkinManager.js'
import GameUtils, {eventToggle} from '@/game/utils/gameUtils/GameUtils.js'
import {primaryFontStyle, skinStoreColors} from '@/game/styles.js'
import {rewardsCatalog} from '@/game/gameConfig/rewardsCatalog.js'
import LiveOpsController from '../../components/liveOpsController/LiveOpsController.js'
import {shakeX} from '@/game/utils/animations/gsapUtils.js'
import ConfirmDialog from './ConfirmDialog.js'

/*
* Инициализирует магазин скинов, рендерит в нём карточки товаров
* */

export default class SkinStoreView extends Container {
  #game = Locator.game
  #fillBody = skinStoreColors.body
  #fillBorder = skinStoreColors.border
  #textCoins
  #selectedCard
  #skinManager
  #selectionFrame
  #coinView = new Container()
  #storeCover = new Container()
  #cardContainer = new Container()
  #gap = 10
  #cards = []
  #confirmDialog
  
  constructor(skinManager) {
    super(skinManager)
    
    this.#skinManager = skinManager
    this.visible = false
    
    this.init()
  }
  
  get cards() {
    return this.#cards
  }
  
  get userCoins() {
    return Locator.storage.playerData.coins
  }
  
  init = () => {
    this.#createStoreCover()
    this.#createCoinView()
    this.#updateCoinsView()
    
    this.#setPosition()
    this.#renderCards()
    this.#checkAdPassPurchased()
    this.#createSelectionFrame()
    this.#setCurrentFrame()
    this.#setEvents(true)
    this.scale.set(1.3)

    this.#skinManager.skinContainerView.addChild(this)
  }
  
  destroy(_options) {
    console.warn('SkinStoreView destroy')
    this.#setEvents(false)
    super.destroy({..._options, children: true,})
    
    if (this.#confirmDialog) this.#confirmDialog.destroy()
  }
  
  #updateCoinsView = () => {
    const textCoins = this.#textCoins
    textCoins.text = Locator.storage.playerData.coins
  }
  
  #setEvents = (bool) => {
    const toggle = eventToggle(bool)
  
    this.#game[toggle.gameOnOff](SKIN_EVENTS.SELECT, this.#checkoutSkinFrame)
    this.#game[toggle.gameOnOff](SKIN_EVENTS.BTN_BUY, this.#onBtnBuyHandler)
  }
  
  #createStoreCover = () => {
    const coinViewHeight = 50
    const height = (SkinCard.cardHeight * 2) + (this.#gap * 3) + coinViewHeight
    
    const width = (SkinCard.cardWidth * 3) + (this.#gap * 4)
    
    const body = createRect({w: width, h: height, color: this.#fillBody, r: 10})
    const border = createDebugRect({w: width, h: height, color: this.#fillBorder, r: 10})
    
    this.#storeCover.addChild(body, border)
    this.#storeCover.alpha = 0.8
    this.addChild(this.#storeCover)
  }
  
  #createCoinView = () => {
    const border = createDebugRect({w: 200, h: 50, color: this.#fillBorder})
    
    const coin = GameUtils.createSprite('coin', {anchorX: 0, anchorY: 0})
    coin.scale.set(0.55)
    coin.position.set(10, (border.height / 2) - (coin.height / 2))
    
    this.#textCoins = new Text({
      text: '-',
      style: {...primaryFontStyle, fill: 0xFFFFFF},
    })
    this.#textCoins.anchor.set(1, 0)
    this.#textCoins.position.set(
      border.width - 10,
      (border.height / 2) - (this.#textCoins.height / 2)
    )
    
    this.#coinView.addChild(border, coin, this.#textCoins)
    this.#coinView.position.x = border.width / 2
    this.addChild(this.#coinView)
  }
  
  #renderCards = () => {
    const cardsPerRow = 3
    let renderIndex = 0
    
    const {skins} = Locator.storage.playerData
    const purchasedSet = new Set(skins)
    const newYearSet = new Set(NEW_YEAR_SKIN_NAMES)
    
    for (let i = 0; i < SKIN_NAMES.length; i++) {
      const skinName = SKIN_NAMES[i]
      
      if (!this.#isSkinVisible(skinName, purchasedSet, newYearSet)) continue
      
      const card = new SkinCard(skinName)
      const currentRow = Math.floor(renderIndex / cardsPerRow)
      const posX = (SkinCard.cardWidth + this.#gap) * (renderIndex % cardsPerRow)
      const posY = currentRow * (SkinCard.cardHeight + this.#gap)
      card.position.set((SkinCard.cardWidth / 2) + posX, posY)
      
      this.#cardContainer.addChild(card)
      this.#cards.push(card)
      
      renderIndex++
    }
    
    this.#cardContainer.x = (this.#storeCover.width / 2) - (this.#cardContainer.width / 2)
    this.#cardContainer.y = (SkinCard.cardHeight / 2) + this.#gap + this.#coinView.height
    
    this.addChild(this.#cardContainer)
  }
  
  // Не рендерить новогодний скин, если новый год прошёл, но рендерить, если он куплен у игрока
  #isSkinVisible = (skinName, purchasedSet, newYearSet) => {
    if (!newYearSet.has(skinName)) return true
    if (purchasedSet.has(skinName)) return true
    
    return LiveOpsController.newYearIsActiveAndPurchased
  }
  
  // устанавливает карточкам статус покупки и цены
  #checkAdPassPurchased = () => {
    const {skins} = Locator.storage.playerData
    const purchasedSet = new Set(skins)
    
    this.#cards.forEach(card => {
      if (purchasedSet.has(card.label)) {
        card.createCheckMark()
      } else {
        card.createButton()
        this.#setCardPrice(card)
      }
      
      card.setEvents(true)
    })
  }
  
  #setCardPrice = (card) => {
    if (rewardsCatalog.skins[card.label]) {
      card.textPrice = rewardsCatalog.skins[card.label].amount
    }
  }

  // единственный экземпляр графики, которая будет позиционироваться на выбранную карту
  #createSelectionFrame = () => {
    this.#selectionFrame =  createDebugRect({
      w: SkinCard.cardWidth,
      h: SkinCard.cardHeight,
      lineWidth: 4,
      color: 0x19BE63
    })
    
    this.#selectionFrame.pivot.set(SkinCard.cardWidth / 2, SkinCard.cardHeight / 2)
    this.#cardContainer.addChild(this.#selectionFrame)
  }
  
  #setCurrentFrame = () => {
    const {currentSkin} = Locator.storage.playerData
    
    this.#cards.forEach(card => {
      if (card.label === currentSkin) this.#checkoutSkinFrame(card)
    })
  }
  
  syncSelectionToCurrentSkin = () => {
    const {currentSkin} = Locator.storage.playerData
    const card = this.#cards.find(card => card.label === currentSkin)
    if (card) this.#checkoutSkinFrame(card)
  }
  
  #checkoutSkinFrame = (card) => {
    if (this.#selectedCard === card) return
    this.#selectedCard = card
    
    this.#selectionFrame.visible = true
    this.#selectionFrame.position.copyFrom(card.position)
  }
  
  #setPosition = () => {
    const {width} = this
    this.pivot.x = width / 2
    this.y = 530
  }
  
  #onBtnBuyHandler = async (card) => {
    this.interactiveChildren = false
    
    Locator.soundManager.play('sfx_btnClick')
    
    if (this.userCoins < card.cardPrice) {
      await this.#hasNoMoneyAction(card)
      this.interactiveChildren = true
      return
    }
    
    if (this.userCoins >= card.cardPrice) {
      this.#confirmDialog = new ConfirmDialog(this, card)
      this.#confirmDialog.init(card)
    }
  }
  
  #hasNoMoneyAction = async (card) => {
    Locator.soundManager.play('sfx_noAccess')
    this.#textCoins.tint = 0xFF0000
    await shakeX(card.button)
    this.#textCoins.tint = 0xFFFFFF
  }
  
  hasMoneyAction = (card) => {
    try {
      Locator.storage.spendCoins(card.cardPrice, false)
      Locator.soundManager.play('sfx_store')
      
      this.#textCoins.text = Locator.storage.playerData.coins
      this.#giveSkin(card)
      
      // todo добавить метрику
    } catch (err) {
      console.error('hasMoneyAction', err)
    }
  }
  
  #giveSkin = (card) => {
    Locator.soundManager.play('sfx_store')
    card.button.visible = false
    card.createCheckMark()
    
    const {skins} = Locator.storage.playerData
    if (!skins.includes(card.label)) skins.push(card.label)
    
    Locator.storage.playerData.currentSkin = card.label
    Locator.storage.save()
  }
}
