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
  #pointerTarget
  #pointerStart = null
  #isEnabled = false
  #keyDownHandler
  #pointerDownHandler
  #pointerUpHandler
  #pointerCancelHandler

  constructor({onMove, pointerTarget}) {
    this.#onMove = onMove
    this.#pointerTarget = pointerTarget
    this.#init()
  }

  setEnabled(isEnabled) {
    this.#isEnabled = isEnabled
  }

  destroy() {
    window.removeEventListener('keydown', this.#keyDownHandler)
    this.#pointerTarget.removeEventListener('pointerdown', this.#pointerDownHandler)
    window.removeEventListener('pointerup', this.#pointerUpHandler)
    window.removeEventListener('pointercancel', this.#pointerCancelHandler)
    this.#pointerStart = null
    this.#isEnabled = false
  }

  #init() {
    this.#keyDownHandler = this.#handleKeyDown.bind(this)
    this.#pointerDownHandler = this.#handlePointerDown.bind(this)
    this.#pointerUpHandler = this.#handlePointerUp.bind(this)
    this.#pointerCancelHandler = this.#clearPointer.bind(this)
    window.addEventListener('keydown', this.#keyDownHandler)
    this.#pointerTarget.addEventListener('pointerdown', this.#pointerDownHandler)
    window.addEventListener('pointerup', this.#pointerUpHandler)
    window.addEventListener('pointercancel', this.#pointerCancelHandler)
  }

  #handleKeyDown(event) {
    const direction = KEY_DIRECTIONS[event.code]
    if (!this.#isEnabled || !direction || event.repeat) return
    if (this.#isEditableTarget(event.target)) return

    event.preventDefault()
    this.#onMove(direction)
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

  #clearPointer() {
    this.#pointerStart = null
  }
}
