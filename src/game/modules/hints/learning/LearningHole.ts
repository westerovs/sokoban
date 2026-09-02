import {gsap} from 'gsap'
import type {Container} from 'pixi.js'
import {Graphics} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import type Game from '@/game/Game.js'
import {WORLD} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {GAME_STYLES} from '@/game/styles.js'
import {destroyTimeLine} from '@/game/utils/animations/gsapUtils.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'

// Создаёт затемнение с прозрачной областью вокруг обучаемой кнопки.

export default class LearningHole {
  #game = Locator.game
  #refs: {buttonsHintView: Container}
  #uiFade!: Container
  #holeMask!: Graphics
  #buttonName: string
  #timeLine: gsap.core.Timeline | null = gsap.timeline()

  // Сохраняет имя кнопки и создаёт обучающую маску.
  constructor(buttonName: string) {
    this.#refs = (this.#game as Game & {refs: {buttonsHintView: Container}}).refs
    this.#buttonName = buttonName
    this.init()
  }

  // Возвращает затемняющий слой обучения.
  get uiFade() {
    return this.#uiFade
  }

  // Подключает изменение размера и создаёт маску.
  init = () => {
    this.#game.on(GAME_EVENTS.gameResize, this.#resize)
    this.#createHole()
  }

  // Показывает затемнение и прозрачную область.
  show = async () => {
    await this.#timeLine!.set([this.#refs.buttonsHintView, this.#uiFade], {visible: true})
      .fromTo(this.#uiFade, {alpha: 0}, {alpha: GAME_STYLES.fadeHalfAlpha, duration: 1}, '<')
      .fromTo(this.#holeMask, {alpha: 0}, {alpha: 1}, '<')
  }

  // Скрывает затемняющий слой.
  hide = async () => {
    await this.#timeLine!.to([this.#uiFade], {alpha: 0, duration: 1})
  }

  // Удаляет события, таймлайн и затемняющий слой.
  destroy = () => {
    this.#game.off(GAME_EVENTS.gameResize, this.#resize)
    destroyTimeLine(this.#timeLine)
    this.#timeLine = null

    if (this.#uiFade) {
      Locator.uiLayer.destroyFade()
    }
  }

  // Создаёт затемняющий слой интерфейса.
  #createHole = () => {
    this.#uiFade = Locator.uiLayer.createFade()
    this.#uiFade.zIndex = 2
    this.#uiFade.alpha = 0
    this.#createHoleMask()
  }

  // Создаёт графическую маску с отверстием.
  #createHoleMask = () => {
    const mask = new Graphics({label: 'holeMask'})
    this.#holeMask = mask

    this.#uiFade.mask = mask
    Locator.uiLayer.stateUiLayer.addChild(mask)

    this.#updateHole()
  }

  // Возвращает позицию кнопки в координатах маски.
  #getBtnHintPosition = () => {
    const buttonCircle = this.#getButtonCircle()
    return GameUtils.getLocalPosition(buttonCircle, this.#holeMask)
  }

  // Возвращает круг подложки целевой кнопки.
  #getButtonCircle = () => {
    const {buttonsHintView} = this.#refs
    const button = buttonsHintView.getChildByLabel(this.#buttonName)!
    const buttonCircle = button.getChildByLabel('btnHintCircle')!

    return buttonCircle
  }

  // Перерисовывает отверстие маски по текущей позиции кнопки.
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

  // Перерисовывает отверстие после изменения размеров игры.
  #resize = () => {
    this.#updateHole()
  }
}
