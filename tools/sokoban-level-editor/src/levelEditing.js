import {removeTileAppearances, setTileAppearance} from './appearanceState.js'

/**
 * Применяет инструменты геометрии, объектов и оформления к состоянию уровня.
 */

const APPEARANCE_ROLES = Object.freeze(['wall', 'floor', 'box'])
const WALKABLE_SYMBOLS = new Set([' ', '.', '$', '@', '-', '*'])

// Возвращает данные, за которые отвечает операция `getTerrain`.
const getTerrain = (symbol) => {
  if (symbol === '_') return 'void'
  if (symbol === '#') return 'wall'
  if ('.-*'.includes(symbol)) return 'target'
  return 'floor'
}

// Возвращает данные, за которые отвечает операция `getOccupant`.
const getOccupant = (symbol) => {
  if ('$-'.includes(symbol)) return 'box'
  if ('@*'.includes(symbol)) return 'player'
  return null
}

// Выполняет отдельную операцию `composeSymbol`.
const composeSymbol = (terrain, occupant) => {
  if (terrain === 'void') return '_'
  if (terrain === 'wall') return '#'
  if (terrain === 'target' && occupant === 'box') return '-'
  if (terrain === 'target' && occupant === 'player') return '*'
  if (terrain === 'target') return '.'
  if (occupant === 'box') return '$'
  if (occupant === 'player') return '@'
  return ' '
}

// Обновляет состояние через операцию `setMapSymbol`.
const setMapSymbol = (map, position, symbol) => {
  const nextMap = [...map]
  const row = Array.from(nextMap[position.y])
  row[position.x] = symbol
  nextMap[position.y] = row.join('')
  return nextMap
}

// Удаляет или очищает состояние через операцию `removePlayer`.
const removePlayer = (map) => {
  return map.map((row) => {
    return Array.from(row, (symbol) => {
      if (getOccupant(symbol) !== 'player') return symbol
      return composeSymbol(getTerrain(symbol), null)
    }).join('')
  })
}

// Возвращает данные, за которые отвечает операция `getAppearanceRolesToRemove`.
const getAppearanceRolesToRemove = (oldSymbol, nextSymbol) => {
  const roles = []
  if (getTerrain(nextSymbol) !== 'wall') roles.push('wall')
  if (!WALKABLE_SYMBOLS.has(nextSymbol)) roles.push('floor')
  if (getOccupant(nextSymbol) !== 'box') roles.push('box')
  if (getTerrain(oldSymbol) !== getTerrain(nextSymbol)) {
    if (getTerrain(nextSymbol) === 'wall') roles.push('wall')
    if (WALKABLE_SYMBOLS.has(nextSymbol) && !WALKABLE_SYMBOLS.has(oldSymbol)) roles.push('floor')
  }
  return [...new Set(roles)]
}

// Обновляет состояние через операцию `applyStructureBrush`.
const applyStructureBrush = (state, brush, position, positionKey) => {
  const oldSymbol = state.map[position.y][position.x]
  const occupant = ['floor', 'target'].includes(brush.tool) ? getOccupant(oldSymbol) : null
  const nextSymbol = composeSymbol(brush.tool, occupant)
  if (nextSymbol === oldSymbol) return {state}

  const map = setMapSymbol(state.map, position, nextSymbol)
  const roles = brush.tool === 'void' ? APPEARANCE_ROLES : getAppearanceRolesToRemove(oldSymbol, nextSymbol)
  const appearance = removeTileAppearances(state.appearance, state.levelId, positionKey, roles)
  return {state: {...state, map, appearance}}
}

// Обновляет состояние через операцию `applyObjectBrush`.
const applyObjectBrush = (state, brush, position, positionKey) => {
  const oldSymbol = state.map[position.y][position.x]
  const terrain = getTerrain(oldSymbol)
  if (!['floor', 'target'].includes(terrain)) return {state, error: 'Объекты можно ставить только на пол или цель'}

  const oldOccupant = getOccupant(oldSymbol)
  const occupant = brush.tool === 'erase' ? null : brush.tool
  let map = brush.tool === 'player' ? removePlayer(state.map) : state.map
  const currentSymbol = map[position.y][position.x]
  map = setMapSymbol(map, position, composeSymbol(getTerrain(currentSymbol), occupant))
  const roles = oldOccupant === 'box' && occupant !== 'box' ? ['box'] : []
  const appearance = removeTileAppearances(state.appearance, state.levelId, positionKey, roles)
  return {state: {...state, map, appearance}}
}

// Проверяет условие, описанное операцией `isAppearanceValid`.
const isAppearanceValid = (role, symbol) => {
  if (role === 'wall') return symbol === '#'
  if (role === 'floor') return WALKABLE_SYMBOLS.has(symbol)
  if (role === 'box') return getOccupant(symbol) === 'box'
  return false
}

// Обновляет состояние через операцию `applyAppearanceBrush`.
const applyAppearanceBrush = (state, brush, position, positionKey, defaults) => {
  if (brush.tool === 'erase') {
    const appearance = removeTileAppearances(state.appearance, state.levelId, positionKey, APPEARANCE_ROLES)
    return {state: {...state, appearance}}
  }

  const symbol = state.map[position.y][position.x]
  if (!isAppearanceValid(brush.role, symbol)) return {state, error: 'Эту текстуру нельзя применить к выбранной клетке'}
  const appearance = setTileAppearance(state.appearance, state.levelId, brush, positionKey, defaults)
  return {state: {...state, appearance}}
}

// Обновляет состояние через операцию `applyEditorBrush`.
const applyEditorBrush = (state, brush, position, defaults) => {
  const positionKey = `${position.x}:${position.y}`
  if (brush.mode === 'structure') return applyStructureBrush(state, brush, position, positionKey)
  if (brush.mode === 'objects') return applyObjectBrush(state, brush, position, positionKey)
  return applyAppearanceBrush(state, brush, position, positionKey, defaults)
}

export {
  applyEditorBrush,
  composeSymbol,
  getOccupant,
  getTerrain,
}
