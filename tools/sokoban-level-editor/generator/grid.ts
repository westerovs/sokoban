/**
 * Предоставляет общие операции с координатами, направлениями и случайным выбором для генератора.
 */

type Direction = {
  x: number
  y: number
  key: string
}

type Random = () => number

const DIRECTIONS = Object.freeze([
  {x: 0, y: -1, key: 'up'}, // Направление вверх
  {x: 1, y: 0, key: 'right'}, // Направление вправо
  {x: 0, y: 1, key: 'down'}, // Направление вниз
  {x: -1, y: 0, key: 'left'}, // Направление влево
])

// Преобразует координаты клетки в линейный индекс.
const toIndex = (x: number, y: number, width: number) => y * width + x

// Преобразует линейный индекс в координаты клетки.
const toPosition = (index: number, width: number) => ({x: index % width, y: Math.floor(index / width)})

// Возвращает соседнюю клетку или `null` за границами поля.
const getAdjacentIndex = (index: number, direction: Direction, width: number, height: number, distance = 1) => {
  const position = toPosition(index, width)
  const x = position.x + direction.x * distance
  const y = position.y + direction.y * distance
  if (x < 0 || y < 0 || x >= width || y >= height) return null
  return toIndex(x, y, width)
}

// Создаёт воспроизводимый генератор псевдослучайных чисел.
const createRandom = (seed: number): Random => {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

// Возвращает случайное целое число в полуинтервале.
const randomInteger = (random: Random, minimum: number, maximum: number) => Math.floor(random() * (maximum - minimum)) + minimum

// Возвращает перемешанную копию массива.
const shuffle = <T>(values: readonly T[], random: Random): T[] => {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = randomInteger(random, 0, index + 1)
    const current = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = current
  }
  return result
}

// Ограничивает число заданным диапазоном.
const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum)

export {
  clamp, // Ограничение числового диапазона
  createRandom, // Воспроизводимая случайная последовательность
  DIRECTIONS, // Ортогональные направления
  getAdjacentIndex, // Поиск соседнего индекса
  randomInteger, // Случайное целое число
  shuffle, // Перемешивание массива
  toIndex, // Преобразование координат в индекс
  toPosition, // Преобразование индекса в координаты
}

export type {Direction, Random}
