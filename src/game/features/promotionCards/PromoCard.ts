import {Container, Sprite, Text, Texture} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import InitialLoad from '@/game/states/preload/levelPreload/states/InitialLoad.js'
import {primaryFontStyle} from '@/game/styles.js'
import BaseModal from '@/game/ui/common/modal/BaseModal.js'
import ButtonAnimator from '@/game/utils/animations/ButtonAnimator.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import type {PromoData} from './promoTypes.js'

// Отображает модальную карточку ограниченного предложения.

export default class PromoCard extends BaseModal {
  #game = Locator.game
  promoData: PromoData
  btnBye!: Container
  id: string

  // Сохраняет данные предложения и создаёт содержимое карточки.
  constructor({promoData}: {promoData: PromoData}) {
    super({label: 'promoCard'})

    this.promoData = promoData
    this.id = promoData.id
    this.#init()
  }

  // Создаёт все элементы карточки и анимацию кнопки.
  #init = () => {
    this.#createHeader()
    this.#createPicture()
    this.#createDescription()
    this.#createButton()
    this.#setPricesToCards()

    ButtonAnimator.initOverHandler([this.btnBye])
  }

  // Закрывает карточку и сообщает об этом игровой шине.
  async hide() {
    await super.hide()
    this.#game.emit(GAME_EVENTS.HIDE_PROMO_CARD)
  }

  // Создаёт заголовок предложения.
  #createHeader = () => {
    const headerText = new Text({
      label: 'promo-card-header',
      text: this.promoData.header,
      style: {...primaryFontStyle, fontSize: 28, fontWeight: 'bold'},
    })
    headerText.anchor.set(0.5)
    headerText.position.set(this.lineWidth / 2, -this.h / 2 + 50)
    this.addChild(headerText)
  }

  // Загружает и создаёт изображение предложения.
  #createPicture = async () => {
    await InitialLoad.promoSpriteSheetPromise()

    const sprite = GameUtils.createSprite(this.promoData.texture)
    sprite.position.set(0, -46)
    sprite.scale.set(2)
    this.addChild(sprite)
  }

  // Создаёт описание предложения.
  #createDescription = () => {
    const descriptionText = new Text({
      label: 'promo-card-description',
      text: this.promoData.description,
      style: {...primaryFontStyle, fontSize: 28, align: 'center'},
    })
    descriptionText.anchor.set(0.5)
    descriptionText.position.set(this.lineWidth / 2, 110)
    this.addChild(descriptionText)
  }

  // Создаёт кнопку покупки предложения.
  #createButton = () => {
    const btnBye = new Container({label: 'btnBye'})
    btnBye.scale.set(0.7)
    btnBye.y = this.h / 2 - 55
    btnBye.type = 'button'
    btnBye.cursor = 'pointer'
    btnBye.eventMode = 'static'

    const background = new Sprite({texture: Texture.from('btn-primary'), label: 'promo-card-button-background'})
    background.anchor.set(0.5)
    btnBye.addChild(background)

    this.btnBye = btnBye
    this.btnBye.once('pointerdown', this.#onHandlerBtnClick)
    this.addChild(btnBye)
  }

  // Получает цену предложения из платформенного каталога.
  #getPrice = async () => {
    const catalog = await SdkManager.purchase.getCatalog()
    const catalogCard = catalog[this.promoData.id]
    if (!catalogCard) return

    return {
      price: catalogCard.price,
      currency: SdkManager.purchase.getCurrency(),
    }
  }

  // Добавляет на кнопку локализованную цену товара.
  #setPricesToCards = async () => {
    try {
      const priceData = await this.#getPrice()
      if (!priceData) return
      const {price, currency} = priceData

      let priceText = null

      if (GameUtils.isPlatformVkOk) {
        priceText = new Text({
          label: 'promo-card-price',
          text: `${price} \n ${currency}`,
          style: {...primaryFontStyle, fontSize: 42, lineHeight: 39, fontWeight: 'bold', align: 'center'},
        })
      } else {
        priceText = new Text({
          label: 'promo-card-price',
          text: `${price} ${currency}`,
          style: {...primaryFontStyle, fontSize: 48, fontWeight: 'bold', align: 'center'},
        })
      }

      priceText.anchor.set(0.5)
      this.btnBye.addChild(priceText)
    } catch (e) {
      console.error('[PromoCard]: failed to set product price', e)
    }
  }

  // Отправляет событие покупки выбранного предложения.
  #onHandlerBtnClick = () => {
    this.#game.emit(GAME_EVENTS.PROMO_CARD_CLICK, this.promoData.id)
  }
}
