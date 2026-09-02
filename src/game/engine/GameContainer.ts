import {Container} from 'pixi.js'
import {WORLD} from '@/game/gameConfig/constants.js'
import DebugRect from '../utils/debug/DebugRect.ts'
import type Game from '../Game.js'
import Locator from './Locator.js'

/**
 * Специальный контейнер для стейтов, который центрируется и масштабируется относительно центра экрана
 * и всегда занимает ширину и высоту всего мира.
 */

export default class GameContainer extends Container {
  game: Game
  #debugRect: DebugRect | null = null
  #isDebug = false

  // Сохраняет игру и создаёт служебные элементы контейнера.
  constructor(game: Game) {
    super({label: 'GameContainer', sortableChildren: true})

    this.game = game
    this.#init()
  }

  // Масштабирует и позиционирует контейнер относительно окна.
  resize = () => {
    const {scaleFactor, x, y} = Locator.gameResize.resizeData
    this.scale.set(scaleFactor)
    this.position.set(x, y)

    this.#updateDebugRect()
  }

  // Выполняет начальную настройку контейнера.
  #init() {
    this.#createDebugRect()
  }

  // Создаёт визуализацию границ игрового мира в отладочном режиме.
  #createDebugRect() {
    if (!this.#isDebug) return

    this.#debugRect = new DebugRect({
      color: 0xff0000,
      label: 'GameContainerDebugRect',
    })
    this.#debugRect.zIndex = 2
    this.addChild(this.#debugRect)
    this.#updateDebugRect()
  }

  // Обновляет отладочную рамку игрового мира.
  #updateDebugRect() {
    if (!this.#isDebug) return

    this.#debugRect?.update({
      width: WORLD.WIDTH,
      height: WORLD.HEIGHT,
      scale: this.scale.x,
    })
  }
}
