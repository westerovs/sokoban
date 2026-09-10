import crypto from 'node:crypto'

// Создаёт стабильный хеш геометрии XSB-карты для проверки результатов решателя.

// Нормализует отступы карты перед вычислением хеша.
const normalizeMapForHash = (map) => {
  const rows = map.map((row) => row.trimEnd()).filter((row) => row.trim())
  const indent = Math.min(...rows.map((row) => row.search(/\S/)))

  return rows.map((row) => row.slice(indent).trimEnd()).join('\n')
}

// Возвращает SHA-256 нормализованной геометрии карты.
const createMapHash = (map) => crypto.createHash('sha256').update(normalizeMapForHash(map)).digest('hex')

export {
  // Операции нормализации и хеширования геометрии
  createMapHash,
  normalizeMapForHash,
}
