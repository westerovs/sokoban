import {GAME_NAMES} from '../../gameConfig/constants.js'
import type {PlayerData} from '../../engine/storage/defaultData.js'
import type Storage from '../../engine/storage/Storage.js'
import {GAME_NAME} from '../../generatedAssets/buildMeta.js'
import Logger, {MODULES} from '../../utils/Logger.js'

// Отправляет игровые цели, параметры и ошибки в Яндекс Метрику.

type MetrikaLevelConfig = {
  levelName: string
  currentSkinName: string
}

// Возвращает идентификатор счётчика для текущей игры.
const getId = () => {
  const gameName: string = GAME_NAME
  if (gameName === GAME_NAMES.detective) return 99603095
  if (gameName === GAME_NAMES.hotel) return 103542034
  if (gameName === GAME_NAMES.adventure) return 105982536
  if (gameName === GAME_NAMES.detectiveGirl) return 107254518
  else return 0
}

const COUNTER_ID = getId()

const ERROR_TYPES = {
  GAME_PRELOAD: {
    initialize: 'GAME_PRELOAD:initialize',
    loadPlayerData: 'GAME_PRELOAD:loadPlayerData',
    showAd: 'GAME_PRELOAD:showAd',
  },
  LEVEL_PRELOAD: {
    loading: 'LEVEL_PRELOAD:loading',
    loadBundle: 'LEVEL_PRELOAD:loadBundle',
  },
  SOUND_PRELOAD: {
    preload: 'SOUND_PRELOAD:preload',
  },
}

// не работает на localhost, переключить в режим DEV
export default class YaMetrika {
  // ================ ↓ ЦЕЛИ ↓ ===============
  // =========================================
  // Отправляет нажатие кнопки старта.
  static btnStart = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'btnStart')

    ym(COUNTER_ID, 'reachGoal', 'clickBtnStart')
  }

  // Отправляет открытие магазина с главного экрана.
  static mainScreenBtnStore = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'mainScreenBtnStore')

    ym(COUNTER_ID, 'reachGoal', 'mainScreenBtnStore')
  }

  // Отправляет открытие таблицы лидеров.
  static btnLeaders = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'btnLeaders')

    ym(COUNTER_ID, 'reachGoal', 'clickBtnLeaders')
  }

  // --------------- ОТЗЫВЫ
  // Нажатие на кнопку оставить отзыв за звезды
  // Отправляет подтверждение отзыва пользователем.
  static userReviewClickOk = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'userReviewClickOk')

    ym(COUNTER_ID, 'reachGoal', 'userReviewClickOk')
  }

  // Нажатие на кнопку позже в предложении поставить отзыв
  // Отправляет откладывание отзыва пользователем.
  static userReviewClickLater = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'userReviewClickLater')

    ym(COUNTER_ID, 'reachGoal', 'userReviewClickLater')
  }

  // --------------- Экран завершения  уровня
  // Отправляет переход к следующему уровню.
  static finalScreenBtnNext = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'finalScreenBtnNext')

    ym(COUNTER_ID, 'reachGoal', 'finalScreenBtnNext')
  }

  // Отправляет возврат домой с финального экрана.
  static finalScreenBtnHome = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'finalScreenBtnHome')

    ym(COUNTER_ID, 'reachGoal', 'finalScreenBtnHome')
  }

  // Кнопка отключить рекламу
  // Отправляет нажатие отключения рекламы.
  static finalScreenBtnDisableAd = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'finalScreenBtnDisableAd')

    ym(COUNTER_ID, 'reachGoal', 'finalScreenBtnDisableAd')
  }

  // Клик по кнопке Магазин (финальный экран)
  // Отправляет открытие магазина с финального экрана.
  static finalScreenBtnStore = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'finalScreenBtnStore')

    ym(COUNTER_ID, 'reachGoal', 'finalScreenBtnStore')
  }

  // Окно когда не хватает подсказок: Нажатие на кнопку Магазин
  // Отправляет переход в магазин из окна нехватки подсказок.
  static noHintsClickBtnStore = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'noHintsClickBtnStore')

    ym(COUNTER_ID, 'reachGoal', 'noHintsClickBtnStore')
  }

  // Окно когда не хватает подсказок: Нажатие на кнопку playReward
  // Отправляет просмотр рекламы из окна нехватки подсказок.
  static noHintsClickBtnReward = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'noHintsClickBtnReward')

    ym(COUNTER_ID, 'reachGoal', 'noHintsClickBtnReward')
  }

  // Все уровни и все скины пройдены полностью
  // Отправляет полное завершение игры.
  static completeGame = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'completeGame')

    ym(COUNTER_ID, 'reachGoal', 'completeGame')
  }

  // Время сессии после загрузки, таймер каждые 3 минуты
  // Отправляет периодическую отметку времени сессии.
  static gameTimeTracker = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'gameTimeTracker')

    ym(COUNTER_ID, 'reachGoal', 'gameTimeTracker')
  }

  // --------------- Реклама
  // Отправляет успешный просмотр рекламы с наградой.
  static rewardedAdWatched = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'rewardedAdWatched')

    ym(COUNTER_ID, 'reachGoal', 'rewardedAdWatched')
  }

  // Отправляет успешный просмотр межстраничной рекламы.
  static interstitialWatched = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'interstitialWatched')

    ym(COUNTER_ID, 'reachGoal', 'interstitialWatched')
  }

  // Отправляет принудительную перезагрузку игры.
  static forceReload = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'forceReload')

    ym(COUNTER_ID, 'reachGoal', 'forceReload')
  }

  // Отправляет покупку новогоднего события.
  static newYearIsPurchased = () => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'newYearIsPurchased')

    ym(COUNTER_ID, 'reachGoal', 'newYearIsPurchased')
  }

  // ============= ↓ Параметры ↓ =============
  // =========================================
  static startLevel = (config: MetrikaLevelConfig, storage: Storage) => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'startLevel')

    const {levelName, currentSkinName} = config
    const {userLevel} = storage

    ym(COUNTER_ID, 'params', {
      startLevel: {
        levelName,
        currentSkinName,
        userLevel,
      },
    })
  }

  // статистика прохождения уровня, включая его время играния
  static completeLevel = (config: MetrikaLevelConfig, storage: Storage, levelPlayTime: number) => {
    if (typeof ym !== 'function') return

    const {levelName, currentSkinName} = config
    const {userLevel} = storage

    const data = {
      levelName: `levelName: ${levelName} / levelPlayTime: ${levelPlayTime}`,
      currentSkinName,
      userLevel: {
        [userLevel]: {levelPlayTime},
      },
    }

    Logger.log(MODULES.Metrika, 'completeLevel', data)

    ym(COUNTER_ID, 'params', {
      completeLevel: data,
    })
  }

  // когда досрочно вышли с уровня
  static earlyExit = (config: MetrikaLevelConfig, storage: Storage, levelPlayTime: number) => {
    if (typeof ym !== 'function') return

    const {levelName, currentSkinName} = config
    const {userLevel} = storage

    const data = {
      levelName: `levelName: ${levelName} / levelPlayTime: ${levelPlayTime}`,
      currentSkinName,
      userLevel: {
        [userLevel]: {levelPlayTime},
      },
    }

    Logger.log(MODULES.Metrika, 'earlyExit', data)

    ym(COUNTER_ID, 'params', {
      earlyExit: data,
    })
  }

  // Использование подсказки
  static useHint = (playerData: PlayerData, hintName: string) => {
    if (typeof ym !== 'function') return
    const data = {
      levelIndex: playerData.levelIndex,
      skinIndex: playerData.skinIndex,
      hintName: hintName === 'hints' ? 'magnifier' : hintName,
    }

    Logger.log(MODULES.Metrika, 'useHint', data)

    ym(COUNTER_ID, 'params', {
      useHint: data,
    })
  }

  // количество использованных подсказок
  static hintCounter = (storage: Storage, counter: number) => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'hintCounter')

    const userLevel = storage.userLevel + 1 // todo внимательно, +1 небольшой костыль
    const {levelIndex, skinIndex} = storage.playerData

    ym(COUNTER_ID, 'params', {
      hintCounter: {
        levelName: levelIndex,
        currentSkinName: skinIndex,
        userLevel: {
          [userLevel]: {counter},
        },
      },
    })
  }

  // количество неправильных кликов
  static missClickCounter = (storage: Storage, counter: number) => {
    if (typeof ym !== 'function') return

    const userLevel = storage.userLevel + 1 // todo внимательно, +1 небольшой костыль
    const {levelIndex, skinIndex} = storage.playerData

    Logger.log(MODULES.Metrika, 'missClickCounter')

    ym(COUNTER_ID, 'params', {
      missClickCounter: {
        counter,
        userLevel,
        levelName: levelIndex,
        currentSkinName: skinIndex,
      },
    })
  }

  // Отправляет идентификатор купленного товара.
  static purchase = (id: string) => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'purchase', id)

    ym(COUNTER_ID, 'params', {purchase: {id}})
  }

  // Отправляет ошибку загрузки звука.
  static soundLoadErr = (src: unknown, err: unknown) => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'soundLoadErr')

    ym(COUNTER_ID, 'params', {soundLoadErr: {src, err}})
  }

  // Отправляет диагностические данные ошибки предзагрузки.
  static preloadError = (type: string, error: unknown) => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'preloadError')

    try {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack || 'No stack available' : 'No stack available'

      const errorPayload = {
        [`error_${type}`]: {
          error: {
            message: errorMessage,
            stack: errorStack,
          },
        },
      }

      ym(COUNTER_ID, 'params', errorPayload)
    } catch (e) {
      console.warn('metrika preloadError', e)
    }
  }

  // -------------- OTHER
  // Отправляет тестовый набор ошибок предзагрузки.
  static testingErrors = () => {
    const e = new Error('Это тестовая ошибка')

    YaMetrika.preloadError(ERROR_TYPES?.GAME_PRELOAD?.initialize, e)
    YaMetrika.preloadError(ERROR_TYPES?.GAME_PRELOAD?.loadPlayerData, e)
    YaMetrika.preloadError(ERROR_TYPES?.GAME_PRELOAD?.showAd, e)

    YaMetrika.preloadError(ERROR_TYPES?.LEVEL_PRELOAD?.loading, e)
    YaMetrika.preloadError(ERROR_TYPES?.LEVEL_PRELOAD?.loadBundle, e)
    YaMetrika.preloadError(ERROR_TYPES?.SOUND_PRELOAD?.preload, e)
  }

  // Отправляет длительность загрузки игры.
  static loadDuration = (duration: number) => {
    if (typeof ym !== 'function') return
    Logger.log(MODULES.Metrika, 'loadDuration', duration)

    ym(COUNTER_ID, 'params', {gameLoadTime: duration})
  }
}

export {
  ERROR_TYPES,
}
