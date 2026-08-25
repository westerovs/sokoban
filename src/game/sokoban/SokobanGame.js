import {Container} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import SokobanBoard from './SokobanBoard.js'
import SokobanDpad from './SokobanDpad.js'
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
  #dpad
  #input
  #dpadVisibilityHandler
  #isInputEnabled = false
  #isAnimatingMove = false

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

    this.#isAnimatingMove = true
    this.#hud.setSteps(this.#level.steps)
    this.#onMove?.()
    this.#board.animateMove(result).then(() => this.#finishMove(result))
    return true
  }

  setInputEnabled(isEnabled) {
    this.#isInputEnabled = isEnabled
    this.#input.setEnabled(isEnabled)
    this.#hud.setEnabled(isEnabled)
    this.#dpad.setEnabled(isEnabled)
  }

  attachHud() {
    Locator.uiLayer.stateUiLayer.addChild(this.#hud, this.#dpad)
    this.#resizeUi()
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
    this.#resizeUi()
  }

  destroy(options) {
    Locator.game.off(GAME_EVENTS.Options.checkboxSokobanDpad, this.#dpadVisibilityHandler)
    this.#input?.destroy()
    this.#hud?.destroy({children: true})
    this.#dpad?.destroy({children: true})
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
    this.#dpad = new SokobanDpad((direction) => this.move(direction))
    this.#input = new SokobanInput({
      onMove: (direction) => this.move(direction),
      pointerTarget: Locator.game.app.canvas,
    })
    this.#dpadVisibilityHandler = this.#setDpadVisible.bind(this)
    Locator.game.on(GAME_EVENTS.Options.checkboxSokobanDpad, this.#dpadVisibilityHandler)
    this.#setDpadVisible(Locator.storage.playerData.option_sokobanDpad)
    this.addChild(this.#board)
  }

  #canUseControls() {
    return this.#isInputEnabled
      && !this.#isAnimatingMove
      && this.#canMove?.() !== false
  }

  #finishMove(result) {
    this.#isAnimatingMove = false
    if (result.deadlockedBox) {
      this.#board.showDeadlock(result.deadlockedBox)
      this.#hud.showDeadlockFeedback()
    }
    if (result.completed) this.#complete()
  }

  #updateViews() {
    this.#hud.clearDeadlockFeedback()
    this.#board.update()
    this.#hud.setSteps(this.#level.steps)
  }

  #resizeUi() {
    if (!this.#hud.parent) return

    const {width, height, center} = Locator.uiLayer.uiData
    const boardLayout = this.#board.getLayout(this.#hud.parent)

    this.#hud.layout({
      ...boardLayout,
      availableWidth: width,
      availableHeight: height,
      centerX: center.x,
    })
    this.#dpad.layout({width, height})
  }

  #setDpadVisible(isVisible) {
    this.#dpad.setVisible(isVisible)
  }

  #complete() {
    this.setInputEnabled(false)
    this.#onComplete?.()
  }
}
