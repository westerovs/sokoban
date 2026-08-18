import i18next from 'i18next'
import PromoCard from '@/game/features/promotionCards/PromoCard.js'
import Locator from '@/game/engine/Locator.ts'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {rewardsCatalog} from '@/game/gameConfig/rewardsCatalog.js'
import PromoCardsTestRenderer from './PromoCardsTestRenderer.js'

export const promoTooltipFromAdminPanel = `
 1 STARTED_PACK.
 Отключи рекламу и 30 подсказок
 Предлагаем в конце 2-го уровня
 
 2 MEGA_HINTS_PACK
 50 подсказок
 В конце 5-го уровня, если не купили стартовый.
 Если стартовый куплен, то в конце 20-го.
 
 3 REMOVE_AD_PACK
 Отключение рекламы
 Если не купили стартовый набор, то в конце 10-го уровня
 Если купили, то не показываем
`

export const PROMO_DATA = {
  STARTED_PACK: {
    id: rewardsCatalog.promo.promoStartedPack.id,
    texture: 'promoStartedPack',
    get header() { return `${i18next.t('promoStartedPack.header')}` },
    get description() { return `${i18next.t('promoStartedPack.description')}` }
  },
  REMOVE_AD_PACK: {
    id: rewardsCatalog.promo.promoRemoveAdPack.id,
    texture: 'promoRemoveAdPack',
    get header() { return `${i18next.t('promoRemoveAdPack.header')}` },
    get description() { return `${i18next.t('promoRemoveAdPack.description')}` }
  },
  MEGA_HINTS_PACK: {
    id: rewardsCatalog.promo.promoMegaHintsPack.id,
    texture: 'promoMegaHintsPack',
    get header() { return `${i18next.t('promoMegaHintsPack.header')}` },
    get description() { return `${i18next.t('promoMegaHintsPack.description')}` }
  }
}

export default class PromoManager {
  #game = Locator.game
  #card = null
  #resolveLearningComplete
  
  static get promoPacksId() {
    return Object.values(rewardsCatalog.promo).map(pack => pack.id)
  }
  
  static testRender = () => new PromoCardsTestRenderer().render(PROMO_DATA)
  
  static getPromoDataForLevel = (storage) => {
    const hasAdPass = storage.playerData.hasAdPass
    const level = storage.levelIndex
    
    if (!hasAdPass) {
      if (level === 2) return PROMO_DATA.STARTED_PACK
      if (level === 5) return PROMO_DATA.MEGA_HINTS_PACK
      if (level === 10) return PROMO_DATA.REMOVE_AD_PACK
    }
    
    if (hasAdPass) {
      if (level === 20) return PROMO_DATA.MEGA_HINTS_PACK
    }
    
    return null
  }
  
  createPromoCard = async (promoData) => {
    const completionPromise = this.#createCompletionPromise()

    this.#card = new PromoCard({promoData})
    this.#setEvents(true)

    const isShown = await this.#showCard()
    if (!isShown) this.#destroy()

    return completionPromise
  }

  #createCompletionPromise = () => {
    return new Promise(resolve => {
      this.#resolveLearningComplete = resolve
    })
  }

  #showCard = async () => {
    try {
      return await this.#card.show()
    } catch (error) {
      console.error('[PromoManager.showCard]', error)
      return false
    }
  }
  
  #setEvents = (bool) => {
    const status = bool ? 'on' : 'off'
    
    this.#game[status](GAME_EVENTS.PROMO_CARD_CLICK, this.#onHandlerBtnByeAction)
    this.#game[status](GAME_EVENTS.completeLevel, this.#destroy)
    this.#game[status](GAME_EVENTS.HIDE_PROMO_CARD, this.#onPromoCardHidden)
  }
  
  #destroy = () => {
    if (this.#card && !this.#card.destroyed) this.#card.destroy()
    this.#complete()
    
    this.#card = null
  }
  
  #onHandlerBtnByeAction = async (id) => {
    if (!PromoManager.promoPacksId.includes(id)) return

    try {
      await Locator.paymentManager.onPurchase(id)
    } finally {
      await this.#hideCard()
    }
  }

  #hideCard = async () => {
    const card = this.#card
    if (!card || card.destroyed) return this.#complete()

    try {
      await card.hide()
    } finally {
      this.#card = null
      this.#complete()
    }
  }

  #onPromoCardHidden = () => {
    this.#card = null
    this.#complete()
  }

  #complete = () => {
    if (!this.#resolveLearningComplete) return

    const resolve = this.#resolveLearningComplete
    this.#resolveLearningComplete = null
    this.#setEvents(false)
    resolve()
  }
}
