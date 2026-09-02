import {GAME_NAME} from '../../generatedAssets/buildMeta.js'
import {MODULES} from '../../utils/Logger.js'
import SdkManager from '../SdkManager.js'
import type {PlayerSave} from './utils/utils.js'

// Читает и записывает локальные настройки и резервные копии профиля игрока.

type StorageAdapter = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export default class LocalStorage {
  #localStorageName = GAME_NAME
  static _storage: StorageAdapter | null = null

  // Возвращает состояние отладочного режима.
  static get isDebug() {
    if (!LocalStorage._storage) return false

    const key = `${GAME_NAME}-isDebug`
    return LocalStorage._storage.getItem(key) === 'true'
  }

  // Сохраняет состояние отладочного режима.
  static set isDebug(value: boolean) {
    if (!LocalStorage._storage) return

    const key = `${GAME_NAME}-isDebug`
    LocalStorage._storage.setItem(key, value ? 'true' : 'false')
  }

  // Возвращает принудительное включение новогоднего события.
  static get forceNewYear() {
    if (!LocalStorage._storage) return false

    const key = `${GAME_NAME}-forceNewYear`
    return LocalStorage._storage.getItem(key) === 'true'
  }

  // Сохраняет принудительное включение новогоднего события.
  static set forceNewYear(value: boolean) {
    if (!LocalStorage._storage) return

    const key = `${GAME_NAME}-forceNewYear`
    LocalStorage._storage.setItem(key, value ? 'true' : 'false')
  }

  // Возвращает состояние журналирования.
  static get isLog() {
    if (!LocalStorage._storage) return false

    const key = `${GAME_NAME}-isLog`
    return LocalStorage._storage.getItem(key) === 'true'
  }

  // Сохраняет состояние журналирования.
  static set isLog(value: boolean) {
    if (!LocalStorage._storage) return

    const key = `${GAME_NAME}-isLog`
    LocalStorage._storage.setItem(key, value ? 'true' : 'false')
  }

  // Возвращает состояние отображения границ объектов.
  static get isItemRects() {
    if (!LocalStorage._storage) return false

    const key = `${GAME_NAME}-isItemRects`
    return LocalStorage._storage.getItem(key) === 'true'
  }

  // Сохраняет состояние отображения границ объектов.
  static set isItemRects(value: boolean) {
    if (!LocalStorage._storage) return

    const key = `${GAME_NAME}-isItemRects`
    LocalStorage._storage.setItem(key, value ? 'true' : 'false')
  }

  // Возвращает состояние тестового промо.
  static get testPromo() {
    if (!LocalStorage._storage) return false

    const key = `${GAME_NAME}-testPromo`
    return LocalStorage._storage.getItem(key) === 'true'
  }

  // Сохраняет состояние тестового промо.
  static set testPromo(value: boolean) {
    if (!LocalStorage._storage) return

    const key = `${GAME_NAME}-testPromo`
    LocalStorage._storage.setItem(key, value ? 'true' : 'false')
  }

  // Возвращает состояние тестирования загрузки.
  static get testLoad() {
    if (!LocalStorage._storage) return false

    const key = `${GAME_NAME}-testLoad`
    return LocalStorage._storage.getItem(key) === 'true'
  }

  // Сохраняет состояние тестирования загрузки.
  static set testLoad(value: boolean) {
    if (!LocalStorage._storage) return

    const key = `${GAME_NAME}-testLoad`
    LocalStorage._storage.setItem(key, value ? 'true' : 'false')
  }

  // Получает хранилище платформы и очищает служебные флаги.
  init = () => {
    try {
      LocalStorage._storage = SdkManager.adapter.storage.getLocalStorage()
      this.#checkAndClear()
    } catch (err) {
      console.error('[LocalStorage]: initialization failed', err)
    }
  }

  // Очищает служебные настройки вне отладочного режима.
  #checkAndClear() {
    if (!LocalStorage._storage) return
    if (LocalStorage.isDebug) return

    LocalStorage.clear()
  }

  // Удаляет служебные флаги текущей игры.
  static clear = () => {
    const storage = LocalStorage._storage
    if (!storage) return

    const keys = [
      `${GAME_NAME}-isDebug`,
      `${GAME_NAME}-isLog`,
      `${GAME_NAME}-forceNewYear`,
      `${GAME_NAME}-isItemRects`,
      `${GAME_NAME}-testPromo`,
      `${GAME_NAME}-testLoad`,
    ]

    keys.forEach((key) => storage.removeItem(key))
  }

  // Собирает сохранения из браузера и платформы для текущего игрока.
  getData = async (): Promise<PlayerSave[] | undefined> => {
    if (!LocalStorage._storage) return

    const saves: PlayerSave[] = []
    const playerId = SdkManager.getPlayerId() || null

    const serverLocalStorageData = playerId ? await this.#getServerLocalStorageData(playerId) : []
    if (serverLocalStorageData) saves.push(...serverLocalStorageData)

    const localStorageData = await this.#getBrowserLocalStorageData()
    if (localStorageData) saves.push(...localStorageData)

    return saves.filter((save) => (save?.playerId || null) === playerId)
  }

  // Записывает профиль в локальное хранилище.
  save = (data: Record<string, unknown>) => {
    if (!LocalStorage._storage) return

    try {
      LocalStorage._storage.setItem(this.#localStorageName, JSON.stringify(data))
    } catch (err) {
      console.error(`[${MODULES.STORAGE}]: local save failed`, err)
    }
  }

  // Читает локальное сохранение, синхронизированное платформой.
  #getServerLocalStorageData = async (playerId: string): Promise<PlayerSave[]> => {
    if (!playerId) return []

    const saves: PlayerSave[] = []
    const data = await SdkManager.getLocalStorage()

    if (data) {
      const storageData = data as Record<string, string>
      if (storageData[this.#localStorageName]) {
        saves.push(JSON.parse(storageData[this.#localStorageName]) as PlayerSave)
      }
    }

    return saves
  }

  // Читает сохранение из браузерного хранилища.
  #getBrowserLocalStorageData = async () => {
    const saves: PlayerSave[] = []
    const storage = LocalStorage._storage
    if (!storage) return saves

    try {
      const newItem = storage.getItem(this.#localStorageName)
      if (newItem) {
        const parsed = this.#safeParse(newItem, this.#localStorageName)
        if (parsed) saves.push(parsed)
      }
    } catch (err) {
      console.error('[LocalStorage]: local load failed', err)
    }
    return saves
  }

  // Безопасно разбирает одно локальное сохранение.
  #safeParse = (data: string, key: string): PlayerSave | null => {
    try {
      return JSON.parse(data) as PlayerSave
    } catch (err) {
      console.error(`[LocalStorage]: failed to parse JSON for key "${key}"`, err)
      return null
    }
  }
}
