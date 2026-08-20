import {Assets} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {Logger, MODULES} from '@/game/utils/Logger.js'
import {createPreloadList} from '../preloadList.js'

export default class LoadLevelResources {
  #levelEntity
  #preloadText
  #isNeedUpdateProgress
  #preloadList

  constructor(levelEntity, isNeedUpdateProgress = true) {
    this.#levelEntity = levelEntity
    this.#preloadText = levelEntity.view.refs.preloadText
    this.#isNeedUpdateProgress = isNeedUpdateProgress
  }

  execute = async (levelIndex) => {
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      try {
        this.#preloadList = createPreloadList(levelIndex)
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
    const bundleName = 'levelBundle'

    this.#updateProgress(0)
    await Assets.addBundle(bundleName, this.#preloadList.levelList)
    this.#updateProgress(50)
    await Assets.loadBundle(bundleName)

    Logger.log(MODULES.LevelPreload, 'Sokoban background is loaded')
  }

  #updateProgress = (progress) => {
    if (!this.#isNeedUpdateProgress || !this.#preloadText) return

    const {textLevel, userLevel, textPart, partIndex, textLoading} = this.#levelEntity.textPreloadData
    this.#preloadText.text = `${textLevel} ${userLevel}\n${textPart} ${partIndex}\n${textLoading} ${progress}%`
  }
}
