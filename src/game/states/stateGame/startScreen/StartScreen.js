import {gsap} from 'gsap'
import Locator from '@/game/engine/Locator.ts'
import Scoreboard from '@/game/features/scoreboard/Scoreboard.js'
import ScoreboardView from '@/game/features/scoreboard/ScoreboardView.js'
import Store from '@/game/features/store/Store.js'
import StoreView from '@/game/features/store/StoreView.js'
import {GAME_STATES} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import YaMetrika from '@/game/modules/metrika/YaMetrika.js'
import {clearTimeLine} from '@/game/utils/animations/gsapUtils.js'
import GameMenuView from './GameMenuView.js'
import StateBadgeController from './statBadge/StateBadgeController.js'

export default class StartScreen {
  #game = Locator.game
  #refs = this.#game.refs
  #storage = Locator.storage
  #soundManager = Locator.soundManager
  #stage = this.#game.app.stage
  #gameMenu

  #buttons
  #backTimeLine = gsap.timeline()

  constructor(state) {
    this.state = state

    // setTimeout(() => this.#createStore(), 500)
  }

  init = () => {
    new StateBadgeController()
    this.#prepare()
    this.#createGameMenu()
    this.#setUserStats()
  }

  #prepare = () => {
    Locator.uiLayer.stateUiLayer.alpha = 1
    Locator.options.setVisibleToggle(true)
    this.#stage.interactiveChildren = true
    this.#game.on(GAME_EVENTS.clearLevel, this.#clear)
  }

  #createGameMenu = () => {
    this.#gameMenu = new GameMenuView()
    this.#refs.gameMenuView = this.#gameMenu

    this.#buttons = this.#gameMenu.children
  }

  // todo пересмотреть. Похоже на костыль
  setInteractive = (bool) => {
    const action = bool ? 'on' : 'off'
    const eventMode = bool ? 'static' : 'none'

    this.#gameMenu.eventMode = eventMode
    this.#gameMenu[action]('pointertap', this.#handleMainMenuClick)

    Locator.options.optionsToggleBtn.eventMode = eventMode
  }

  #setUserStats = () => {
    const {userLevel, userCoins} = this.#refs

    const userLevelText = userLevel.getChildByLabel('badgeText')
    userLevelText.text = this.#storage.userLevel

    const userCoinsText = userCoins.getChildByLabel('badgeText')
    userCoinsText.text = this.#storage.playerData.coins
  }

  // -------- handlers
  #handleMainMenuClick = ({target}) => {
    if (Locator.options.isVisible) return

    if (target.label === 'btnStart') this.#onBtnStartHandler()
    if (target.label === 'btnStore') this.#onBtnStoreHandler()
    if (target.label === 'btnLeaders') this.#onBtnLeaderboardHandler()

    if (target.type === 'button') this.#soundManager.play('sfx_btnClick')
  }

  #onBtnStartHandler = () => {
    YaMetrika.btnStart()

    this.#game.emit(GAME_EVENTS.clearLevel)
    this.state.checkoutState(GAME_STATES.levelPreload)
  }

  #onBtnStoreHandler = async () => {
    YaMetrika.mainScreenBtnStore()
    this.#createStore()
  }

  #onBtnLeaderboardHandler = async () => {
    YaMetrika.btnLeaders()
    this.#createScoreBoard()

    // if (SdkManager.isUserAuth) {
    //   Logger.log('', 'Игрок авторизован.')
    //   // this.#uiManager.showModule(MODULE_NAMES.SCOREBOARD.moduleName)
    //   return
    // }

    // new Authorization()
  }

  #clear = () => {
    this.#game.off(GAME_EVENTS.clearLevel, this.#clear)
    clearTimeLine(this.#backTimeLine, true)
  }

  #createStore = () => {
    const view = new StoreView()
    new Store(view)
  }

  #createScoreBoard = () => {
    const view = new ScoreboardView()
    new Scoreboard(view)
  }
}
