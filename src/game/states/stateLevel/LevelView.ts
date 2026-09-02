import {Container} from 'pixi.js'
import type Game from '@/game/Game.js'
import CompleteLevelView from '@/game/ui/level/completeLevelScreen/CompleteLevelView.js'

// Содержит визуальные элементы игрового уровня и общие ссылки на них.

export default class LevelView extends Container {
  #game: Game
  refs: Record<string, any> = {}

  // Сохраняет игру и создаёт контейнер ссылок уровня.
  constructor(game: Game) {
    super({label: 'levelView'})

    this.#game = game
  }

  // Создаёт или возвращает экран завершения уровня.
  createCompleteLevelView() {
    if (this.refs.completeLevelView) return this.refs.completeLevelView

    const completeLevelView = new CompleteLevelView({
      refs: this.refs,
    })
    completeLevelView.visible = false

    this.refs.completeLevelView = completeLevelView
    this.addChild(completeLevelView)

    return completeLevelView
  }
}
