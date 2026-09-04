import type {EditorBrush} from './editorTypes.js'

/**
 * Создаёт прямые палитры стен, декора, ящиков, пола и целей вместе с общими инструментами.
 */

const MODE_CONFIG = Object.freeze([
  {role: 'wall', title: 'Стены', shortcut: '1'}, // Первая вкладка прямого размещения стен
  {role: 'decor', title: 'Декор', shortcut: '2'}, // Вторая вкладка прямого размещения декоративных стен
  {role: 'box', title: 'Ящики', shortcut: '3'}, // Третья вкладка прямого размещения ящиков
  {role: 'floor', title: 'Пол', shortcut: '4'}, // Четвёртая вкладка прямого размещения пола
  {role: 'target', title: 'Цели', shortcut: '5'}, // Пятая вкладка прямого размещения целей
])

const UTILITY_TOOLS = Object.freeze([
  {mode: 'player', label: 'Игрок', icon: '🐱'}, // Перемещает единственного игрока
  {mode: 'void', label: 'Пустота', icon: '×'}, // Полностью очищает выбранную клетку
])

type ModeConfig = (typeof MODE_CONFIG)[number]
type UtilityTool = (typeof UTILITY_TOOLS)[number]

export default class EditorPalette {
  #catalog: any
  #modeElement: HTMLElement
  #onSelect: (brush: EditorBrush) => void
  #paletteElement: HTMLElement
  #selectedButtons = new Map<string, HTMLButtonElement>()
  #utilityElement: HTMLElement

  // Создаёт палитру и сохраняет её DOM-зависимости.
  constructor(
    utilityElement: HTMLElement,
    modeElement: HTMLElement,
    paletteElement: HTMLElement,
    catalog: any,
    onSelect: (brush: EditorBrush) => void,
  ) {
    this.#utilityElement = utilityElement
    this.#modeElement = modeElement
    this.#paletteElement = paletteElement
    this.#catalog = catalog
    this.#onSelect = onSelect
    this.#init()
  }

  // Выбирает стену по умолчанию после открытия редактора.
  selectDefault() {
    this.#selectMode('wall')
  }

  // Переключает палитру по цифровой горячей клавише.
  selectModeByShortcut(shortcut: string) {
    const config = MODE_CONFIG.find((item) => item.shortcut === shortcut)
    if (config) this.#selectMode(config.role)
  }

  // Создаёт общие инструменты, вкладки и панели текстур.
  #init() {
    this.#utilityElement.append(this.#createUtilitySection())
    MODE_CONFIG.forEach((config) => {
      this.#modeElement.append(this.#createModeButton(config))
      this.#paletteElement.append(this.#createModePanel(config))
    })
  }

  // Создаёт отдельный верхний блок игрока и пустоты.
  #createUtilitySection() {
    const section = this.#createSection('Игрок и очистка')
    const tiles = section.querySelector<HTMLElement>('.editor-palette__tiles')
    if (!tiles) throw new Error('[EditorPalette]: utility tiles are missing')
    tiles.append(...UTILITY_TOOLS.map((tool) => this.#createUtilityButton(tool)))
    return section
  }

  // Создаёт кнопку переключения одной прямой палитры.
  #createModeButton(config: ModeConfig) {
    const button = document.createElement('button')
    button.className = 'editor-mode-button'
    button.type = 'button'
    button.dataset.mode = config.role
    button.ariaPressed = 'false'
    button.title = `Горячая клавиша: ${config.shortcut}`
    button.textContent = config.title
    button.addEventListener('click', () => this.#selectMode(config.role))
    return button
  }

  // Создаёт панель настоящих текстур одной роли.
  #createModePanel(config: ModeConfig) {
    const panel = document.createElement('div')
    const section = this.#createSection(config.title)
    const tiles = section.querySelector<HTMLElement>('.editor-palette__tiles')
    if (!tiles) throw new Error('[EditorPalette]: mode tiles are missing')
    panel.className = 'editor-palette__mode'
    panel.dataset.mode = config.role
    panel.hidden = true
    tiles.append(...this.#catalog.groups[config.role].map((texture: string) => this.#createTextureButton(config, texture)))
    panel.append(section)
    return panel
  }

  // Создаёт секцию палитры с заголовком и сеткой кнопок.
  #createSection(titleText: string) {
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

  // Создаёт текстовую кнопку общего инструмента.
  #createUtilityButton(tool: UtilityTool) {
    const button = document.createElement('button')
    const icon = document.createElement('span')
    const label = document.createElement('span')
    button.className = 'editor-tool-button'
    button.type = 'button'
    button.dataset.tool = tool.mode
    button.ariaPressed = 'false'
    icon.className = 'editor-tool-button__icon'
    icon.textContent = tool.icon
    label.textContent = tool.label
    button.append(icon, label)
    button.addEventListener('click', () => this.#selectBrush(button, tool))
    return button
  }

  // Создаёт кнопку настоящей текстуры с прямой кистью размещения.
  #createTextureButton(config: ModeConfig, texture: string) {
    const button = document.createElement('button')
    const image = document.createElement('img')
    button.className = 'editor-tile-button'
    button.type = 'button'
    button.title = `${config.title} · ${texture}`
    button.dataset.role = config.role
    button.dataset.texture = texture
    button.ariaPressed = 'false'
    image.src = this.#catalog.sources[config.role][texture]
    image.alt = texture
    button.append(image)
    this.#addDefaultBadge(button, config.role, texture)
    button.addEventListener('click', () =>
      this.#selectBrush(button, {
        mode: 'tile',
        role: config.role,
        texture,
        label: `${config.title} · ${texture}`,
      }),
    )
    return button
  }

  // Отмечает текстуру, используемую игрой по умолчанию.
  #addDefaultBadge(button: HTMLButtonElement, role: string, texture: string) {
    if (this.#catalog.defaults[role] !== texture) return
    const badge = document.createElement('span')
    badge.className = 'editor-tile-button__default'
    badge.textContent = 'BASE'
    button.append(badge)
  }

  // Показывает нужную вкладку и восстанавливает её последнюю кисть.
  #selectMode(role: string) {
    this.#modeElement
      .querySelectorAll<HTMLButtonElement>('button')
      .forEach((button) => (button.ariaPressed = String(button.dataset.mode === role)))
    this.#paletteElement
      .querySelectorAll<HTMLElement>('.editor-palette__mode')
      .forEach((panel) => (panel.hidden = panel.dataset.mode !== role))
    const selected = this.#selectedButtons.get(role) ?? this.#getDefaultButton(role)
    selected?.click()
  }

  // Возвращает кнопку основной текстуры выбранной роли.
  #getDefaultButton(role: string) {
    return this.#paletteElement.querySelector<HTMLButtonElement>(`[data-role="${role}"][data-texture="${this.#catalog.defaults[role]}"]`)
  }

  // Делает кнопку единственной активной кистью и сообщает о выборе.
  #selectBrush(button: HTMLButtonElement, brush: EditorBrush) {
    this.#utilityElement.querySelectorAll<HTMLButtonElement>('button').forEach((item) => (item.ariaPressed = 'false'))
    this.#paletteElement.querySelectorAll<HTMLButtonElement>('button').forEach((item) => (item.ariaPressed = 'false'))
    button.ariaPressed = 'true'
    if (brush.role) this.#selectedButtons.set(brush.role, button)
    this.#onSelect(brush)
  }
}
