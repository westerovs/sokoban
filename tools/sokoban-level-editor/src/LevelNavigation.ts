import type {EditorLevel, EditorLocation} from './editorTypes.js'

/**
 * Управляет выбором локации и уровня с защитой несохранённых изменений.
 */

export default class LevelNavigation {
  #canSelect: () => boolean
  #levelSelect: HTMLSelectElement
  #locationSelect: HTMLSelectElement
  #locations: EditorLocation[]
  #onSelect: (level: EditorLevel | null) => void
  #selectedLevel: EditorLevel | null = null

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(
    locationSelect: HTMLSelectElement,
    levelSelect: HTMLSelectElement,
    locations: EditorLocation[],
    onSelect: (level: EditorLevel | null) => void,
    canSelect: () => boolean,
  ) {
    this.#locationSelect = locationSelect
    this.#levelSelect = levelSelect
    this.#locations = locations
    this.#onSelect = onSelect
    this.#canSelect = canSelect
    this.#init()
  }

  // Выполняет отдельную операцию `selectLevel`.
  selectLevel(levelId: string | null) {
    const location = this.#locations.find(({levels}) => levels.some((level) => level.id === levelId))
    if (!levelId || !location) return this.#selectFirstLevel()

    this.#locationSelect.value = location.id
    this.#replaceLevelOptions(location)
    this.#levelSelect.value = levelId
    this.#commitSelection(this.getSelectedLevel())
  }

  // Возвращает данные, за которые отвечает операция `getSelectedLevel`.
  getSelectedLevel() {
    return this.#getSelectedLocation()?.levels.find(({id}) => id === this.#levelSelect.value) ?? null
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init() {
    this.#locationSelect.replaceChildren(...this.#locations.map(this.#createLocationOption))
    this.#locationSelect.addEventListener('change', this.#handleLocationChange)
    this.#levelSelect.addEventListener('change', this.#handleLevelChange)
  }

  // Выполняет отдельную операцию `selectFirstLevel`.
  #selectFirstLevel = () => {
    const location = this.#getSelectedLocation() ?? this.#locations[0]
    if (!location) return this.#commitSelection(null)

    this.#locationSelect.value = location.id
    this.#replaceLevelOptions(location)
    this.#commitSelection(this.getSelectedLevel())
  }

  // Выполняет отдельную операцию `replaceLevelOptions`.
  #replaceLevelOptions(location: EditorLocation) {
    this.#levelSelect.replaceChildren(...location.levels.map(this.#createLevelOption))
  }

  // Возвращает данные, за которые отвечает операция `getSelectedLocation`.
  #getSelectedLocation() {
    return this.#locations.find(({id}) => id === this.#locationSelect.value) ?? null
  }

  // Обрабатывает событие, за которое отвечает операция `handleLocationChange`.
  #handleLocationChange = () => {
    const location = this.#getSelectedLocation()
    if (location) this.#replaceLevelOptions(location)
    this.#tryCommitSelection(this.getSelectedLevel())
  }

  // Обрабатывает событие, за которое отвечает операция `handleLevelChange`.
  #handleLevelChange = () => {
    this.#tryCommitSelection(this.getSelectedLevel())
  }

  // Пытается выполнить операцию `tryCommitSelection` и сообщает результат.
  #tryCommitSelection(level: EditorLevel | null) {
    if (this.#selectedLevel && level?.id !== this.#selectedLevel.id && !this.#canSelect()) {
      this.#restoreSelection()
      return
    }
    this.#commitSelection(level)
  }

  // Выполняет отдельную операцию `commitSelection`.
  #commitSelection(level: EditorLevel | null) {
    this.#selectedLevel = level
    this.#onSelect(level)
  }

  // Выполняет отдельную операцию `restoreSelection`.
  #restoreSelection() {
    const selectedLevel = this.#selectedLevel
    if (!selectedLevel) return
    const location = this.#locations.find(({levels}) => levels.some((level) => level.id === selectedLevel.id))
    if (!location) return
    this.#locationSelect.value = location.id
    this.#replaceLevelOptions(location)
    this.#levelSelect.value = selectedLevel.id
  }

  // Создаёт данные или представление для операции `createLocationOption`.
  #createLocationOption = (location: EditorLocation) => {
    const option = document.createElement('option')
    option.value = location.id
    option.textContent = `${location.id} · ${location.titleKey}`
    return option
  }

  // Создаёт данные или представление для операции `createLevelOption`.
  #createLevelOption = (level: EditorLevel) => {
    const option = document.createElement('option')
    option.value = level.id
    option.textContent = `${level.number}. ${level.id}`
    return option
  }
}
