// Описывает используемую игрой часть API платформенных адаптеров.

type SdkFlags = Record<string, boolean | number | string | undefined>

type AdvertisingArea = {
  x: number
  y: number
  width: number
  height: number
}

type SdkAdvertising = {
  isRewardedAvailableNow: () => boolean
  showInterstitial: () => Promise<unknown>
  showRewarded: () => Promise<unknown>
  showBanner: () => Promise<unknown>
  hideAllAdaptiveBanners: () => void
  debugAdaptiveBanners: () => void
  setAdaptiveBannersAreas: (areas: AdvertisingArea[]) => void
  showAllAdaptiveBanners: () => void
}

type SdkCatalogItem = {
  price?: string | number
  [property: string]: unknown
}

type SdkPurchaseData = {
  productID: string
  purchaseToken: string
}

type SdkPurchase = {
  isAvailable: () => boolean
  getCurrency: () => string
  getCatalog: () => Promise<Record<string, SdkCatalogItem>>
  getPurchases: () => Promise<SdkPurchaseData[]>
  buy: (id: string) => Promise<SdkPurchaseData>
  consumePurchase: (purchaseToken: string) => Promise<unknown>
}

type SdkLeaderboardEntry = {
  id: string
  score: number
  rank: number
  avatar: string
  title: string
  extra_data?: Record<string, unknown>
}

type SdkLeaderboard = {
  setScore: (score: number, force?: boolean) => Promise<unknown>
  getEntries: (topLimit?: number, nearbyLimit?: number) => Promise<SdkLeaderboardEntry[]>
}

type SdkPlayer = {
  getId: () => string | null
  isAuth: () => boolean
  auth?: () => Promise<unknown> // Старое имя метода авторизации платформы
  authorize?: () => Promise<unknown>
}

type SdkReview = {
  isAvailable?: () => boolean
  getStatus?: () => boolean
  shouldAct?: () => boolean
  act?: () => Promise<unknown>
}

type SdkStorage = {
  getLocalStorage: () => globalThis.Storage & Record<string, string>
  get: (keys: string[]) => Promise<Array<Record<string, unknown>>>
  set: (data: Record<string, unknown>, force?: boolean) => Promise<unknown>
}

type SdkAdapter = {
  isReady: boolean
  options: {
    flags: SdkFlags
    [property: string]: unknown
  }
  advertising: SdkAdvertising
  leaderboard: SdkLeaderboard
  makeReview?: SdkReview
  player: SdkPlayer
  purchase: SdkPurchase
  session: {
    open: () => Promise<unknown>
    showPopup: () => void
  }
  storage: SdkStorage
  init: () => Promise<unknown>
  gameReady: () => void
  gameplayStart: () => void
  gameplayStop: () => void
  getLang: () => string | Promise<string>
  getPlatformId: () => string
  getServerTime: () => number | Promise<number>
  on: (event: string, listener: (...args: never[]) => void) => void
  forceMute?: (isMuted: boolean) => void
}

type AdCallbacks = {
  onOpen?: () => void
  onClosed?: () => void
  onRewarded?: () => void
  onFinally?: () => void
  onError?: () => void
}

export type {
  AdCallbacks,
  AdvertisingArea,
  SdkAdapter,
  SdkCatalogItem,
  SdkFlags,
  SdkLeaderboard,
  SdkLeaderboardEntry,
  SdkPlayer,
  SdkPurchase,
  SdkPurchaseData,
  SdkReview,
}
