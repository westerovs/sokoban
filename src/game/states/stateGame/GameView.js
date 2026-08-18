import {Container} from 'pixi.js'
import GameUtils, {viewResize} from '../../utils/gameUtils/GameUtils.js'


export default class GameView extends Container {
  constructor() {
    super()

    this.refs = {}
    this.sortableChildren = true
    this.label = 'gameView'

    this.#init()
  }
  
  resize() {
    return viewResize(this.refs)
  }
  
  #init = () => {
    this.#createBackground()
  }

  #createBackground() {
    const background = GameUtils.createSprite('startScreen')
    background.anchor.set(0)
    background.width = 2560
    background.height = 1080

    this.addChild(background)
  }
}
