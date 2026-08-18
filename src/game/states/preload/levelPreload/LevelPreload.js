import {Assets} from 'pixi.js'
import BaseState from '@/game/states/BaseState.js'
import {GAME_STATES, PLATFORM_ID} from '@/game/gameConfig/constants.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import Locator from '@/game/engine/Locator.ts'
import {Logger, MODULES} from '@/game/utils/Logger.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import TestController from '@/game/utils/testing/autotest/TestController.js'
// states
import InitialLoad from './states/InitialLoad.js'
import PreparePreloadText from './states/PreparePreloadText.js'
import LoadLevelResources from './states/LoadLevelResources.js'
import Finalize from './states/Finalize.js'
import LevelConfig from '@/game/gameConfig/LevelConfig.js'
import LocalStorage from '@/game/engine/storage/LocalStorage.js'
import SdkManager from '@/game/engine/SdkManager.js'

let spineName = null
let isFirstInit = false

export default class LevelPreload extends BaseState {
  view
  storage
  playerData
  levelIndex
  textPreloadData
  #sfxIsLoaded = false
  #loadResourcesState
  
  get initEventName() {
    return GAME_STATES.levelPreload
  }
  
  async initialize() {
    super.initialize()
    
    SdkManager.gameplayStop()
    
    this.storage = Locator.storage
    this.levelIndex = this.storage.playerData.levelIndex
    this.playerData = this.storage.playerData
    this.game.clearLevelCache = this.clearLevelCache
    const startTime = performance.now()
    
    const adPromise = this.#maybeShowAd()
    
    // prepare
    await this.#runInitializeState()
    spineName = LevelConfig.getGameLevelData(this.levelIndex).spineName
    await Locator.gameResize.resize()
    await this.#runPreparePreloadText()
    // level load
    await this.#runLoadLevelResources(this.levelIndex)
    this.#postLoadLazySFX()

    // ждём окончания рекламы
    await adPromise
    
    if (LocalStorage.testLoad) {
      await this.#testing()
      return
    }
    
    await this.#checkoutState(startTime)
  }
  
  resize() {
    this.view.resize()
  }
  
  terminate() {
    this.game.emit(GAME_EVENTS.clearLevel)
    this.isInitialized = false
    
    this.view.destroy({children: true})
    this.view = null
    this.storage = null
    this.playerData = null
    this.levelIndex = null
    this.textPreloadData = null
  }
  
  #maybeShowAd = () => {
    if (!isFirstInit) {
      isFirstInit = true
      return
    }
    
    let resolveAD
    
    const adPromise = new Promise((resolve) => {
      resolveAD = resolve
    })
    
    // Платформа VK — пропуск рекламы
    if (SdkManager.isPlatform(PLATFORM_ID.vk)) {
      Logger.log(MODULES.LevelPreload, '[flag vk], blocking showAd')
      resolveAD(true)
      return adPromise
    }
    
    if (GameUtils.skipAdInFirstLevel(this.levelIndex)) {
      Logger.warn('', 'первый уровень, не показываем рекламу!')
      resolveAD(true)
      return adPromise
    }
    
    // Нет AdPass — показываем рекламу
    const hasAdPass = this.storage.playerData.hasAdPass
    if (!hasAdPass) {
      SdkManager.showInterstitial({
        onFinally: () => resolveAD(true)
      })
      return adPromise
    }
    
    // По умолчанию пропускаем
    resolveAD(true)
    return adPromise
  }
  
  #runInitializeState = async () => {
    const initialState = new InitialLoad(this)
    initialState.initView()
    this.view = initialState.view
    await initialState.execute()
    
    this.isInitialized = true
  }
  
  #runPreparePreloadText = async () => {
    const prepareState = new PreparePreloadText(this)
    await prepareState.execute(this.levelIndex)
    this.textPreloadData = prepareState.textPreloadData
  }
  
  #runLoadLevelResources = async (levelIndex) => {
    this.#loadResourcesState = new LoadLevelResources(this,true)
    await this.#loadResourcesState.execute(levelIndex)
  }
  
  #checkoutState = async (startTime) => {
    super.checkoutState()
    GameUtils.checkLoadTime(startTime, `level ${this.levelIndex} loaded in`)
    
    const finalizeState = new Finalize(this)
    await finalizeState.startGame()
  }
  
  // todo при первом запуске получать spineName
  clearLevelCache = async () => {
    if (!spineName) return
    
    Logger.log(MODULES.LevelPreload, '-------- clearLevel Cache', spineName)
    
    return new Promise(async resolve => {
      try {
        // выгружает содержимое preloadList
        await Assets.unloadBundle('levelBundle')
        await Assets.unloadBundle('levelBundle_2')
        
        // spineLevel
        await Assets.unload(`${spineName}.spineData`) // spine
        await Assets.unload(`${spineName}`) // background
        await Assets.unload(`${spineName}_2`) // background_2
        
        const {levelIndex, skinIndex} = Locator.storage.playerData
        
        if (levelIndex === 1 && skinIndex === 1) {
          Assets.cache.remove('intro.spineData')
          await Assets.unload('intro.spineData') // spine
          await Assets.unload('intro') // spriteSheet
        }
        try {
          const {spriteSheet} = this.#loadResourcesState.hudSpriteSheetData
          spriteSheet.destroy(true)
        } catch (err) {
          console.log('[hudSpriteSheet destroy]', err)
        }

        // Очистка аудио ресурсов, если используется soundManager
        const soundManager = Locator.soundManager
        soundManager.clearSoundList(soundManager.speechList)
        
        resolve()
      } catch (err) {
        console.error('[clearLevel Cache]', err)
      }
    })
  }
  
  #postLoadLazySFX = async () => {
    if (this.#sfxIsLoaded) return
    await Locator.soundManager.preloadSFXFLevel() // фоновая загрузка SFX
    this.#sfxIsLoaded = true
  }
  
  #testing = async () => {
    try {
      new TestController(this)
    } catch (err) {
      console.error('[LevelPreload] testing error!', err)
      LocalStorage.testLoad = false
      Locator.storage.save()
    }
  }
}
