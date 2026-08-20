import {Container} from 'pixi.js'
import SokobanBoard from './SokobanBoard.js'
import SokobanInput from './SokobanInput.js'
import SokobanLevel from './SokobanLevel.js'

export default class SokobanGame extends Container {
  #map
  #onComplete
  #level
  #board
  #input
  #isInputEnabled = false

  constructor({map, onComplete}) {
    super({label: 'sokoban-game'})

    this.#map = map
    this.#onComplete = onComplete
    this.#init()
  }

  move(direction) {
    if (!this.#isInputEnabled) return false

    const levelDirection = this.#board.getLevelDirection(direction)
    const result = this.#level.move(levelDirection)
    if (!result.moved) return false

    this.#board.update()
    if (result.completed) this.#complete()
    return true
  }

  setInputEnabled(isEnabled) {
    this.#isInputEnabled = isEnabled
    this.#input.setEnabled(isEnabled)
  }

  resize() {
    this.#board.resize()
  }

  destroy(options) {
    this.#input?.destroy()
    this.#isInputEnabled = false
    super.destroy(options)
  }

  #init() {
    this.#level = new SokobanLevel(this.#map)
    this.#board = new SokobanBoard(this.#level)
    this.#input = new SokobanInput((direction) => this.move(direction))
    this.addChild(this.#board)
  }

  #complete() {
    this.setInputEnabled(false)
    this.#onComplete?.()
  }
}
