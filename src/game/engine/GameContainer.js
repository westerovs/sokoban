import {Container} from 'pixi.js'
import {WORLD} from '@/game/gameConfig/constants.js'
import Locator from './Locator.js'
import DebugRect from '../utils/debug/DebugRect.ts'

/**
 * Специальный контейнер для стейтов, который центрируется и масштабируется относительно центра экрана
 * и всегда занимает ширину и высоту всего мира.
 */

export default class GameContainer extends Container {
  #debugRect = null
  #isDebug = false
  
  constructor(game) {
    super({label: 'GameContainer', sortableChildren: true})

    this.game = game
    this.#init()
  }
  
  resize = () => {
    const {scaleFactor, x, y} = Locator.gameResize.resizeData
    this.scale.set(scaleFactor)
    this.position.set(x, y)
    
    this.#updateDebugRect()
  }
  
  #init() {
    this.#createDebugRect()
  }
  
  #createDebugRect() {
    if (!this.#isDebug) return
    
    this.#debugRect = new DebugRect({
      color: 0xFF0000,
      label: 'GameContainerDebugRect',
    })
    this.#debugRect.zIndex = 2
    this.addChild(this.#debugRect)
    this.#updateDebugRect()
  }
  
  #updateDebugRect() {
    if (!this.#isDebug) return
    
    this.#debugRect?.update({
      width: WORLD.WIDTH,
      height: WORLD.HEIGHT,
      scale: this.scale.x,
    })
  }

}
