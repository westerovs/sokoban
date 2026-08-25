import {Container} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import SokobanBoard from './SokobanBoard.js'
import SokobanHud from './SokobanHud.js'
import SokobanInput from './SokobanInput.js'
import SokobanLevel from './SokobanLevel.js'

export default class SokobanGame extends Container {
  #map
  #levelNumber
  #onComplete
  #onMove
  #canMove
  #level
  #board
  #hud
  #input
  #isInputEnabled = false

  constructor({map, levelNumber, onComplete, onMove, canMove}) {
    super({label: 'sokoban-game'})

    this.#map = map
    this.#levelNumber = levelNumber
    this.#onComplete = onComplete
    this.#onMove = onMove
    this.#canMove = canMove
    this.#init()
  }

  move(direction) {
    if (!this.#canUseControls()) return false

    const levelDirection = this.#board.getLevelDirection(direction)
    const result = this.#level.move(levelDirection)
    if (!result.moved) return false

    this.#board.update()
    this.#hud.setSteps(this.#level.steps)
    this.#onMove?.()
    if (result.completed) this.#complete()
    return true
  }

  setInputEnabled(isEnabled) {
    this.#isInputEnabled = isEnabled
    this.#input.setEnabled(isEnabled)
    this.#hud.setEnabled(isEnabled)
  }

  attachHud() {
    Locator.uiLayer.stateUiLayer.addChild(this.#hud)
    this.#resizeHud()
  }

  undo() {
    if (!this.#canUseControls() || !this.#level.undo()) return false

    this.#updateViews()
    return true
  }

  restart() {
    if (!this.#canUseControls() || !this.#level.restart()) return false

    this.#updateViews()
    return true
  }

  resize() {
    this.#board.resize()
    this.#resizeHud()
  }

  destroy(options) {
    this.#input?.destroy()
    this.#hud?.destroy({children: true})
    this.#isInputEnabled = false
    super.destroy(options)
  }

  #init() {
    this.#level = new SokobanLevel(this.#map)
    this.#board = new SokobanBoard(this.#level)
    this.#hud = new SokobanHud({
      levelNumber: this.#levelNumber,
      onUndo: () => this.undo(),
      onRestart: () => this.restart(),
    })
    this.#input = new SokobanInput((direction) => this.move(direction))
    this.addChild(this.#board)
  }

  #canUseControls() {
    return this.#isInputEnabled && this.#canMove?.() !== false
  }

  #updateViews() {
    this.#board.update()
    this.#hud.setSteps(this.#level.steps)
  }

  #resizeHud() {
    if (!this.#hud.parent) return

    const {width, height, center} = Locator.uiLayer.uiData
    const boardLayout = this.#board.getLayout(this.#hud.parent)

    this.#hud.layout({
      ...boardLayout,
      availableWidth: width,
      availableHeight: height,
      centerX: center.x,
    })
  }

  #complete() {
    this.setInputEnabled(false)
    this.#onComplete?.()
  }
}
