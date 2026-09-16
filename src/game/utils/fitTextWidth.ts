import type {Text} from 'pixi.js'

// Уменьшает текст до доступной ширины без изменения пропорций.

// Сбрасывает прошлое сжатие и вписывает актуальную строку в заданную ширину.
const fitTextWidth = (text: Text, width: number) => {
  text.scale.set(1)
  text.scale.set(Math.min(1, width / Math.max(text.width, 1)))
}

export {
  fitTextWidth, // Вписывание строки в доступную ширину
}
