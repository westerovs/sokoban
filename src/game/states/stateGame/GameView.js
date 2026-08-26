import {Container} from 'pixi.js'
import GameUtils from '../../utils/gameUtils/GameUtils.js'

export default class GameView extends Container {
  #background
  #backgroundName

  constructor() {
    super({label: 'game-view', sortableChildren: true})

    this.refs = {}
    this.#init()
  }

  setBackground = (textureName) => {
    if (textureName === this.#backgroundName) return

    this.#background?.destroy()
    this.#background = GameUtils.createSprite(textureName, {label: `game-background-${textureName}`})
    this.#background.anchor.set(0)
    this.#background.width = 2560
    this.#background.height = 1080
    this.#background.zIndex = -1
    this.#backgroundName = textureName
    this.addChildAt(this.#background, 0)
  }

  #init = () => {
    this.#createBackground()
  }

  #createBackground() {
    this.setBackground('startScreen')
  }
}
