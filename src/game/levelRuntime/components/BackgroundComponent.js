import {Sprite, Texture} from 'pixi.js'
import {WORLD} from '../../gameConfig/constants.js'

export default class BackgroundComponent extends Sprite {
  #view = this
  
  constructor(_entity, textureName) {
    super(Texture.from(textureName))
    this.label = 'level-background'
    this.anchor.set(0.5)
    this.position.set(WORLD.HALF_W, WORLD.HALF_H)
    this.height = WORLD.HEIGHT
    this.zIndex = -2
  }
  
  get view() {
    return this.#view
  }
}
