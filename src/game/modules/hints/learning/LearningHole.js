import {gsap} from 'gsap'
import {Graphics} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {WORLD} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {GAME_STYLES} from '@/game/styles.js'
import {destroyTimeLine} from '@/game/utils/animations/gsapUtils.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'

// todo адаптировать под step FirstLearning
export default class LearningHole {
  #game = Locator.game
  #refs = this.#game.refs
  #uiFade
  #holeMask
  #buttonName
  #timeLine = gsap.timeline()

  constructor(buttonName) {
    this.#buttonName = buttonName
    this.init()
  }

  get uiFade() {
    return this.#uiFade
  }

  init = () => {
    this.#game.on(GAME_EVENTS.gameResize, this.#resize)
    this.#createHole()
  }

  show = async () => {
    await this.#timeLine
      .set([this.#refs.buttonsHintView, this.#uiFade], {visible: true})
      .fromTo(this.#uiFade, {alpha: 0}, {alpha: GAME_STYLES.fadeHalfAlpha, duration: 1}, '<')
      .fromTo(this.#holeMask, {alpha: 0}, {alpha: 1}, '<')
  }

  hide = async () => {
    await this.#timeLine.to([this.#uiFade], {alpha: 0, duration: 1})
  }

  destroy = () => {
    this.#game.off(GAME_EVENTS.gameResize, this.#resize)
    destroyTimeLine(this.#timeLine)
    this.#timeLine = null

    if (this.#uiFade) {
      Locator.uiLayer.destroyFade()
    }
  }

  #createHole = () => {
    this.#uiFade = Locator.uiLayer.createFade()
    this.#uiFade.zIndex = 2
    this.#uiFade.alpha = 0
    this.#createHoleMask()
  }

  #createHoleMask = () => {
    const mask = new Graphics()
    this.#holeMask = mask
    mask.label = 'holeMask'

    this.#uiFade.mask = mask
    Locator.uiLayer.stateUiLayer.addChild(mask)

    this.#updateHole()
  }

  #getBtnHintPosition = () => {
    const buttonCircle = this.#getButtonCircle()
    return GameUtils.getLocalPosition(buttonCircle, this.#holeMask)
  }

  #getButtonCircle = () => {
    const {buttonsHintView} = this.#game.refs
    const button = buttonsHintView.getChildByLabel(this.#buttonName)
    const buttonCircle = button.getChildByLabel('btnHintCircle')

    return buttonCircle
  }

  #updateHole = () => {
    const buttonCircle = this.#getButtonCircle()

    const {x, y} = this.#getBtnHintPosition()
    const radius = buttonCircle.width / 1.2
    const uiFade = this.#uiFade
    const holeMask = this.#holeMask
    holeMask.clear()
    // fade rect
    holeMask
      .rect(uiFade.x, uiFade.y, WORLD.WIDTH, WORLD.HEIGHT)
      .fill(0xffffff)
      .circle(x - buttonCircle.width / 2, y, radius)
      .cut()
  }

  #resize = () => {
    this.#updateHole()
  }
}
