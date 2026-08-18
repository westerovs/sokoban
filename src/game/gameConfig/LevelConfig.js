import Locator from '../engine/Locator.ts'
import {ASSETS_URL, GAME_NAMES} from './constants.js'
import YaMetrika from '../modules/metrika/YaMetrika.js'
import {Logger, MODULES} from '../utils/Logger.js'
import GameUtils from '../utils/gameUtils/GameUtils.js'
import ABTest from '../modules/ABTest.js'
import LoadUtils from '../utils/gameUtils/LoadUtils.js'

const PART_NAMES = {
  hogItems: 'hogItems',
  hogItems2: 'hogItems2',
}

/*
* hybridPath - задаётся при сборке. Нужен для разделения путей динамической загрузки.
* Загрузка может быть как из папки архива, так и по ссылке с облака
*
* folderPath - используется как относительная ссылка внутри папки assets.
* Необходима для точечной загрузки ассетов, например новогодние ассеты могут лежать отдельно
*
* */

export default class LevelConfig {
  #storage = Locator.storage
  #maxSkins = 5
  #config = null
  static maxLevels
  static levelJsonNumber = null
  static spineName = null
  
  static getMaxLevels() {
    const levels = ABTest.getFilteredLevels()
    return Object.keys(levels).length - 1
  }
  
  // извлекает номер уровня из строки, если она содержит шаблон level10 -> 10
  static getLevelNumber = (text) => {
    const match = text.match(/level(\d+)/)
    return match ? Number(match[1]) : null
  }
  
  // todo в этом месте стоит хранить вообще всё что нужно для уровня. Сейчас тут нет звуков речи и стори текстов
  static getGameLevelData =  (levelIndex) => {
    const levels = ABTest.getFilteredLevels()
    const maxLevels = Object.keys(levels).length - 1
    LevelConfig.maxLevels = maxLevels
    
    // Если уровень игрока выше чем число доступных уровней, ставим игроку последний уровень из возможных
    if (levelIndex > maxLevels) {
      Locator.storage.playerData.levelIndex = maxLevels
      levelIndex = maxLevels
    }
    
    const levelData = Object.values(levels)[levelIndex]
    const {spineName, amb, music} = levelData
    
    const levelJsonNumber = LevelConfig.getLevelNumber(spineName)
    LevelConfig.levelJsonNumber = levelJsonNumber
    LevelConfig.spineName = spineName
    
    const backgroundName = (levelData?.back) ? levelData.back : `back_lv${levelJsonNumber}`
    const hudDataName = `hudData-${levelJsonNumber}`
    
    let hybridPath = ASSETS_URL.local
    if (levelData.isRemote) hybridPath = ASSETS_URL.remote
    
    return {
      hybridPath,
      amb,
      music,
      levelData,
      levelJsonNumber,
      
      // background
      backgroundName,
      background: {alias: backgroundName, src: LoadUtils.forceFreshCache(`${hybridPath}assets/levels/backgrounds/${backgroundName}.webp`)},
      // spine
      spineName,
      levelType: GameUtils.extractSuffix(spineName),
      
      levelAtlas: `${hybridPath}assets/levels/gameLevels/${spineName}.atlas`,
      levelJson: `${hybridPath}assets/levels/gameLevels/${spineName}.json`,
      levelSpriteSheet: {alias: `${spineName}`, src: `${hybridPath}assets/levels/gameLevels/${spineName}.webp`},
      
      // hud
      hudDataName,
      hudJson: `${hybridPath}assets/levels/hud/${hudDataName}.json`,
      hudSpriteSheet: {alias: hudDataName, src: LoadUtils.forceFreshCache(`${hybridPath}assets/levels/hud/${hudDataName}.png`)},
    }
  }
  
  static getSpeechAndTextData = () => {
    const {skinIndex, levelIndex} = Locator.storage.playerData
    const levelJsonNumber = LevelConfig.levelJsonNumber
    
    // добавляет разнообразие, если в игре только 2 аудиодорожки
    let storyIndex = (skinIndex % 2) ? 0 : 1 // если четный индекс, то 0
    
    // последовательно идёт история 0->1->2->3 и тд
    if (GAME_NAMES.currentName === GAME_NAMES.hotel) storyIndex = skinIndex - 1
    // в детективе нет разнообразия, поэтому всегда 0 индекс
    if (GAME_NAMES.currentName === GAME_NAMES.detective) storyIndex = 0
    
    // в приключениях блокируем повтор истории на первом уровне, всегда отдаём второй элемент аудио
    if (GAME_NAMES.currentName === GAME_NAMES.adventure) {
      if (levelIndex === 0 && skinIndex > 1) storyIndex = 1
    }
    
    try {
      const storyText = Locator.gameConfig.storyText[`lv${levelJsonNumber}`]
      const introText = storyText.intro.text[storyIndex].trim()
      const outroText = storyText.outro.text[storyIndex].trim()
      const introSpeech = storyText.intro.speech[storyIndex].trim()
      const outroSpeech = storyText.outro.speech[storyIndex].trim()
      
      return {
        introText,
        outroText,
        introSpeech,
        outroSpeech,
      }
    } catch (err) {
      console.error('[getSpeechAndTextData]', err)
      return {}
    }
  }
  
  static get levelType() {
    return GameUtils.extractSuffix(LevelConfig.spineName)
  }
  
  getConfig = () => {
    const {levelIndex, skinIndex} = this.#storage.playerData
    const {spineName, amb, backgroundName} = LevelConfig.getGameLevelData(levelIndex)
    
    const validateSkinIndex = this.#validateSkinIndex(skinIndex)
    
    this.#config = {
      spineName: spineName,
      bgTexture: backgroundName,
      levelParts: Object.values(PART_NAMES),
      hogItemsBone: null, // нужно вычислять динамически
      currentSkinName: `mode1/skin_mode1_v${validateSkinIndex}`,
      amb,
      levelType: GameUtils.extractSuffix(spineName),
    }
    
    this.#log(amb)
    return this.#config
  }
  
  #validateSkinIndex = (skinIndex) => {
    if (skinIndex === 0) return 1
    if (skinIndex > 5) return 5
    if (skinIndex < 0) return 1
    return skinIndex
  }
  
  updateSavedLevel = () => {
    const currentLevel = this.#storage.playerData.levelIndex
    this.#storage.playerData.levelIndex = currentLevel + 1
    
    this.#checkAllLevelsComplete()
    this.#storage.save()
  }
  
  #checkAllLevelsComplete = () => {
    const {levelIndex} = this.#storage.playerData
    
    // если прошли все уровни, увеличиваем скин
    if (levelIndex > LevelConfig.maxLevels) {
      Logger.log(MODULES.Config, 'круг всех уровней пройден, увеличиваем скин level')
      this.#storage.playerData.skinIndex++
      this.#storage.playerData.partIndex++
      
      // если прошли все скины, обнуляем skinIndex
      if (this.#storage.playerData.skinIndex > this.#maxSkins) {
        Logger.log(MODULES.Config, 'круг всех скинов завершен, сброс скинов')
        this.#storage.playerData.skinIndex = 1
        YaMetrika.completeGame()
      }
      
      this.#storage.playerData.levelIndex = 0
    }
  }
  
  #log = (amb) => {
    const {levelIndex, skinIndex, partIndex} = this.#storage.playerData
    
    Logger.log(MODULES.Config, `
      spineName: ${this.#config?.spineName} / skin${skinIndex}
      levelType: ${GameUtils.extractSuffix(this.#config?.spineName)}
      partIndex: ${partIndex}
      amb: ${amb}
      level index in levels: ${levelIndex}
    `,)
    
    YaMetrika.startLevel(this.#config, this.#storage)
  }
}
