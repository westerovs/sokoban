import {Assets} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import LocalStorage from '@/game/engine/storage/LocalStorage.js'
import {GAME_STATES, PLATFORM_ID} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import BaseState from '@/game/states/BaseState.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {Logger, MODULES} from '@/game/utils/Logger.js'
import Finalize from './states/Finalize.js'
import InitialLoad from './states/InitialLoad.js'
import LoadLevelResources from './states/LoadLevelResources.js'
import PreparePreloadText from './states/PreparePreloadText.js'

let isFirstInit = false

export default class LevelPreload extends BaseState {
  #sfxIsLoaded = false
  view
  storage
  playerData
  levelIndex
  textPreloadData

  get initEventName() {
    return GAME_STATES.levelPreload
  }

  async initialize() {
    super.initialize()
    SdkManager.gameplayStop()
    this.#initLevelData()

    const startTime = performance.now()
    const adPromise = this.#maybeShowAd()

    await this.#runInitializeState()
    await this.#runPreparePreloadText()
    await this.#runLoadLevelResources()
    this.#postLoadLazySFX()
    await adPromise

    if (LocalStorage.testLoad) {
      await this.#testing()
      return
    }

    await this.#checkoutState(startTime)
  }

  clearLevelCache = async () => {
    Logger.log(MODULES.LevelPreload, 'очистка кэша уровня Sokoban')

    try {
      await Assets.unloadBundle('levelBundle')
    } catch (err) {
      console.error('[clearLevel Cache]', err)
    }
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

  #initLevelData() {
    this.storage = Locator.storage
    this.levelIndex = this.storage.playerData.levelIndex
    this.playerData = this.storage.playerData
    this.game.clearLevelCache = this.clearLevelCache
  }

  #maybeShowAd() {
    if (!isFirstInit) {
      isFirstInit = true
      return
    }

    return new Promise((resolve) => {
      this.#showAdOrResolve(resolve)
    })
  }

  #showAdOrResolve(resolve) {
    if (SdkManager.isPlatform(PLATFORM_ID.vk)) {
      Logger.log(MODULES.LevelPreload, '[flag vk], blocking showAd')
      resolve(true)
      return
    }

    if (GameUtils.skipAdInFirstLevel(this.levelIndex)) {
      Logger.warn('', 'первый уровень, не показываем рекламу!')
      resolve(true)
      return
    }

    if (!this.storage.playerData.hasAdPass) {
      SdkManager.showInterstitial({onFinally: () => resolve(true)})
      return
    }

    resolve(true)
  }

  async #runInitializeState() {
    const initialState = new InitialLoad(this)
    initialState.initView()
    this.view = initialState.view
    await initialState.execute()
    this.isInitialized = true
  }

  async #runPreparePreloadText() {
    const prepareState = new PreparePreloadText(this)
    await prepareState.execute(this.levelIndex)
    this.textPreloadData = prepareState.textPreloadData
    await Locator.gameResize.resize()
  }

  async #runLoadLevelResources() {
    const loadResourcesState = new LoadLevelResources(this, true)
    await loadResourcesState.execute(this.levelIndex)
  }

  async #checkoutState(startTime) {
    super.checkoutState()
    GameUtils.checkLoadTime(startTime, 'level ' + this.levelIndex + ' loaded in')

    const finalizeState = new Finalize(this)
    await finalizeState.startGame()
  }

  async #postLoadLazySFX() {
    if (this.#sfxIsLoaded) return
    await Locator.soundManager.preloadSFXFLevel()
    this.#sfxIsLoaded = true
  }

  async #testing() {
    try {
      console.log('тут может быть запуск тестирования')
    } catch (err) {
      console.error('[LevelPreload] testing error!', err)
      LocalStorage.testLoad = false
      Locator.storage.save()
    }
  }
}
