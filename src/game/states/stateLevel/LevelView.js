import {Container} from 'pixi.js'
import CompleteLevelView from '@/game/ui/level/completeLevelScreen/CompleteLevelView.js'


export default class LevelView extends Container {
  #game

  constructor(game) {
    super()

    this.#game = game
    this.refs = {}
    this.sortableChildren = true
    this.label = 'levelView'

    this.#init()
  }

  #init = () => {
    this.#createCompleteLevelView()
  }

  #createCompleteLevelView() {
    const completeLevelView = new CompleteLevelView({
      refs: this.refs
    })
    completeLevelView.visible = false

    this.refs.completeLevelView = completeLevelView
    this.addChild(completeLevelView)
  }

}
