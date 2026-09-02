import type {Container} from 'pixi.js'
import {Sprite} from 'pixi.js'

// Содержит общие математические операции для игровой логики и сцены.

type RandomPositionOptions = {
  minX?: number
  maxX?: number
  minY?: number
  maxY?: number
  forceYMinus?: boolean
}

export default class MathTools {
  // Создаёт короткий случайный идентификатор.
  static getRandomID() {
    return (+new Date()).toString(16) + ((Math.random() * 100000000) | 0).toString(16)
  }

  // Вычисляет расстояние между двумя точками.
  static calculateDistance(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
  }

  // Возвращает случайное число в заданном диапазоне.
  static getRandomNumber(min = 0, max: number, toFixed = 2) {
    return +(Math.random() * (max - min) + min).toFixed(toFixed)
  }

  // Возвращает случайное смещение по двум координатам.
  static getRandomPosition = ({minX = 0, maxX = 100, minY = 0, maxY = 100, forceYMinus = false}: RandomPositionOptions) => {
    // Возвращает случайный знак числа.
    const sign = () => (Math.random() < 0.5 ? -1 : 1)

    return {
      rx: MathTools.getRandomNumber(minX, maxX, 0) * sign(),
      ry: MathTools.getRandomNumber(minY, maxY, 0) * (forceYMinus ? -1 : sign()),
    }
  }

  // Ограничивает число заданным диапазоном.
  static clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
  }

  // Проверяет пересечение прямоугольных границ двух объектов.
  static testForAABB = (object1: Container, object2: Container, collisionDepth = 0) => {
    const bounds1 = object1.getBounds()
    const bounds2 = object2.getBounds()

    return (
      bounds1.x < bounds2.x + bounds2.width - collisionDepth &&
      bounds1.x + bounds1.width > bounds2.x + collisionDepth &&
      bounds1.y < bounds2.y + bounds2.height - collisionDepth &&
      bounds1.y + bounds1.height > bounds2.y + collisionDepth
    )
  }

  // Возвращает глобальную позицию объекта с учётом якоря спрайта.
  static getGlobalPosWithAnchor = (gameObject: Container) => {
    const globalPosition = gameObject.getGlobalPosition()

    let offsetX = 0
    let offsetY = 0

    if (gameObject instanceof Sprite) {
      // Учтите разницу в позиции из-за якоря (хардкод, якорь должен быть 0.5)
      offsetX = gameObject.width * gameObject.anchor.x
      offsetY = gameObject.height * gameObject.anchor.y
    }

    // Получите точные глобальные координаты, учтя якорь
    return {
      x: globalPosition.x - offsetX,
      y: globalPosition.y - offsetY,
    }
  }

  // Вычисляет масштаб первого объекта относительно ширины второго.
  static getScale = (firstTarget: {width: number}, secondTarget: {width: number}) => {
    const initialWidth = firstTarget.width
    const targetWidth = secondTarget.width // Желаемый размер спрайта
    const scale = targetWidth / initialWidth
    // console.log('scale', scale)

    return scale
  }

  // Проверяет, является ли значение корректным числом.
  static isNumber = (value: unknown) => {
    return typeof value === 'number' && !isNaN(value)
  }
}
