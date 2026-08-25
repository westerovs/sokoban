import Locator from '../engine/Locator.ts'
import ABTest from '../modules/ABTest.js'
import YaMetrika from '../modules/metrika/YaMetrika.js'
import LoadUtils from '../utils/gameUtils/LoadUtils.js'
import {Logger, MODULES} from '../utils/Logger.js'
import {ASSETS_URL} from './constants.js'

export default class LevelConfig {
  #storage = Locator.storage
  #config = null
  static maxLevels = 0

  static getMaxLevels() {
    const levels = ABTest.getFilteredLevels()
    return Math.max(Object.keys(levels).length - 1, 0)
  }

  static getGameLevelData(levelIndex) {
    const levels = ABTest.getFilteredLevels()
    const maxLevels = LevelConfig.getMaxLevels()
    const safeLevelIndex = Math.min(Math.max(levelIndex, 0), maxLevels)
    const levelData = Object.values(levels)[safeLevelIndex]

    LevelConfig.maxLevels = maxLevels
    if (!levelData) throw new Error('Sokoban level ' + safeLevelIndex + ' not found')
    if (safeLevelIndex !== levelIndex) Locator.storage.playerData.levelIndex = safeLevelIndex

    return LevelConfig.#createLevelData(levelData, safeLevelIndex)
  }

  static get levelType() {
    return 'sokoban'
  }

  getConfig() {
    const {levelIndex} = this.#storage.playerData
    const levelData = LevelConfig.getGameLevelData(levelIndex)

    this.#config = {
      ...levelData,
      bgTexture: levelData.backgroundName,
      currentSkinName: 'sokoban',
    }

    this.#log()
    return this.#config
  }

  updateSavedLevel() {
    const nextLevelIndex = this.#storage.playerData.levelIndex + 1

    if (nextLevelIndex > LevelConfig.maxLevels) {
      this.#completeLevelsCycle()
    } else {
      this.#storage.playerData.levelIndex = nextLevelIndex
    }

    this.#storage.save()
  }

  static #createLevelData(levelData, levelIndex) {
    const backgroundName = levelData.back ?? 'back_lv' + levelIndex
    const hybridPath = levelData.isRemote ? ASSETS_URL.remote : ASSETS_URL.local

    return {
      ...levelData,
      levelData,
      levelIndex,
      levelType: 'sokoban',
      backgroundName,
      background: {
        alias: backgroundName,
        src: LoadUtils.forceFreshCache(hybridPath + 'assets/levels/backgrounds/' + backgroundName + '.webp'),
      },
    }
  }

  #completeLevelsCycle() {
    Logger.log(MODULES.Config, 'круг всех уровней Sokoban пройден')
    this.#storage.playerData.levelIndex = 0
    YaMetrika.completeGame()
  }

  #log() {
    const {levelIndex} = this.#storage.playerData

    Logger.log(
      MODULES.Config,
      '\n      level: ' + this.#config.id
      + '\n      levelType: ' + this.#config.levelType
      + '\n      level index in levels: ' + levelIndex + '\n    ',
    )

    YaMetrika.startLevel(this.#config, this.#storage)
  }
}
