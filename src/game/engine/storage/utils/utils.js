import {STORAGE_KEYS} from '../defaultData.js'

const createProfileProxy = (profile, name = 'GameData') => {
  return new Proxy(profile, {
    get(target, prop) {
      if (!(prop in target)) {
        console.error(`[${name}] ⚠️ Access to unknown key: ${String(prop)}`)
      }
      return target[prop]
    },
    set(target, prop, value) {
      if (!(prop in target)) {
        console.warn(`[${name}] ⚠️ Setting unknown key: ${String(prop)}`)
      }
      target[prop] = value
      return true
    }
  })
}

// свежесть данных
const getMaxFreshData = (dataArray) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return {}
  
  const withDates = dataArray.filter(save => save?.savedAt)
  if (withDates.length === 0) return null
  
  const dates = withDates.map((save) => new Date(save.savedAt).getTime())
  const maxFreshSave = Math.max(...dates)
  
  const result = withDates.find(save => new Date(save.savedAt).getTime() === maxFreshSave)
  return result || null
}

const getMaxUserLevelData = (dataArray) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) return null
  
  return dataArray.reduce((max, curr) => {
    const nCurr = Number(curr?.userLevel)
    if (!Number.isFinite(nCurr)) return max
    
    const nMax = Number(max?.userLevel)
    if (!Number.isFinite(nMax)) return curr
    
    return nCurr > nMax ? curr : max
  }, null)
}

const parseJsonKey = (data, key) => {
  const raw = data?.[STORAGE_KEYS[key]]
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'string' || raw.trim() === '') return []
  
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

const stringifyJsonKey = (storageObject) => {
  if (typeof storageObject === 'string') return storageObject
  if (!Array.isArray(storageObject)) return '[]'
  
  try {
    return JSON.stringify(storageObject)
  } catch (e) {
    return '[]'
  }
}

const parseJSON = (str) => {
  let res = null
  
  try {
    res = JSON.parse(str)
  } catch (e) {
    console.error(e)
  }
  
  return res
}

export {
  createProfileProxy,
  getMaxFreshData,
  getMaxUserLevelData,
  parseJsonKey,
  stringifyJsonKey,
  parseJSON
}
