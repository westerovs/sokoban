export default class GameSettings {
  #storage

  constructor(storage) {
    this.#storage = storage
  }

  toggleMusic = () => {
    this.#storage.playerData.option_isPlayMusic = !this.#storage.playerData.option_isPlayMusic
    this.#storage.save()
  }

  toggleSFX = () => {
    this.#storage.playerData.option_isPlaySFX = !this.#storage.playerData.option_isPlaySFX
    this.#storage.save()
  }

  toggleZoom = () => {
    this.#storage.playerData.option_zoom = !this.#storage.playerData.option_zoom
    this.#storage.save()
  }

  toggleSokobanDpad = () => {
    this.#storage.playerData.option_sokobanDpad = !this.#storage.playerData.option_sokobanDpad
    this.#storage.save()
  }
}
