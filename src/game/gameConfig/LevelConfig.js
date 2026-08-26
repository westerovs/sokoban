import Locator from '../engine/Locator.ts'
import YaMetrika from '../modules/metrika/YaMetrika.js'
import LoadUtils from '../utils/gameUtils/LoadUtils.js'
import {Logger, MODULES} from '../utils/Logger.js'
import {ASSETS_URL} from './constants.js'
import LevelProgress from './LevelProgress.js'
import {getLevelEntries, getLevelEntryByIndex} from './locationCatalog.js'

export default class LevelConfig {
  #storage = Locator.storage
  #config = null
  static maxLevels = 0

  static getMaxLevels() {
    return Math.max(getLevelEntries().length - 1, 0)
  }

  static getGameLevelData(levelIndex) {
    const maxLevels = LevelConfig.getMaxLevels()
    const safeLevelIndex = Math.min(Math.max(levelIndex, 0), maxLevels)
    const entry = getLevelEntryByIndex(safeLevelIndex)

    LevelConfig.maxLevels = maxLevels
    if (!entry) throw new Error('Sokoban level ' + safeLevelIndex + ' not found')
    if (safeLevelIndex !== levelIndex) Locator.storage.playerData.levelIndex = safeLevelIndex

    return LevelConfig.#createLevelData(entry)
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
    const progress = new LevelProgress(this.#storage)
    const result = progress.completeLevel(this.#config.id)

    if (result.isGameCompleted && result.isFirstCompletion) this.#completeGame()
    return result
  }

  static #createLevelData(entry) {
    const {globalIndex, level, location, locationIndex, locationLevelIndex} = entry
    const hybridPath = level.isRemote ? ASSETS_URL.remote : ASSETS_URL.local

    return {
      ...level,
      levelData: level,
      levelIndex: globalIndex,
      locationId: location.id,
      locationIndex,
      locationLevelIndex,
      locationLevelNumber: locationLevelIndex + 1,
      locationTitleKey: location.titleKey,
      levelType: 'sokoban',
      amb: location.ambience,
      music: location.music,
      backgroundName: location.background,
      background: {
        alias: location.background,
        src: LoadUtils.forceFreshCache(hybridPath + 'assets/levels/backgrounds/' + location.background + '.webp'),
      },
    }
  }

  #completeGame() {
    Logger.log(MODULES.Config, 'все уровни Sokoban пройдены')
    YaMetrika.completeGame()
  }

  #log() {
    const {levelIndex} = this.#storage.playerData

    Logger.log(
      MODULES.Config,
      '\n      level: ' +
        this.#config.id +
        '\n      levelType: ' +
        this.#config.levelType +
        '\n      level index in levels: ' +
        levelIndex +
        '\n    ',
    )

    YaMetrika.startLevel(this.#config, this.#storage)
  }
}
