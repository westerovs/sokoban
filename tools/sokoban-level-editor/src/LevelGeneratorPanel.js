import {SOKOBAN_SETTINGS} from '@/game/sokoban/config/settings.js'
import {
  DEFAULT_BOARD_HEIGHT,
  DEFAULT_BOARD_WIDTH,
  DEFAULT_DIFFICULTY,
  DEFAULT_SHAPE,
  DIFFICULTY_CONFIG,
  MIN_BOARD_SIZE,
  SHAPE_CONFIG,
} from '../generator/config.mjs'
import {createTopologyBoard, getMaximumBoxCount, normalizeTopology} from '../generator/topology.mjs'

/**
 * Управляет настройками генерации новой структуры и перестановки объектов в текущей геометрии.
 */

// Считает ящики на обычном полу и на целях.
const countBoxes = (map) => map.reduce((total, row) => total + Array.from(row).filter((symbol) => '$-'.includes(symbol)).length, 0)

// Вычисляет вместимость текущей структуры теми же правилами, что и сервер.
const getCurrentMaximumBoxes = (map) => getMaximumBoxCount(createTopologyBoard(normalizeTopology(map)))

// Создаёт варианты выбора сложности из общей конфигурации генератора.
const createDifficultyOptions = () => {
  return Object.entries(DIFFICULTY_CONFIG)
    .map(([value, config]) => `<option value="${value}">${config.label}</option>`)
    .join('')
}

// Создаёт варианты выбора внешней формы из общей конфигурации генератора.
const createShapeOptions = () => {
  return Object.entries(SHAPE_CONFIG)
    .map(([value, config]) => `<option value="${value}">${config.label}</option>`)
    .join('')
}

// Создаёт разметку настроек новой структуры.
const createStructureControlsMarkup = () => `
  <div class="editor-generator__fields">
    <label class="editor-generator__field">
      <span>Ширина</span>
      <input data-field="width" type="number" min="${MIN_BOARD_SIZE}" max="${SOKOBAN_SETTINGS.maxBoardColumns}" value="${DEFAULT_BOARD_WIDTH}" />
    </label>
    <label class="editor-generator__field">
      <span>Высота</span>
      <input data-field="height" type="number" min="${MIN_BOARD_SIZE}" max="${SOKOBAN_SETTINGS.maxBoardRows}" value="${DEFAULT_BOARD_HEIGHT}" />
    </label>
  </div>
  <label class="editor-generator__field">
    <span>Сложность</span>
    <select data-field="difficulty">${createDifficultyOptions()}</select>
  </label>
  <label class="editor-generator__field">
    <span>Форма</span>
    <select data-field="shape">${createShapeOptions()}</select>
  </label>
  <p class="editor-generator__hint">Размер задаёт максимальную область: контур может занимать только часть её клеток.</p>
  <button class="editor-generator__primary" data-action="new-structure" type="button">Создать новую структуру</button>
`

// Создаёт разметку перестановки объектов в текущей структуре.
const createObjectControlsMarkup = () => `
  <div class="editor-generator__divider"></div>
  <div class="editor-generator__caption">Ящики в текущей структуре</div>
  <div class="editor-generator__counter">
    <button data-action="remove-box" type="button" aria-label="Уменьшить количество ящиков">−</button>
    <output data-field="box-count">1</output>
    <button data-action="add-box" type="button" aria-label="Увеличить количество ящиков">+</button>
  </div>
  <button class="editor-generator__secondary" data-action="reshuffle" type="button">Переставить объекты</button>
  <p class="editor-generator__hint">Кнопки −/+ и перестановка сохраняют все внешние и внутренние стены.</p>
  <div class="editor-generator__stats" data-field="stats"></div>
`

// Форматирует статистику последней созданной головоломки.
const formatGenerationStats = (stats) => {
  if (!stats) return 'Создайте структуру или переставьте объекты, чтобы увидеть оценку.'
  const solution = stats.minimumPushes ? `Минимум ${stats.minimumPushes} толчков` : `Гарантированный путь — ${stats.solutionPushes} толчков`
  const shape = SHAPE_CONFIG[stats.shape]?.label ?? 'Текущая структура'
  return `${stats.width}×${stats.height} · ${shape} · ${stats.boxCount} ящ. · ${solution} · линий ящиков: ${stats.boxLines}`
}

export default class LevelGeneratorPanel {
  #addButton
  #boxCount = 1
  #boxCountOutput
  #difficultySelect
  #element
  #heightInput
  #isBusy = false
  #maximumBoxCount = 1
  #onGenerate
  #removeButton
  #shapeSelect
  #stats = null
  #statsElement
  #widthInput

  // Создаёт панель и сохраняет обработчик генерации.
  constructor(element, onGenerate) {
    this.#element = element
    this.#onGenerate = onGenerate
    this.#init()
  }

  // Синхронизирует размеры и количество объектов с открытым уровнем.
  setCurrentLevel(state, {syncDimensions = false} = {}) {
    if (!state?.map?.length) return
    this.#boxCount = Math.max(1, countBoxes(state.map))
    this.#maximumBoxCount = Math.max(this.#boxCount, getCurrentMaximumBoxes(state.map))
    this.#stats = null
    if (syncDimensions) {
      this.#widthInput.value = state.map[0].length
      this.#heightInput.value = state.map.length
    }
    this.#render()
  }

  // Показывает точную статистику и вместимость результата генератора.
  setGenerationStats(stats) {
    this.#stats = stats
    this.#boxCount = stats.boxCount
    this.#maximumBoxCount = stats.maxBoxCount
    this.#render()
  }

  // Создаёт DOM панели и подключает действия пользователя.
  #init() {
    this.#element.innerHTML = createStructureControlsMarkup() + createObjectControlsMarkup()
    this.#cacheElements()
    this.#difficultySelect.value = DEFAULT_DIFFICULTY
    this.#shapeSelect.value = DEFAULT_SHAPE
    this.#bindActions()
    this.#render()
  }

  // Сохраняет ссылки на интерактивные элементы панели.
  #cacheElements() {
    this.#widthInput = this.#element.querySelector('[data-field="width"]')
    this.#heightInput = this.#element.querySelector('[data-field="height"]')
    this.#difficultySelect = this.#element.querySelector('[data-field="difficulty"]')
    this.#shapeSelect = this.#element.querySelector('[data-field="shape"]')
    this.#boxCountOutput = this.#element.querySelector('[data-field="box-count"]')
    this.#statsElement = this.#element.querySelector('[data-field="stats"]')
    this.#removeButton = this.#element.querySelector('[data-action="remove-box"]')
    this.#addButton = this.#element.querySelector('[data-action="add-box"]')
  }

  // Подключает создание структуры и изменение количества ящиков.
  #bindActions() {
    this.#element.querySelector('[data-action="new-structure"]').addEventListener('click', () => this.#generateNewStructure())
    this.#element.querySelector('[data-action="reshuffle"]').addEventListener('click', () => this.#populateCurrentStructure(this.#boxCount))
    this.#removeButton.addEventListener('click', () => this.#populateCurrentStructure(this.#boxCount - 1))
    this.#addButton.addEventListener('click', () => this.#populateCurrentStructure(this.#boxCount + 1))
  }

  // Запрашивает новую геометрию с автоматическим количеством ящиков.
  #generateNewStructure() {
    return this.#run({
      width: Number(this.#widthInput.value),
      height: Number(this.#heightInput.value),
      difficulty: this.#difficultySelect.value,
      shape: this.#shapeSelect.value,
      boxCount: null,
      preserveTopology: false,
    })
  }

  // Переставляет выбранное количество объектов в неизменной геометрии.
  #populateCurrentStructure(boxCount) {
    if (boxCount < 1 || boxCount > this.#maximumBoxCount) return
    return this.#run({difficulty: this.#difficultySelect.value, boxCount, preserveTopology: true})
  }

  // Выполняет одну генерацию и блокирует повторные нажатия до ответа.
  async #run(options) {
    if (this.#isBusy) return
    this.#isBusy = true
    this.#render()
    try {
      const stats = await this.#onGenerate(options)
      if (stats) this.setGenerationStats(stats)
    } finally {
      this.#isBusy = false
      this.#render()
    }
  }

  // Обновляет счётчик, статистику и доступность элементов управления.
  #render() {
    this.#boxCountOutput.value = `${this.#boxCount} / ${this.#maximumBoxCount}`
    this.#statsElement.textContent = formatGenerationStats(this.#stats)
    this.#element.querySelectorAll('button, input, select').forEach((element) => (element.disabled = this.#isBusy))
    this.#removeButton.disabled ||= this.#boxCount <= 1
    this.#addButton.disabled ||= this.#boxCount >= this.#maximumBoxCount
  }
}
