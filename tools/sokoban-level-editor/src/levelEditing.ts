import {removeTileAppearances, setTileAppearance} from './appearanceState.js'
import type {EditorBrush, EditorState, Position} from './editorTypes.js'

/**
 * Сразу изменяет тип клетки и назначает выбранную пользователем текстуру.
 */

const APPEARANCE_ROLES = Object.freeze(['wall', 'decor', 'floor', 'box', 'target']) // Визуальные слои, привязанные к клетке

// Возвращает тип основания клетки по символу карты.
const getTerrain = (symbol: string) => {
  if (symbol === '_') return 'void'
  if (symbol === '#') return 'wall'
  if ('.-*'.includes(symbol)) return 'target'
  return 'floor'
}

// Возвращает объект, занимающий клетку карты.
const getOccupant = (symbol: string) => {
  if ('$-'.includes(symbol)) return 'box'
  if ('@*'.includes(symbol)) return 'player'
  return null
}

// Собирает символ карты из основания и находящегося на нём объекта.
const composeSymbol = (terrain: string, occupant: string | null) => {
  if (terrain === 'void') return '_'
  if (terrain === 'wall') return '#'
  if (terrain === 'target' && occupant === 'box') return '-'
  if (terrain === 'target' && occupant === 'player') return '*'
  if (terrain === 'target') return '.'
  if (occupant === 'box') return '$'
  if (occupant === 'player') return '@'
  return ' '
}

// Возвращает новую карту с изменённым символом одной клетки.
const setMapSymbol = (map: string[], position: Position, symbol: string) => {
  const nextMap = [...map]
  const row = Array.from(nextMap[position.y])
  row[position.x] = symbol
  nextMap[position.y] = row.join('')
  return nextMap
}

// Убирает прежнюю позицию игрока, сохраняя основание клетки.
const removePlayer = (map: string[]) => {
  return map.map((row) =>
    Array.from(row, (symbol) => {
      return getOccupant(symbol) === 'player' ? composeSymbol(getTerrain(symbol), null) : symbol
    }).join(''),
  )
}

// Удаляет устаревшие слои и назначает выбранную текстуру клетки.
const replaceAppearance = (
  state: EditorState,
  brush: EditorBrush,
  positionKey: string,
  roles: readonly string[],
  defaults: Record<string, string>,
) => {
  const cleared = removeTileAppearances(state.appearance, positionKey, roles)
  return setTileAppearance(cleared, brush, positionKey, defaults)
}

// Ставит обычную или декоративную стену и полностью очищает прежнее содержимое клетки.
const applyBlockingBrush = (
  state: EditorState,
  brush: EditorBrush,
  position: Position,
  positionKey: string,
  defaults: Record<string, string>,
) => {
  const map = setMapSymbol(state.map, position, '#')
  const appearance = replaceAppearance(state, brush, positionKey, APPEARANCE_ROLES, defaults)
  return {state: {...state, map, appearance}}
}

// Ставит выбранный пол, сохраняя находящийся на клетке объект.
const applyFloorBrush = (
  state: EditorState,
  brush: EditorBrush,
  position: Position,
  positionKey: string,
  defaults: Record<string, string>,
) => {
  const oldSymbol = state.map[position.y][position.x]
  const occupant = getOccupant(oldSymbol)
  const isDecor = Boolean(state.appearance.decor?.[positionKey])
  const terrain = getTerrain(oldSymbol) === 'target' ? 'target' : 'floor'
  const roles = isDecor ? ['wall', 'box', 'target'] : ['wall', 'decor', ...(occupant === 'box' ? [] : ['box'])]
  const map = isDecor ? state.map : setMapSymbol(state.map, position, composeSymbol(terrain, occupant))
  const appearance = replaceAppearance(state, brush, positionKey, roles, defaults)
  return {state: {...state, map, appearance}}
}

// Ставит выбранную цель, сохраняя находящийся на клетке объект.
const applyTargetBrush = (
  state: EditorState,
  brush: EditorBrush,
  position: Position,
  positionKey: string,
  defaults: Record<string, string>,
) => {
  const occupant = getOccupant(state.map[position.y][position.x])
  const roles = occupant === 'box' ? ['wall', 'decor'] : ['wall', 'decor', 'box']
  const map = setMapSymbol(state.map, position, composeSymbol('target', occupant))
  const appearance = replaceAppearance(state, brush, positionKey, roles, defaults)
  return {state: {...state, map, appearance}}
}

// Ставит выбранный ящик на существующее основание или новый обычный пол.
const applyBoxBrush = (
  state: EditorState,
  brush: EditorBrush,
  position: Position,
  positionKey: string,
  defaults: Record<string, string>,
) => {
  const oldTerrain = getTerrain(state.map[position.y][position.x])
  const terrain = oldTerrain === 'target' ? 'target' : 'floor'
  const roles = terrain === 'target' ? ['wall', 'decor'] : ['wall', 'decor', 'target']
  const map = setMapSymbol(state.map, position, composeSymbol(terrain, 'box'))
  const appearance = replaceAppearance(state, brush, positionKey, roles, defaults)
  return {state: {...state, map, appearance}}
}

// Перемещает единственного игрока на выбранную клетку.
const applyPlayerBrush = (state: EditorState, position: Position, positionKey: string) => {
  let map = removePlayer(state.map)
  const oldSymbol = map[position.y][position.x]
  const terrain = getTerrain(oldSymbol) === 'target' ? 'target' : 'floor'
  map = setMapSymbol(map, position, composeSymbol(terrain, 'player'))
  const roles = terrain === 'target' ? ['wall', 'decor', 'box'] : ['wall', 'decor', 'box', 'target']
  const appearance = removeTileAppearances(state.appearance, positionKey, roles)
  return {state: {...state, map, appearance}}
}

// Превращает клетку в пустоту и удаляет все её визуальные слои.
const applyVoidBrush = (state: EditorState, position: Position, positionKey: string) => {
  const map = setMapSymbol(state.map, position, '_')
  const appearance = removeTileAppearances(state.appearance, positionKey, APPEARANCE_ROLES)
  return {state: {...state, map, appearance}}
}

// Применяет выбранную прямую кисть к одной клетке редактора.
const applyEditorBrush = (state: EditorState, brush: EditorBrush, position: Position, defaults: Record<string, string>) => {
  const positionKey = `${position.x}:${position.y}`
  if (brush.mode === 'void') return applyVoidBrush(state, position, positionKey)
  if (brush.mode === 'player') return applyPlayerBrush(state, position, positionKey)
  if (brush.role === 'wall' || brush.role === 'decor') return applyBlockingBrush(state, brush, position, positionKey, defaults)
  if (brush.role === 'floor') return applyFloorBrush(state, brush, position, positionKey, defaults)
  if (brush.role === 'target') return applyTargetBrush(state, brush, position, positionKey, defaults)
  return applyBoxBrush(state, brush, position, positionKey, defaults)
}

export {applyEditorBrush, composeSymbol, getOccupant, getTerrain}
