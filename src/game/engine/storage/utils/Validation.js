import {DEFAULT_DATA, DEFAULT_DATA_VALUES} from '../defaultData.js'
import {parseJSON} from './utils.js'

const formatDataTo = (type, value) => {
  if (type === 'number') return Number(value) || 0
  if (type === 'string') return String(value) || ''
  
  if (type === 'object') {
    if (typeof value === 'string') return parseJSON(value) || {}
    return value || {}
  }
  
  if (type === 'array') {
    if (typeof value === 'string') return parseJSON(value) || []
    return value || []
  }
  
  if (type === 'bool') {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') {
      return value === 1 || value === -1
    }
    if (typeof value === 'string') {
      const lowered = value.trim().toLowerCase()
      if (lowered === 'true' || lowered === '1') return true
      if (lowered === 'false' || lowered === '0') return false
      return false
    }
    if (Array.isArray(value)) return false
    if (value && typeof value === 'object') return false
    return Boolean(value)
  }
  
  return value
}

export default class Validation {
  static validate = (data) => {
    if (!data || typeof data !== 'object') return {...DEFAULT_DATA_VALUES}
    
    const merged = {}
    
    for (const [key, dataValue] of Object.entries(DEFAULT_DATA)) {
      const incoming = data[key]
      
      if (incoming === undefined || incoming === null) {
        merged[key] = DEFAULT_DATA[key].value
        continue
      }
      
      merged[key] = formatDataTo(dataValue.type, incoming)
    }
    
    Validation.checkDeprecatedKeys(data)
    
    return merged
  }

  
  static checkDeprecatedKeys = (data) => {
    const unknownKeys = Object.keys(data).filter(key => !(key in DEFAULT_DATA))
    
    if (unknownKeys.length) {
      const unknownPairs = unknownKeys.map(key => [key, data[key]])
      const unknownEntries = Object.fromEntries(unknownPairs)
      
      console.warn('[STORAGE.validate] outdated keys ignored:', unknownEntries)
    }
  }
}
