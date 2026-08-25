import {gsap} from 'gsap'
import Locator from '../../../engine/Locator.ts'
import {destroyTimeLine} from '../../../utils/animations/gsapUtils.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'
import {Sprite, Texture} from 'pixi.js'


// todo адаптировать под step FirstLearning
export default class LearningArrow extends Sprite {
  #game = Locator.game
  #arrowTimeLine
  #btnTargetName

  constructor(btnTargetName) {
    super(Texture.from('learning-arrow'))
    this.#btnTargetName = btnTargetName
    
    this.#init()
  }
  
  destroy = (props) => {
    if (this.destroyed) return
    super.destroy(props)
    
    this.#game.off(GAME_EVENTS.gameResize, this.#resize)
    destroyTimeLine(this.#arrowTimeLine)
    this.#arrowTimeLine = null
    
    Locator.uiLayer.stateUiLayer.removeChild(this)
  }
  
  #init = () => {
    if (!this.#btnTargetName) return
    
    this.anchor.set(0.5, 1)
    this.zIndex = 2
    Locator.uiLayer.stateUiLayer.addChild(this)
    
    this.#game.on(GAME_EVENTS.gameResize, this.#resize)
    this.#arrowUpdatePosition()
  }

  #arrowUpdatePosition = () => {
    destroyTimeLine(this.#arrowTimeLine)
    
    const {x, y} = this.#getArrowHintPosition()
    this.scale.set(1)
    
    return this.#arrowTimeLine = gsap.timeline()
      .set(this, {x, y})
      .fromTo(this, {x, y}, {x: '-=50', y, yoyo: true, repeat: -1}, '<')
      .from(this.scale, {x: 1.1, y: 0.8, yoyo: true, repeat: -1}, '<')
      .fromTo(this, {alpha: 0}, {alpha: 1}, '<')
  }
  
  #getArrowHintPosition = () => {
    const {buttonsHintView} = this.#game.refs
    const btnLoupe = buttonsHintView.getChildByLabel(this.#btnTargetName)

    this.angle = - 90

    const globalCenter = btnLoupe.toGlobal({x: btnLoupe.width / 2, y: 0})
    const localPos = this.parent.toLocal(globalCenter)

    return {
      x: (localPos.x + 10) - (btnLoupe.width),
      y: localPos.y,
    }
  }
  
  #resize = () => {
    this.#arrowUpdatePosition()
  }
}
