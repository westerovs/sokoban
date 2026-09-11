import type {EditorState, Position} from './editorTypes.js'

// Редактирует индивидуальное смещение выбранного декора в пикселях.

const ARROW_STEP = 1 // Обычный шаг смещения в пикселях
const LARGE_ARROW_STEP = 10 // Шаг смещения с Shift в пикселях

export default class DecorOffsetPanel {
  #root: HTMLElement
  #onChange: (state: EditorState) => void
  #onSelect: (position: Position | null) => void
  #state: EditorState | null = null
  #position: Position | null = null
  #x!: HTMLInputElement
  #y!: HTMLInputElement

  // Сохраняет зависимости панели и подключает поля.
  constructor(root: HTMLElement, onChange: (state: EditorState) => void, onSelect: (position: Position | null) => void) {
    this.#root = root
    this.#onChange = onChange
    this.#onSelect = onSelect
    this.#init()
  }

  // Выбирает декор по исходной клетке карты.
  select(position: Position | null) {
    this.#position = position
    this.sync(this.#state)
  }

  // Обновляет поля после редактирования, отмены или смены уровня.
  sync(state: EditorState | null) {
    this.#state = state
    const texture = state?.appearance.decor?.[this.#key()]
    if (!texture) this.#position = null
    const offset = state?.appearance.decorOffsets?.[this.#key()] ?? {x: 0, y: 0}
    this.#x.value = String(offset.x)
    this.#y.value = String(offset.y)
    this.#root.querySelector('fieldset')!.disabled = !this.#position
    const output = this.#root.querySelector('output')!
    output.textContent = this.#position ? texture! : ''
    output.hidden = !this.#position
    this.#onSelect(this.#position)
  }

  // Сдвигает выбранный объект стрелками, не перехватывая сочетания команд.
  handleKey(event: KeyboardEvent) {
    if (!this.#position || event.altKey || event.ctrlKey || event.metaKey) return false
    const directions: Record<string, number[]> = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}
    const direction = directions[event.key]
    if (!direction) return false
    const step = event.shiftKey ? LARGE_ARROW_STEP : ARROW_STEP
    this.#apply(Number(this.#x.value) + direction[0] * step, Number(this.#y.value) + direction[1] * step)
    return true
  }

  // Подключает ввод координат и сброс выбранного смещения.
  #init() {
    this.#x = this.#root.querySelector<HTMLInputElement>('[name="decor-x"]')!
    this.#y = this.#root.querySelector<HTMLInputElement>('[name="decor-y"]')!
    for (const input of [this.#x, this.#y]) input.addEventListener('change', () => this.#applyInputs())
    this.#root.querySelector('[data-reset]')!.addEventListener('click', () => this.#apply(0, 0))
  }

  // Возвращает ключ исходной клетки выбранного объекта.
  #key() {
    return this.#position ? `${this.#position.x}:${this.#position.y}` : ''
  }

  // Принимает только заполненные поля с конечными числовыми значениями.
  #applyInputs() {
    if (!this.#x.value || !this.#y.value || !this.#x.checkValidity() || !this.#y.checkValidity()) return this.sync(this.#state)
    this.#apply(this.#x.valueAsNumber, this.#y.valueAsNumber)
  }

  // Передаёт новый снимок состояния в общую историю редактора.
  #apply(x: number, y: number) {
    if (!this.#state || !this.#position || !Number.isFinite(x) || !Number.isFinite(y)) return
    const state = structuredClone(this.#state)
    const offsets = (state.appearance.decorOffsets ??= {})
    if (x || y) offsets[this.#key()] = {x, y}
    else delete offsets[this.#key()]
    if (!Object.keys(offsets).length) delete state.appearance.decorOffsets
    this.#onChange(state)
  }
}
