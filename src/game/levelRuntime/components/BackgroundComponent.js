import {Sprite, Texture} from 'pixi.js'
import {WORLD} from '@/game/gameConfig/constants.js'

export default class BackgroundComponent extends Sprite {
  #view = this
  
  constructor(entity, textureName) {
    super(Texture.from(textureName))
    this.view.label = 'background'
    this.anchor.set(0.5)
    this.position.set(WORLD.HALF_W,  WORLD.HALF_H)
    this.height = WORLD.HEIGHT
  }
  
  get view() {
    return this.#view
  }
}
