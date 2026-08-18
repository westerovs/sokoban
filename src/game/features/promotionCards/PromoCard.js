import {Container, Sprite, Text, Texture} from 'pixi.js'
import BaseModal from '@/game/ui/common/modal/BaseModal.js'
import {primaryFontStyle} from '@/game/styles.js'
import ButtonAnimator from '@/game/utils/animations/ButtonAnimator.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import SdkManager from '@/game/engine/SdkManager.js'
import Locator from '@/game/engine/Locator.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import InitialLoad from '@/game/states/preload/levelPreload/states/InitialLoad.js'


export default class PromoCard extends BaseModal {
  #game = Locator.game
  promoData
  btnBye
  id

  
  constructor({promoData} = {}) {
    super({label: 'promoCard'})
    
    this.promoData = promoData
    this.id = promoData.id
    this.#init()
  }
  
  #init = () => {
    this.#createHeader()
    this.#createPicture()
    this.#createDescription()
    this.#createButton()
    this.#setPricesToCards()
    
    ButtonAnimator.initOverHandler([this.btnBye])
  }
  
  async hide() {
    await super.hide()
    this.#game.emit(GAME_EVENTS.HIDE_PROMO_CARD)
  }
  
  #createHeader = () => {
    const headerText = new Text({
      text: this.promoData.header,
      style: {...primaryFontStyle, fontSize: 28, fontWeight: 'bold'},
    })
    headerText.anchor.set(0.5)
    headerText.position.set((this.view.lineWidth / 2), (-this.view.h / 2) + 50)
    this.view.addChild(headerText)
  }
  
  #createPicture = async () => {
    await InitialLoad.promoSpriteSheetPromise()
    
    const sprite = GameUtils.createSprite(this.promoData.texture)
    sprite.position.set(0, -46)
    sprite.scale.set(2)
    this.view.addChild(sprite)
  }
  
  #createDescription = () => {
    const descriptionText = new Text({
      text: this.promoData.description,
      style: {...primaryFontStyle, fontSize: 28, align: 'center'},
    })
    descriptionText.anchor.set(0.5)
    descriptionText.position.set((this.view.lineWidth / 2), 110)
    this.view.addChild(descriptionText)
  }
  
  #createButton = () => {
    const btnBye = new Container()
    btnBye.label = 'btnBye'
    btnBye.scale.set(0.7)
    btnBye.y = (this.view.h / 2) - 55
    btnBye.type = 'button'
    btnBye.cursor = 'pointer'
    btnBye.eventMode = 'static'

    const background = new Sprite(Texture.from('btn-primary'))
    background.anchor.set(0.5)
    btnBye.addChild(background)
    
    this.btnBye = btnBye
    this.btnBye.once('pointerdown', this.#onHandlerBtnClick)
    this.addChild(btnBye)
  }
  
  #getPrice = async () => {
    const catalog = await SdkManager.purchase.getCatalog()
    const catalogCard = catalog[this.promoData.id]
    if (!catalogCard) return
    
    return {
      price: catalogCard.price,
      currency: SdkManager.purchase.getCurrency()
    }
  }
  
  #setPricesToCards = async () => {
    try {
      const {price, currency} = await this.#getPrice()

      let priceText = null
      
      if (GameUtils.isPlatformVkOk) {
        priceText = new Text({
          text: `${price} \n ${currency}`,
          style: {...primaryFontStyle, fontSize: 42, lineHeight: 39, fontWeight: 'bold', align: 'center'},
        })
      } else {
        priceText = new Text({
          text: `${price} ${currency}`,
          style: {...primaryFontStyle, fontSize: 48, fontWeight: 'bold', align: 'center'},
        })
      }
      
      priceText.anchor.set(0.5)
      this.btnBye.addChild(priceText)
    } catch (e) {
      console.error('[setPricesToCards]', e)
    }
  }
  
  #onHandlerBtnClick = () => {
    this.#game.emit(GAME_EVENTS.PROMO_CARD_CLICK, this.promoData.id)
  }
}
