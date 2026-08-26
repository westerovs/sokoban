import {gsap} from 'gsap'
import Locator from '../../engine/Locator.ts'
import {GAME_STYLES} from '../../styles.js'
import MathTools from '../MathTools.js'

/**
 * Utils связанные с GSAP
 * */

const clearTimeLine = (timeLine, remove = false, progress = 0) => {
  if (timeLine) {
    timeLine.progress(progress) // Перематываем анимацию к начальному состоянию
    timeLine.kill() // Остановить текущую анимацию
    timeLine.clear() // Очистить таймлайн

    if (remove) timeLine = null
  }

  return timeLine
}

const destroyTimeLine = (timeLine) => {
  if (timeLine) {
    timeLine.kill()
    timeLine.clear()
  }

  return timeLine
}

const checkoutFade = (fade, {hide, fadeToHalf, fadeInFromZeroToHalf, fadeInFromFullToHalf, fadeToDark, duration = 0.3}) => {
  fade.visible = true

  // 1 > 0
  if (hide) {
    return gsap.to(fade, {alpha: 0, visible: false, duration})
  }
  // X > 0.65
  if (fadeToHalf) {
    return gsap.to(fade, {alpha: GAME_STYLES.fadeHalfAlpha, duration})
  }
  // 0 > 0.5
  if (fadeInFromZeroToHalf) {
    return gsap.fromTo(fade, {alpha: 0}, {alpha: GAME_STYLES.fadeHalfAlpha, duration})
  }
  // 1 > 0.5
  if (fadeInFromFullToHalf) {
    return gsap.fromTo(fade, {alpha: 1}, {alpha: GAME_STYLES.fadeHalfAlpha, duration})
  }
  // X > 1
  if (fadeToDark) {
    return gsap.to(fade, {alpha: 1, duration})
  }
}

const typewriterEffect = async (target, text) => {
  target.text = ''
  const chars = text.split('')
  const baseDelay = 0.01

  for (let i = 0; i < chars.length; i++) {
    await new Promise((resolve) => {
      const random = MathTools.getRandomNumber(0.01, 0.05)

      gsap
        .to(
          {},
          {
            duration: 0.1,
            delay: i === 0 ? 0 : baseDelay + random,
            onComplete: () => {
              target.text += chars[i]
              resolve()
            },
          },
        )
        .timeScale(1.5)
    })
  }
}

const animateCounter = (target, fromValue, toValue, duration = 1) => {
  return new Promise((resolve) => {
    const obj = {value: fromValue}

    gsap.to(obj, {
      value: toValue,
      duration,
      roundProps: 'value',
      onUpdate: () => {
        target.text = Math.floor(obj.value)
      },
      onComplete: () => {
        resolve()
      },
    })
  })
}

const animateDots = (game, dots, delay) => {
  let currentAnimationTime = 0
  const centreY = 0
  const amplitude = 10

  const animate = () => {
    currentAnimationTime += 0.09

    dots.forEach((item, index) => {
      if (index === 0) item.y = centreY + Math.sin(currentAnimationTime) * amplitude
      if (index === 1) item.y = centreY + Math.sin(currentAnimationTime - 1) * amplitude
      if (index === 2) item.y = centreY + Math.sin(currentAnimationTime - 2) * amplitude
    })
  }

  game.app.ticker.add(animate)

  gsap.delayedCall(delay + 0.5, () => {
    game.app.ticker.remove(animate)
  })
}

const jump = (target, repeat = -1) => {
  const duration = 0.2
  const angle = 3
  const initialScaleX = target.scale.x
  const initialScaleY = target.scale.y
  const jumpHeight = 5

  return gsap
    .timeline({repeat: repeat})
    .to(target.scale, {y: initialScaleY * 0.95, x: initialScaleX * 1.05, duration: duration, ease: 'sine.in'})
    .to(target, {y: `-=${jumpHeight}`, duration: duration, ease: 'sine.out'})
    .to(target, {angle: angle, duration: duration, ease: 'none'}, '<')
    .to(target.scale, {y: initialScaleY, x: initialScaleX, duration: duration, ease: 'sine.out'}, '<')
    .to(target, {y: target.y, duration: duration, ease: 'sine.in'})
    .to(target, {angle: 0, duration: duration, ease: 'none'}, '<')
    .to(target.scale, {y: initialScaleY * 0.95, x: initialScaleX * 1.05, duration: duration, ease: 'sine.in'})
    .to(target, {y: `-=${jumpHeight}`, duration: duration, ease: 'sine.out'})
    .to(target, {angle: -angle, duration: duration, ease: 'none'}, '<')
    .to(target.scale, {y: initialScaleY, x: initialScaleX, duration: duration, ease: 'sine.out'}, '<')
    .to(target, {y: target.y, duration: duration, ease: 'sine.in'})
    .to(target, {angle: 0, duration: duration, ease: 'none'}, '<')
}

const shake = (el) => {
  return gsap
    .timeline({repeat: 1, yoyo: true})
    .to(el.scale, {x: 1.2, y: 1.2, duration: 0.06, yoyo: true})
    .to(el, {x: '+=3', y: '+=2', duration: 0.06, ease: 'linear'}, '<')
    .to(el, {x: '-=6', y: '-=3', duration: 0.06, ease: 'linear'})
    .to(el, {x: '+=4', y: '+=2', duration: 0.06, ease: 'linear'})
    .to(el, {x: '-=1', y: '-=1', duration: 0.06, ease: 'linear'})
}

const shakeX = (el) => {
  const initX = el.x
  const duration = 0.05
  return gsap
    .timeline({repeat: 1, yoyo: true})
    .to(el.scale, {x: 0.9, y: 0.9, duration: duration, yoyo: true})
    .to(el, {x: '-=10', duration: duration, ease: 'linear'}, '<')
    .to(el, {x: '+=10', duration: duration, ease: 'linear'})
    .to(el, {x: '+=10', duration: duration, ease: 'linear'})
    .to(el, {x: '-=10', duration: duration, ease: 'linear'})
    .to(el, {x: '-=10', duration: duration, ease: 'linear'})
    .to(el, {x: '+=10', duration: duration, ease: 'linear'})
    .to(el, {x: initX, duration: duration, ease: 'linear'})
}

export {animateCounter, animateDots, checkoutFade, clearTimeLine, destroyTimeLine, jump, shake, shakeX, typewriterEffect}
