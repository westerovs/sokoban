import type {StorageKey} from '../defaultData.js'
import {STORAGE_KEYS} from '../defaultData.js'

// Содержит преобразования и выбор наиболее актуального профиля игрока.

type PlayerSave = Record<string, unknown> & {
  savedAt?: unknown
  userLevel?: unknown
}

// Создаёт диагностический прокси над данными профиля.
const createProfileProxy = <Profile extends object>(profile: Profile, name = 'GameData'): Profile => {
  return new Proxy(profile, {
    get(target, prop) {
      if (!(prop in target)) {
        console.error(`[${name}] ⚠️ Access to unknown key: ${String(prop)}`)
      }
      return Reflect.get(target, prop)
    },
    set(target, prop, value) {
      if (!(prop in target)) {
        console.warn(`[${name}] ⚠️ Setting unknown key: ${String(prop)}`)
      }
      return Reflect.set(target, prop, value)
    },
  })
}

// свежесть данных
const getMaxFreshData = (dataArray: PlayerSave[]): PlayerSave | null => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return {}

  const withDates = dataArray.filter((save) => save?.savedAt)
  if (withDates.length === 0) return null

  const dates = withDates.map((save) => new Date(save.savedAt as string).getTime())
  const maxFreshSave = Math.max(...dates)

  const result = withDates.find((save) => new Date(save.savedAt as string).getTime() === maxFreshSave)
  return result || null
}

// Возвращает сохранение с наибольшим достигнутым уровнем.
const getMaxUserLevelData = (dataArray: PlayerSave[]): PlayerSave | null => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return null

  return dataArray.reduce<PlayerSave | null>((max, curr) => {
    const nCurr = Number(curr?.userLevel)
    if (!Number.isFinite(nCurr)) return max

    const nMax = Number(max?.userLevel)
    if (!Number.isFinite(nMax)) return curr

    return nCurr > nMax ? curr : max
  }, null)
}

// Восстанавливает массив из сериализованного поля профиля.
const parseJsonKey = (data: Record<string, unknown>, key: StorageKey) => {
  const raw = data?.[STORAGE_KEYS[key]]
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'string' || raw.trim() === '') return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error(e)
    return []
  }
}

// Сериализует массив для платформенного хранилища.
const stringifyJsonKey = (storageObject: unknown) => {
  if (typeof storageObject === 'string') return storageObject
  if (!Array.isArray(storageObject)) return '[]'

  try {
    return JSON.stringify(storageObject)
  } catch (e) {
    console.error(e)
    return '[]'
  }
}

// Безопасно разбирает строку JSON.
const parseJSON = (str: string): unknown => {
  let res: unknown = null

  try {
    res = JSON.parse(str)
  } catch (e) {
    console.error(e)
  }

  return res
}

export {createProfileProxy, getMaxFreshData, getMaxUserLevelData, parseJSON, parseJsonKey, stringifyJsonKey}

export type {PlayerSave}
