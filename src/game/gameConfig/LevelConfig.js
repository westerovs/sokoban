import Locator from '../engine/Locator.ts'
import ABTest from '../modules/ABTest.js'
import YaMetrika from '../modules/metrika/YaMetrika.js'
import LoadUtils from '../utils/gameUtils/LoadUtils.js'
import {Logger, MODULES} from '../utils/Logger.js'
import {ASSETS_URL} from './constants.js'

export default class LevelConfig {
  #storage = Locator.storage
  #maxSkins = 5
  #config = null
  static maxLevels = 0

  static getMaxLevels() {
    const levels = ABTest.getFilteredLevels()
    return Math.max(Object.keys(levels).length - 1, 0)
  }

  static getLevelNumber = (text) => {
    const match = text?.match(/level(\d+)/)
    return match ? Number(match[1]) : null
  }

  static getGameLevelData = (levelIndex) => {
    const levels = ABTest.getFilteredLevels()
    const maxLevels = LevelConfig.getMaxLevels()
    const safeLevelIndex = Math.min(Math.max(levelIndex, 0), maxLevels)
    const levelData = Object.values(levels)[safeLevelIndex]

    LevelConfig.maxLevels = maxLevels
    if (safeLevelIndex !== levelIndex) {
      Locator.storage.playerData.levelIndex = safeLevelIndex
    }
    if (!levelData) throw new Error(`Sokoban level ${safeLevelIndex} not found`)

    return LevelConfig.#createLevelData(levelData, safeLevelIndex)
  }

  static getSpeechAndTextData = () => ({
    introText: '',
    outroText: '',
    introSpeech: '',
    outroSpeech: '',
  })

  static get levelType() {
    return 'sokoban'
  }

  getConfig = () => {
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

  updateSavedLevel = () => {
    this.#storage.playerData.levelIndex++
    this.#checkAllLevelsComplete()
    this.#storage.save()
  }

  static #createLevelData = (levelData, levelIndex) => {
    const backgroundName = levelData.back ?? `back_lv${levelIndex}`
    const hybridPath = levelData.isRemote ? ASSETS_URL.remote : ASSETS_URL.local

    return {
      ...levelData,
      levelData,
      levelIndex,
      spineName: `level${levelIndex}`,
      levelType: 'sokoban',
      backgroundName,
      background: {
        alias: backgroundName,
        src: LoadUtils.forceFreshCache(`${hybridPath}assets/levels/backgrounds/${backgroundName}.webp`),
      },
    }
  }

  #checkAllLevelsComplete = () => {
    if (this.#storage.playerData.levelIndex <= LevelConfig.maxLevels) return

    Logger.log(MODULES.Config, 'круг всех уровней пройден, увеличиваем скин level')
    this.#storage.playerData.skinIndex++
    this.#storage.playerData.partIndex++

    if (this.#storage.playerData.skinIndex > this.#maxSkins) {
      this.#storage.playerData.skinIndex = 1
      YaMetrika.completeGame()
    }

    this.#storage.playerData.levelIndex = 0
  }

  #log = () => {
    const {levelIndex, skinIndex, partIndex} = this.#storage.playerData

    Logger.log(
      MODULES.Config,
      `
      level: ${this.#config.id}
      levelType: ${this.#config.levelType}
      skinIndex: ${skinIndex}
      partIndex: ${partIndex}
      level index in levels: ${levelIndex}
    `,
    )

    YaMetrika.startLevel(this.#config, this.#storage)
  }
}
