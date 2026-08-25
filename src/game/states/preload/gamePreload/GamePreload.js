import {Assets} from 'pixi.js'
import i18next from 'i18next'
import BaseState from '../../BaseState.js'
import {GAME_STATES, PLATFORM_ID} from '../../../gameConfig/constants.js'
import PreloadView from '../PreloadView.js'
import Locator from '@/game/engine/Locator.js'
import {LOG_STATUS, Logger, MODULES} from '../../../utils/Logger.js'
import {createPreloadList} from './preloadList.js'
import GameUtils from '../../../utils/gameUtils/GameUtils.js'
import GameTimeTrackerCounter from '../../../modules/metrika/GameTimeTrackerCounter.js'
import YaMetrika, {ERROR_TYPES} from '../../../modules/metrika/YaMetrika.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'
import SdkManager from '../../../engine/SdkManager.js'
import LocaleManager from '../../../modules/LocaleManager.js'
import AdminPanelButton from '../../../utils/testing/adminPanel/AdminPanelButton.js'
import LoadUtils from '../../../utils/gameUtils/LoadUtils.js'
import DebugInfo from '../../../utils/testing/DebugInfo.js'
import DebugHotkeys from '../../../utils/testing/DebugHotkeys.js'
import LocalStorage from '../../../engine/storage/LocalStorage.js'
import {LIVE_OPS_ID} from '../../../components/liveOpsController/LiveOpsController.js'
import GamePause from '../../../components/GamePause.js'

/*
* Класс предзагружает ресурсы необходимые для показа стартового окна
* + фоном догружает аудио
* */

export default class GamePreload extends BaseState {
  #view
  #preloadText
  #startTime
  #adapter
  #loadAttempts = 0
  #maxLoadAttempts = 3
  
  constructor(game, adapter) {
    super(game)
    
    this.#adapter = adapter
  }
  
  get initEventName() {
    return GAME_STATES.preloadState
  }
  
  async initialize() {
    super.initialize()
    this.#startTime = performance.now()
    
    this.#initView()
    await Locator.gameResize.resize()
    
    const isLoaded = await this.#load()
    if (!isLoaded) return
    
    await this.#startGame()
    this.#postStartActions()
  }
  
  async resize() {
    await this.#view?.resize()
  }
  
  #load = async () => {
    this.#loadAttempts = 0
    
    while (this.#loadAttempts < this.#maxLoadAttempts) {
      try {
        await this.#loadSdkAndLocales(40)
        this.#startLevelConfigurationLoading()
        await this.#loadStorageAndPayments(50)
        
        Locator.liveOps.init()
        await this.#loadGameBundle(60)
        
        this.#setLoggerStatus()
        this.#updateProgressView(80)

        await this.#createUiSpriteSheet()
        this.#updateProgressView(100)
        return true
      } catch (err) {
        const canRetry = await this.#handleLoadError(err)
        if (!canRetry) return false
      }
    }
    
    return false
  }
  
  #handleLoadError = async (err) => {
    console.error('[GamePreload load]', err)
    this.#loadAttempts++
    
    // Показываем статус + ждём задержку, увеличивая её на каждую попытку
    await GameUtils.showTextPreloadAttempts(this.#preloadText, this.#loadAttempts, this.#maxLoadAttempts, err)
    
    if (this.#loadAttempts < this.#maxLoadAttempts) return true
    console.error(`[MODULES.GamePreload] initialize error: ${err}`)
    YaMetrika.preloadError(ERROR_TYPES?.GAME_PRELOAD?.initialize, err)
    
    return false
  }
  
  #loadGameBundle = async (progress) => {
    await Assets.init({manifest: createPreloadList()})
    await Assets.loadBundle('gameScreen')

    this.#updateProgressView(progress)
  }
  
  // load step1
  #loadSdkAndLocales = async (progress) => {
    const sdkPromise = SdkManager.initSdk(this.#adapter)
    const localesPromise = Locator.gameConfig.loadLocalesJson()
    
    await Promise.all([
      sdkPromise,
      localesPromise,
    ])
    
    await LocaleManager.init()
    Locator.gameConfig.locale = LocaleManager.locale
    
    this.#updateProgressView(progress)
  }
  
  // load step2
  #loadStorageAndPayments = async (progress) => {
    await Locator.storage.load()
    await Locator.paymentManager.consumePendingPayments()
    this.#updateProgressView(progress)
  }
  
  // фоновая загрузка, в levelPreload/InitialLoad дожидается, если вдруг не успела загрузиться
  #startLevelConfigurationLoading = () => {
    Locator.gameConfig.loadLevelConfiguration()
      .catch((error) => {
        console.warn('[GamePreload] Фоновая загрузка конфигурации уровня не завершена', error)
      })
  }
  
  #initView = () => {
    this.#view = new PreloadView(this.game)
    this.game.gameContainer.addChild(this.#view)
    this.#updateProgressView(0)
    
    this.isInitialized = true
    Logger.log(MODULES.GamePreload, 'initView')
  }
  
  #updateProgressView = (progress) => {
    const preloadText = this.#view?.refs?.preloadText
    if (!this.#view || !preloadText) return
    
    const isDetectI18text = i18next.t('textLoading') || ''
    const textValue = isDetectI18text ? `${isDetectI18text} ${progress}%` : ''
    
    preloadText.text = `${textValue}`
    preloadText.style.fontFamily = 'BloggerSans'
    this.#preloadText = preloadText
  }
  
  #createUiSpriteSheet = async () => {
    await LoadUtils.loadSpriteSheet({spriteSheetName: 'startScreenUi'})
    
    const isNewYear = Locator.liveOps.isActive(LIVE_OPS_ID.NEW_YEAR)
    if (isNewYear) {
      await LoadUtils.loadSpriteSheet({spriteSheetName: 'newYear'})
    }
    
  }
  
  #setLoggerStatus = () => {
    if (LocalStorage.isDebug && LocalStorage.isLog) {
      LOG_STATUS.IS_DISABLED_LOG = false
    }
  }

  #startGame = async () => {
    this.terminate()
    new AdminPanelButton(this.game, Locator.storage, Locator.gameConfig)
    
    Locator.options.init()
    
    if (SdkManager.flags?.skipFirstScreen) {
      this.game.emit(GAME_STATES.levelPreload)
      return
    }
    
    this.game.emit(this.game.stateAfterPreload)
  }
  
  #showAd = () => {
    if (SdkManager.isPlatform(PLATFORM_ID.cg)) return
    if (SdkManager.flags?.noPreroll || GameUtils.isFirstLevel) return
    if (!Locator.storage.playerData.hasAdPass) SdkManager.showInterstitial()
  }
  
  terminate() {
    this.game.emit(GAME_EVENTS.clearLevel)
    
    this.#view.destroy({children: true})
    this.#view = null
    
    this.isInitialized = false
  }
  
  #postStartActions = () => {
    const loadDuration = GameUtils.checkLoadTime(this.#startTime, 'sdk + game loaded in')
    YaMetrika.loadDuration(loadDuration)
    
    Assets.backgroundLoadBundle(['secondaryFont'])
    Locator.soundManager.init()
    Locator.soundManager.preloadSFXF() // фоновая загрузка SFX
    
    new GameTimeTrackerCounter()

    if (LocalStorage.isDebug) {
      new DebugInfo(this.game)
      new DebugHotkeys()
      // new TestSoundButton()
    }
    
    Logger.log(MODULES.SDK, 'flags', SdkManager.flags)
    
    this.#initGamePause()
    this.#showAd()
  }
  
  #initGamePause = () => {
    new GamePause()
  }
}
