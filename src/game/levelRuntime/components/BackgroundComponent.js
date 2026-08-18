import {Sprite, Texture} from 'pixi.js'

export default class BackgroundComponent extends Sprite {
  #view = this
  
  constructor(entity, textureName) {
    super(Texture.from(textureName))
    this.view.label = 'background'
  }
  
  get view() {
    return this.#view
  }
}
