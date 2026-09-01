export default class LevelNavigation {
  #levelSelect
  #locationSelect
  #locations
  #onSelect

  constructor(locationSelect, levelSelect, locations, onSelect) {
    this.#locationSelect = locationSelect
    this.#levelSelect = levelSelect
    this.#locations = locations
    this.#onSelect = onSelect
    this.#init()
  }

  selectLevel(levelId) {
    const location = this.#locations.find(({levels}) => levels.some((level) => level.id === levelId))
    if (!location) return this.#selectFirstLevel()

    this.#locationSelect.value = location.id
    this.#replaceLevelOptions(location)
    this.#levelSelect.value = levelId
    this.#emitSelectedLevel()
  }

  getSelectedLevel() {
    return this.#getSelectedLocation()?.levels.find(({id}) => id === this.#levelSelect.value) ?? null
  }

  #init() {
    this.#locationSelect.replaceChildren(...this.#locations.map(this.#createLocationOption))
    this.#locationSelect.addEventListener('change', this.#selectFirstLevel)
    this.#levelSelect.addEventListener('change', this.#emitSelectedLevel)
  }

  #selectFirstLevel = () => {
    const location = this.#getSelectedLocation() ?? this.#locations[0]
    if (!location) return this.#onSelect(null)

    this.#locationSelect.value = location.id
    this.#replaceLevelOptions(location)
    this.#emitSelectedLevel()
  }

  #replaceLevelOptions(location) {
    this.#levelSelect.replaceChildren(...location.levels.map(this.#createLevelOption))
  }

  #getSelectedLocation() {
    return this.#locations.find(({id}) => id === this.#locationSelect.value) ?? null
  }

  #emitSelectedLevel = () => {
    this.#onSelect(this.getSelectedLevel())
  }

  #createLocationOption = (location) => {
    const option = document.createElement('option')
    option.value = location.id
    option.textContent = `${location.id} · ${location.titleKey}`
    return option
  }

  #createLevelOption = (level) => {
    const option = document.createElement('option')
    option.value = level.id
    option.textContent = `${level.number}. ${level.id}`
    return option
  }
}
