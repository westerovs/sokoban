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
  #appearance
  #levelNumber
  #pushRecord
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
  #heldDirection = null

  constructor({map, appearance, levelNumber, pushRecord, onComplete, onMove, canMove}) {
    super({label: 'sokoban-game'})

    this.#map = map
    this.#appearance = appearance
    this.#levelNumber = levelNumber
    this.#pushRecord = pushRecord
    this.#onComplete = onComplete
    this.#onMove = onMove
    this.#canMove = canMove
    this.#init()
  }

  move(direction) {
    return this.#startMove(direction, null)
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

  hideInterface() {
    this.#hud.visible = false
    this.#dpad.visible = false
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

  #startMove(direction, heldDirection) {
    if (!this.#canUseControls()) return false

    const levelDirection = this.#board.getLevelDirection(direction)
    const result = this.#level.move(levelDirection)
    if (!result.moved) return false

    this.#isAnimatingMove = true
    this.#hud.setSteps(this.#level.steps)
    this.#onMove?.()
    const isContinuous = Boolean(heldDirection)
    this.#board.animateMove(result, {isContinuous}).then(() => this.#finishMove(result))
    return true
  }

  #init() {
    this.#level = new SokobanLevel(this.#map)
    this.#board = new SokobanBoard(this.#level, this.#appearance)
    this.#hud = new SokobanHud({
      levelNumber: this.#levelNumber,
      pushRecord: this.#pushRecord,
      onUndo: () => this.undo(),
      onRestart: () => this.restart(),
    })
    this.#dpad = new SokobanDpad((direction) => this.#setHeldDirection(direction))
    this.#input = new SokobanInput({
      onMove: (direction) => this.move(direction),
      onHeldDirectionChange: (direction) => this.#setHeldDirection(direction),
      pointerTarget: Locator.game.app.canvas,
    })
    this.#dpadVisibilityHandler = this.#setDpadVisible.bind(this)
    Locator.game.on(GAME_EVENTS.Options.checkboxSokobanDpad, this.#dpadVisibilityHandler)
    this.#setDpadVisible(Locator.storage.playerData.option_sokobanDpad)
    this.addChild(this.#board)
  }

  #canUseControls() {
    return this.#isInputEnabled && !this.#isAnimatingMove && this.#canMove?.() !== false
  }

  #setHeldDirection(direction) {
    if (direction === this.#heldDirection) return

    this.#heldDirection = direction
    this.#continueHeldMovement()
  }

  #continueHeldMovement() {
    if (!this.#heldDirection) return
    this.#startMove(this.#heldDirection, this.#heldDirection)
  }

  #finishMove(result) {
    this.#isAnimatingMove = false
    if (result.deadlockedBox) {
      this.#board.showDeadlock(result.deadlockedBox)
      this.#hud.showDeadlockFeedback()
    }
    if (result.completed) {
      this.#complete()
      return
    }

    this.#continueHeldMovement()
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
    this.hideInterface()
    this.#onComplete?.()
  }
}
