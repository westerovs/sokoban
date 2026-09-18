import {gsap} from 'gsap'
import type {DestroyOptions, PointData} from 'pixi.js'
import {Container, Sprite} from 'pixi.js'
import GameUtils from './gameUtils/GameUtils.ts'

const HAND_SCALE = 0.78 // Базовый масштаб руки
const TAP_SCALE = 0.66 // Масштаб руки в момент нажатия
const TAP_APPROACH_OFFSET = 34 // Смещение руки перед нажатием
const SWIPE_DURATION = 0.7 // Длительность одного свайпа в секундах

type HintSwipeStep = {
  deltaX: number
  deltaY?: number
  type: 'swipe'
}

type HintTapStep = {
  count?: number
  type: 'tap'
}

type HintStep = HintSwipeStep | HintTapStep

type HintOptions = {
  steps?: readonly HintStep[]
  targetPoint?: PointData | null
}

const DEFAULT_STEPS: readonly HintStep[] = [{type: 'tap', count: 3}]

export default class Hint extends Container {
  #animation: gsap.core.Timeline | null = null
  #hand!: Sprite
  #steps: readonly HintStep[] = DEFAULT_STEPS
  #target: Container | null = null
  #targetPoint: PointData | null = null

  constructor() {
    super({label: 'hint'})

    this.eventMode = 'none'
    this.visible = false
    this.#init()
  }

  start = (target: Container, {steps = DEFAULT_STEPS, targetPoint = null}: HintOptions = {}) => {
    this.stop()
    this.#target = target
    this.#targetPoint = targetPoint
    this.#steps = steps
    this.#play()
  }

  stop = () => {
    this.#animation?.kill()
    this.#animation = null
    this.#clearTarget()
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

  #play = () => {
    if (!this.#target || this.#target.destroyed || !this.parent) return this.stop()
    const targetPosition = this.#getTargetPosition()
    this.#prepareAnimation(targetPosition)
    this.#animation = this.#createAnimation(targetPosition)
  }

  #getTargetPosition = () => {
    const bounds = this.#target!.getLocalBounds()
    const center = this.#targetPoint ?? {x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2}
    return this.parent!.toLocal(this.#target!.toGlobal(center))
  }

  #prepareAnimation = ({x, y}: PointData) => {
    this.visible = true
    this.alpha = 0
    this.position.set(x, y)
    this.scale.set(HAND_SCALE)
  }

  #createAnimation = (target: PointData) => {
    const timeline = gsap.timeline({onComplete: this.#finishAnimation})
    this.#steps.forEach((step) => this.#addStep(timeline, target, step))
    timeline.to(this, {alpha: 0, duration: 0.2})
    return timeline
  }

  #addStep = (timeline: gsap.core.Timeline, target: PointData, step: HintStep) => {
    if (step.type === 'swipe') {
      this.#addSwipe(timeline, target, step)
      return
    }
    this.#addTaps(timeline, target, step.count ?? 1)
  }

  #addSwipe = (timeline: gsap.core.Timeline, target: PointData, step: HintSwipeStep) => {
    const start = {x: target.x - step.deltaX / 2, y: target.y - (step.deltaY ?? 0) / 2}
    const end = {x: target.x + step.deltaX / 2, y: target.y + (step.deltaY ?? 0) / 2}
    timeline.set(this.position, start)
    timeline.set(this.scale, {x: HAND_SCALE, y: HAND_SCALE})
    timeline.to(this, {alpha: 1, duration: 0.12})
    timeline.to(this.position, {...end, duration: SWIPE_DURATION, ease: 'power1.inOut'})
    timeline.to(this, {alpha: 0, duration: 0.18})
  }

  #addTaps = (timeline: gsap.core.Timeline, target: PointData, count: number) => {
    timeline.set(this.position, {x: target.x + TAP_APPROACH_OFFSET, y: target.y - TAP_APPROACH_OFFSET})
    timeline.set(this.scale, {x: HAND_SCALE, y: HAND_SCALE})
    timeline.to(this, {alpha: 1, duration: 0.12})
    timeline.to(this.position, {x: target.x + 10, y: target.y - 10, duration: 0.25, ease: 'power2.out'})
    for (let index = 0; index < count; index += 1) this.#addTap(timeline, target)
  }

  #addTap = (timeline: gsap.core.Timeline, target: PointData) => {
    timeline.to(this.position, {x: target.x, y: target.y, duration: 0.18, ease: 'power2.in'})
    timeline.to(this.scale, {x: TAP_SCALE, y: TAP_SCALE, duration: 0.18, ease: 'power2.in'}, '<')
    timeline.to(this.position, {x: target.x + 10, y: target.y - 10, duration: 0.22, ease: 'power2.out'})
    timeline.to(this.scale, {x: HAND_SCALE, y: HAND_SCALE, duration: 0.22, ease: 'power2.out'}, '<')
  }

  #finishAnimation = () => {
    this.#animation = null
    this.visible = false
    this.#clearTarget()
  }

  #clearTarget = () => {
    this.#target = null
    this.#targetPoint = null
    this.#steps = DEFAULT_STEPS
  }
}

// prettier-ignore
export type {
  HintOptions,
  HintStep,
}
