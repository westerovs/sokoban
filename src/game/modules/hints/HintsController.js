import {gsap} from 'gsap'
import {Rectangle} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {eventToggle} from '@/game/utils/gameUtils/GameUtils.js'
import HintsCounter from '@/game/modules/hints/HintsCounter.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {destroyTimeLine} from '@/game/utils/animations/gsapUtils.js'
import ButtonsHintView from './ButtonsHintView.js'
import HintsLearning from './learning/HintsLearning.js'
import ButtonsStateFX from './ButtonsStateFX.js'
import NoHintsWindow from './NoHintsWindow.js'
import {Logger, MODULES} from '@/game/utils/Logger.js'
import SdkManager from '@/game/engine/SdkManager.js'
import {GAME_NAME} from '@/game/generatedAssets/buildMeta.js'
import {GAME_NAMES} from '@/game/gameConfig/constants.js'
import Store from '@/game/features/store/Store.js'
import StoreView from '@/game/features/store/StoreView.js'

// todo проверить все места в коде, где могут быть хардкод-строки с именами
export const HINT_BUTTON_NAMES = {
  hints: 'hints',
  hintDarts: 'hintDarts',
  hintCompass: 'hintCompass',
}

export default class HintsController {
  #game = Locator.game
  #refs = this.#game.refs
  #storage = Locator.storage
  #hintsLearning
  #level
  // view
  #optionsToggleBtn
  #buttonsHintView
  #buttons
  #btnHint
  #btnDarts
  #btnCompass
  // hints
  #hintDarts
  #hintCompass
  #idleTimeLine
  #buttonsStateFX
  #isDestroyed
  
  constructor(level) {
    this.#level = level
    this.#optionsToggleBtn = Locator.options.optionsToggleBtn
  }
  
  get level() {
    return this.#level
  }
  
  get buttons() {
    return this.#buttons
  }
  
  get btnDarts() {
    return this.#btnDarts
  }
  
  get btnCompass() {
    return this.#btnCompass
  }
  
  get buttonsHintView() {
    return this.#buttonsHintView
  }
  
  get hintsLearning() {
    return this.#hintsLearning
  }

  init = async () => {
    try {
      this.#createButtons()
      // this.#setEvents(true)
      // this.#initComponents()

      // new HintsCounter(this.#buttons)
      //
      // // this.setInteractive(true)
      // // await this.#initHintsLearning()
      //
      // this.#setStaticFilterArea()
      // this.#idleButtons()
    } catch (e) {
      console.log('[HintsController init]', e)
    }
  }
  
  // нужно для исправления бага дрожания элемента, когда на нем фильтр и анимация
  #setStaticFilterArea = () => {
    this.#buttons.forEach(button => {
      const local = button.getLocalBounds()
      
      const padding = 10
      const x = local.x - padding
      const y = local.y - padding
      const w = local.width + padding * 2
      const h = local.height + padding * 2
      
      button.filterArea = new Rectangle(x, y, w, h)
    })
  }

  setInteractive = (bool) => {
    const toggle = eventToggle(bool)
    
    Locator.options.optionsToggleBtn.eventMode = bool ? 'static' : 'none'
    this.#buttonsHintView[toggle.gameOnOff]('pointerup', this.#onHandlerContainerUp)
  }
  
  #createButtons = () => {
    this.#buttonsHintView = new ButtonsHintView({refs: this.#refs})
    Locator.uiLayer.stateUiLayer.addChild(this.#buttonsHintView)
  }
  
  #initHintsLearning = async () => {
    if (GAME_NAME === GAME_NAMES.hotel) return
    
    this.#hintsLearning = new HintsLearning(this)
    await this.#hintsLearning.init()
  }

  #initComponents = () => {
    this.#initButtons()
    
    this.#buttonsStateFX = new ButtonsStateFX(this.buttons)
  }
  
  #initButtons = () => {
    this.#buttonsHintView = this.#refs.buttonsHintView
    this.#btnHint = this.#refs.btnHint

    if (GAME_NAME === GAME_NAMES.hotel) {
      this.#buttons = [this.#btnHint, this.#optionsToggleBtn]
      return
    }
    
    this.#btnDarts = this.#refs.btnHintDarts
    this.#btnCompass = this.#refs.btnHintCompass
    this.#buttons = [this.#btnHint, this.#btnDarts, this.#btnCompass, this.#optionsToggleBtn]
  }
  
  #setEvents = (bool) => {
    const toggle = eventToggle(bool)
    
    this.#game[toggle.gameOnOff](GAME_EVENTS.completeLevel, this.#destroy)
    this.#game[toggle.gameOnOff](GAME_EVENTS.completeLevelWin, this.#destroy)
    this.#game[toggle.gameOnOff](GAME_EVENTS.gameResize, this.#resize)
  }
  
  // ---------- pointer events
  #onHandlerContainerUp = async ({target}) => {
    if (Locator.options.isVisible) return
    
    const aliveTargets = this.#game.level.aliveTargets
    if (!aliveTargets.length) return
    if (target.isDisabled) return
    if (target.type === 'button') Locator.soundManager.play('sfx_btnClick')
    
    const isHintAvailable = await this.#isHintAvailable(target)
    if (!isHintAvailable) return
    
    if (target.label === HINT_BUTTON_NAMES.hints) this.#onBtnMagnifierClick(target)
    
    if (GAME_NAME === GAME_NAMES.hotel) return
    if (target.label === HINT_BUTTON_NAMES.hintDarts) this.#onBtnDartsClick(target)
    if (target.label === HINT_BUTTON_NAMES.hintCompass) this.#onBtnCompassClick(target)
  }
  
  #onHandlerBtnHint = (button) => {
    this.#game.emit(GAME_EVENTS.HINTS.startHint, button.label)
    this.#setButtonsEnabled()
    
    this.#buttonsStateFX.checkoutBtnState(button, true)
    
    // если это обучающий уровень, то не списываем подсказки
    if (HintsLearning.isLearningStarted) return
    this.#storage.spendHints(button.label)
  }
  
  #setButtonsEnabled = (isLocked = false) => {
    this.setInteractive(isLocked)
  }
  
  #isHintAvailable = async (button) => {
    // если это обучающий уровень, разрешаем в любом случае
    if (HintsLearning.isLearningStarted) return true
    
    const amount = this.#storage.playerData[button.label]
    if (amount <= 0) {
      if (SdkManager.flags?.noStore) {
        this.#showNoHintsWindow(button)
        return false
      }

      this.#openStore()
      return false
    }
    
    return true
  }
  
  #onBtnMagnifierClick = async (button) => {
    this.#onHandlerBtnHint(button)
    await this.#onCompleteHintAction(button)
  }
  
  #onBtnDartsClick = async (button) => {
    const targets = this.#hintDarts.getAvailableTargets()
    if (!targets.length) return
    
    await this.#onHandlerBtnHint(button)
    await this.#hintDarts.runHint(targets)
    await this.#onCompleteHintAction(button)
  }
  
  #onBtnCompassClick = async (button) => {
    await this.#onHandlerBtnHint(button)
    await this.#hintCompass.runHint()
    await this.#onCompleteHintAction(button)
  }
  
  #onCompleteHintAction = async (button) => {
    if (this.#isDestroyed || button.destroyed) return
    
    await this.#buttonsStateFX.checkoutBtnState(button, false)
    this.#setButtonsEnabled(true)
    this.#buttons.forEach(button => button.cursor = 'pointer')
  }
  // ---------- pointer events end
  
  #idleButtons = () => {
    const scales = this.#buttons
      .filter(btn => btn.label !== 'optionsToggleBtn')
      .map(btn => btn.getChildByLabel('icon', 1).scale)
    
    if (!scales.length) return

    this.#idleTimeLine = gsap.timeline({repeat: -1, repeatDelay: 5})
      .fromTo(
        scales,
        {x: 1, y: 1},
        {x: 1.15, y: 1.15, yoyo: true, repeat: 5, duration: 0.8, stagger: 0.3, ease: 'sine.inOut'}
      )
  }
  
  #destroy = async () => {
    if (this.#isDestroyed) return
    this.#isDestroyed = true
    
    this.#setEvents(false)
    this.setInteractive(false)
    destroyTimeLine(this.#idleTimeLine)
    this.#idleTimeLine = null
    this.#buttonsHintView.destroy({children: true})
    
    Logger.log(MODULES.DestroyMessage, '[HintsController destroy]')
  }
  
  #resize = () => {
    this.#setStaticFilterArea()
  }
  
  #showNoHintsWindow = (button) => {
    const view = new NoHintsWindow(button.label)
    view.init()
  }
  
  #openStore = () => {
    Locator.soundManager.play('sfx_btnClick')
    
    const view = new StoreView()
    new Store(view)
  }
}
