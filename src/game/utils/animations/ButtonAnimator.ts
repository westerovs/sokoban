import {gsap} from 'gsap'
import type {Container} from 'pixi.js'
import {clearTimeLine} from './gsapUtils.js'

// Управляет стандартными анимациями нажатия и наведения для кнопок.

const clickAnimations = new WeakMap<Container, Promise<void>>()

export default class ButtonAnimator {
  // Проигрывает короткую анимацию нажатия и не запускает её повторно для той же кнопки.
  static click(target: Container | null | undefined, x = 0.1, y = 0.1): Promise<void> {
    if (!target) return Promise.resolve()

    const activeAnimation = clickAnimations.get(target)
    if (activeAnimation) return activeAnimation

    const {x: startX, y: startY} = target.scale

    const promise = new Promise<void>((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => {
          clearTimeLine(tl)
          clickAnimations.delete(target)
          resolve()
        },
      })

      tl.to(target.scale, {x: startX - x, y: startY - y, duration: 0.1, yoyo: true, repeat: 1})
    })

    clickAnimations.set(target, promise)
    return promise
  }

  // Инициализирует обработчики pointerover и pointerout.
  static initOverHandler(target: Container | null | Array<Container | null>, overScale?: number, outScale?: number) {
    const targets = Array.isArray(target) ? target : [target]

    targets.forEach((item) => {
      if (!item) return

      const defaultOverScaleX = item.scale.x - Math.sign(item.scale.x) * 0.05
      const defaultOverScaleY = item.scale.y - Math.sign(item.scale.y) * 0.05

      const finalOverScale = {
        x: overScale !== undefined ? overScale : defaultOverScaleX,
        y: overScale !== undefined ? overScale : defaultOverScaleY,
      }

      const finalOutScale = {
        x: outScale !== undefined ? outScale : item.scale.x,
        y: outScale !== undefined ? outScale : item.scale.y,
      }

      item.on('pointerover', () => gsap.to(item.scale, {x: finalOverScale.x, y: finalOverScale.y, duration: 0.2}))
      item.on('pointerout', () => gsap.to(item.scale, {x: finalOutScale.x, y: finalOutScale.y, duration: 0.2}))
    })
  }
}
