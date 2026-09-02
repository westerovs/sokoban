import i18next from 'i18next'
import {Assets, Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.js'
import GamePause from '../../../components/GamePause.js'
import {LIVE_OPS_ID} from '../../../components/liveOpsController/LiveOpsController.js'
import SdkManager from '../../../engine/SdkManager.js'
import LocalStorage from '../../../engine/storage/LocalStorage.js'
import {GAME_STATES, PLATFORM_ID} from '../../../gameConfig/constants.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'
import LocaleManager from '../../../modules/LocaleManager.js'
import GameTimeTrackerCounter from '../../../modules/metrika/GameTimeTrackerCounter.js'
import YaMetrika, {ERROR_TYPES} from '../../../modules/metrika/YaMetrika.js'
import {trySelectRequestedSokobanLevel} from '../../../sokoban/editor/trySelectRequestedSokobanLevel.js'
import GameUtils from '../../../utils/gameUtils/GameUtils.js'
import LoadUtils from '../../../utils/gameUtils/LoadUtils.js'
import Logger, {LOG_STATUS, MODULES} from '../../../utils/Logger.js'
import AdminPanelButton from '../../../utils/testing/adminPanel/AdminPanelButton.js'
import DebugHotkeys from '../../../utils/testing/DebugHotkeys.js'
import DebugInfo from '../../../utils/testing/DebugInfo.js'
import BaseState from '../../BaseState.js'
import PreloadView from '../PreloadView.js'
import {createPreloadList} from './preloadList.js'
import type Game from '../../../Game.js'
import type {SdkAdapter} from '../../../engine/sdkTypes.js'

/**
 * Загружает обязательные ресурсы игры и подготавливает стартовое состояние.
 */

export default class GamePreload extends BaseState {
  #view: PreloadView | null = null
  #preloadText: Text | null = null
  #startTime = 0
  #adapter: SdkAdapter
  #loadAttempts = 0 // Текущее количество попыток загрузки
  #maxLoadAttempts = 3 // Максимальное количество повторов после ошибки загрузки

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(game: Game, adapter: SdkAdapter) {
    super(game)

    this.#adapter = adapter
  }

  // Возвращает значение свойства `initEventName`.
  get initEventName() {
    return GAME_STATES.preloadState
  }

  // Выполняет отдельную операцию `initialize`.
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

  // Пересчитывает размеры и расположение представления.
  async resize() {
    const view = this.#view as (PreloadView & {resize?: () => void | Promise<void>}) | null
    await view?.resize?.()
  }

  // Возвращает данные, за которые отвечает операция `load`.
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

  // Обрабатывает событие, за которое отвечает операция `handleLoadError`.
  #handleLoadError = async (err: unknown) => {
    console.error('[GamePreload]: load failed', err)
    this.#loadAttempts++

    // Показываем статус + ждём задержку, увеличивая её на каждую попытку
    await GameUtils.showTextPreloadAttempts(this.#preloadText, this.#loadAttempts, this.#maxLoadAttempts, err)

    if (this.#loadAttempts < this.#maxLoadAttempts) return true
    console.error(`[GamePreload]: initialize failed: ${err}`)
    YaMetrika.preloadError(ERROR_TYPES?.GAME_PRELOAD?.initialize, err)

    return false
  }

  // Возвращает данные, за которые отвечает операция `loadGameBundle`.
  #loadGameBundle = async (progress: number) => {
    await Assets.init({manifest: createPreloadList()})
    await Assets.loadBundle('gameScreen')

    this.#updateProgressView(progress)
  }

  // Загружает SDK, локализации и основной набор игровых ресурсов.
  #loadSdkAndLocales = async (progress: number) => {
    const sdkPromise = SdkManager.initSdk(this.#adapter)
    const localesPromise = Locator.gameConfig.loadLocalesJson()

    await Promise.all([sdkPromise, localesPromise])

    await LocaleManager.init()
    Locator.gameConfig.locale = LocaleManager.locale

    this.#updateProgressView(progress)
  }

  // Загружает сохранения игрока и подготавливает платежи.
  #loadStorageAndPayments = async (progress: number) => {
    await Locator.storage.load()
    await Locator.paymentManager.consumePendingPayments()
    this.#updateProgressView(progress)
  }

  // фоновая загрузка, в levelPreload/InitialLoad дожидается, если вдруг не успела загрузиться
  #startLevelConfigurationLoading = () => {
    Locator.gameConfig.loadLevelConfiguration().catch((error) => {
      console.warn('[GamePreload] Фоновая загрузка конфигурации уровня не завершена', error)
    })
  }

  // Выполняет отдельную операцию `initView`.
  #initView = () => {
    this.#view = new PreloadView()
    this.game.gameContainer.addChild(this.#view)
    this.#updateProgressView(0)

    this.isInitialized = true
    Logger.log(MODULES.GamePreload, 'initView')
  }

  // Обновляет состояние через операцию `updateProgressView`.
  #updateProgressView = (progress: number) => {
    const preloadText = this.#view?.refs?.preloadText
    if (!this.#view || !preloadText) return

    const isDetectI18text = i18next.t('textLoading') || ''
    const textValue = isDetectI18text ? `${isDetectI18text} ${progress}%` : ''

    preloadText.text = `${textValue}`
    preloadText.style.fontFamily = 'BloggerSans'
    this.#preloadText = preloadText
  }

  // Создаёт данные или представление для операции `createUiSpriteSheet`.
  #createUiSpriteSheet = async () => {
    await LoadUtils.loadSpriteSheet({spriteSheetName: 'startScreenUi'})

    const isNewYear = Locator.liveOps.isActive(LIVE_OPS_ID.NEW_YEAR)
    if (isNewYear) {
      await LoadUtils.loadSpriteSheet({spriteSheetName: 'newYear'})
    }
  }

  // Обновляет состояние через операцию `setLoggerStatus`.
  #setLoggerStatus = () => {
    if (LocalStorage.isDebug && LocalStorage.isLog) {
      LOG_STATUS.IS_DISABLED_LOG = false
    }
  }

  // Выполняет отдельную операцию `startGame`.
  #startGame = async () => {
    this.terminate()
    new AdminPanelButton(this.game, Locator.storage, Locator.gameConfig)

    Locator.options.init()

    if (trySelectRequestedSokobanLevel(Locator.storage)) {
      this.game.emit(GAME_STATES.levelPreload)
      return
    }

    if (SdkManager.flags?.skipFirstScreen) {
      this.game.emit(GAME_STATES.levelPreload)
      return
    }

    this.game.emit(this.game.stateAfterPreload)
  }

  // Изменяет видимость через операцию `showAd`.
  #showAd = () => {
    if (SdkManager.isPlatform(PLATFORM_ID.cg)) return
    if (SdkManager.flags?.noPreroll || GameUtils.isFirstLevel) return
    if (!Locator.storage.playerData.hasAdPass) SdkManager.showInterstitial()
  }

  // Выполняет отдельную операцию `terminate`.
  terminate() {
    this.game.emit(GAME_EVENTS.clearLevel)

    this.#view?.destroy({children: true})
    this.#view = null

    this.isInitialized = false
  }

  // Выполняет отдельную операцию `postStartActions`.
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

  // Выполняет отдельную операцию `initGamePause`.
  #initGamePause = () => {
    new GamePause()
  }
}
