/**
 * Преобразует карты между стандартным XSB и внутренним форматом игры.
 */

const STANDARD_ROW_PATTERN = /^[ #.$@*+]+$/
const METADATA_PATTERN = /^;\s*([^:]+):\s*(.+)$/

// Разбирает входные данные через операцию `parseMetadata`.
const parseMetadata = (line, metadata) => {
  const match = METADATA_PATTERN.exec(line)
  if (!match) return

  metadata[match[1].trim().toLowerCase()] = match[2].trim()
}

// Добавляет данные или представление через операцию `addParsedLevel`.
const addParsedLevel = (levels, rows, metadata) => {
  if (rows.length === 0) return

  levels.push({map: [...rows], metadata: {...metadata}})
  rows.length = 0
  Object.keys(metadata).forEach((key) => delete metadata[key])
}

// Разбирает входные данные через операцию `parseXsbLine`.
const parseXsbLine = (line, levels, rows, metadata, sourceLabel) => {
  if (!line.trim()) return addParsedLevel(levels, rows, metadata)
  if (line.trimStart().startsWith(';')) return parseMetadata(line.trimStart(), metadata)
  if (!STANDARD_ROW_PATTERN.test(line)) throw new Error(`Недопустимая строка в ${sourceLabel}: ${line}`)

  rows.push(line.trimEnd())
}

// Разбирает входные данные через операцию `parseXsb`.
const parseXsb = (text, sourceLabel = 'XSB') => {
  const levels = []
  const rows = []
  const metadata = {}

  text.replace(/\r\n/g, '\n').split('\n').forEach((line) => parseXsbLine(line, levels, rows, metadata, sourceLabel))
  addParsedLevel(levels, rows, metadata)
  return levels
}

// Преобразует данные в формат операции `serializeMetadata`.
const serializeMetadata = (metadata) => {
  return Object.entries(metadata).map(([key, value]) => `; ${key}: ${value}`)
}

// Преобразует данные в формат операции `serializeXsb`.
const serializeXsb = (levels) => {
  const blocks = levels.map((level) => [...serializeMetadata(level.metadata), ...level.map].join('\n'))
  return `${blocks.join('\n\n')}\n`
}

// Возвращает данные, за которые отвечает операция `getBoundaryPositions`.
const getBoundaryPositions = (width, height) => {
  const horizontal = Array.from({length: width}, (_, x) => [x, 0, x, height - 1])
  const vertical = Array.from({length: height}, (_, y) => [0, y, width - 1, y])

  return [...horizontal, ...vertical].flatMap(([x1, y1, x2, y2]) => [
    {x: x1, y: y1},
    {x: x2, y: y2},
  ])
}

// Пытается выполнить операцию `tryAddExteriorSpace` и сообщает результат.
const tryAddExteriorSpace = (map, position, exterior, queue) => {
  const {x, y} = position
  if (y < 0 || y >= map.length || x < 0 || x >= map[0].length || map[y][x] !== ' ') return

  const key = `${x}:${y}`
  if (exterior.has(key)) return
  exterior.add(key)
  queue.push(position)
}

// Возвращает данные, за которые отвечает операция `findExteriorSpaces`.
const findExteriorSpaces = (map) => {
  const exterior = new Set()
  const queue = []
  getBoundaryPositions(map[0].length, map.length).forEach((position) => tryAddExteriorSpace(map, position, exterior, queue))

  for (let index = 0; index < queue.length; index++) {
    const {x, y} = queue[index]
    const neighbors = [
      {x: x - 1, y},
      {x: x + 1, y},
      {x, y: y - 1},
      {x, y: y + 1},
    ]
    neighbors.forEach((position) => tryAddExteriorSpace(map, position, exterior, queue))
  }
  return exterior
}

// Выполняет отдельную операцию `toRuntimeSymbol`.
const toRuntimeSymbol = (symbol, positionKey, exterior) => {
  if (symbol === ' ' && exterior.has(positionKey)) return '_'
  if (symbol === '*') return '-'
  if (symbol === '+') return '*'
  return symbol
}

// Выполняет отдельную операцию `toRuntimeMap`.
const toRuntimeMap = (standardMap) => {
  const width = Math.max(...standardMap.map((row) => row.length))
  const paddedMap = standardMap.map((row) => row.padEnd(width, ' '))
  const exterior = findExteriorSpaces(paddedMap)

  return paddedMap.map((row, y) => {
    return Array.from(row, (symbol, x) => toRuntimeSymbol(symbol, `${x}:${y}`, exterior)).join('')
  })
}

// Выполняет отдельную операцию `toStandardSymbol`.
const toStandardSymbol = (symbol) => {
  if (symbol === '_') return ' '
  if (symbol === '-') return '*'
  if (symbol === '*') return '+'
  return symbol
}

// Выполняет отдельную операцию `trimEmptyRows`.
const trimEmptyRows = (rows) => {
  while (rows[0] !== undefined && !rows[0].trim()) rows.shift()
  while (rows.at(-1) !== undefined && !rows.at(-1).trim()) rows.pop()
  return rows
}

// Выполняет отдельную операцию `toStandardMap`.
const toStandardMap = (runtimeMap) => {
  const rows = runtimeMap.map((row) => Array.from(row, toStandardSymbol).join('').trimEnd())
  return trimEmptyRows(rows)
}

export {
  parseXsb,
  serializeXsb,
  toRuntimeMap,
  toStandardMap,
}
