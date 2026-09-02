import {Graphics} from 'pixi.js'
// Содержит небольшие фабрики графики и общие операции с массивами.

type RectOptions = {
  x?: number
  y?: number
  w?: number
  h?: number
  r?: number
  color?: number
  alpha?: number
  center?: boolean
}

type DebugRectOptions = RectOptions & {
  lineWidth?: number
}

type CircleOptions = {
  x?: number
  y?: number
  r?: number
  color?: number
  alpha?: number
}

// Создаёт залитый прямоугольник с закруглёнными углами.
const createRect = ({x = 0, y = 0, w = 0, h = 0, r = 0, color = 0xfff333, alpha = 1, center = false}: RectOptions) => {
  const rect = new Graphics({label: 'rect'}).roundRect(x, y, w, h, r).fill({color, alpha})

  if (center) {
    rect.position.set(-(rect.width / 2) + x, -(rect.height / 2) + y)
  }

  return rect
}

// Создаёт контурный прямоугольник для визуальной отладки.
const createDebugRect = ({
  x = 0,
  y = 0,
  w = 0,
  h = 0,
  r = 0,
  lineWidth = 2,
  color = 0xff0000,
  alpha = 1,
  center = false,
}: DebugRectOptions) => {
  const rect = new Graphics({label: 'debug-rect'}).roundRect(x, y, w, h, r).stroke({width: lineWidth, color, alpha})

  if (center) {
    rect.position.set(-(rect.width / 2) + x, -(rect.height / 2) + y)
  }

  return rect
}

// Создаёт залитый круг.
const createCircle = ({x = 0, y = 0, r = 50, color = 0xfff333, alpha = 1}: CircleOptions) => {
  const circle = new Graphics({label: 'circle'}).circle(x, y, r / 2).fill({color, alpha})

  return circle
}

// Возвращает перемешанную копию массива.
const shuffleArr = <T>(arr: T[]) => {
  const newArr = arr.slice()
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
  }
  return newArr
}

// Возвращает случайный элемент массива или null для пустого массива.
const getRandomItem = <T>(array: T[]) => {
  if (!Array.isArray(array) || array.length === 0) return null
  const index = Math.floor(Math.random() * array.length)
  return array[index]
}

export {
  createCircle,
  createDebugRect,
  createRect,
  getRandomItem,
  shuffleArr,
}
