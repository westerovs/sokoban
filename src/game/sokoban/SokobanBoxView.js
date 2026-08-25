import {Container} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {SOKOBAN_TEXTURES} from './config.js'

export default class SokobanBoxView extends Container {
  #tileSize
  #goalMark

  constructor(index, tileSize) {
    super({label: 'sokoban-box-' + index})

    this.#tileSize = tileSize
    this.#init(index)
  }

  setOnTarget(isOnTarget) {
    this.#goalMark.visible = isOnTarget
  }

  #init(index) {
    const box = this.#createBox(index)
    this.#goalMark = this.#createGoalMark(index)
    this.addChild(box, this.#goalMark)
  }

  #createBox(index) {
    const box = GameUtils.createSprite(SOKOBAN_TEXTURES.box, {
      label: 'sokoban-box-sprite-' + index,
      anchorX: 0,
      anchorY: 0,
    })

    box.setSize(this.#tileSize, this.#tileSize)

    return box
  }

  #createGoalMark(index) {
    const goalMark = GameUtils.createSprite(SOKOBAN_TEXTURES.target, {
      label: 'sokoban-box-goal-mark-' + index,
      anchorX: 0,
      anchorY: 0,
    })

    goalMark.setSize(this.#tileSize, this.#tileSize)
    goalMark.visible = false

    return goalMark
  }
}
