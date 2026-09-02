import {DIRECTIONS, getAdjacentIndex, type Random, randomInteger, shuffle, toIndex} from './grid.js'
import {createFloorMask, resolveGeneratedShape} from './shapeGeneration.js'

/**
 * Создаёт связную геометрию произвольной формы с внутренними стенами и оценивает её вместимость.
 */

type Position = {
  x: number
  y: number
}

type Size = {
  width: number
  height: number
}

type Rectangle = Position & Size
type TopologyGrid = Array<Array<boolean | null>>

type TopologyBoard = {
  width: number
  height: number
  floors: Set<number>
  topology: string[]
}

type TopologyConfig = {
  wallDensity: number
  minimumBoxes: number
  boxAreaRatio: number
}

const WALL_PATTERNS = Object.freeze([
  Object.freeze([{x: 0, y: 0}]), // Одиночная опорная стена
  Object.freeze([
    {x: 0, y: 0},
    {x: 1, y: 0},
  ]), // Короткая перегородка
  Object.freeze([
    {x: 0, y: 0},
    {x: 1, y: 0},
    {x: 2, y: 0},
  ]), // Длинная перегородка
  Object.freeze([
    {x: 0, y: 0},
    {x: 0, y: 1},
    {x: 1, y: 1},
  ]), // Угловая перегородка
  Object.freeze([
    {x: 0, y: 0},
    {x: 1, y: 0},
    {x: 1, y: 1},
    {x: 2, y: 1},
  ]), // Ступенчатая перегородка
  Object.freeze([
    {x: 0, y: 0},
    {x: 0, y: 1},
    {x: 0, y: 2},
    {x: 1, y: 1},
  ]), // Т-образная перегородка
])

const OPEN_RECTANGLE_SIZES = Object.freeze([
  {width: 4, height: 3}, // Горизонтальная открытая площадка
  {width: 3, height: 4}, // Вертикальная открытая площадка
])
const SHAPE_ATTEMPTS = 18 // Число попыток получить пригодный внешний контур

// Проверяет наличие пола рядом с клеткой, включая диагонали.
const hasNeighboringFloor = (mask: boolean[][], x: number, y: number) => {
  for (let offsetY = -1; offsetY <= 1; offsetY++) {
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      if (mask[y + offsetY]?.[x + offsetX]) return true
    }
  }
  return false
}

// Превращает маску пола в сетку пола, стен и внешней пустоты.
const createGridFromFloorMask = (mask: boolean[][]): TopologyGrid => {
  return mask.map((row, y) => {
    return row.map((isFloor, x) => {
      if (isFloor) return false
      return hasNeighboringFloor(mask, x, y) ? true : null
    })
  })
}

// Возвращает независимую копию сетки стен.
const cloneGrid = (grid: TopologyGrid): TopologyGrid => grid.map((row) => [...row])

// Переносит содержимое одной сетки в другую.
const replaceGrid = (target: TopologyGrid, source: TopologyGrid) =>
  source.forEach((row, y) => row.forEach((value, x) => (target[y][x] = value)))

// Возвращает количество клеток пола в сетке.
const countFloorCells = (grid: TopologyGrid) => grid.reduce((total, row) => total + row.filter((cell) => cell === false).length, 0)

// Возвращает соседние клетки пола для заданной позиции.
const getFloorNeighbors = (grid: TopologyGrid, x: number, y: number) => {
  return DIRECTIONS.filter((direction) => grid[y + direction.y]?.[x + direction.x] === false)
}

// Проверяет отсутствие бесполезных тупиков шириной в одну клетку.
const hasFloorDeadEnd = (grid: TopologyGrid) => {
  return grid.some((row, y) => row.some((cell, x) => cell === false && getFloorNeighbors(grid, x, y).length < 2))
}

// Считает клетки связной области пола от указанной позиции.
const countReachableFloor = (grid: TopologyGrid, start: Position) => {
  const visited = new Set([`${start.x}:${start.y}`])
  const queue = [start]
  for (let index = 0; index < queue.length; index++) {
    getFloorNeighbors(grid, queue[index].x, queue[index].y).forEach((direction) => {
      const next = {x: queue[index].x + direction.x, y: queue[index].y + direction.y}
      const key = `${next.x}:${next.y}`
      if (!visited.has(key)) {
        visited.add(key)
        queue.push(next)
      }
    })
  }
  return visited.size
}

// Проверяет связность всего пола в сетке.
const isFloorConnected = (grid: TopologyGrid) => {
  const y = grid.findIndex((row) => row.includes(false))
  if (y < 0) return false
  const start = {x: grid[y].indexOf(false), y}
  return countReachableFloor(grid, start) === countFloorCells(grid)
}

// Проверяет пригодность сетки после добавления стен.
const isUsableGrid = (grid: TopologyGrid, minimumFloorCount: number) => {
  return countFloorCells(grid) >= minimumFloorCount && isFloorConnected(grid) && !hasFloorDeadEnd(grid)
}

// Поворачивает точку шаблона на четверть оборота.
const rotatePoint = (point: Position): Position => ({x: -point.y, y: point.x})

// Нормализует координаты преобразованного шаблона.
const normalizePattern = (pattern: readonly Position[]): Position[] => {
  const minimumX = Math.min(...pattern.map(({x}) => x))
  const minimumY = Math.min(...pattern.map(({y}) => y))
  return pattern.map(({x, y}) => ({x: x - minimumX, y: y - minimumY}))
}

// Возвращает случайно повёрнутый и отражённый шаблон стен.
const createPatternVariant = (pattern: readonly Position[], random: Random): Position[] => {
  let result = pattern.map((point) => ({...point}))
  const rotations = randomInteger(random, 0, 4)
  for (let index = 0; index < rotations; index++) result = result.map(rotatePoint)
  if (random() < 0.5) result = result.map(({x, y}) => ({x: -x, y}))
  return normalizePattern(result)
}

// Возвращает габариты шаблона стен.
const getPatternSize = (pattern: readonly Position[]): Size => ({
  width: Math.max(...pattern.map(({x}) => x)) + 1,
  height: Math.max(...pattern.map(({y}) => y)) + 1,
})

// Пытается поставить один шаблон, не разрушая связность комнаты.
const tryPlacePattern = (grid: TopologyGrid, pattern: readonly Position[], random: Random, minimumFloorCount: number) => {
  const size = getPatternSize(pattern)
  const originX = randomInteger(random, 1, grid[0].length - size.width)
  const originY = randomInteger(random, 1, grid.length - size.height)
  const candidate = cloneGrid(grid)
  const cells = pattern.map(({x, y}) => candidate[originY + y][originX + x])
  if (cells.some((cell) => cell === null)) return false
  const changed = cells.some((cell) => cell === false)
  pattern.forEach(({x, y}) => (candidate[originY + y][originX + x] = true))
  if (!changed || !isUsableGrid(candidate, minimumFloorCount)) return false
  replaceGrid(grid, candidate)
  return true
}

// Добавляет набор внутренних стен из базовых шаблонов.
const addWallPatterns = (grid: TopologyGrid, wallDensity: number, random: Random) => {
  const initialFloorCount = countFloorCells(grid)
  const targetWalls = Math.round(initialFloorCount * wallDensity)
  const minimumFloorCount = Math.max(8, Math.round(initialFloorCount * 0.72))
  let placedWalls = 0
  for (let attempt = 0; attempt < initialFloorCount * 12 && placedWalls < targetWalls; attempt++) {
    const source = WALL_PATTERNS[randomInteger(random, 0, WALL_PATTERNS.length)]
    const pattern = createPatternVariant(source, random)
    if (tryPlacePattern(grid, pattern, random, minimumFloorCount)) placedWalls += pattern.length
  }
}

// Проверяет, полностью ли прямоугольник состоит из пола.
const isOpenRectangle = (grid: TopologyGrid, startX: number, startY: number, size: Size) => {
  for (let y = startY; y < startY + size.height; y++) {
    for (let x = startX; x < startX + size.width; x++) if (grid[y][x] !== false) return false
  }
  return true
}

// Находит первую слишком большую открытую площадку.
const findOpenRectangle = (grid: TopologyGrid): Rectangle | null => {
  for (const size of OPEN_RECTANGLE_SIZES) {
    for (let y = 1; y <= grid.length - size.height - 1; y++) {
      for (let x = 1; x <= grid[0].length - size.width - 1; x++) {
        if (isOpenRectangle(grid, x, y, size)) return {x, y, ...size}
      }
    }
  }
  return null
}

// Пытается разделить открытую площадку одной внутренней стеной.
const tryBreakOpenRectangle = (grid: TopologyGrid, rectangle: Rectangle, random: Random, minimumFloorCount: number) => {
  const positions: Position[] = []
  for (let y = rectangle.y; y < rectangle.y + rectangle.height; y++) {
    for (let x = rectangle.x; x < rectangle.x + rectangle.width; x++) positions.push({x, y})
  }
  return shuffle(positions, random).some(({x, y}) => {
    const candidate = cloneGrid(grid)
    candidate[y][x] = true
    if (!isUsableGrid(candidate, minimumFloorCount)) return false
    replaceGrid(grid, candidate)
    return true
  })
}

// Разбивает крупные открытые зоны, которые дают много простых вариантов ходов.
const breakOpenAreas = (grid: TopologyGrid, random: Random) => {
  const minimumFloorCount = Math.max(8, Math.round(countFloorCells(grid) * 0.82))
  for (let attempt = 0; attempt < grid.length * grid[0].length; attempt++) {
    const rectangle = findOpenRectangle(grid)
    if (!rectangle || !tryBreakOpenRectangle(grid, rectangle, random, minimumFloorCount)) return
  }
}

// Преобразует сетку стен в карту структуры Sokoban.
const serializeGrid = (grid: TopologyGrid) => {
  return grid.map((row) => row.map((cell) => (cell === null ? '_' : cell ? '#' : ' ')).join(''))
}

// Проверяет достаточный размер полезной области внешней формы.
const hasEnoughFloor = (grid: TopologyGrid, width: number, height: number) => {
  const innerArea = (width - 2) * (height - 2)
  return countFloorCells(grid) >= Math.max(12, Math.round(innerArea * 0.32))
}

// Проверяет, что внешний контур действительно отличается от прямоугольника.
const hasOuterVoid = (grid: TopologyGrid) => grid.some((row) => row.includes(null))

// Создаёт одну пригодную сетку выбранной внешней формы.
const tryCreateShapeGrid = (width: number, height: number, shape: string, random: Random): TopologyGrid | null => {
  const grid = createGridFromFloorMask(createFloorMask(width, height, shape, random))
  if (!hasOuterVoid(grid) || !hasEnoughFloor(grid, width, height) || !isUsableGrid(grid, 8)) return null
  return grid
}

// Создаёт новую структуру с произвольным контуром и внутренними стенами.
const createGeneratedTopology = (width: number, height: number, config: TopologyConfig, requestedShape: string, random: Random) => {
  for (let attempt = 0; attempt < SHAPE_ATTEMPTS; attempt++) {
    const shape = resolveGeneratedShape(requestedShape, random)
    const grid = tryCreateShapeGrid(width, height, shape, random)
    if (!grid) continue
    addWallPatterns(grid, config.wallDensity, random)
    breakOpenAreas(grid, random)
    return {topology: serializeGrid(grid), shape}
  }
  throw new Error('Не удалось создать связную форму; попробуйте другой размер или режим')
}

// Удаляет объекты с карты, сохраняя пол, внешние и внутренние стены.
const normalizeTopology = (map: string[]): string[] => {
  if (!Array.isArray(map) || map.length === 0 || map.some((row) => typeof row !== 'string')) {
    throw new Error('Не удалось прочитать структуру текущего уровня')
  }
  const width = map[0].length
  if (!width || map.some((row) => row.length !== width)) throw new Error('Строки структуры имеют разную длину')
  return map.map((row) => Array.from(row, (symbol) => ('_#'.includes(symbol) ? symbol : ' ')).join(''))
}

// Создаёт индексированное представление проходимых клеток структуры.
const createTopologyBoard = (topology: string[]): TopologyBoard => {
  const width = topology[0].length
  const floors = new Set<number>()
  topology.forEach((row, y) => {
    Array.from(row).forEach((symbol, x) => {
      if (!'_#'.includes(symbol)) floors.add(toIndex(x, y, width))
    })
  })
  return {width, height: topology.length, floors, topology}
}

// Проверяет наличие прямой для обратного вытягивания ящика с цели.
const hasPullLane = (position: number, board: TopologyBoard) => {
  return DIRECTIONS.some((direction) => {
    const first = getAdjacentIndex(position, direction, board.width, board.height)
    const second = getAdjacentIndex(position, direction, board.width, board.height, 2)
    return first !== null && second !== null && board.floors.has(first) && board.floors.has(second)
  })
}

// Возвращает клетки, подходящие для начального размещения целей.
const getEligibleGoalPositions = (board: TopologyBoard) => Array.from(board.floors).filter((position) => hasPullLane(position, board))

// Возвращает безопасный максимум ящиков для текущей структуры.
const getMaximumBoxCount = (board: TopologyBoard) => {
  const movementCapacity = Math.floor((board.floors.size - 1) / 5)
  return Math.max(1, Math.min(movementCapacity, getEligibleGoalPositions(board).length))
}

// Подбирает количество ящиков по площади и выбранной сложности.
const getRecommendedBoxCount = (board: TopologyBoard, config: TopologyConfig) => {
  const desired = Math.max(config.minimumBoxes, Math.round(board.floors.size / config.boxAreaRatio))
  return Math.min(desired, getMaximumBoxCount(board))
}

// Проверяет, что все клетки пола принадлежат одной связной области.
const isTopologyConnected = (board: TopologyBoard) => {
  const start = board.floors.values().next().value
  if (start === undefined) return false
  const visited = new Set([start])
  const queue = [start]
  for (let index = 0; index < queue.length; index++) {
    DIRECTIONS.forEach((direction) => {
      const next = getAdjacentIndex(queue[index], direction, board.width, board.height)
      if (next === null || !board.floors.has(next) || visited.has(next)) return
      visited.add(next)
      queue.push(next)
    })
  }
  return visited.size === board.floors.size
}

export {
  createGeneratedTopology,
  createTopologyBoard,
  getEligibleGoalPositions,
  getMaximumBoxCount,
  getRecommendedBoxCount,
  isTopologyConnected,
  normalizeTopology,
}

export type {TopologyBoard, TopologyConfig}
