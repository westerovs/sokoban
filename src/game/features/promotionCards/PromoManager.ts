import i18next from 'i18next'
import Locator from '@/game/engine/Locator.ts'
import type Storage from '@/game/engine/storage/Storage.js'
import PromoCard from '@/game/features/promotionCards/PromoCard.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {rewardsCatalog} from '@/game/gameConfig/rewardsCatalog.js'
import PromoCardsTestRenderer from './PromoCardsTestRenderer.js'
import type {PromoData, PromoDataCatalog} from './promoTypes.js'

// Выбирает, показывает и закрывает промопредложения по прогрессу игрока.

const promoTooltipFromAdminPanel = `
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

const PROMO_DATA: PromoDataCatalog = {
  STARTED_PACK: {
    id: rewardsCatalog.promo.promoStartedPack.id,
    texture: 'promoStartedPack',
    get header() {
      return `${i18next.t('promoStartedPack.header')}`
    },
    get description() {
      return `${i18next.t('promoStartedPack.description')}`
    },
  },
  REMOVE_AD_PACK: {
    id: rewardsCatalog.promo.promoRemoveAdPack.id,
    texture: 'promoRemoveAdPack',
    get header() {
      return `${i18next.t('promoRemoveAdPack.header')}`
    },
    get description() {
      return `${i18next.t('promoRemoveAdPack.description')}`
    },
  },
  MEGA_HINTS_PACK: {
    id: rewardsCatalog.promo.promoMegaHintsPack.id,
    texture: 'promoMegaHintsPack',
    get header() {
      return `${i18next.t('promoMegaHintsPack.header')}`
    },
    get description() {
      return `${i18next.t('promoMegaHintsPack.description')}`
    },
  },
}

export default class PromoManager {
  #game = Locator.game
  #card: PromoCard | null = null
  #resolveLearningComplete: (() => void) | null = null

  // Возвращает идентификаторы всех промонаборов.
  static get promoPacksId() {
    return Object.values(rewardsCatalog.promo).map((pack) => pack.id)
  }

  // Отображает все промокарточки для визуальной проверки.
  static testRender = () => new PromoCardsTestRenderer().render(PROMO_DATA)

  // Выбирает предложение для текущего уровня прогресса.
  static getPromoDataForLevel = (storage: Storage) => {
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

  // Создаёт карточку и возвращает обещание её закрытия.
  createPromoCard = async (promoData: PromoData) => {
    const completionPromise = this.#createCompletionPromise()

    this.#card = new PromoCard({promoData})
    this.#setEvents(true)

    const isShown = await this.#showCard()
    if (!isShown) this.#destroy()

    return completionPromise
  }

  // Создаёт обещание завершения показа предложения.
  #createCompletionPromise = () => {
    return new Promise<void>((resolve) => {
      this.#resolveLearningComplete = resolve
    })
  }

  // Показывает карточку с безопасной обработкой ошибки.
  #showCard = async () => {
    try {
      return await this.#card!.show()
    } catch (error) {
      console.error('[PromoManager]: failed to show promo card', error)
      return false
    }
  }

  // Подключает или отключает события карточки.
  #setEvents = (bool: boolean) => {
    const status = bool ? 'on' : 'off'

    this.#game[status](GAME_EVENTS.PROMO_CARD_CLICK, this.#onHandlerBtnByeAction)
    this.#game[status](GAME_EVENTS.completeLevel, this.#destroy)
    this.#game[status](GAME_EVENTS.HIDE_PROMO_CARD, this.#onPromoCardHidden)
  }

  // Уничтожает карточку и завершает ожидание.
  #destroy = () => {
    if (this.#card && !this.#card.destroyed) this.#card.destroy()
    this.#complete()

    this.#card = null
  }

  // Покупает выбранное предложение и закрывает карточку.
  #onHandlerBtnByeAction = async (id: string) => {
    if (!PromoManager.promoPacksId.includes(id)) return

    try {
      await Locator.paymentManager.onPurchase(id)
    } finally {
      await this.#hideCard()
    }
  }

  // Скрывает активную карточку.
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

  // Сбрасывает ссылку после внешнего закрытия карточки.
  #onPromoCardHidden = () => {
    this.#card = null
    this.#complete()
  }

  // Завершает ожидание карточки и отключает события.
  #complete = () => {
    if (!this.#resolveLearningComplete) return

    const resolve = this.#resolveLearningComplete
    this.#resolveLearningComplete = null
    this.#setEvents(false)
    resolve()
  }
}

export {PROMO_DATA, promoTooltipFromAdminPanel}
