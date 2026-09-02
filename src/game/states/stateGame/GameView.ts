import {Container, Sprite} from 'pixi.js'
import GameUtils from '../../utils/gameUtils/GameUtils.js'

// Отображает общий фон главного игрового состояния.

export default class GameView extends Container {
  #background: Sprite | null = null
  #backgroundName: string | null = null
  refs: Record<string, any> = {}

  // Создаёт контейнер главного экрана и его начальный фон.
  constructor() {
    super({label: 'game-view', sortableChildren: true})

    this.#init()
  }

  // Заменяет фоновую текстуру, если она действительно изменилась.
  setBackground = (textureName: string) => {
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

  // Создаёт начальное содержимое представления.
  #init = () => {
    this.#createBackground()
  }

  // Устанавливает фон стартового экрана.
  #createBackground() {
    this.setBackground('startScreen')
  }
}
