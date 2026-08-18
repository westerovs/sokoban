import {Sprite, Texture} from 'pixi.js'
import {gsap} from 'gsap'
import Locator from '@/game/engine/Locator.ts'
import {Logger, MODULES} from '@/game/utils/Logger.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'

export default class ErrorCross {
  #game = Locator.game
  #camera = null
  #initCameraPosition = null
  #initPosition = {x: 0, y: 0}
  #cross
  #currentTween = null
  
  constructor() {
    this.#camera = this.#game.camera
    this.#cross = this.createErrorCross()
    this.#cross.setEvents = this.setEvents
    
    this.setEvents(true)
  }
  
  createErrorCross = () => {
    if (this.#cross) return
    
    const sprite = new Sprite(Texture.from('error-cross'))
    sprite.label = 'errorCross'
    sprite.zIndex = 1
    sprite.eventMode = 'none'
    sprite.anchor.set(0.5)
    sprite.visible = false
    
    this.#camera.addChild(sprite)
    return sprite
  }
  
  setPause = (bool) => {
    if (bool) {
      this.setEvents(true)
      this.#cross.renderable = true
      return
    }
    
    this.#cross.renderable = false
    this.setEvents(false)
  }
  
  setEvents = (bool) => {
    const status = bool ? 'on' : 'off'
    
    this.#game[status](GAME_EVENTS.endHit, this.#reset)
    this.#game[status](GAME_EVENTS.completeLevel,  this.setEvents.bind(this, false))
    this.#camera[status]('pointerdown', this.#onHandlerDown)
    this.#camera[status]('pointerup', this.#onHandlerUp)
  }
  
  clear = (log) => {
    if (log) Logger.log(MODULES.DestroyMessage,'[ErrorCross] module clear')
    this.#reset()
    
    this.#game.off(GAME_EVENTS.endHit, this.#reset)
    this.#camera.off('pointerdown', this.#onHandlerDown)
    this.#camera.off('pointerup', this.#onHandlerUp)
    
    this.#cross.visible = false
    this.#cross.eventMode = 'auto'
  }
  
  #reset = () => {
    if (this.#currentTween) {
      this.#currentTween.kill()
      this.#currentTween.clear()
      this.#cross.visible = false
    }
  }
  
  #onHandlerDown = (event) => {
    this.#initPosition = this.#camera.toLocal(event.global)
    this.#initCameraPosition = {x: this.#camera.left, y: this.#camera.top}
    this.disabledClick = false
  }
  
  #onHandlerUp = (event) => {
    const target = event.target
    if (this.disabledClick) return
    if (target.label === 'errorCross') return
    if (!this.#initCameraPosition) return
    
    const finalPosition = this.#camera.toLocal(event.global)
    // Смещение камеры по `left` и `top`
    const cameraShiftX = this.#camera.left - this.#initCameraPosition.x
    const cameraShiftY = this.#camera.top - this.#initCameraPosition.y

    // Корректируем финальные позиции с учётом смещения камеры
    const deltaX = (this.#initPosition.x - finalPosition.x) + cameraShiftX
    const deltaY = (this.#initPosition.y - finalPosition.y) + cameraShiftY
    const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    if (delta > 2) return
    if (target?.isAlive === false && target.visible) return
    if (target.typeName === 'hogItemContainer') return
    this.#reset()
    
    Locator.soundManager.play('sfx_missClick')
    this.#runAnimation(finalPosition)
    
    this.#game.emit(GAME_EVENTS.missClick, true)
  }
  
  #runAnimation = (finalPosition) => {
    const scaleFactor = 1 / this.#camera.scale.x  // Учитываем текущий масштаб камеры
    
    this.#currentTween = gsap.timeline({duration: 0.1, yoyo: true, repeat: 0})
      .set([this.#cross], {x: finalPosition.x, y: finalPosition.y}, '<')
      .set([this.#cross], {visible: true}, '<')
      .set([this.#cross], {alpha: 1, duration: 0.3}, '<')
      .fromTo([this.#cross.scale], {x: 0, y: 0}, {x: 0.6 * scaleFactor, y: 0.6 * scaleFactor}, '<')  // Масштабируем крестик
      .to([this.#cross], {alpha: 0, delay: 0.5, duration: 0.2}, '<')
      .eventCallback('onComplete', () => {
        this.#cross.visible = false
      })
  }
}
