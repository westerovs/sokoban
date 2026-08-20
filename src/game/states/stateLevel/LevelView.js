import {Container, Texture} from 'pixi.js'
import {WORLD} from '@/game/gameConfig/constants.js'
import CompleteLevelView from '@/game/ui/level/completeLevelScreen/CompleteLevelView.js'
import GameUtils, {viewResize} from '@/game/utils/gameUtils/GameUtils.js'

export default class LevelView extends Container {
  #game

  constructor(game) {
    super({label: 'levelView', sortableChildren: true})

    this.#game = game
    this.refs = {}
    this.#init()
  }

  resize() {
    return viewResize(this.refs)
  }

  #init = () => {
    this.#createCompleteLevelView()
    this.#createFade()
  }

  #createCompleteLevelView() {
    const completeLevelView = new CompleteLevelView({refs: this.refs})
    completeLevelView.game = this.#game
    completeLevelView.refs = this.refs
    completeLevelView.visible = false

    this.refs.completeLevelView = completeLevelView
    this.addChild(completeLevelView)
  }

  #createFade() {
    const fade = GameUtils.createSprite(Texture.WHITE, {
      label: 'fade',
      anchorX: 0,
      anchorY: 0,
    })
    fade.visible = true
    fade.alpha = 0
    fade.width = WORLD.WIDTH + 1
    fade.height = WORLD.HEIGHT
    fade.tint = 0x000000

    this.refs.fade = fade
    this.addChild(fade)
  }
}
