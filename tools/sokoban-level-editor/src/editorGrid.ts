import type {Bounds, EditorLevel, EditorState, LevelAppearance, Offset} from './editorTypes.js'

/**
 * Разворачивает уровень на максимальном поле редактора и компактно собирает его для экспорта.
 */

// Создаёт прямоугольную карту, полностью заполненную пустыми клетками.
const createEmptyMap = (width: number, height: number) => {
  return Array.from({length: height}, () => '_'.repeat(width))
}

// Возвращает смещение, которое размещает исходную карту по центру рабочего поля.
const getCenterOffset = (map: string[], width: number, height: number): Offset => {
  return {
    x: Math.floor((width - map[0].length) / 2),
    y: Math.floor((height - map.length) / 2),
  }
}

// Копирует исходную карту в рабочее поле с указанным смещением.
const placeMap = (targetMap: string[], sourceMap: string[], offset: Offset) => {
  return targetMap.map((row, y) => {
    const sourceRow = sourceMap[y - offset.y]
    if (sourceRow === undefined) return row

    const symbols = Array.from(row)
    Array.from(sourceRow).forEach((symbol, x) => (symbols[x + offset.x] = symbol))
    return symbols.join('')
  })
}

// Переносит координату оформления на заданное количество клеток.
const shiftPositionKey = (positionKey: string, offset: Offset) => {
  const [x, y] = positionKey.split(':').map(Number)
  return `${x + offset.x}:${y + offset.y}`
}

// Переносит координаты всех текстур одного визуального слоя.
const shiftRoleAppearance = (roleAppearance: Record<string, string>, offset: Offset) => {
  return Object.fromEntries(Object.entries(roleAppearance).map(([key, texture]) => [shiftPositionKey(key, offset), texture]))
}

// Переносит координаты всех визуальных слоёв уровня.
const shiftAppearance = (appearance: LevelAppearance, offset: Offset): LevelAppearance => {
  return Object.fromEntries(Object.entries(appearance).map(([role, values]) => [role, shiftRoleAppearance(values ?? {}, offset)]))
}

// Создаёт состояние уровня на полном поле редактора.
const expandEditorState = (level: EditorLevel, appearance: LevelAppearance, width: number, height: number): EditorState => {
  const offset = getCenterOffset(level.map, width, height)
  const map = placeMap(createEmptyMap(width, height), level.map, offset)
  return {levelId: level.id, map, appearance: shiftAppearance(appearance, offset)}
}

// Расширяет границы содержимого одной непустой клеткой.
const includePosition = (bounds: Bounds, x: number, y: number): Bounds => ({
  minX: Math.min(bounds.minX, x),
  minY: Math.min(bounds.minY, y),
  maxX: Math.max(bounds.maxX, x),
  maxY: Math.max(bounds.maxY, y),
})

// Находит минимальный прямоугольник, содержащий все игровые клетки.
const getContentBounds = (map: string[]): Bounds | null => {
  let bounds = {minX: Infinity, minY: Infinity, maxX: -1, maxY: -1}
  map.forEach((row, y) =>
    Array.from(row).forEach((symbol, x) => {
      if (symbol !== '_') bounds = includePosition(bounds, x, y)
    }),
  )
  return bounds.maxX >= 0 ? bounds : null
}

// Обрезает карту по найденным границам содержимого.
const cropMap = (map: string[], bounds: Bounds | null) => {
  if (!bounds) return ['_']
  return map.slice(bounds.minY, bounds.maxY + 1).map((row) => row.slice(bounds.minX, bounds.maxX + 1))
}

// Проверяет, попадает ли координата оформления внутрь экспортируемой карты.
const isInsideBounds = (positionKey: string, bounds: Bounds | null) => {
  const [x, y] = positionKey.split(':').map(Number)
  return bounds && x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY
}

// Обрезает и переносит один визуальный слой в координаты экспортируемой карты.
const cropRoleAppearance = (roleAppearance: Record<string, string>, bounds: Bounds) => {
  const offset = {x: -bounds.minX, y: -bounds.minY}
  const entries = Object.entries(roleAppearance).filter(([key]) => isInsideBounds(key, bounds))
  return Object.fromEntries(entries.map(([key, texture]) => [shiftPositionKey(key, offset), texture]))
}

// Обрезает визуальные слои и удаляет опустевшие группы.
const cropAppearance = (appearance: LevelAppearance, bounds: Bounds | null): LevelAppearance => {
  if (!bounds) return {}
  const entries = Object.entries(appearance).map(([role, values]) => [role, cropRoleAppearance(values ?? {}, bounds)] as const)
  return Object.fromEntries(entries.filter(([, values]) => Object.keys(values).length > 0))
}

// Возвращает компактное состояние для сохранения, копирования или запуска.
const compactEditorState = (state: EditorState): EditorState => {
  const bounds = getContentBounds(state.map)
  return {...state, map: cropMap(state.map, bounds), appearance: cropAppearance(state.appearance, bounds)}
}

export {
  compactEditorState,
  expandEditorState,
  getContentBounds,
}
