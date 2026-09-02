import {Assets} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import LocalStorage from '@/game/engine/storage/LocalStorage.js'
import {GAME_STATES, PLATFORM_ID} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import BaseState from '@/game/states/BaseState.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import Logger, {MODULES} from '@/game/utils/Logger.js'
import Finalize from './states/Finalize.js'
import InitialLoad from './states/InitialLoad.js'
import LoadLevelResources from './states/LoadLevelResources.js'
import PreparePreloadText from './states/PreparePreloadText.js'
import type PreloadView from '../PreloadView.js'
import type Storage from '../../../engine/storage/Storage.js'
import type {PlayerData} from '../../../engine/storage/defaultData.js'
import type {PreloadTextData} from './preloadTypes.js'

// Управляет последовательностью подготовки и загрузки выбранного уровня.

let isFirstInit = false // Показывает, был ли уже выполнен первый запуск предзагрузки

export default class LevelPreload extends BaseState {
  declare view: PreloadView | null
  storage: Storage | null = null
  playerData: PlayerData | null = null
  levelIndex: number | null = null
  textPreloadData: PreloadTextData | null = null

  // Возвращает событие запуска предзагрузки уровня.
  get initEventName() {
    return GAME_STATES.levelPreload
  }

  // Последовательно подготавливает данные, ресурсы и переход в уровень.
  async initialize() {
    super.initialize()
    SdkManager.gameplayStop()
    this.#initLevelData()

    const startTime = performance.now()
    const adPromise = this.#maybeShowAd()

    await this.#runInitializeState()
    await this.#runPreparePreloadText()
    await this.#runLoadLevelResources()
    await adPromise

    if (LocalStorage.testLoad) {
      await this.#testing()
      return
    }

    await this.#checkoutState(startTime)
  }

  // Очищает кэш ресурсов завершённого уровня.
  clearLevelCache = async () => {
    Logger.log(MODULES.LevelPreload, 'очистка кэша уровня Sokoban')

    try {
      await Assets.unloadBundle('levelBundle')
    } catch (err) {
      console.error('[LevelPreload]: level cache cleanup failed', err)
    }
  }

  // Освобождает временные данные и представление загрузки.
  terminate() {
    this.game.emit(GAME_EVENTS.clearLevel)
    this.isInitialized = false

    this.view?.destroy({children: true})
    this.view = null
    this.storage = null
    this.playerData = null
    this.levelIndex = null
    this.textPreloadData = null
  }

  // Сохраняет профиль и индекс загружаемого уровня.
  #initLevelData() {
    this.storage = Locator.storage
    this.levelIndex = this.storage.playerData.levelIndex
    this.playerData = this.storage.playerData
    this.game.clearLevelCache = this.clearLevelCache
  }

  // При необходимости запускает межуровневую рекламу.
  #maybeShowAd() {
    if (!isFirstInit) {
      isFirstInit = true
      return
    }

    return new Promise<boolean>((resolve) => {
      this.#showAdOrResolve(resolve)
    })
  }

  // Завершает ожидание после показа или пропуска рекламы.
  #showAdOrResolve(resolve: (value: boolean | PromiseLike<boolean>) => void) {
    if (SdkManager.isPlatform(PLATFORM_ID.vk)) {
      Logger.log(MODULES.LevelPreload, '[flag vk], blocking showAd')
      resolve(true)
      return
    }

    if (GameUtils.skipAdInFirstLevel(this.levelIndex!)) {
      Logger.warn('', 'первый уровень, не показываем рекламу!')
      resolve(true)
      return
    }

    if (!this.storage!.playerData.hasAdPass) {
      SdkManager.showInterstitial({onFinally: () => resolve(true)})
      return
    }

    resolve(true)
  }

  // Создаёт представление и выполняет одноразовую загрузку.
  async #runInitializeState() {
    const initialState = new InitialLoad(this)
    initialState.initView()
    this.view = initialState.view
    await initialState.execute()
    this.isInitialized = true
  }

  // Подготавливает локализованный текст прогресса.
  async #runPreparePreloadText() {
    const prepareState = new PreparePreloadText(this)
    await prepareState.execute(this.levelIndex!)
    this.textPreloadData = prepareState.textPreloadData
    await Locator.gameResize.resize()
  }

  // Загружает ресурсы выбранного уровня.
  async #runLoadLevelResources() {
    const loadResourcesState = new LoadLevelResources(this, true)
    await loadResourcesState.execute(this.levelIndex!)
  }

  // Завершает предзагрузку и переключает игру в состояние уровня.
  async #checkoutState(startTime: number) {
    super.checkoutState()
    GameUtils.checkLoadTime(startTime, 'level ' + this.levelIndex + ' loaded in')

    const finalizeState = new Finalize(this)
    await finalizeState.startGame()
  }

  // Выполняет служебную точку запуска тестирования загрузки.
  async #testing() {
    try {
      console.log('тут может быть запуск тестирования')
    } catch (err) {
      console.error('[LevelPreload]: testing failed', err)
      LocalStorage.testLoad = false
      Locator.storage.save()
    }
  }
}
