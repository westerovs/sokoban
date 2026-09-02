import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import {PLATFORM_ID} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {PACKAGE_VERSION} from '@/game/generatedAssets/buildMeta.js'
import YaMetrika from '@/game/modules/metrika/YaMetrika.js'
import OfflineBadge from '@/game/utils/gameUtils/OfflineBadge.js'
import {Logger} from '@/game/utils/Logger.js'
import MathTools from '@/game/utils/MathTools.js'
import {DEFAULT_DATA_VALUES, SERIALIZED_ARRAY_KEYS, STORAGE_KEYS} from './defaultData.js'
import GameSettings from './GameSettings.js'
import LocalStorage from './LocalStorage.js'
import {createProfileProxy, getMaxFreshData, getMaxUserLevelData, parseJsonKey, stringifyJsonKey} from './utils/utils.js'
import Validation from './utils/Validation.js'

/**
 * Загружает, изменяет и сохраняет профиль игрока в локальном и платформенном хранилищах.
 */

export default class Storage {
  #game
  #gameSettings = new GameSettings(this)
  #localStorage = new LocalStorage()
  #rawData = {}
  #playerData
  #isDebug = false
  #isReadOnly = false

  constructor(game) {
    if (typeof Storage.instance === 'object') {
      return Storage.instance
    }

    this.#game = game

    Storage.instance = this
    return Storage.instance
  }

  get gameSettings() {
    return this.#gameSettings
  }

  get playerData() {
    return this.#playerData
  }

  get userLevel() {
    return this.#playerData.userLevel
  }

  get levelIndex() {
    return this.#playerData.levelIndex
  }

  // Переводит профиль в режим без постоянных записей до перезагрузки страницы.
  enableReadOnlyMode = () => {
    this.#isReadOnly = true
  }

  // Загружает и подготавливает наиболее свежий профиль игрока.
  load = async () => {
    try {
      this.#localStorage.init()

      const saves = await this.#loadSaves()
      const freshestData = this.#selectFreshestData(saves)
      const playerData = this.#preparePlayerData(freshestData)

      this.#setProxyData(playerData)
    } catch (err) {
      console.error('[load]', err)
    }
  }

  // Сохраняет текущее состояние профиля во все доступные хранилища.
  save = (force) => {
    // В режиме черновика профиль меняется только в памяти: тестовый прогресс не попадает в постоянные хранилища.
    if (this.#isReadOnly) return

    if (this.#isDebug) {
      console.error('[Storage] save off!')
      return
    }

    OfflineBadge.checkAndShow()

    this.#rawData = {...this.#playerData}
    this.#rawData.playerId = SdkManager.getPlayerId()
    this.#rawData.savedAt = new Date().toISOString()
    SERIALIZED_ARRAY_KEYS.forEach((key) => {
      this.#rawData[key] = stringifyJsonKey(this.#rawData[key])
    })

    Logger.log('[save]', this.#rawData)

    this.#localStorage.save(this.#rawData)

    if (!SdkManager.isPlatform(PLATFORM_ID.base)) {
      SdkManager.adapter.storage.set(this.#rawData, force).catch((err) => console.error('[save]', err))
    }
  }

  get hints() {
    return this.#playerData.hints
  }

  // todo добавляет не только хинты, а все товары из магазина и монетки
  addHints = (id, amount, save = true) => {
    if (!id) return
    if (!MathTools.isNumber(amount)) {
      console.error(`[addHints] id ${id} not a number: ${amount}`)
      return
    }

    if (id === STORAGE_KEYS.hints) {
      this.#playerData.hints += amount
      this.#game.emit(GAME_EVENTS.STORAGE.hintsUpdated, {storageName: STORAGE_KEYS.hints, type: 'added'})
    }
    if (id === STORAGE_KEYS.hintDarts) {
      this.#playerData.hintDarts += amount
      this.#game.emit(GAME_EVENTS.STORAGE.hintsUpdated, {storageName: STORAGE_KEYS.hintDarts, type: 'added'})
    }
    if (id === STORAGE_KEYS.hintCompass) {
      this.#playerData.hintCompass += amount
      this.#game.emit(GAME_EVENTS.STORAGE.hintsUpdated, {storageName: STORAGE_KEYS.hintCompass, type: 'added'})
    }
    if (id === STORAGE_KEYS.coins) {
      this.#playerData.coins += amount
      this.#game.emit(GAME_EVENTS.STORAGE.hintsUpdated, {storageName: STORAGE_KEYS.coins, type: 'added'})
    }

    if (save) this.save(true)
  }

  addCoins = (amount) => {
    if (!MathTools.isNumber(amount)) {
      console.error(`[addCoins] id not a number: ${amount}`)
      return
    }

    this.#playerData.coins += amount
    this.save(true)
  }

  // todo проверка на меньше 0, т.к текущая не гарантирует уход в минус, если списание большое
  spendCoins = (amount, save = true) => {
    if (!MathTools.isNumber(amount)) {
      console.error(`[spendCoins] id not a number: ${amount}`)
      return
    }

    if (this.#playerData.coins <= 0) return

    this.#game.emit(GAME_EVENTS.STORAGE.hintsUpdated, {storageName: STORAGE_KEYS.coins, type: 'spend'})
    this.#playerData.coins -= amount

    if (save) this.save(true)
  }

  spendHints = (hintName) => {
    if (this.#playerData[hintName] <= 0) return

    YaMetrika.useHint(this.#playerData, hintName)

    this.#playerData[hintName] -= 1
    this.#game.emit(GAME_EVENTS.STORAGE.hintsUpdated, {storageName: hintName, type: 'spend'})
    this.save()
  }

  // Сбрасывает постоянный профиль и перезапускает игру.
  resetAllData = () => {
    // Режим черновика не позволяет очистить постоянный профиль через инструменты отладки.
    if (this.#isReadOnly) return

    if (LocalStorage._storage) {
      localStorage.clear()
      LocalStorage.clear()
    }

    this.#playerData = {...DEFAULT_DATA_VALUES}
    SdkManager.leaderboard.setScore(this.#playerData.userLevel).catch((e) => {
      console.error('[leaderboard.setScore]', e)
    })

    this.save(true)
    Locator.game.app.stage.visible = false
    setTimeout(() => location.reload(), 2500)
  }

  // Повышает рекорд игрока после первого прохождения уровня.
  updateUserRecord = () => {
    this.#playerData.userLevel += 1

    // В режиме черновика новый рекорд остаётся в памяти и не отправляется в таблицу лидеров.
    if (this.#isReadOnly) return

    SdkManager.leaderboard.setScore(this.#playerData.userLevel).catch((e) => {
      console.error('[leaderboard.setScore]', e)
    })
  }

  // ------------- save / load
  #loadSaves = async () => {
    const [serverData, localData] = await Promise.all([SdkManager.getData(), this.#localStorage.getData()])

    const saves = []
    if (Array.isArray(serverData)) saves.push(...serverData.flat(1))
    if (Array.isArray(localData)) saves.push(...localData.flat(1))

    setTimeout(() => Logger.log('[LoadSaveManager.saves]', saves), 1000)

    return saves
  }

  #selectFreshestData = (saves) => {
    const freshestData = getMaxFreshData(saves)

    if (freshestData === null) return getMaxUserLevelData(saves)

    return freshestData
  }

  #preparePlayerData = (data) => {
    this.#handleSpecialRulesIfFirstInit(data)

    const validatedData = Validation.validate(data)

    SERIALIZED_ARRAY_KEYS.forEach((key) => {
      validatedData[key] = parseJsonKey(validatedData, key)
    })

    return validatedData
  }

  #setProxyData = (freshestData) => {
    freshestData.version = PACKAGE_VERSION
    freshestData.playerId = SdkManager.getPlayerId()
    this.#rawData = freshestData

    this.#playerData = createProfileProxy(freshestData, 'PlayerProfile')
    Logger.log('[LoadSaveManager.setProxyData]', freshestData)
  }

  #handleSpecialRulesIfFirstInit = (data) => {
    if (!data) return

    if (data.option_zoom === null || data.option_zoom === undefined) {
      // для крейзи всегда показываем кнопки зума по умолчанию
      if (SdkManager.isPlatform(PLATFORM_ID.cg)) {
        data.option_zoom = true
        return
      }

      // если это не крейзи и мобилка - всегда прячем
      if (SdkManager.isMobile) {
        data.option_zoom = false
        return
      }

      // если это не мобилка и не крейзи и игра не на русском, то показываем кнопки
      if (Locator.gameConfig.locale !== 'ru') {
        data.option_zoom = true
        return
      }

      data.option_zoom = false
    }
  }
}
