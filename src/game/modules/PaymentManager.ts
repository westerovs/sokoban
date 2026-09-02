import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import {STORAGE_KEYS} from '@/game/engine/storage/defaultData.js'
import LocalStorage from '@/game/engine/storage/LocalStorage.js'
import PromoManager from '@/game/features/promotionCards/PromoManager.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {MAGNIFIERS_IDS, rewardsCatalog} from '@/game/gameConfig/rewardsCatalog.js'
import YaMetrika from '@/game/modules/metrika/YaMetrika.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import Logger from '@/game/utils/Logger.js'
import type Game from '@/game/Game.js'

// Обрабатывает покупки платформы и выдаёт соответствующие игровые награды.

type Reward = {
  id: string
  amount?: number
}

type RewardGroup = Record<string, Reward>

export default class PaymentManager {
  static instance: PaymentManager | null = null
  #game!: Game

  // Сохраняет игровую шину и возвращает общий экземпляр менеджера.
  constructor(game: Game) {
    if (PaymentManager.instance) {
      return PaymentManager.instance
    }

    this.#game = game

    PaymentManager.instance = this
    return this
  }

  // проверяет необработанные платежи при первом запуске
  consumePendingPayments = async () => {
    try {
      if (!SdkManager.isPurchaseAvailable) return

      const purchase = SdkManager.purchase
      const pendingPayments = await purchase.getPurchases()
      if (pendingPayments.length === 0) return

      const catalog = await purchase.getCatalog()

      for (const {productID, purchaseToken} of pendingPayments) {
        if (!catalog[productID]) continue

        if (LocalStorage.isDebug) {
          console.log(
            `%c[consumePendingPayments]:%c\n ${productID},\n ${purchaseToken}`,
            'color: tomato; font-weight: bold;',
            'color: inherit;',
          )
        }

        await this.consumePurchase(productID, purchaseToken)
      }
    } catch (err) {
      console.error('[PaymentManager]: pending payments processing failed', err)
    }
  }

  // Запускает покупку указанного товара.
  async onPurchase(id: string) {
    return this.#buy(id)
  }

  // Покупает товар и передаёт его на обработку.
  #buy = (itemId: string) => {
    Logger.log('', `[onPurchase]: ${itemId}`)

    const purchase = SdkManager.purchase

    return purchase
      .buy(itemId)
      .then(async ({purchaseToken}) => {
        await this.consumePurchase(itemId, purchaseToken)
        return true
      })
      .catch((error: unknown) => {
        GameUtils.showError(error)
        return false
      })
  }

  // Подтверждает покупку и выдаёт награду.
  consumePurchase = async (itemId: string, purchaseToken: string) => {
    Logger.log('', `[consumePurchase]: ${itemId}`)
    const purchase = SdkManager.purchase

    try {
      await purchase.consumePurchase(purchaseToken)
      this.giveReward(itemId)

      YaMetrika.purchase(itemId)
    } catch (e) {
      console.error('[PaymentManager]: purchase consumption failed', e)
      return false
    }
  }

  // Выдаёт награду из магазина или промонабора.
  giveReward = (itemId: string) => {
    Logger.log('', 'giveReward', itemId)
    const {store, promo} = rewardsCatalog

    this.#processStoreReward(store, itemId)
    this.#processPromoDataReward(promo, itemId)
  }

  // Применяет награду обычного товара магазина.
  #processStoreReward = (store: RewardGroup, itemId: string) => {
    const reward = store[itemId]
    if (!reward) return false

    const storage = Locator.storage
    console.log('processStoreReward')
    if ((MAGNIFIERS_IDS as string[]).includes(itemId)) storage.addHints(STORAGE_KEYS.hints, reward.amount ?? 0)
    if (itemId === store.dartsHint.id) storage.addHints(STORAGE_KEYS.hintDarts, reward.amount ?? 0)
    if (itemId === store.compassHint.id) storage.addHints(STORAGE_KEYS.hintCompass, reward.amount ?? 0)
    // coins
    if (itemId === store.coinLarge.id) storage.addHints(STORAGE_KEYS.coins, reward.amount ?? 0)
    if (itemId === store.coinXL.id) storage.addHints(STORAGE_KEYS.coins, reward.amount ?? 0)

    // пропуск рекламы
    if (itemId === store.noAdPack.id) {
      Logger.log('', 'grants ad-free access')
      storage.playerData.hasAdPass = true
      storage.save(true)
      this.#game.emit(GAME_EVENTS.paymentManager.hasNoAdsPass, itemId)
    }
  }

  // Применяет награду купленного промонабора.
  #processPromoDataReward = (promo: RewardGroup, itemId: string) => {
    const storage = Locator.storage

    // проверка наличия id в promoPacks
    if (PromoManager.promoPacksId.includes(itemId)) {
      if (itemId === promo.promoStartedPack.id) {
        storage.playerData.hasAdPass = true
        storage.addHints(STORAGE_KEYS.hints, rewardsCatalog.promo.promoStartedPack.amount)
        this.#game.emit(GAME_EVENTS.paymentManager.hasNoAdsPass, itemId)
      }
      if (itemId === promo.promoRemoveAdPack.id) {
        storage.playerData.hasAdPass = true
        storage.save(true)
        this.#game.emit(GAME_EVENTS.paymentManager.hasNoAdsPass, itemId)
      }
      if (itemId === promo.promoMegaHintsPack.id) {
        storage.addHints(STORAGE_KEYS.hints, rewardsCatalog.promo.promoMegaHintsPack.amount)
      }

      this.#game.emit(GAME_EVENTS.PAYMENT.promoIsPurchased, itemId)
    }
  }
}
