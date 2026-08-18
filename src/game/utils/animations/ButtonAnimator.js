import {gsap} from 'gsap'
import {clearTimeLine} from './gsapUtils.js'

const clickAnimations = new WeakMap()

export default class ButtonAnimator {
  
  static click(target, x = 0.1, y = 0.1) {
    if (!target) return Promise.resolve()
    
    if (clickAnimations.has(target)) {
      return clickAnimations.get(target)
    }
    
    const {x: startX, y: startY} = target.scale
    
    const promise = new Promise(resolve => {
      const tl = gsap.timeline({
        onComplete: () => {
          clearTimeLine(tl)
          clickAnimations.delete(target)
          resolve()
        }
      })
      
      tl.to(target.scale, {x: startX - x, y: startY - y, duration: 0.1, yoyo: true, repeat: 1})
    })
    
    clickAnimations.set(target, promise)
    return promise
  }

  
  // Статический метод для инициализации обработчиков pointerover и pointerout
  static initOverHandler(target, overScale, outScale) {
    const targets = Array.isArray(target) ? target : [target]
    
    targets.forEach(item => {
      if (!item) return
      
      const defaultOverScaleX = item.scale.x - Math.sign(item.scale.x) * 0.05
      const defaultOverScaleY = item.scale.y - Math.sign(item.scale.y) * 0.05
      
      const finalOverScale = {
        x: overScale !== undefined ? overScale : defaultOverScaleX,
        y: overScale !== undefined ? overScale : defaultOverScaleY
      }
      
      const finalOutScale = {
        x: outScale !== undefined ? outScale : item.scale.x,
        y: outScale !== undefined ? outScale : item.scale.y
      }
      
      item.on('pointerover', () => gsap.to(item.scale, { x: finalOverScale.x, y: finalOverScale.y, duration: 0.2 }))
      item.on('pointerout', () => gsap.to(item.scale, { x: finalOutScale.x, y: finalOutScale.y, duration: 0.2 }))
    })
  }
}
