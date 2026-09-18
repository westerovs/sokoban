import {gsap} from 'gsap'
import type {DestroyOptions, PointData} from 'pixi.js'
import {Container, Sprite} from 'pixi.js'
import GameUtils from './gameUtils/GameUtils.ts'

const APPEARANCE_INTERVAL = 10 // Интервал между началами подсказок в секундах
const ANIMATION_DURATION = 3 // Полная длительность анимации в секундах
const HAND_SCALE = 0.78 // Базовый масштаб руки

export default class Hint extends Container {
  #animation: gsap.core.Timeline | null = null
  #hand!: Sprite
  #showCall: gsap.core.Tween | null = null
  #target: Container | null = null
  #targetPoint: PointData | null = null

  constructor() {
    super({label: 'hint'})

    this.eventMode = 'none'
    this.visible = false
    this.#init()
  }

  start = (target: Container, targetPoint: PointData | null = null) => {
    this.stop()
    this.#target = target
    this.#targetPoint = targetPoint
    this.#play()
  }

  stop = () => {
    this.#showCall?.kill()
    this.#animation?.kill()
    this.#showCall = null
    this.#animation = null
    this.#target = null
    this.#targetPoint = null
    this.visible = false
  }

  override destroy(options?: DestroyOptions) {
    this.stop()
    super.destroy(options)
  }

  #init = () => {
    this.#hand = GameUtils.createSprite('hint', {label: 'hint-hand'})
    this.#hand.anchor.set(0.08, 0.83)
    this.addChild(this.#hand)
  }

  #scheduleNextAppearance = () => {
    this.#showCall = gsap.delayedCall(APPEARANCE_INTERVAL, this.#play)
  }

  #play = () => {
    this.#showCall = null
    if (!this.#target || this.#target.destroyed || !this.parent) return this.stop()

    this.#scheduleNextAppearance()
    const targetPosition = this.#getTargetPosition()
    this.#prepareAnimation(targetPosition.x, targetPosition.y)
    this.#animation = this.#createTapAnimation(targetPosition.x, targetPosition.y)
  }

  #getTargetPosition = () => {
    const bounds = this.#target!.getLocalBounds()
    const center = this.#targetPoint ?? {x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2}
    return this.parent!.toLocal(this.#target!.toGlobal(center))
  }

  #prepareAnimation = (targetX: number, targetY: number) => {
    this.visible = true
    this.alpha = 1
    this.position.set(targetX + 42, targetY - 42)
    this.scale.set(HAND_SCALE)
  }

  #createTapAnimation = (targetX: number, targetY: number) => {
    const animation = gsap.timeline({
      onComplete: () => {
        this.visible = false
        this.#animation = null
      },
    })

    animation.to(this.position, {x: targetX + 10, y: targetY - 10, duration: 0.55, ease: 'power2.out'}, 0)
    this.#addTap(animation, targetX, targetY, 0.65)
    this.#addTap(animation, targetX, targetY, 1.25)
    this.#addTap(animation, targetX, targetY, 1.85)
    animation.to(this, {alpha: 0, duration: 0.45}, ANIMATION_DURATION - 0.45)
    return animation
  }

  #addTap = (animation: gsap.core.Timeline, targetX: number, targetY: number, startTime: number) => {
    animation.to(this.position, {x: targetX, y: targetY, duration: 0.18, ease: 'power2.in'}, startTime)
    animation.to(this.scale, {x: 0.66, y: 0.66, duration: 0.18, ease: 'power2.in'}, startTime)
    animation.to(
      this.position,
      {x: targetX + 10, y: targetY - 10, duration: 0.22, ease: 'power2.out'},
      startTime + 0.18,
    )
    animation.to(this.scale, {x: HAND_SCALE, y: HAND_SCALE, duration: 0.22, ease: 'power2.out'}, startTime + 0.18)
  }
}
