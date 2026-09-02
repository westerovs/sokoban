import {gsap} from 'gsap'
import type {Container, DestroyOptions} from 'pixi.js'
import {Sprite, Texture} from 'pixi.js'
import Locator from '../../../engine/Locator.ts'
import type Game from '../../../Game.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'
import {destroyTimeLine} from '../../../utils/animations/gsapUtils.js'

// Показывает анимированную стрелку рядом с выбранной кнопкой подсказки.

export default class LearningArrow extends Sprite {
  #game = Locator.game
  #arrowTimeLine: gsap.core.Timeline | null = null
  #btnTargetName: string

  // Создаёт стрелку для указанной кнопки подсказки.
  constructor(btnTargetName: string) {
    super({texture: Texture.from('learning-arrow'), label: 'learning-arrow'})
    this.#btnTargetName = btnTargetName

    this.#init()
  }

  // Удаляет стрелку, события и анимацию.
  destroy = (props?: DestroyOptions) => {
    if (this.destroyed) return
    super.destroy(props)

    this.#game.off(GAME_EVENTS.gameResize, this.#resize)
    destroyTimeLine(this.#arrowTimeLine)
    this.#arrowTimeLine = null

    Locator.uiLayer.stateUiLayer.removeChild(this)
  }

  // Инициализирует стрелку и её позиционирование.
  #init = () => {
    if (!this.#btnTargetName) return

    this.anchor.set(0.5, 1)
    this.zIndex = 2
    Locator.uiLayer.stateUiLayer.addChild(this)

    this.#game.on(GAME_EVENTS.gameResize, this.#resize)
    this.#arrowUpdatePosition()
  }

  // Обновляет позицию и запускает циклическую анимацию.
  #arrowUpdatePosition = () => {
    destroyTimeLine(this.#arrowTimeLine)

    const {x, y} = this.#getArrowHintPosition()
    this.scale.set(1)

    return (this.#arrowTimeLine = gsap
      .timeline()
      .set(this, {x, y})
      .fromTo(this, {x, y}, {x: '-=50', y, yoyo: true, repeat: -1}, '<')
      .from(this.scale, {x: 1.1, y: 0.8, yoyo: true, repeat: -1}, '<')
      .fromTo(this, {alpha: 0}, {alpha: 1}, '<'))
  }

  // Вычисляет позицию стрелки относительно целевой кнопки.
  #getArrowHintPosition = () => {
    const {buttonsHintView} = (this.#game as Game & {refs: {buttonsHintView: Container}}).refs
    const btnLoupe = buttonsHintView.getChildByLabel(this.#btnTargetName)!

    this.angle = -90

    const globalCenter = btnLoupe.toGlobal({x: btnLoupe.width / 2, y: 0})
    const localPos = this.parent!.toLocal(globalCenter)

    return {
      x: localPos.x + 10 - btnLoupe.width,
      y: localPos.y,
    }
  }

  // Пересчитывает положение стрелки после изменения размеров игры.
  #resize = () => {
    this.#arrowUpdatePosition()
  }
}
