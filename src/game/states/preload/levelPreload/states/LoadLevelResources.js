// [STATE 3] Загрузка всех ресурсов уровня
import {Assets} from 'pixi.js'
import {Logger, MODULES} from '@/game/utils/Logger.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import SpineUtils from '@/game/utils/SpineUtils.js'
import LoadUtils from '@/game/utils/gameUtils/LoadUtils.js'
import Locator from '@/game/engine/Locator.ts'
import {createPreloadList} from '../preloadList.js'
import {GAME_NAME} from '@/game/generatedAssets/buildMeta.js'
import {GAME_NAMES} from '@/game/gameConfig/constants.js'

export default class LoadLevelResources {
  #levelEntity
  #preloadList
  #preloadText
  #isNeedUpdateProgress
  #hudSpriteSheetData
  #spineName = null
  
  constructor(levelEntity, isNeedUpdateProgress = true) {
    this.#levelEntity = levelEntity
    this.#preloadText = levelEntity.view.refs.preloadText
    this.#isNeedUpdateProgress = isNeedUpdateProgress
  }
  
  get hudSpriteSheetData() {
    return this.#hudSpriteSheetData
  }
  
  get getSpineName() {
    return this.#spineName
  }
  
  execute = async (levelIndex) => {
    this.#spineName = null
    
    let attempts = 0
    const maxAttempts = 5
    
    while (attempts < maxAttempts) {
      try {
        this.#preloadList = this.#getPreloadList(levelIndex)
        
        await this.#loadLevelAssets()
        await this.#loadAndParseLevel()
        await this.#loadPinchIfFirstLevel()
        await this.#createHudSpriteSheet()
        await this.#loadSpeech()
        
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
  
  #loadAndParseLevel = async () => {
    const {spineLevelData} = this.#preloadList
    const {spineName, hybridPath} = spineLevelData
    this.#spineName = spineName
    
    this.#updateProgress(40)
    await SpineUtils.loadAndParseSpineAsset({
      spineName,
      folderPath: 'levels/gameLevels',
      basePath: hybridPath,
    })

    Logger.log(MODULES.LevelPreload, 'loadAndParseLevel is loaded')
  }
  
  #loadPinchIfFirstLevel = async () => {
    if (GameUtils.isFirstLevel) {
      this.#updateProgress(44)
      await SpineUtils.loadAndParseSpineAsset({spineName: 'pinch', folderPath: 'spines/pinch'})
      Logger.log(MODULES.LevelPreload, 'pinch is loaded')
      
      
      this.#updateProgress(48)
      
      if (GAME_NAME === GAME_NAMES.hotel) {
        await SpineUtils.loadAndParseSpineAsset({
          spineName: 'intro', folderPath: 'spines/intro'
        })
      }
    }
  }
  
  #createHudSpriteSheet = async () => {
    try {
      const {spineLevelData} = this.#preloadList
      const {hudJson, hudDataName} = spineLevelData

      const atlasPng = Assets.get(hudDataName)
      this.#updateProgress(60)
      const hudIconsJson = await LoadUtils.loadJson(hudJson)

      const hudSpriteSheet = await GameUtils.createSpriteSheet(atlasPng, hudIconsJson, true)
      this.#hudSpriteSheetData = {
        spriteSheet: hudSpriteSheet,
        hudDataName
      }
      
      Logger.log(MODULES.LevelPreload, 'createHudSpriteSheet is loaded')
    } catch (err) {
      console.error('[createHudSpriteSheet]', err)
    }
  }
  
  #loadSpeech = async () => {
    Logger.log(MODULES.LevelPreload, 'loadSpeech start')

    const soundManager = Locator.soundManager
    soundManager.clearSoundList(soundManager.speechList) // todo возможно следует убрать для фоновой загрузки

    const {speechList} = this.#preloadList
    this.#updateProgress(80)
    await soundManager.preload(soundManager.speechList, speechList, true)
    Logger.log(MODULES.LevelPreload, 'speech is loaded')
  }
  
  #getPreloadList = (levelIndex) => {
    return createPreloadList(this.#levelEntity.game, this.#levelEntity.storage, levelIndex)
  }
  
  #updateProgress = (progress) => {
    if (!this.#isNeedUpdateProgress) return
    if (!this.#preloadText) return
    
    const {textLevel, userLevel, textPart, partIndex, textLoading,} = this.#levelEntity.textPreloadData
    
    const preloadText = this.#preloadText
    preloadText.text = `${textLevel} ${userLevel}\n${textPart} ${partIndex}\n${textLoading} ${progress}%`
  }
}
