import {getOccupant} from './levelEditing.js'

/**
 * Проверяет структуру уровня и отмечает потенциально проблемные клетки.
 */

const ALLOWED_SYMBOLS = new Set(['_', '#', ' ', '.', '$', '@', '-', '*'])
const MAX_COLUMNS = 20 // Максимальная ширина карты в клетках
const MAX_ROWS = 17 // Максимальная высота карты в клетках
const DIRECTIONS = Object.freeze([
  {x: 0, y: -1},
  {x: 1, y: 0},
  {x: 0, y: 1},
  {x: -1, y: 0},
])

// Возвращает данные, за которые отвечает операция `getPositionKey`.
const getPositionKey = ({x, y}) => `${x}:${y}`

// Возвращает данные, за которые отвечает операция `getPositions`.
const getPositions = (map, predicate) => {
  return map.flatMap((row, y) => {
    return Array.from(row).flatMap((symbol, x) => (predicate(symbol, {x, y}) ? [{x, y}] : []))
  })
}

// Создаёт данные или представление для операции `createIssue`.
const createIssue = (type, message, positions = []) => ({type, message, positions})

// Проверяет условие, описанное операцией `validateDimensions`.
const validateDimensions = (map) => {
  const issues = []
  if (!Array.isArray(map) || map.length === 0 || !map[0]?.length) return [createIssue('error', 'Карта не должна быть пустой')]
  if (map.some((row) => typeof row !== 'string' || row.length !== map[0].length)) issues.push(createIssue('error', 'Строки карты имеют разную длину'))
  if (map[0].length > MAX_COLUMNS || map.length > MAX_ROWS) issues.push(createIssue('error', 'Максимальный размер карты — 20×17'))
  return issues
}

// Проверяет условие, описанное операцией `validateSymbols`.
const validateSymbols = (map) => {
  const positions = getPositions(map, (symbol) => !ALLOWED_SYMBOLS.has(symbol))
  return positions.length > 0 ? [createIssue('error', 'На карте есть неизвестные клетки', positions)] : []
}

// Проверяет условие, описанное операцией `validateEntities`.
const validateEntities = (map) => {
  const issues = []
  const players = getPositions(map, (symbol) => getOccupant(symbol) === 'player')
  const boxes = getPositions(map, (symbol) => getOccupant(symbol) === 'box')
  const targets = getPositions(map, (symbol) => '.-*'.includes(symbol))

  if (players.length !== 1) issues.push(createIssue('error', 'На уровне должен быть ровно один игрок', players))
  if (boxes.length === 0) issues.push(createIssue('error', 'На уровне должен быть хотя бы один ящик'))
  if (boxes.length !== targets.length) issues.push(createIssue('error', `Ящиков: ${boxes.length}, целей: ${targets.length}`, [...boxes, ...targets]))
  return issues
}

// Проверяет условие, описанное операцией `isPassable`.
const isPassable = (map, position) => {
  const symbol = map[position.y]?.[position.x]
  return Boolean(symbol) && symbol !== '_' && symbol !== '#'
}

// Возвращает данные, за которые отвечает операция `getReachablePositions`.
const getReachablePositions = (map, start) => {
  if (!start) return new Set()
  const visited = new Set([getPositionKey(start)])
  const queue = [start]
  for (let index = 0; index < queue.length; index++) {
    DIRECTIONS.forEach((direction) => {
      const next = {x: queue[index].x + direction.x, y: queue[index].y + direction.y}
      const key = getPositionKey(next)
      if (!visited.has(key) && isPassable(map, next)) {
        visited.add(key)
        queue.push(next)
      }
    })
  }
  return visited
}

// Проверяет условие, описанное операцией `validateConnectivity`.
const validateConnectivity = (map) => {
  const player = getPositions(map, (symbol) => getOccupant(symbol) === 'player')[0]
  const reachable = getReachablePositions(map, player)
  const disconnected = getPositions(map, (_, position) => isPassable(map, position) && !reachable.has(getPositionKey(position)))
  return disconnected.length > 0 ? [createIssue('warning', 'Есть недоступные участки пола', disconnected)] : []
}

// Проверяет условие, описанное операцией `isBlocked`.
const isBlocked = (map, position) => {
  const symbol = map[position.y]?.[position.x]
  return !symbol || symbol === '_' || symbol === '#'
}

// Проверяет условие, описанное операцией `isStaticCorner`.
const isStaticCorner = (map, position) => {
  const upOrDown = isBlocked(map, {x: position.x, y: position.y - 1}) || isBlocked(map, {x: position.x, y: position.y + 1})
  const leftOrRight = isBlocked(map, {x: position.x - 1, y: position.y}) || isBlocked(map, {x: position.x + 1, y: position.y})
  return upOrDown && leftOrRight
}

// Проверяет условие, описанное операцией `validateBoxCorners`.
const validateBoxCorners = (map) => {
  const corners = getPositions(map, (symbol, position) => symbol === '$' && isStaticCorner(map, position))
  return corners.length > 0 ? [createIssue('warning', 'Есть ящики в тупиковых углах', corners)] : []
}

// Проверяет условие, описанное операцией `validateLevelMap`.
const validateLevelMap = (map) => {
  const dimensionIssues = validateDimensions(map)
  if (dimensionIssues.length > 0) return {isValid: false, issues: dimensionIssues, invalidPositions: []}

  const issues = [...validateSymbols(map), ...validateEntities(map), ...validateConnectivity(map), ...validateBoxCorners(map)]
  const invalidPositions = issues.flatMap((issue) => issue.positions)
  return {isValid: !issues.some((issue) => issue.type === 'error'), issues, invalidPositions}
}

export {
  validateLevelMap,
}
