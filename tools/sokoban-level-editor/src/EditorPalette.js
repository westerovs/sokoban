/**
 * Создаёт режимы и палитры инструментов редактора уровней.
 */

const MODE_TITLES = Object.freeze({
  structure: 'Геометрия', // Режим изменения типа клетки
  objects: 'Объекты', // Режим размещения игрока и ящиков
  appearance: 'Оформление', // Режим замены текстур без изменения правил
})

const STRUCTURE_TOOLS = Object.freeze([
  {tool: 'void', label: 'Пустота', icon: '×'}, // Удаляет игровую клетку
  {tool: 'floor', label: 'Пол', icon: '▦'}, // Создаёт обычный пол
  {tool: 'wall', label: 'Стена', icon: '▧'}, // Создаёт непроходимую стену
  {tool: 'target', label: 'Цель', icon: '●'}, // Создаёт точку назначения ящика
])

const OBJECT_TOOLS = Object.freeze([
  {tool: 'player', label: 'Игрок', icon: '🐱'}, // Перемещает единственного игрока
  {tool: 'box', label: 'Ящик', icon: '▣'}, // Размещает ящик на клетке
  {tool: 'erase', label: 'Убрать объект', icon: '⌫'}, // Удаляет игрока или ящик
])

const DEFAULT_TOOLS = Object.freeze({
  structure: 'wall', // Инструмент геометрии при открытии режима
  objects: 'player', // Инструмент объектов при открытии режима
})

export default class EditorPalette {
  #catalog
  #modeElement
  #onSelect
  #paletteElement
  #selectedButtons = new Map()

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(modeElement, paletteElement, catalog, onSelect) {
    this.#modeElement = modeElement
    this.#paletteElement = paletteElement
    this.#catalog = catalog
    this.#onSelect = onSelect
    this.#init()
  }

  // Выполняет отдельную операцию `selectDefault`.
  selectDefault() {
    this.#selectMode('structure')
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init() {
    Object.keys(MODE_TITLES).forEach((mode) => {
      this.#modeElement.append(this.#createModeButton(mode))
      this.#paletteElement.append(this.#createModePanel(mode))
    })
  }

  // Создаёт данные или представление для операции `createModeButton`.
  #createModeButton(mode) {
    const button = document.createElement('button')
    button.className = 'editor-mode-button'
    button.type = 'button'
    button.dataset.mode = mode
    button.ariaPressed = 'false'
    button.textContent = MODE_TITLES[mode]
    button.addEventListener('click', () => this.#selectMode(mode))
    return button
  }

  // Создаёт данные или представление для операции `createModePanel`.
  #createModePanel(mode) {
    const panel = document.createElement('div')
    panel.className = 'editor-palette__mode'
    panel.dataset.mode = mode
    panel.hidden = true
    if (mode === 'structure') panel.append(this.#createTextSection('Клетки карты', mode, STRUCTURE_TOOLS))
    if (mode === 'objects') panel.append(this.#createTextSection('Содержимое клетки', mode, OBJECT_TOOLS))
    if (mode === 'appearance') this.#fillAppearancePanel(panel)
    return panel
  }

  // Создаёт данные или представление для операции `createTextSection`.
  #createTextSection(titleText, mode, tools) {
    const section = this.#createSection(titleText)
    const tiles = section.querySelector('.editor-palette__tiles')
    tiles.append(...tools.map((tool) => this.#createTextButton(mode, tool)))
    return section
  }

  // Создаёт данные или представление для операции `createSection`.
  #createSection(titleText) {
    const section = document.createElement('section')
    const title = document.createElement('h2')
    const tiles = document.createElement('div')
    section.className = 'editor-palette__section'
    title.className = 'editor-palette__title'
    title.textContent = titleText
    tiles.className = 'editor-palette__tiles'
    section.append(title, tiles)
    return section
  }

  // Создаёт данные или представление для операции `createTextButton`.
  #createTextButton(mode, tool) {
    const button = document.createElement('button')
    const icon = document.createElement('span')
    const label = document.createElement('span')
    button.className = 'editor-tool-button'
    button.type = 'button'
    button.dataset.mode = mode
    button.dataset.tool = tool.tool
    button.ariaPressed = 'false'
    icon.className = 'editor-tool-button__icon'
    icon.textContent = tool.icon
    label.textContent = tool.label
    button.append(icon, label)
    button.addEventListener('click', () => this.#selectBrush(button, {mode, tool: tool.tool, label: tool.label}))
    return button
  }

  // Выполняет отдельную операцию `fillAppearancePanel`.
  #fillAppearancePanel(panel) {
    panel.append(this.#createTextSection('Инструменты', 'appearance', [{tool: 'erase', label: 'Сбросить вид', icon: '⌫'}]))
    Object.entries(this.#catalog.groups).forEach(([role, textures]) => {
      const section = this.#createSection(this.#getRoleTitle(role))
      section.querySelector('.editor-palette__tiles').append(...textures.map((texture) => this.#createTextureButton(role, texture)))
      panel.append(section)
    })
  }

  // Создаёт данные или представление для операции `createTextureButton`.
  #createTextureButton(role, texture) {
    const button = document.createElement('button')
    const image = document.createElement('img')
    button.className = 'editor-tile-button'
    button.type = 'button'
    button.title = `${this.#getRoleTitle(role)} · ${texture}`
    button.dataset.role = role
    button.dataset.texture = texture
    button.ariaPressed = 'false'
    image.src = this.#catalog.sources[role][texture]
    image.alt = texture
    button.append(image)
    this.#addDefaultBadge(button, role, texture)
    button.addEventListener('click', () => this.#selectBrush(button, {mode: 'appearance', role, texture, label: texture}))
    return button
  }

  // Добавляет данные или представление через операцию `addDefaultBadge`.
  #addDefaultBadge(button, role, texture) {
    if (this.#catalog.defaults[role] !== texture) return
    const badge = document.createElement('span')
    badge.className = 'editor-tile-button__default'
    badge.textContent = 'BASE'
    button.append(badge)
  }

  // Выполняет отдельную операцию `selectMode`.
  #selectMode(mode) {
    this.#modeElement.querySelectorAll('button').forEach((button) => (button.ariaPressed = String(button.dataset.mode === mode)))
    this.#paletteElement.querySelectorAll('.editor-palette__mode').forEach((panel) => (panel.hidden = panel.dataset.mode !== mode))
    const selected = this.#selectedButtons.get(mode) ?? this.#getDefaultButton(mode)
    selected?.click()
  }

  // Возвращает данные, за которые отвечает операция `getDefaultButton`.
  #getDefaultButton(mode) {
    const panel = this.#paletteElement.querySelector(`.editor-palette__mode[data-mode="${mode}"]`)
    if (mode === 'appearance') {
      return panel?.querySelector(`[data-role="wall"][data-texture="${this.#catalog.defaults.wall}"]`)
    }
    return panel?.querySelector(`[data-tool="${DEFAULT_TOOLS[mode]}"]`)
  }

  // Выполняет отдельную операцию `selectBrush`.
  #selectBrush(button, brush) {
    const previous = this.#selectedButtons.get(brush.mode)
    if (previous) previous.ariaPressed = 'false'
    button.ariaPressed = 'true'
    this.#selectedButtons.set(brush.mode, button)
    this.#onSelect(brush)
  }

  // Возвращает данные, за которые отвечает операция `getRoleTitle`.
  #getRoleTitle(role) {
    return {wall: 'Стены', floor: 'Пол', box: 'Ящики'}[role]
  }
}
