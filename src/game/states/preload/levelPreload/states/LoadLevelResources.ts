import {Assets, Text} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import Logger, {MODULES} from '@/game/utils/Logger.js'
import type LevelPreload from '../LevelPreload.js'
import {createPreloadList} from '../preloadList.js'
import type {LevelPreloadList} from '../preloadTypes.js'

// [STATE 3] Загрузка всех ресурсов уровня

export default class LoadLevelResources {
  #levelEntity: LevelPreload
  #preloadList: LevelPreloadList | null = null
  #preloadText: Text | null
  #isNeedUpdateProgress: boolean

  // Сохраняет состояние загрузки и настройку отображения прогресса.
  constructor(levelEntity: LevelPreload, isNeedUpdateProgress = true) {
    this.#levelEntity = levelEntity
    this.#preloadText = levelEntity.view?.refs.preloadText ?? null
    this.#isNeedUpdateProgress = isNeedUpdateProgress
  }

  // Загружает ресурсы уровня с ограниченным числом повторов.
  execute = async (levelIndex: number) => {
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        this.#preloadList = this.#getPreloadList(levelIndex)
        await this.#loadLevelAssets()

        this.#updateProgress(100)
        break
      } catch (err) {
        attempts++
        await GameUtils.showTextPreloadAttempts(this.#preloadText, attempts, maxAttempts, err)
      }
    }
  }

  // Создаёт и загружает PixiJS-набор ресурсов уровня.
  #loadLevelAssets = async () => {
    const {levelList} = this.#preloadList!
    const bundleName = 'levelBundle'
    this.#updateProgress(0)
    await Assets.addBundle(bundleName, levelList)

    this.#updateProgress(20)
    await Assets.loadBundle(bundleName)

    Logger.log(MODULES.LevelPreload, 'loadLevelAssets is loaded')
  }

  // Формирует список ресурсов выбранного уровня.
  #getPreloadList = (levelIndex: number) => {
    return createPreloadList(this.#levelEntity.game, this.#levelEntity.storage!, levelIndex)
  }

  // Обновляет локализованный текст прогресса загрузки уровня.
  #updateProgress = (progress: number) => {
    if (!this.#isNeedUpdateProgress) return
    if (!this.#preloadText) return

    const {textLevel, userLevel, textPart, partIndex, textLoading} = this.#levelEntity.textPreloadData!

    const preloadText = this.#preloadText
    preloadText.text = `${textLevel} ${userLevel}\n${textPart} ${partIndex}\n${textLoading} ${progress}%`
  }
}
