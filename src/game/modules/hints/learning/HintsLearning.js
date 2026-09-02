import {gsap} from 'gsap'
import i18next from 'i18next'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {HINT_BUTTON_NAMES} from '@/game/modules/hints/HintsController.js'
import SpeechBubbleView from '@/game/ui/common/speechBubble/SpeechBubbleView.js'
import {destroyTimeLine, shake} from '@/game/utils/animations/gsapUtils.js'
import GrayscaleFilter from '@/game/utils/filters/GrayscaleFilter.js'
import GameUtils, {eventToggle} from '@/game/utils/gameUtils/GameUtils.js'
import Logger from '@/game/utils/Logger.js'
import LearningArrow from './LearningArrow.js'
import LearningHole from './LearningHole.js'

/*
 * Для дротиков и компаса используется одинаковое обучение клика по кнопке
 * Но для компаса, после его появления на сцене используется дополнительное обучение его перемещения
 * */
export default class HintsLearning {
  #game = Locator.game
  #stepPromise = null
  #stepResolve = null
  #controller
  #level
  #hole
  #speechBubble
  #arrow
  #timeline = gsap.timeline()
  #targetButton

  static isLearningStarted

  constructor(controller) {
    this.#controller = controller
    this.#level = this.#game.level

    HintsLearning.isLearningStarted = false

    this.#stepPromise = new Promise((resolve) => {
      this.#stepResolve = resolve
    })
  }

  get speechBubble() {
    return this.#speechBubble
  }

  get stepPromise() {
    return this.#stepPromise
  }

  init = async () => {
    const {hintDartsIsAvailable, hintCompassIsAvailable} = Locator.storage.playerData

    const newPlayerHandled = await this.isNewPlayer({hintDartsIsAvailable, hintCompassIsAvailable})
    if (newPlayerHandled) return

    await this.isOldPlayer({hintDartsIsAvailable, hintCompassIsAvailable})
  }

  // [0] ---------------- prepare ---------------
  isNewPlayer = async ({hintDartsIsAvailable, hintCompassIsAvailable}) => {
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
  isOldPlayer = async ({hintDartsIsAvailable, hintCompassIsAvailable}) => {
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

  #setEvents = (bool) => {
    const toggle = eventToggle(bool)

    this.#game[toggle.gameOnOff](GAME_EVENTS.completeLevel, this.#destroy)
    this.#game[toggle.gameOnOff](GAME_EVENTS.HINTS.startHint, this.#startHinAction)
  }

  #disableButton = (button) => {
    button.isDisabled = true
    button.cursor = 'not-allowed'

    const label = button.getChildByLabel('btnLabel')
    label.visible = false

    const padlock = this.#createPadlock()
    button.addChild(padlock)

    const icon = button.getChildByLabel('icon')
    const grayscale = new GrayscaleFilter()
    icon.filters = [grayscale]
    button.grayscaleFilter = grayscale
  }

  #unDisableButton = (button) => {
    button.isDisabled = false
    button.cursor = 'pointer'

    const label = button.getChildByLabel('btnLabel')
    label.visible = true

    gsap.from(label, {x: '-=50', alpha: 0})

    const icon = button.getChildByLabel('icon')
    icon.filters = []
    button.grayscaleFilter = null
  }

  #createPadlock = () => {
    const sprite = GameUtils.createSprite('hint-padlock', {name: 'padlock'})
    sprite.position.set(-26, 37)
    return sprite
  }

  // [1] ---------------- learning ---------------
  #startLearning = async (button) => {
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

  #setIconInfinityVisible = (isVisible) => {
    const iconInfinity = this.#targetButton.getChildByLabel('iconInfinity', 1)
    const valueText = this.#targetButton.getChildByLabel('valueText', 1)

    iconInfinity.visible = !!isVisible
    valueText.visible = !isVisible
  }

  #startLearningAnimation = async (button) => {
    const padlock = button.getChildByLabel('padlock')
    const grayscaleFilter = button.grayscaleFilter

    await this.#timeline
      .fromTo([this.#speechBubble], {alpha: 0}, {alpha: 1, visible: true})
      .add(this.#speechBubble.animateBubble(), '<')
      .add(shake(padlock), '<')
      .to(padlock, {y: '+=55', alpha: 0})
      .to(grayscaleFilter, {amount: 0, duration: 0.4, ease: 'sine.out'}, '<')
  }

  #startHinAction = async (buttonName) => {
    await gsap.to([this.#hole.uiFade, this.#speechBubble, this.#arrow], {alpha: 0})

    this.#completeLearning()
    this.#saveProgress(buttonName)
  }

  #completeLearning = () => {
    this.#setIconInfinityVisible(false)
    if (this.#stepResolve) this.#stepResolve()

    this.#destroy()
  }

  #saveProgress = (buttonName) => {
    if (buttonName === HINT_BUTTON_NAMES.hintDarts) Locator.storage.playerData.hintDartsIsAvailable = true
    if (buttonName === HINT_BUTTON_NAMES.hintCompass) Locator.storage.playerData.hintCompassIsAvailable = true
  }

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
