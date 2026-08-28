const KEY_DIRECTIONS = Object.freeze({
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
})
const SWIPE_MIN_DISTANCE = 32

export default class SokobanInput {
  #onMove
  #onHeldDirectionChange
  #pointerTarget
  #pointerStart = null
  #heldKeyCodes = []
  #isEnabled = false
  #keyDownHandler
  #keyUpHandler
  #blurHandler
  #pointerDownHandler
  #pointerUpHandler
  #pointerCancelHandler

  constructor({onMove, onHeldDirectionChange, pointerTarget}) {
    this.#onMove = onMove
    this.#onHeldDirectionChange = onHeldDirectionChange
    this.#pointerTarget = pointerTarget
    this.#init()
  }

  setEnabled(isEnabled) {
    this.#isEnabled = isEnabled
    if (!isEnabled) this.#clearHeldKeys()
  }

  destroy() {
    window.removeEventListener('keydown', this.#keyDownHandler)
    window.removeEventListener('keyup', this.#keyUpHandler)
    window.removeEventListener('blur', this.#blurHandler)
    this.#pointerTarget.removeEventListener('pointerdown', this.#pointerDownHandler)
    window.removeEventListener('pointerup', this.#pointerUpHandler)
    window.removeEventListener('pointercancel', this.#pointerCancelHandler)
    this.#clearHeldKeys()
    this.#pointerStart = null
    this.#isEnabled = false
  }

  #init() {
    this.#keyDownHandler = this.#handleKeyDown.bind(this)
    this.#keyUpHandler = this.#handleKeyUp.bind(this)
    this.#blurHandler = this.#clearHeldKeys.bind(this)
    this.#pointerDownHandler = this.#handlePointerDown.bind(this)
    this.#pointerUpHandler = this.#handlePointerUp.bind(this)
    this.#pointerCancelHandler = this.#clearPointer.bind(this)
    window.addEventListener('keydown', this.#keyDownHandler)
    window.addEventListener('keyup', this.#keyUpHandler)
    window.addEventListener('blur', this.#blurHandler)
    this.#pointerTarget.addEventListener('pointerdown', this.#pointerDownHandler)
    window.addEventListener('pointerup', this.#pointerUpHandler)
    window.addEventListener('pointercancel', this.#pointerCancelHandler)
  }

  #handleKeyDown(event) {
    const direction = KEY_DIRECTIONS[event.code]
    if (!this.#isEnabled || !direction) return
    if (this.#isEditableTarget(event.target)) return

    event.preventDefault()
    if (event.repeat || this.#heldKeyCodes.includes(event.code)) return

    this.#heldKeyCodes.push(event.code)
    this.#emitHeldDirection()
  }

  #handleKeyUp(event) {
    const keyIndex = this.#heldKeyCodes.indexOf(event.code)
    if (keyIndex === -1) return

    event.preventDefault()
    this.#heldKeyCodes.splice(keyIndex, 1)
    this.#emitHeldDirection()
  }

  #isEditableTarget(target) {
    const tagName = target?.tagName
    return tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable
  }

  #handlePointerDown(event) {
    if (!this.#isEnabled || !this.#isSwipePointer(event)) return

    this.#pointerStart = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    }
  }

  #handlePointerUp(event) {
    const start = this.#pointerStart
    this.#pointerStart = null
    if (!this.#isEnabled || !start || start.id !== event.pointerId) return

    const direction = this.#getSwipeDirection(event.clientX - start.x, event.clientY - start.y)
    if (direction) this.#onMove(direction)
  }

  #getSwipeDirection(deltaX, deltaY) {
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < SWIPE_MIN_DISTANCE) return null
    if (Math.abs(deltaX) > Math.abs(deltaY)) return deltaX > 0 ? 'right' : 'left'
    return deltaY > 0 ? 'down' : 'up'
  }

  #isSwipePointer(event) {
    return event.isPrimary && (event.pointerType === 'touch' || event.pointerType === 'pen')
  }

  #emitHeldDirection() {
    const activeKeyCode = this.#heldKeyCodes.at(-1)
    this.#onHeldDirectionChange(activeKeyCode ? KEY_DIRECTIONS[activeKeyCode] : null)
  }

  #clearHeldKeys() {
    if (this.#heldKeyCodes.length === 0) return

    this.#heldKeyCodes = []
    this.#onHeldDirectionChange(null)
  }

  #clearPointer() {
    this.#pointerStart = null
  }
}
