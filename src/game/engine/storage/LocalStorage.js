import {GAME_NAME} from '../../generatedAssets/buildMeta.js'
import {MODULES} from '../../utils/Logger.js'
import SdkManager from '../SdkManager.js'

export default class LocalStorage {
  #localStorageName = GAME_NAME
  static _storage = null

  static get isDebug() {
    if (!LocalStorage._storage) return false

    const key = `${GAME_NAME}-isDebug`
    return LocalStorage._storage.getItem(key) === 'true'
  }

  static set isDebug(value) {
    if (!LocalStorage._storage) return

    const key = `${GAME_NAME}-isDebug`
    LocalStorage._storage.setItem(key, value ? 'true' : 'false')
  }

  static get forceNewYear() {
    if (!LocalStorage._storage) return false

    const key = `${GAME_NAME}-forceNewYear`
    return LocalStorage._storage.getItem(key) === 'true'
  }

  static set forceNewYear(value) {
    if (!LocalStorage._storage) return

    const key = `${GAME_NAME}-forceNewYear`
    LocalStorage._storage.setItem(key, value ? 'true' : 'false')
  }

  static get isLog() {
    if (!LocalStorage._storage) return false

    const key = `${GAME_NAME}-isLog`
    return LocalStorage._storage.getItem(key) === 'true'
  }

  static set isLog(value) {
    if (!LocalStorage._storage) return

    const key = `${GAME_NAME}-isLog`
    LocalStorage._storage.setItem(key, value ? 'true' : 'false')
  }

  static get isItemRects() {
    if (!LocalStorage._storage) return false

    const key = `${GAME_NAME}-isItemRects`
    return LocalStorage._storage.getItem(key) === 'true'
  }

  static set isItemRects(value) {
    if (!LocalStorage._storage) return

    const key = `${GAME_NAME}-isItemRects`
    LocalStorage._storage.setItem(key, value ? 'true' : 'false')
  }

  static get testPromo() {
    if (!LocalStorage._storage) return false

    const key = `${GAME_NAME}-testPromo`
    return LocalStorage._storage.getItem(key) === 'true'
  }

  static set testPromo(value) {
    if (!LocalStorage._storage) return

    const key = `${GAME_NAME}-testPromo`
    LocalStorage._storage.setItem(key, value ? 'true' : 'false')
  }

  static get testLoad() {
    if (!LocalStorage._storage) return false

    const key = `${GAME_NAME}-testLoad`
    return LocalStorage._storage.getItem(key) === 'true'
  }

  static set testLoad(value) {
    if (!LocalStorage._storage) return

    const key = `${GAME_NAME}-testLoad`
    LocalStorage._storage.setItem(key, value ? 'true' : 'false')
  }

  init = () => {
    try {
      LocalStorage._storage = SdkManager.adapter.storage.getLocalStorage()
      this.#checkAndClear()
    } catch (err) {
      console.error('[LocalStorage]', err)
    }
  }

  #checkAndClear() {
    if (!LocalStorage._storage) return
    if (LocalStorage.isDebug) return

    LocalStorage.clear()
  }

  static clear = () => {
    const keys = [
      `${GAME_NAME}-isDebug`,
      `${GAME_NAME}-isLog`,
      `${GAME_NAME}-forceNewYear`,
      `${GAME_NAME}-isItemRects`,
      `${GAME_NAME}-testPromo`,
      `${GAME_NAME}-testLoad`,
    ]

    keys.forEach((key) => LocalStorage._storage.removeItem(key))
  }

  getData = async () => {
    if (!LocalStorage._storage) return

    const saves = []
    const playerId = SdkManager.getPlayerId() || null

    const serverLocalStorageData = playerId ? await this.#getServerLocalStorageData(playerId) : []
    if (serverLocalStorageData) saves.push(...serverLocalStorageData)

    const localStorageData = await this.#getBrowserLocalStorageData()
    if (localStorageData) saves.push(...localStorageData)

    return saves.filter((save) => (save?.playerId || null) === playerId)
  }

  save = (data) => {
    if (!LocalStorage._storage) return

    try {
      LocalStorage._storage.setItem(this.#localStorageName, JSON.stringify(data))
    } catch (err) {
      console.error(MODULES.STORAGE, '[LocalStorage save]', err)
    }
  }

  #getServerLocalStorageData = async (playerId) => {
    if (!playerId) return []

    const saves = []
    const data = await SdkManager.getLocalStorage()

    if (data) {
      if (data[this.#localStorageName]) {
        saves.push(JSON.parse(data[this.#localStorageName]))
      }
    }

    return saves
  }

  #getBrowserLocalStorageData = async () => {
    const saves = []

    try {
      const newItem = LocalStorage._storage.getItem(this.#localStorageName)
      if (newItem) {
        const parsed = this.#safeParse(newItem, this.#localStorageName)
        if (parsed) saves.push(parsed)
      }
    } catch (err) {
      console.error('[LocalStorage load]', err)
    }
    return saves
  }

  #safeParse = (data, key) => {
    try {
      return JSON.parse(data)
    } catch (err) {
      console.error(`Ошибка парсинга JSON для ключа "${key}":`, err)
      return null
    }
  }
}
