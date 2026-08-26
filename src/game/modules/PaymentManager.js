import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import {STORAGE_KEYS} from '@/game/engine/storage/defaultData.js'
import LocalStorage from '@/game/engine/storage/LocalStorage.js'
import PromoManager from '@/game/features/promotionCards/PromoManager.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {MAGNIFIERS_IDS, rewardsCatalog} from '@/game/gameConfig/rewardsCatalog.js'
import YaMetrika from '@/game/modules/metrika/YaMetrika.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {Logger} from '@/game/utils/Logger.js'

export default class PaymentManager {
  #game

  constructor(game) {
    if (typeof PaymentManager.instance === 'object') {
      return PaymentManager.instance
    }

    this.#game = game

    PaymentManager.instance = this
    return PaymentManager.instance
  }

  // проверяет необработанные платежи при первом запуске
  consumePendingPayments = async () => {
    try {
      if (!SdkManager.isPurchaseAvailable) return

      const purchase = await SdkManager.sdk.purchase
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
      console.error('[consumePendingPayments]', err)
    }
  }

  async onPurchase(id) {
    return this.#buy(id)
  }

  #buy = (itemId) => {
    Logger.log('', `[onPurchase]: ${itemId}`)

    const purchase = SdkManager.purchase

    return purchase
      .buy(itemId)
      .then(async ({purchaseToken}) => {
        await this.consumePurchase(itemId, purchaseToken)
        return true
      })
      .catch((error) => {
        GameUtils.showError(error)
        return false
      })
  }

  consumePurchase = async (itemId, purchaseToken) => {
    Logger.log('', `[consumePurchase]: ${itemId}`)
    const purchase = SdkManager.purchase

    try {
      await purchase.consumePurchase(purchaseToken)
      this.giveReward(itemId)

      YaMetrika.purchase(itemId)
    } catch (e) {
      console.error('[consumePurchase]', e)
      return false
    }
  }

  giveReward = (itemId) => {
    Logger.log('', 'giveReward', itemId)
    const {store, promo} = rewardsCatalog

    this.#processStoreReward(store, itemId)
    this.#processPromoDataReward(promo, itemId)
  }

  #processStoreReward = (store, itemId) => {
    const reward = rewardsCatalog.store[itemId]
    if (!reward) return false

    const storage = Locator.storage
    console.log('processStoreReward')
    if (MAGNIFIERS_IDS.includes(itemId)) storage.addHints(STORAGE_KEYS.hints, store[itemId].amount)
    if (itemId === store.dartsHint.id) storage.addHints(STORAGE_KEYS.hintDarts, store[itemId].amount)
    if (itemId === store.compassHint.id) storage.addHints(STORAGE_KEYS.hintCompass, store[itemId].amount)
    // coins
    if (itemId === store.coinLarge.id) storage.addHints(STORAGE_KEYS.coins, store[itemId].amount)
    if (itemId === store.coinXL.id) storage.addHints(STORAGE_KEYS.coins, store[itemId].amount)

    // пропуск рекламы
    if (itemId === store.noAdPack.id) {
      Logger.log('', 'grants ad-free access')
      storage.playerData.hasAdPass = true
      storage.save(true)
      this.#game.emit(GAME_EVENTS.paymentManager.hasNoAdsPass, itemId)
    }
  }

  #processPromoDataReward = (promo, itemId) => {
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
