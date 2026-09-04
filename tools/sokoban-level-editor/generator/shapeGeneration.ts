import {clamp, type Random, randomInteger} from './grid.js'

/**
 * Создаёт связные маски пола для разных типов внешнего контура уровня.
 */

type Position = {
  x: number
  y: number
}

type Rectangle = Position & {
  width: number
  height: number
}

type GroundMask = boolean[][]

const GENERATED_SHAPES = Object.freeze(['compact', 'rooms', 'winding']) // Конкретные формы для случайного режима
const MIN_ROOM_SIZE = 3 // Минимальная сторона отдельной комнаты
const CORRIDOR_WIDTH = 2 // Ширина соединений, безопасная для движения ящиков

// Создаёт пустую маску доступного пространства.
const createEmptyMask = (width: number, height: number): GroundMask => Array.from({length: height}, () => Array<boolean>(width).fill(false))

// Заполняет прямоугольный участок маски заданным значением.
const fillRectangle = (mask: GroundMask, rectangle: Rectangle, value = true) => {
  for (let y = rectangle.y; y < rectangle.y + rectangle.height; y++) {
    for (let x = rectangle.x; x < rectangle.x + rectangle.width; x++) mask[y][x] = value
  }
}

// Возвращает центр прямоугольного участка.
const getRectangleCenter = (rectangle: Rectangle): Position => ({
  x: rectangle.x + Math.floor(rectangle.width / 2),
  y: rectangle.y + Math.floor(rectangle.height / 2),
})

// Возвращает случайное целое число с включённой верхней границей.
const randomBetween = (random: Random, minimum: number, maximum: number) => randomInteger(random, minimum, maximum + 1)

// Создаёт случайную комнату внутри безопасной рамки поля.
const createRandomRoom = (width: number, height: number, random: Random): Rectangle => {
  const maxWidth = Math.max(MIN_ROOM_SIZE, Math.min(width - 2, Math.round(width * 0.48)))
  const maxHeight = Math.max(MIN_ROOM_SIZE, Math.min(height - 2, Math.round(height * 0.48)))
  const roomWidth = randomBetween(random, MIN_ROOM_SIZE, maxWidth)
  const roomHeight = randomBetween(random, MIN_ROOM_SIZE, maxHeight)
  return {
    x: randomInteger(random, 1, width - roomWidth),
    y: randomInteger(random, 1, height - roomHeight),
    width: roomWidth,
    height: roomHeight,
  }
}

// Ограничивает начало широкого прохода внутренней областью поля.
const getCorridorOrigin = (coordinate: number, limit: number) => clamp(coordinate - 1, 1, limit - CORRIDOR_WIDTH - 1)

// Прокладывает горизонтальный проход между двумя координатами.
const carveHorizontalCorridor = (mask: GroundMask, firstX: number, secondX: number, y: number) => {
  const startX = Math.min(firstX, secondX)
  fillRectangle(mask, {
    x: startX,
    y: getCorridorOrigin(y, mask.length),
    width: Math.abs(secondX - firstX) + 1,
    height: CORRIDOR_WIDTH,
  })
}

// Прокладывает вертикальный проход между двумя координатами.
const carveVerticalCorridor = (mask: GroundMask, firstY: number, secondY: number, x: number) => {
  const startY = Math.min(firstY, secondY)
  fillRectangle(mask, {
    x: getCorridorOrigin(x, mask[0].length),
    y: startY,
    width: CORRIDOR_WIDTH,
    height: Math.abs(secondY - firstY) + 1,
  })
}

// Соединяет две точки Г-образным широким проходом.
const connectPoints = (mask: GroundMask, first: Position, second: Position, random: Random) => {
  if (random() < 0.5) {
    carveHorizontalCorridor(mask, first.x, second.x, first.y)
    carveVerticalCorridor(mask, first.y, second.y, second.x)
    return
  }
  carveVerticalCorridor(mask, first.y, second.y, first.x)
  carveHorizontalCorridor(mask, first.x, second.x, second.y)
}

// Создаёт случайную выемку с выбранного края компактной области.
const createEdgeNotch = (width: number, height: number, side: number, random: Random): Rectangle => {
  const horizontal = side === 0 || side === 2
  const spanLimit = horizontal ? width - 2 : height - 2
  const depthLimit = horizontal ? height - 2 : width - 2
  const minimumSpan = Math.min(3, spanLimit)
  const minimumDepth = Math.min(2, depthLimit)
  const span = randomBetween(random, minimumSpan, Math.max(minimumSpan, Math.floor(spanLimit * 0.52)))
  const depth = randomBetween(random, minimumDepth, Math.max(minimumDepth, Math.floor(depthLimit * 0.35)))
  const offset = randomInteger(random, 1, (horizontal ? width : height) - span)
  if (side === 0) return {x: offset, y: 1, width: span, height: depth}
  if (side === 1) return {x: width - depth - 1, y: offset, width: depth, height: span}
  if (side === 2) return {x: offset, y: height - depth - 1, width: span, height: depth}
  return {x: 1, y: offset, width: depth, height: span}
}

// Создаёт единую область с асимметричными выемками по краям.
const createCompactMask = (width: number, height: number, random: Random): GroundMask => {
  const mask = createEmptyMask(width, height)
  fillRectangle(mask, {x: 1, y: 1, width: width - 2, height: height - 2})
  const notchCount = Math.max(2, Math.round((width + height) / 8))
  for (let index = 0; index < notchCount; index++) {
    fillRectangle(mask, createEdgeNotch(width, height, randomInteger(random, 0, 4), random), false)
  }
  return mask
}

// Подбирает число комнат по доступной площади.
const getRoomCount = (width: number, height: number) => {
  const innerArea = (width - 2) * (height - 2)
  return clamp(Math.round(innerArea / 45) + 2, 3, 9)
}

// Создаёт несколько перекрывающихся комнат с широкими переходами.
const createRoomsMask = (width: number, height: number, random: Random): GroundMask => {
  const mask = createEmptyMask(width, height)
  let previousCenter: Position | null = null
  for (let index = 0; index < getRoomCount(width, height); index++) {
    const room = createRandomRoom(width, height, random)
    const center = getRectangleCenter(room)
    fillRectangle(mask, room)
    if (previousCenter) connectPoints(mask, previousCenter, center, random)
    previousCenter = center
  }
  return mask
}

// Создаёт небольшую комнату вокруг узловой точки извилистой структуры.
const carveWaypointRoom = (mask: GroundMask, point: Position, random: Random) => {
  const width = randomBetween(random, MIN_ROOM_SIZE, Math.min(5, mask[0].length - 2))
  const height = randomBetween(random, MIN_ROOM_SIZE, Math.min(5, mask.length - 2))
  const x = clamp(point.x - Math.floor(width / 2), 1, mask[0].length - width - 1)
  const y = clamp(point.y - Math.floor(height / 2), 1, mask.length - height - 1)
  fillRectangle(mask, {x, y, width, height})
}

// Возвращает случайную внутреннюю точку поля.
const createWaypoint = (width: number, height: number, random: Random): Position => ({
  x: randomInteger(random, 1, width - 1),
  y: randomInteger(random, 1, height - 1),
})

// Подбирает число поворотов извилистой структуры по площади.
const getWaypointCount = (width: number, height: number) => {
  const innerArea = (width - 2) * (height - 2)
  return clamp(Math.round(innerArea / 32) + 3, 4, 12)
}

// Создаёт ветвистую область из широких коридоров и небольших комнат.
const createWindingMask = (width: number, height: number, random: Random): GroundMask => {
  const mask = createEmptyMask(width, height)
  let current = {x: Math.floor(width / 2), y: Math.floor(height / 2)}
  carveWaypointRoom(mask, current, random)
  for (let index = 0; index < getWaypointCount(width, height); index++) {
    const next = createWaypoint(width, height, random)
    connectPoints(mask, current, next, random)
    if (index % 2 === 0 || random() < 0.35) carveWaypointRoom(mask, next, random)
    current = next
  }
  return mask
}

// Выбирает конкретную форму для случайного режима.
const resolveGeneratedShape = (shape: string, random: Random) => {
  if (shape !== 'random') return shape
  return GENERATED_SHAPES[randomInteger(random, 0, GENERATED_SHAPES.length)]
}

// Создаёт маску пола выбранной формы.
const createGroundMask = (width: number, height: number, shape: string, random: Random): GroundMask => {
  if (shape === 'compact') return createCompactMask(width, height, random)
  if (shape === 'rooms') return createRoomsMask(width, height, random)
  return createWindingMask(width, height, random)
}

export {
  createGroundMask, // Создание маски пола выбранной формы
  resolveGeneratedShape, // Выбор конкретной формы
}
