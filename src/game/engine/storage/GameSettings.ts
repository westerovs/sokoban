import type Storage from './Storage.js'

// Изменяет пользовательские настройки, хранящиеся в профиле игрока.

export default class GameSettings {
  #storage: Storage

  // Сохраняет доступ к профилю игрока.
  constructor(storage: Storage) {
    this.#storage = storage
  }

  // Переключает воспроизведение музыки.
  toggleMusic = () => {
    this.#storage.playerData.option_isPlayMusic = !this.#storage.playerData.option_isPlayMusic
    this.#storage.save()
  }

  // Переключает воспроизведение звуковых эффектов.
  toggleSFX = () => {
    this.#storage.playerData.option_isPlaySFX = !this.#storage.playerData.option_isPlaySFX
    this.#storage.save()
  }

  // Переключает масштабирование игрового поля.
  toggleZoom = () => {
    this.#storage.playerData.option_zoom = !this.#storage.playerData.option_zoom
    this.#storage.save()
  }

  // Переключает экранную крестовину Sokoban.
  toggleSokobanDpad = () => {
    this.#storage.playerData.option_sokobanDpad = !this.#storage.playerData.option_sokobanDpad
    this.#storage.save()
  }
}
