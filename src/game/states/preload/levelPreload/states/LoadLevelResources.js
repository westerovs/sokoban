import {Assets} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import Logger, {MODULES} from '@/game/utils/Logger.js'
import {createPreloadList} from '../preloadList.js'

// [STATE 3] Загрузка всех ресурсов уровня

export default class LoadLevelResources {
  #levelEntity
  #preloadList
  #preloadText
  #isNeedUpdateProgress

  constructor(levelEntity, isNeedUpdateProgress = true) {
    this.#levelEntity = levelEntity
    this.#preloadText = levelEntity.view.refs.preloadText
    this.#isNeedUpdateProgress = isNeedUpdateProgress
  }

  execute = async (levelIndex) => {
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

  #loadLevelAssets = async () => {
    const {levelList} = this.#preloadList
    const bundleName = 'levelBundle'
    this.#updateProgress(0)
    await Assets.addBundle(bundleName, levelList)

    this.#updateProgress(20)
    await Assets.loadBundle(bundleName)

    Logger.log(MODULES.LevelPreload, 'loadLevelAssets is loaded')
  }

  #getPreloadList = (levelIndex) => {
    return createPreloadList(this.#levelEntity.game, this.#levelEntity.storage, levelIndex)
  }

  #updateProgress = (progress) => {
    if (!this.#isNeedUpdateProgress) return
    if (!this.#preloadText) return

    const {textLevel, userLevel, textPart, partIndex, textLoading} = this.#levelEntity.textPreloadData

    const preloadText = this.#preloadText
    preloadText.text = `${textLevel} ${userLevel}\n${textPart} ${partIndex}\n${textLoading} ${progress}%`
  }
}
