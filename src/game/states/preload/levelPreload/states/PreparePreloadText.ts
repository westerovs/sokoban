import i18next from 'i18next'
import type Storage from '@/game/engine/storage/Storage.js'
import type Game from '@/game/Game.js'
import type LevelPreload from '../LevelPreload.js'
import type {PreloadTextData} from '../preloadTypes.js'

// [STATE 2] Подготавливает локализованные подписи загрузки конкретного уровня.

export default class PreparePreloadText {
  #levelEntity: LevelPreload
  #game: Game
  #storage: Storage
  #textPreloadData: PreloadTextData | null = null

  // Сохраняет состояние загрузки и его зависимости.
  constructor(levelEntity: LevelPreload) {
    this.#levelEntity = levelEntity
    this.#game = levelEntity.game
    this.#storage = levelEntity.storage!
  }

  // Формирует подписи прогресса для выбранного уровня.
  execute = async (_levelIndex: number) => {
    await this.#initTextPreloadData()
  }

  // Возвращает подготовленные подписи загрузки.
  get textPreloadData() {
    return this.#textPreloadData
  }

  // Собирает локализованные значения для текста прогресса.
  #initTextPreloadData = () => {
    // уровень
    const textLevel = i18next.t('level')
    const userLevel = this.#storage.userLevel
    // этап
    const textPart = i18next.t('textLoadingSkinPart')
    const partIndex = this.#getPartIndex()
    // загрузка
    const textLoading = i18next.t('textLoading')

    this.#textPreloadData = {
      textLevel,
      userLevel,
      textPart,
      partIndex,
      textLoading,
    }
  }

  // Возвращает текущую часть прогресса игрока.
  #getPartIndex = () => {
    const {skinIndex, partIndex} = this.#levelEntity.playerData!

    if (partIndex < 5) {
      this.#levelEntity.playerData!.partIndex = skinIndex
    }

    return this.#levelEntity.playerData!.partIndex
  }
}
