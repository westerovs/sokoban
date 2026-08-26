import {Graphics} from 'pixi.js'

type DebugRectOptions = {
  color?: number
  label?: string
  borderSize?: number
}

type DebugRectSize = {
  width: number
  height: number
  scale?: number
}

export default class DebugRect extends Graphics {
  #color: number
  #borderSize: number

  constructor({color = 0x00ff00, label = 'debugRect', borderSize = 4}: DebugRectOptions = {}) {
    super({label, eventMode: 'none'})

    this.#color = color
    this.#borderSize = borderSize
  }

  update = ({width, height, scale = 1}: DebugRectSize) => {
    const borderSize = this.#borderSize / scale
    const offset = borderSize / 2

    this.clear()
      .rect(offset, offset, width - borderSize, height - borderSize)
      .stroke({
        width: borderSize,
        color: this.#color,
      })
  }
}
