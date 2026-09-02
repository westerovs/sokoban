import {isMobile} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import CrazyGames from '@/game/engine/special/CrazyGames.js'
import {DEFAULT_DATA} from '@/game/engine/storage/defaultData.js'
import {DEFAULT_FLAGS, GAME_STATES, PLATFORM_ID} from '@/game/gameConfig/constants.js'
import {Logger, MODULES} from '@/game/utils/Logger.js'
import type {AdCallbacks, SdkAdapter, SdkLeaderboard, SdkPlayer, SdkPurchase, SdkReview} from './sdkTypes.js'

// Предоставляет игре единый типизированный доступ к платформенному SDK.

export default class SdkManager {
  static sdk: SdkAdapter | undefined
  static makeReview: SdkReview | undefined
  static leaderboard: SdkLeaderboard
  static purchase: SdkPurchase
  static player: SdkPlayer
  static adapter: SdkAdapter
  static gameplayIsStarted = false
  static gameplayIsStopped = true
  static isGameReady = false

  static get flags() {
    return SdkManager.adapter.options.flags
  }

  // доступны ли покупки
  static get isPurchaseAvailable() {
    return SdkManager.adapter.purchase.isAvailable()
  }

  static get isUserAuth() {
    return SdkManager.adapter.player.isAuth()
  }

  static get isMobile() {
    return isMobile.any
  }

  // ------------- ↓ main ↓ -------------
  static initSdk = async (adapter: SdkAdapter) => {
    SdkManager.adapter = adapter

    await adapter.init()

    SdkManager.sdk = adapter
    SdkManager.makeReview = adapter.makeReview
    SdkManager.leaderboard = adapter.leaderboard
    SdkManager.purchase = adapter.purchase
    SdkManager.player = adapter.player

    SdkManager.checkAvailableFlags()
    SdkManager.showBanner()
    SdkManager.initSessionControl()

    if (SdkManager.isPlatform(PLATFORM_ID.cg)) {
      CrazyGames.init()
    }
  }

  // проверка, инициализированно-ли SDK
  static isReady = () => {
    const isReady = SdkManager.adapter.isReady

    if (!isReady) {
      console.error('[SdkManager]: SDK is not initialized')
      // попытка повторной инициализации
      void SdkManager.initSdk(SdkManager.adapter)
    }
    return isReady
  }

  static gameplayStart = () => {
    if (Locator.game.currentStateName === GAME_STATES.gameState) return
    if (SdkManager.gameplayIsStarted) return

    SdkManager.gameplayIsStarted = true
    SdkManager.gameplayIsStopped = false
    SdkManager.sdk?.gameplayStart()
    Logger.log(null, '[gameplayStart]')
  }

  static gameplayStop = () => {
    if (Locator.game.currentStateName === GAME_STATES.gameState) return
    if (SdkManager.gameplayIsStopped) return

    SdkManager.gameplayIsStarted = false
    SdkManager.gameplayIsStopped = true
    SdkManager.sdk?.gameplayStop()
    Logger.log(null, '[gameplayStop]')
  }

  // сообщает SDK площадки, что игра загружена и готова к показу
  static gameReady = () => {
    if (SdkManager.isGameReady) return
    SdkManager.isGameReady = true
    Logger.warn(null, 'gameReady')
    SdkManager.adapter.gameReady()
  }

  static checkAvailableFlags = () => {
    const sdkFlags = SdkManager.adapter.options.flags

    // проверка на пустой объект
    if (sdkFlags && Object.keys(sdkFlags).length > 0) {
      console.log('[SdkManager] SDK flags are available:', sdkFlags)
    } else {
      SdkManager.adapter.options.flags = DEFAULT_FLAGS
      console.log(`[SdkManager] load flags error set default`, DEFAULT_FLAGS)
    }
  }

  // ------------- ↓ storage ↓ -------------
  static getPlayerId = () => {
    const id = SdkManager.sdk?.player?.getId()
    if (id) return id

    return null
  }

  static getLocalStorage = async () => {
    return await SdkManager.adapter.storage.getLocalStorage()
  }

  static getData = async () => {
    const keys = Object.keys(DEFAULT_DATA)
    return await SdkManager.adapter.storage.get(keys)
  }

  // ------------- ↓ advertising ↓ -------------
  static isRewardedAvailableNow = () => {
    return SdkManager.adapter.advertising.isRewardedAvailableNow()
  }

  static showInterstitial = ({onOpen, onClosed, onFinally, onError}: AdCallbacks = {}) => {
    return new Promise<void>((resolve) => {
      if (Locator?.storage?.playerData?.hasAdPass) {
        resolve()
        return
      }

      Logger.log(null, '--- show Interstitial ---')
      if (onOpen) onOpen()

      SdkManager.adapter.advertising
        .showInterstitial()
        .then(() => {
          if (onClosed) onClosed()
        })
        .catch((err: unknown) => {
          // Base/no-adapters reject without a reason when interstitials are unsupported.
          if (err) console.error('[SdkManager]: interstitial failed', err)
          if (onError) onError()
        })
        .finally(() => {
          if (onFinally) onFinally()
          resolve()
        })
    })
  }

  static showRewarded = ({onOpen, onRewarded, onFinally, onError}: AdCallbacks = {}) => {
    Logger.log(null, '--- show Rewarded ---')

    if (onOpen) onOpen()
    Logger.log(MODULES.SDK, '[showRewarded] start')

    SdkManager.adapter.advertising
      .showRewarded()
      .then(() => {
        if (onRewarded) onRewarded()
      })
      .catch((err: unknown) => {
        console.error('[SdkManager]: rewarded ad failed', err)
        if (onError) onError()
      })
      .finally(() => {
        if (onFinally) onFinally()
      })
  }

  static showBanner = () => {
    SdkManager.adapter.advertising
      .showBanner()
      .then(() => {
        Logger.log('[showBanner]')
      })
      .catch((error: unknown) => {
        // Base/no-adapters reject without a reason when banners are unsupported.
        if (error) console.error('[SdkManager]: banner failed', error)
      })
  }

  static initSessionControl = () => {
    SdkManager.adapter.session
      .open()
      .catch((error: unknown) => {
        console.error('[SdkManager]: session control failed', error)
        SdkManager.adapter.session.showPopup()
      })
      .finally(() => {
        console.log('session control finished')
      })
  }

  // ------------- ↓ other ↓ -------------
  static getLang = async () => {
    return await SdkManager.adapter.getLang()
  }

  static getServerTime = async () => {
    return await SdkManager.adapter.getServerTime()
  }

  static getPlatformId = () => {
    const id = SdkManager.sdk?.getPlatformId()

    if (!id) {
      Logger.log('[SdkManager getPlatformId]: id not found')
      return ''
    }

    Logger.log('[SdkManager getPlatformId]:', id.toLowerCase())
    return id.toLowerCase()
  }

  static isPlatform = (platformName: string) => {
    return SdkManager.getPlatformId().includes(platformName)
  }
}
