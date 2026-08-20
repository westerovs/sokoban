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

export default class SokobanInput {
  #onMove
  #isEnabled = false
  #keyDownHandler

  constructor(onMove) {
    this.#onMove = onMove
    this.#init()
  }

  setEnabled(isEnabled) {
    this.#isEnabled = isEnabled
  }

  destroy() {
    window.removeEventListener('keydown', this.#keyDownHandler)
    this.#isEnabled = false
  }

  #init() {
    this.#keyDownHandler = this.#handleKeyDown.bind(this)
    window.addEventListener('keydown', this.#keyDownHandler)
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
}
