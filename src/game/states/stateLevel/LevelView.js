import {Container} from 'pixi.js'
import CompleteLevelView from '@/game/ui/level/completeLevelScreen/CompleteLevelView.js'


export default class LevelView extends Container {
  #game

  constructor(game) {
    super({label: 'levelView'})

    this.#game = game
    this.refs = {}
  }

  createCompleteLevelView() {
    if (this.refs.completeLevelView) return this.refs.completeLevelView

    const completeLevelView = new CompleteLevelView({
      refs: this.refs
    })
    completeLevelView.visible = false

    this.refs.completeLevelView = completeLevelView
    this.addChild(completeLevelView)

    return completeLevelView
  }
}
