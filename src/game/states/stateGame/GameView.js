import {Container} from 'pixi.js'
import GameUtils, {viewResize} from '../../utils/gameUtils/GameUtils.js'
import {WORLD} from '@/game/gameConfig/constants.js'


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
    background.anchor.set(0.5)
    background.position.set(WORLD.HALF_W,  WORLD.HALF_H)
    background.height = WORLD.HEIGHT

    this.addChild(background)
  }
}
