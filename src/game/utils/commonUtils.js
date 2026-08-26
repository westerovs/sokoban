import {Graphics} from 'pixi.js'
/**
 * Различные часто-используемые методы, не влияющие на логику игры
 * */

const createRect = ({x = 0, y = 0, w = 0, h = 0, r = 0, color = 0xfff333, alpha = 1, center = false}) => {
  const rect = new Graphics().roundRect(x, y, w, h, r).fill({color, alpha})

  if (center) {
    rect.position.set(-(rect.width / 2) + x, -(rect.height / 2) + y)
  }

  return rect
}

const createDebugRect = ({x = 0, y = 0, w = 0, h = 0, r = 0, lineWidth = 2, color = 0xff0000, alpha = 1, center = false}) => {
  const rect = new Graphics().roundRect(x, y, w, h, r).stroke({width: lineWidth, color, alpha})

  if (center) {
    rect.position.set(-(rect.width / 2) + x, -(rect.height / 2) + y)
  }

  return rect
}

const createCircle = ({x = 0, y = 0, r = 50, color = 0xfff333, alpha = 1}) => {
  const circle = new Graphics().circle(x, y, r / 2).fill({color, alpha})

  return circle
}

const shuffleArr = (arr) => {
  const newArr = arr.slice()
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
  }
  return newArr
}

const getRandomItem = (array) => {
  if (!Array.isArray(array) || array.length === 0) return null
  const index = Math.floor(Math.random() * array.length)
  return array[index]
}

export {createCircle, createDebugRect, createRect, getRandomItem, shuffleArr}
