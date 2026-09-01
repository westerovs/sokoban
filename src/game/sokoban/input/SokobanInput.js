/**
 * Преобразует клавиатурный и сенсорный ввод в направления Sokoban.
 */

const KEY_DIRECTIONS = Object.freeze({
  ArrowUp: 'up', // Стрелка вверх
  KeyW: 'up', // Альтернативная клавиша движения вверх
  ArrowDown: 'down', // Стрелка вниз
  KeyS: 'down', // Альтернативная клавиша движения вниз
  ArrowLeft: 'left', // Стрелка влево
  KeyA: 'left', // Альтернативная клавиша движения влево
  ArrowRight: 'right', // Стрелка вправо
  KeyD: 'right', // Альтернативная клавиша движения вправо
})
const SWIPE_MIN_DISTANCE = 32 // Минимальная длина жеста для распознавания свайпа

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

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor({onMove, onHeldDirectionChange, pointerTarget}) {
    this.#onMove = onMove
    this.#onHeldDirectionChange = onHeldDirectionChange
    this.#pointerTarget = pointerTarget
    this.#init()
  }

  // Включает или отключает взаимодействие с элементом.
  setEnabled(isEnabled) {
    this.#isEnabled = isEnabled
    if (!isEnabled) this.#clearHeldKeys()
  }

  // Освобождает обработчики, анимации и ресурсы экземпляра.
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

  // Инициализирует внутреннее состояние и зависимости.
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

  // Обрабатывает нажатие клавиши движения.
  #handleKeyDown(event) {
    const direction = KEY_DIRECTIONS[event.code]
    if (!this.#isEnabled || !direction) return
    if (this.#isEditableTarget(event.target)) return

    event.preventDefault()
    if (event.repeat || this.#heldKeyCodes.includes(event.code)) return

    this.#heldKeyCodes.push(event.code)
    this.#emitHeldDirection()
  }

  // Обрабатывает отпускание клавиши движения.
  #handleKeyUp(event) {
    const keyIndex = this.#heldKeyCodes.indexOf(event.code)
    if (keyIndex === -1) return

    event.preventDefault()
    this.#heldKeyCodes.splice(keyIndex, 1)
    this.#emitHeldDirection()
  }

  // Проверяет, относится ли DOM-элемент к полю ввода.
  #isEditableTarget(target) {
    const tagName = target?.tagName
    return tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable
  }

  // Запоминает начало возможного свайпа.
  #handlePointerDown(event) {
    if (!this.#isEnabled || !this.#isSwipePointer(event)) return

    this.#pointerStart = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    }
  }

  // Распознаёт завершённый свайп и передаёт направление.
  #handlePointerUp(event) {
    const start = this.#pointerStart
    this.#pointerStart = null
    if (!this.#isEnabled || !start || start.id !== event.pointerId) return

    const direction = this.#getSwipeDirection(event.clientX - start.x, event.clientY - start.y)
    if (direction) this.#onMove(direction)
  }

  // Определяет направление свайпа по горизонтальному и вертикальному смещению.
  #getSwipeDirection(deltaX, deltaY) {
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < SWIPE_MIN_DISTANCE) return null
    if (Math.abs(deltaX) > Math.abs(deltaY)) return deltaX > 0 ? 'right' : 'left'
    return deltaY > 0 ? 'down' : 'up'
  }

  // Проверяет, можно ли считать событие сенсорным свайпом.
  #isSwipePointer(event) {
    return event.isPrimary && (event.pointerType === 'touch' || event.pointerType === 'pen')
  }

  // Передаёт наружу текущее удерживаемое направление.
  #emitHeldDirection() {
    const activeKeyCode = this.#heldKeyCodes.at(-1)
    this.#onHeldDirectionChange(activeKeyCode ? KEY_DIRECTIONS[activeKeyCode] : null)
  }

  // Очищает список удерживаемых клавиш движения.
  #clearHeldKeys() {
    if (this.#heldKeyCodes.length === 0) return

    this.#heldKeyCodes = []
    this.#onHeldDirectionChange(null)
  }

  // Сбрасывает сохранённое состояние указателя.
  #clearPointer() {
    this.#pointerStart = null
  }
}
