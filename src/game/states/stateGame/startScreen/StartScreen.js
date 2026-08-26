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

export default class StartScreen {
  #backTimeLine = gsap.timeline()
  #game = Locator.game
  #gameMenu
  #progress
  #refs = this.#game.refs
  #selectedLocationId
  #soundManager = Locator.soundManager
  #stage = this.#game.app.stage
  #storage = Locator.storage

  constructor(state) {
    this.state = state
  }

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

  setInteractive = (isInteractive) => {
    this.#stage.interactiveChildren = isInteractive
  }

  showLocations = (playSound = true) => {
    this.#selectedLocationId = null
    this.#game.view.setBackground('startScreen')
    const unlockedLocation = this.#progress.consumeUnlockCelebration()
    const pageIndex = unlockedLocation ? getLocationPageIndex(unlockedLocation.id) : this.#progress.locationPageIndex
    this.#gameMenu.showLocations(this.#progress.getLocationStates(), pageIndex, this.#progress.getContinueTargetEntry(), unlockedLocation)
    if (playSound) this.#playClickSound()
  }

  #prepare = () => {
    Locator.uiLayer.stateUiLayer.alpha = 1
    Locator.options.setVisibleToggle(true)
    this.#stage.interactiveChildren = true
    this.#game.on(GAME_EVENTS.clearLevel, this.#clear)
    this.#game.on(GAME_EVENTS.gameResize, this.#resize)
  }

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

  #showInitialScreen = () => {
    if (this.#game.consumeSelectedLocationRequest()) {
      this.#showSelectedLocation()
      return
    }

    this.showLocations(false)
  }

  #showSelectedLocation = () => {
    const locationId = this.#progress.selectedLocationId
    const location = getLocationById(locationId)
    if (!location || !this.#progress.isLocationUnlocked(locationId)) {
      this.showLocations(false)
      return
    }

    this.#selectedLocationId = locationId
    this.#game.view.setBackground(location.background)
    this.#gameMenu.showLevels(location, this.#progress.getLevelStates(locationId), this.#progress.getSelectedEntry(locationId))
  }

  #openLocation = (locationId) => {
    if (!this.#progress.selectLocation(locationId)) return

    this.#selectedLocationId = locationId
    const location = getLocationById(locationId)
    const selectedEntry = this.#progress.getSelectedEntry(locationId)
    this.#game.view.setBackground(location.background)
    this.#gameMenu.showLevels(location, this.#progress.getLevelStates(locationId), selectedEntry)
    this.#playClickSound()
  }

  #selectPage = (pageIndex) => {
    this.#progress.selectPage(pageIndex)
    this.#gameMenu.showLocations(
      this.#progress.getLocationStates(),
      this.#progress.locationPageIndex,
      this.#progress.getContinueTargetEntry(),
    )
    this.#playClickSound()
  }

  #selectLevel = (levelId) => {
    if (!this.#progress.selectLevel(levelId)) return

    const entry = this.#progress.getSelectedEntry(this.#selectedLocationId)
    const states = this.#progress.getLevelStates(this.#selectedLocationId)
    this.#gameMenu.updateSelectedLevel(states, entry)
    this.#playClickSound()
  }

  #continueGame = () => {
    const entry = this.#progress.getContinueTargetEntry()
    if (!entry || !this.#progress.selectLevel(entry.level.id)) return

    YaMetrika.btnStart()
    this.#startSelectedLevel()
  }

  #playSelectedLevel = () => {
    YaMetrika.btnStart()
    this.#startSelectedLevel()
  }

  #startSelectedLevel = () => {
    const entry = this.#progress.getSelectedEntry()
    if (!entry || !this.#progress.markLevelPlayed(entry.level.id)) return

    this.#playClickSound()
    this.#game.emit(GAME_EVENTS.clearLevel)
    this.state.checkoutState(GAME_STATES.levelPreload)
  }

  #setUserStats = () => {
    const userLevelText = this.#refs.userLevel.getChildByLabel('badgeText')
    userLevelText.text = this.#storage.userLevel
    const userCoinsText = this.#refs.userCoins.getChildByLabel('badgeText')
    userCoinsText.text = this.#storage.playerData.coins
  }

  #openStore = () => {
    if (Locator.options.isVisible) return
    YaMetrika.mainScreenBtnStore()
    this.#playClickSound()
    new Store(new StoreView())
  }

  #openLeaderboard = () => {
    if (Locator.options.isVisible) return
    YaMetrika.btnLeaders()
    this.#playClickSound()
    new Scoreboard(new ScoreboardView())
  }

  #resize = () => {
    this.#gameMenu?.updateAdaptive()
  }

  #playClickSound = () => {
    this.#soundManager.play('sfx_btnClick')
  }

  #clear = () => {
    this.#game.off(GAME_EVENTS.clearLevel, this.#clear)
    this.#game.off(GAME_EVENTS.gameResize, this.#resize)
    clearTimeLine(this.#backTimeLine, true)
  }
}
