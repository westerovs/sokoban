import {gsap} from 'gsap'
import Locator from '@/game/engine/Locator.ts'
import Scoreboard from '@/game/features/scoreboard/Scoreboard.js'
import ScoreboardView from '@/game/features/scoreboard/ScoreboardView.js'
import Store from '@/game/features/store/Store.js'
import StoreView from '@/game/features/store/StoreView.js'
import {GAME_STATES} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import LevelProgress from '@/game/gameConfig/levels/LevelProgress.js'
import {getLocationById, getLocationPageIndex} from '@/game/gameConfig/levels/locationCatalog.js'
import YaMetrika from '@/game/modules/metrika/YaMetrika.js'
import {clearTimeLine} from '@/game/utils/animations/gsapUtils.js'
import GameMenuView from './GameMenuView.js'
import StateBadgeController from './statBadge/StateBadgeController.js'
import type StateGame from '../StateGame.js'
import type GameView from '../GameView.js'

// Координирует навигацию стартового экрана, прогресс и запуск выбранного уровня.

export default class StartScreen {
  #backTimeLine = gsap.timeline()
  #game = Locator.game
  #gameMenu!: GameMenuView
  #progress!: LevelProgress
  #refs = this.#game.refs
  #selectedLocationId: string | null = null
  #soundManager = Locator.soundManager
  #stage = this.#game.app.stage
  #storage = Locator.storage
  state: StateGame

  // Сохраняет родительское игровое состояние.
  constructor(state: StateGame) {
    this.state = state
  }

  // Загружает конфигурацию и создаёт стартовый экран.
  init = async () => {
    await Locator.gameConfig.loadLevelConfiguration()
    this.#progress = new LevelProgress(this.#storage)
    this.#progress.initialize()
    new StateBadgeController()
    this.#prepare()
    this.#createGameMenu()
    this.#setUserStats()
    this.#showInitialScreen()
  }

  // Включает или отключает взаимодействие со сценой.
  setInteractive = (isInteractive: boolean) => {
    this.#stage.interactiveChildren = isInteractive
  }

  // Возвращает пользователя к списку локаций.
  showMainScreen = () => {
    if (this.#selectedLocationId === null) return

    this.showLocations(false)
  }

  // Показывает текущую страницу доступных локаций.
  showLocations = (playSound = true) => {
    this.#selectedLocationId = null
    Locator.options.setMainScreenNavigation(true)
    ;(this.#game.view as GameView).setBackground('startScreen')
    const unlockedLocation = this.#progress.consumeUnlockCelebration()
    const pageIndex = unlockedLocation ? getLocationPageIndex(unlockedLocation.id) : this.#progress.locationPageIndex
    this.#gameMenu.showLocations(this.#progress.getLocationStates(), pageIndex, this.#progress.getContinueTargetEntry(), unlockedLocation)
    if (playSound) this.#playClickSound()
  }

  // Подготавливает UI-слой и игровые события.
  #prepare = () => {
    Locator.uiLayer.stateUiLayer.alpha = 1
    Locator.options.setVisibleToggle(true)
    this.#stage.interactiveChildren = true
    this.#game.on(GAME_EVENTS.clearLevel, this.#clear)
    this.#game.on(GAME_EVENTS.gameResize, this.#resize)
  }

  // Создаёт представление меню с его обработчиками.
  #createGameMenu = () => {
    this.#gameMenu = new GameMenuView({
      onBack: this.showLocations,
      onContinue: this.#continueGame,
      onLeaderboard: this.#openLeaderboard,
      onLevelSelect: this.#selectLevel,
      onLocationSelect: this.#openLocation,
      onPageSelect: this.#selectPage,
      onPlay: this.#playSelectedLevel,
      onStore: this.#openStore,
    })
    this.#refs.gameMenuView = this.#gameMenu
  }

  // Выбирает начальный экран согласно запросу игры.
  #showInitialScreen = () => {
    if (this.#game.consumeSelectedLocationRequest()) {
      this.#showSelectedLocation()
      return
    }

    this.showLocations(false)
  }

  // Открывает ранее выбранную локацию, если она доступна.
  #showSelectedLocation = () => {
    const locationId = this.#progress.selectedLocationId
    if (!locationId) {
      this.showLocations(false)
      return
    }

    const location = getLocationById(locationId)
    if (!location || !this.#progress.isLocationUnlocked(locationId)) {
      this.showLocations(false)
      return
    }

    this.#selectedLocationId = locationId
    Locator.options.setMainScreenNavigation(false)
    ;(this.#game.view as GameView).setBackground(location.background)
    const selectedEntry = this.#progress.getSelectedEntry(locationId)
    if (!selectedEntry) return
    this.#gameMenu.showLevels(location, this.#progress.getLevelStates(locationId), selectedEntry)
  }

  // Выбирает локацию и показывает её уровни.
  #openLocation = (locationId: string) => {
    if (!this.#progress.selectLocation(locationId)) return

    this.#selectedLocationId = locationId
    Locator.options.setMainScreenNavigation(false)
    const location = getLocationById(locationId)
    if (!location) return
    const selectedEntry = this.#progress.getSelectedEntry(locationId)
    if (!selectedEntry) return
    ;(this.#game.view as GameView).setBackground(location.background)
    this.#gameMenu.showLevels(location, this.#progress.getLevelStates(locationId), selectedEntry)
    this.#playClickSound()
  }

  // Переключает страницу списка локаций.
  #selectPage = (pageIndex: number) => {
    this.#progress.selectPage(pageIndex)
    this.#gameMenu.showLocations(
      this.#progress.getLocationStates(),
      this.#progress.locationPageIndex,
      this.#progress.getContinueTargetEntry(),
      null,
    )
    this.#playClickSound()
  }

  // Выбирает уровень внутри текущей локации.
  #selectLevel = (levelId: string) => {
    if (!this.#progress.selectLevel(levelId)) return
    if (!this.#selectedLocationId) return

    const entry = this.#progress.getSelectedEntry(this.#selectedLocationId)
    if (!entry) return
    const states = this.#progress.getLevelStates(this.#selectedLocationId)
    this.#gameMenu.updateSelectedLevel(states, entry)
    this.#playClickSound()
  }

  // Продолжает игру с сохранённой точки прогресса.
  #continueGame = () => {
    const entry = this.#progress.getContinueTargetEntry()
    if (!entry || !this.#progress.selectLevel(entry.level.id)) return

    YaMetrika.btnStart()
    this.#startSelectedLevel()
  }

  // Запускает явно выбранный уровень.
  #playSelectedLevel = (levelId: string) => {
    if (!this.#progress.selectLevel(levelId)) return

    YaMetrika.btnStart()
    this.#startSelectedLevel()
  }

  // Фиксирует запуск и переключает игру на предзагрузку уровня.
  #startSelectedLevel = () => {
    const entry = this.#progress.getSelectedEntry()
    if (!entry || !this.#progress.markLevelPlayed(entry.level.id)) return

    this.#playClickSound()
    this.#game.emit(GAME_EVENTS.clearLevel)
    this.state.checkoutState(GAME_STATES.levelPreload)
  }

  // Обновляет значения уровня и монет в верхней панели.
  #setUserStats = () => {
    const userLevelText = this.#refs.userLevel.getChildByLabel('badgeText')
    userLevelText.text = this.#storage.userLevel
    const userCoinsText = this.#refs.userCoins.getChildByLabel('badgeText')
    userCoinsText.text = this.#storage.playerData.coins
  }

  // Открывает магазин поверх главного экрана.
  #openStore = () => {
    if (Locator.options.isVisible) return
    YaMetrika.mainScreenBtnStore()
    this.#playClickSound()
    new Store(new StoreView())
  }

  // Открывает таблицу лидеров поверх главного экрана.
  #openLeaderboard = () => {
    if (Locator.options.isVisible) return
    YaMetrika.btnLeaders()
    this.#playClickSound()
    new Scoreboard(new ScoreboardView())
  }

  // Адаптирует меню к изменению размера окна.
  #resize = () => {
    this.#gameMenu?.updateAdaptive()
  }

  // Воспроизводит звук нажатия кнопки.
  #playClickSound = () => {
    this.#soundManager.play('sfx_btnClick')
  }

  // Отписывает стартовый экран от событий и очищает анимацию.
  #clear = () => {
    this.#game.off(GAME_EVENTS.clearLevel, this.#clear)
    this.#game.off(GAME_EVENTS.gameResize, this.#resize)
    clearTimeLine(this.#backTimeLine, true)
  }
}
