const ROLE_TITLES = Object.freeze({
  wall: 'Стены',
  floor: 'Пол',
  box: 'Ящики',
})

export default class EditorPalette {
  #catalog
  #element
  #onSelect
  #selectedButton = null

  constructor(element, catalog, onSelect) {
    this.#element = element
    this.#catalog = catalog
    this.#onSelect = onSelect
    this.#init()
  }

  selectDefault() {
    const buttons = Array.from(this.#element.querySelectorAll('button'))
    buttons.find((button) => button.dataset.texture === this.#catalog.defaults.wall)?.click()
  }

  #init() {
    Object.entries(this.#catalog.groups).forEach(([role, textures]) => {
      this.#element.append(this.#createSection(role, textures))
    })
  }

  #createSection(role, textures) {
    const section = document.createElement('section')
    const title = document.createElement('h2')
    const tiles = document.createElement('div')
    section.className = 'editor-palette__section'
    title.className = 'editor-palette__title'
    title.textContent = ROLE_TITLES[role]
    tiles.className = 'editor-palette__tiles'
    tiles.append(...textures.map((texture) => this.#createButton(role, texture)))
    section.append(title, tiles)
    return section
  }

  #createButton(role, texture) {
    const button = document.createElement('button')
    const image = document.createElement('img')
    button.className = 'editor-tile-button'
    button.type = 'button'
    button.title = `${ROLE_TITLES[role]} · ${texture}`
    button.dataset.role = role
    button.dataset.texture = texture
    button.ariaPressed = 'false'
    image.src = this.#catalog.sources[role][texture]
    image.alt = texture
    button.append(image)
    this.#addDefaultBadge(button, role, texture)
    button.addEventListener('click', () => this.#select(button, {role, texture}))
    return button
  }

  #addDefaultBadge(button, role, texture) {
    if (this.#catalog.defaults[role] !== texture) return

    const badge = document.createElement('span')
    badge.className = 'editor-tile-button__default'
    badge.textContent = 'BASE'
    button.append(badge)
  }

  #select(button, brush) {
    if (this.#selectedButton) this.#selectedButton.ariaPressed = 'false'
    this.#selectedButton = button
    button.ariaPressed = 'true'
    this.#onSelect(brush)
  }
}
