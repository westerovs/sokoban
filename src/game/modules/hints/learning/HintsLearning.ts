import {gsap} from 'gsap'
import i18next from 'i18next'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import type Game from '@/game/Game.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {HINT_BUTTON_NAMES} from '@/game/modules/hints/HintsController.js'
import SpeechBubbleView from '@/game/ui/common/speechBubble/SpeechBubbleView.js'
import {destroyTimeLine, shake} from '@/game/utils/animations/gsapUtils.js'
import GrayscaleFilter from '@/game/utils/filters/GrayscaleFilter.js'
import GameUtils, {eventToggle} from '@/game/utils/gameUtils/GameUtils.js'
import Logger from '@/game/utils/Logger.js'
import type HintsController from '../HintsController.js'
import type {HintButton, HintButtonName} from '../hintTypes.js'
import LearningArrow from './LearningArrow.js'
import LearningHole from './LearningHole.js'

/*
 * Для дротиков и компаса используется одинаковое обучение клика по кнопке
 * Но для компаса, после его появления на сцене используется дополнительное обучение его перемещения
 * */
export default class HintsLearning {
  #game = Locator.game
  #stepPromise: Promise<void>
  #stepResolve: (() => void) | null = null
  #controller: HintsController
  #level: {hasTutorial: boolean}
  #hole: LearningHole | null = null
  #speechBubble: SpeechBubbleView | null = null
  #arrow: LearningArrow | null = null
  #timeline: gsap.core.Timeline | null = gsap.timeline()
  #targetButton: HintButton | null = null

  static isLearningStarted = false

  // Сохраняет контроллер подсказок и создаёт обещание завершения обучения.
  constructor(controller: HintsController) {
    this.#controller = controller
    this.#level = (this.#game as Game & {level: {hasTutorial: boolean}}).level

    HintsLearning.isLearningStarted = false

    this.#stepPromise = new Promise<void>((resolve) => {
      this.#stepResolve = resolve
    })
  }

  // Возвращает текущее текстовое облако обучения.
  get speechBubble() {
    return this.#speechBubble
  }

  // Возвращает обещание завершения текущего шага обучения.
  get stepPromise() {
    return this.#stepPromise
  }

  // Выбирает сценарий обучения для нового или существующего игрока.
  init = async () => {
    const {hintDartsIsAvailable, hintCompassIsAvailable} = Locator.storage.playerData

    const newPlayerHandled = await this.isNewPlayer({hintDartsIsAvailable, hintCompassIsAvailable})
    if (newPlayerHandled) return

    await this.isOldPlayer({hintDartsIsAvailable, hintCompassIsAvailable})
  }

  // [0] ---------------- prepare ---------------
  isNewPlayer = async ({
    hintDartsIsAvailable,
    hintCompassIsAvailable,
  }: {
    hintDartsIsAvailable: boolean
    hintCompassIsAvailable: boolean
  }) => {
    const {levelIndex} = Locator.storage.playerData
    const {btnDarts, btnCompass} = this.#controller

    if (this.#level.hasTutorial) {
      if (!hintDartsIsAvailable) this.#disableButton(btnDarts)
      if (!hintCompassIsAvailable) this.#disableButton(btnCompass)
      return true
    }

    if (levelIndex === 1 && !hintDartsIsAvailable) {
      this.#disableButton(btnDarts)
      if (!hintCompassIsAvailable) this.#disableButton(btnCompass)

      await this.#startLearning(btnDarts)
      return true
    }

    if (levelIndex === 4 && !hintDartsIsAvailable) {
      this.#disableButton(btnDarts)
      if (!hintCompassIsAvailable) this.#disableButton(btnCompass)

      await this.#startLearning(btnCompass)
      return true
    }

    return false
  }

  // [0]
  isOldPlayer = async ({
    hintDartsIsAvailable,
    hintCompassIsAvailable,
  }: {
    hintDartsIsAvailable: boolean
    hintCompassIsAvailable: boolean
  }) => {
    const {btnDarts, btnCompass} = this.#controller

    if (!hintDartsIsAvailable) {
      this.#disableButton(btnDarts)
      if (!hintCompassIsAvailable) this.#disableButton(btnCompass)

      await this.#startLearning(btnDarts)
      return
    }

    if (!hintCompassIsAvailable) {
      this.#disableButton(btnCompass)
      if (!hintDartsIsAvailable) this.#disableButton(btnDarts)

      await this.#startLearning(btnCompass)
    }
  }

  // Подключает или отключает игровые события обучения.
  #setEvents = (bool: boolean) => {
    const toggle = eventToggle(bool)

    this.#game[toggle.gameOnOff](GAME_EVENTS.completeLevel, this.#destroy)
    this.#game[toggle.gameOnOff](GAME_EVENTS.HINTS.startHint, this.#startHinAction)
  }

  // Блокирует кнопку до прохождения обучения.
  #disableButton = (button: HintButton) => {
    button.isDisabled = true
    button.cursor = 'not-allowed'

    const label = button.getChildByLabel('btnLabel')!
    label.visible = false

    const padlock = this.#createPadlock()
    button.addChild(padlock)

    const icon = button.getChildByLabel('icon')!
    const grayscale = new GrayscaleFilter()
    icon.filters = [grayscale]
    button.grayscaleFilter = grayscale
  }

  // Возвращает кнопке обычное интерактивное состояние.
  #unDisableButton = (button: HintButton) => {
    button.isDisabled = false
    button.cursor = 'pointer'

    const label = button.getChildByLabel('btnLabel')!
    label.visible = true

    gsap.from(label, {x: '-=50', alpha: 0})

    const icon = button.getChildByLabel('icon')!
    icon.filters = []
    button.grayscaleFilter = null
  }

  // Создаёт иконку замка для заблокированной кнопки.
  #createPadlock = () => {
    const sprite = GameUtils.createSprite('hint-padlock', {name: 'padlock'})
    sprite.position.set(-26, 37)
    return sprite
  }

  // [1] ---------------- learning ---------------
  // Запускает обучение для указанной кнопки.
  #startLearning = async (button: HintButton) => {
    HintsLearning.isLearningStarted = true
    this.#targetButton = button

    this.#setIconInfinityVisible(true)
    this.#setEvents(true)

    this.#controller.setInteractive(false)

    const text = button.label === HINT_BUTTON_NAMES.hintDarts ? 'learning.darts' : 'learning.compass1'
    this.#speechBubble = new SpeechBubbleView({
      textMessage: i18next.t(text),
    })
    this.#speechBubble.setPositionY(480)
    this.#arrow = new LearningArrow(button.label)

    this.#hole = new LearningHole(button.label)
    await this.#hole.show()
    await this.#startLearningAnimation(button)

    SdkManager.gameplayStart()

    this.#unDisableButton(button)
    this.#controller.setInteractive(true)

    return this.#stepPromise
  }

  // Переключает бесконечный запас подсказки на время обучения.
  #setIconInfinityVisible = (isVisible: boolean) => {
    const iconInfinity = this.#targetButton!.getChildByLabel('iconInfinity', true)!
    const valueText = this.#targetButton!.getChildByLabel('valueText', true)!

    iconInfinity.visible = !!isVisible
    valueText.visible = !isVisible
  }

  // Проигрывает открытие кнопки и объясняющее сообщение.
  #startLearningAnimation = async (button: HintButton) => {
    const padlock = button.getChildByLabel('padlock')!
    const grayscaleFilter = button.grayscaleFilter

    await this.#timeline!.fromTo([this.#speechBubble], {alpha: 0}, {alpha: 1, visible: true})
      .add(this.#speechBubble!.animateBubble(), '<')
      .add(shake(padlock), '<')
      .to(padlock, {y: '+=55', alpha: 0})
      .to(grayscaleFilter!, {amount: 0, duration: 0.4, ease: 'sine.out'}, '<')
  }

  // Завершает обучение после первого использования подсказки.
  #startHinAction = async (buttonName: HintButtonName) => {
    await gsap.to([this.#hole!.uiFade, this.#speechBubble, this.#arrow], {alpha: 0})

    this.#completeLearning()
    this.#saveProgress(buttonName)
  }

  // Разрешает ожидание шага и очищает обучающие элементы.
  #completeLearning = () => {
    this.#setIconInfinityVisible(false)
    if (this.#stepResolve) this.#stepResolve()

    this.#destroy()
  }

  // Сохраняет доступность изученной подсказки.
  #saveProgress = (buttonName: HintButtonName) => {
    if (buttonName === HINT_BUTTON_NAMES.hintDarts) Locator.storage.playerData.hintDartsIsAvailable = true
    if (buttonName === HINT_BUTTON_NAMES.hintCompass) Locator.storage.playerData.hintCompassIsAvailable = true
  }

  // Удаляет события и все визуальные элементы обучения.
  #destroy = () => {
    Logger.log('[HintsLearning]', '')
    this.#setEvents(false)

    destroyTimeLine(this.#timeline)
    this.#timeline = null

    if (this.#hole) this.#hole.destroy()
    if (this.#speechBubble) this.#speechBubble.destroy({children: true})
    if (this.#arrow) this.#arrow.destroy()

    this.#targetButton = null
    HintsLearning.isLearningStarted = false
    this.#stepResolve = null
    this.#hole = null
    this.#speechBubble = null
    this.#arrow = null
  }
}
