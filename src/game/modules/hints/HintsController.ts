import {gsap} from 'gsap'
import {Rectangle} from 'pixi.js'
import type {Container, FederatedPointerEvent} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import type Game from '@/game/Game.js'
import SdkManager from '@/game/engine/SdkManager.js'
import Store from '@/game/features/store/Store.js'
import StoreView from '@/game/features/store/StoreView.js'
import {GAME_NAMES} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {GAME_NAME} from '@/game/generatedAssets/buildMeta.js'
import {destroyTimeLine} from '@/game/utils/animations/gsapUtils.js'
import {eventToggle} from '@/game/utils/gameUtils/GameUtils.js'
import Logger, {MODULES} from '@/game/utils/Logger.js'
import ButtonsHintView from './ButtonsHintView.js'
import ButtonsStateFX from './ButtonsStateFX.js'
import HintsLearning from './learning/HintsLearning.js'
import NoHintsWindow from './NoHintsWindow.js'
import type {HintButton, HintButtonName, HintRefs} from './hintTypes.js'

// Координирует кнопки, доступность и выполнение игровых подсказок.

const HINT_BUTTON_NAMES = {
  hints: 'hints',
  hintDarts: 'hintDarts',
  hintCompass: 'hintCompass',
} as const

type HintLevel = {
  aliveTargets: unknown[]
}

type DartsHint = {
  getAvailableTargets: () => unknown[]
  runHint: (targets: unknown[]) => Promise<unknown>
}

type CompassHint = {
  runHint: () => Promise<unknown>
}

export default class HintsController {
  #game = Locator.game
  #refs: HintRefs
  #storage = Locator.storage
  #hintsLearning: HintsLearning | null = null
  #level: HintLevel
  // view
  #optionsToggleBtn: HintButton
  #buttonsHintView!: ButtonsHintView
  #buttons: HintButton[] = []
  #btnHint!: HintButton
  #btnDarts!: HintButton
  #btnCompass!: HintButton
  // hints
  #hintDarts!: DartsHint
  #hintCompass!: CompassHint
  #idleTimeLine: gsap.core.Timeline | null = null
  #buttonsStateFX!: ButtonsStateFX
  #isDestroyed = false

  // Сохраняет уровень и элементы управления интерфейса.
  constructor(level: HintLevel) {
    this.#refs = (this.#game as Game & {refs: HintRefs}).refs
    this.#level = level
    this.#optionsToggleBtn = Locator.options.optionsToggleBtn as HintButton
  }

  // Возвращает текущий уровень.
  get level() {
    return this.#level
  }

  // Возвращает кнопки подсказок и настроек.
  get buttons() {
    return this.#buttons
  }

  // Возвращает кнопку дротиков.
  get btnDarts() {
    return this.#btnDarts
  }

  // Возвращает кнопку компаса.
  get btnCompass() {
    return this.#btnCompass
  }

  // Возвращает представление кнопок подсказок.
  get buttonsHintView() {
    return this.#buttonsHintView
  }

  // Возвращает активный сценарий обучения.
  get hintsLearning() {
    return this.#hintsLearning
  }

  // Создаёт визуальную часть контроллера подсказок.
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
    this.#buttons.forEach((button) => {
      const local = button.getLocalBounds()

      const padding = 10
      const x = local.x - padding
      const y = local.y - padding
      const w = local.width + padding * 2
      const h = local.height + padding * 2

      button.filterArea = new Rectangle(x, y, w, h)
    })
  }

  // Переключает интерактивность кнопок подсказок.
  setInteractive = (bool: boolean) => {
    const toggle = eventToggle(bool)

    Locator.options.optionsToggleBtn.eventMode = bool ? 'static' : 'none'
    this.#buttonsHintView[toggle.gameOnOff]('pointerup', this.#onHandlerContainerUp)
  }

  // Создаёт представление кнопок и добавляет его в UI-слой.
  #createButtons = () => {
    this.#buttonsHintView = new ButtonsHintView({refs: this.#refs})
    Locator.uiLayer.stateUiLayer.addChild(this.#buttonsHintView)
  }

  // Запускает обучение дополнительным подсказкам.
  #initHintsLearning = async () => {
    if ((GAME_NAME as string) === GAME_NAMES.hotel) return

    this.#hintsLearning = new HintsLearning(this)
    await this.#hintsLearning.init()
  }

  // Создаёт вспомогательные компоненты кнопок.
  #initComponents = () => {
    this.#initButtons()

    this.#buttonsStateFX = new ButtonsStateFX(this.buttons)
  }

  // Получает созданные кнопки из общего набора ссылок.
  #initButtons = () => {
    this.#buttonsHintView = this.#refs.buttonsHintView as ButtonsHintView
    this.#btnHint = this.#refs.btnHint as HintButton

    if ((GAME_NAME as string) === GAME_NAMES.hotel) {
      this.#buttons = [this.#btnHint, this.#optionsToggleBtn]
      return
    }

    this.#btnDarts = this.#refs.btnHintDarts as HintButton
    this.#btnCompass = this.#refs.btnHintCompass as HintButton
    this.#buttons = [this.#btnHint, this.#btnDarts, this.#btnCompass, this.#optionsToggleBtn]
  }

  // Подключает или отключает события жизненного цикла уровня.
  #setEvents = (bool: boolean) => {
    const toggle = eventToggle(bool)

    this.#game[toggle.gameOnOff](GAME_EVENTS.completeLevel, this.#destroy)
    this.#game[toggle.gameOnOff](GAME_EVENTS.completeLevelWin, this.#destroy)
    this.#game[toggle.gameOnOff](GAME_EVENTS.gameResize, this.#resize)
  }

  // ---------- pointer events
  // Обрабатывает нажатие одной из кнопок подсказок.
  #onHandlerContainerUp = async (event: FederatedPointerEvent) => {
    const target = event.target as HintButton
    if (Locator.options.isVisible) return

    const aliveTargets = (this.#game as Game & {level: HintLevel}).level.aliveTargets
    if (!aliveTargets.length) return
    if (target.isDisabled) return
    if (target.type === 'button') Locator.soundManager.play('sfx_btnClick')

    const isHintAvailable = await this.#isHintAvailable(target)
    if (!isHintAvailable) return

    if (target.label === HINT_BUTTON_NAMES.hints) this.#onBtnMagnifierClick(target)

    if ((GAME_NAME as string) === GAME_NAMES.hotel) return
    if (target.label === HINT_BUTTON_NAMES.hintDarts) this.#onBtnDartsClick(target)
    if (target.label === HINT_BUTTON_NAMES.hintCompass) this.#onBtnCompassClick(target)
  }

  // Фиксирует использование подсказки и обновляет кнопки.
  #onHandlerBtnHint = (button: HintButton) => {
    this.#game.emit(GAME_EVENTS.HINTS.startHint, button.label)
    this.#setButtonsEnabled()

    this.#buttonsStateFX.checkoutBtnState(button, true)

    // если это обучающий уровень, то не списываем подсказки
    if (HintsLearning.isLearningStarted) return
    this.#storage.spendHints(button.label as HintButtonName)
  }

  // Переключает блокировку кнопок подсказок.
  #setButtonsEnabled = (isLocked = false) => {
    this.setInteractive(isLocked)
  }

  // Проверяет запас выбранной подсказки.
  #isHintAvailable = async (button: HintButton) => {
    // если это обучающий уровень, разрешаем в любом случае
    if (HintsLearning.isLearningStarted) return true

    const amount = this.#storage.playerData[button.label as HintButtonName]
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

  // Запускает подсказку-лупу.
  #onBtnMagnifierClick = async (button: HintButton) => {
    this.#onHandlerBtnHint(button)
    await this.#onCompleteHintAction(button)
  }

  // Запускает подсказку-дротики.
  #onBtnDartsClick = async (button: HintButton) => {
    const targets = this.#hintDarts.getAvailableTargets()
    if (!targets.length) return

    await this.#onHandlerBtnHint(button)
    await this.#hintDarts.runHint(targets)
    await this.#onCompleteHintAction(button)
  }

  // Запускает подсказку-компас.
  #onBtnCompassClick = async (button: HintButton) => {
    await this.#onHandlerBtnHint(button)
    await this.#hintCompass.runHint()
    await this.#onCompleteHintAction(button)
  }

  // Восстанавливает интерфейс после завершения подсказки.
  #onCompleteHintAction = async (button: HintButton) => {
    if (this.#isDestroyed || button.destroyed) return

    await this.#buttonsStateFX.checkoutBtnState(button, false)
    this.#setButtonsEnabled(true)
    this.#buttons.forEach((button) => (button.cursor = 'pointer'))
  }
  // ---------- pointer events end

  // Запускает периодическую анимацию иконок подсказок.
  #idleButtons = () => {
    const scales = this.#buttons.filter((btn) => btn.label !== 'optionsToggleBtn').map((btn) => btn.getChildByLabel('icon', true)!.scale)

    if (!scales.length) return

    this.#idleTimeLine = gsap
      .timeline({repeat: -1, repeatDelay: 5})
      .fromTo(scales, {x: 1, y: 1}, {x: 1.15, y: 1.15, yoyo: true, repeat: 5, duration: 0.8, stagger: 0.3, ease: 'sine.inOut'})
  }

  // Удаляет события, анимации и представление контроллера.
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

  // Обновляет области фильтров после изменения размеров.
  #resize = () => {
    this.#setStaticFilterArea()
  }

  // Показывает окно получения подсказки за рекламу.
  #showNoHintsWindow = (button: HintButton) => {
    const view = new NoHintsWindow(button.label as HintButtonName)
    view.init()
  }

  // Открывает игровой магазин.
  #openStore = () => {
    Locator.soundManager.play('sfx_btnClick')

    const view = new StoreView()
    new Store(view)
  }
}

export {
  HINT_BUTTON_NAMES,
}
