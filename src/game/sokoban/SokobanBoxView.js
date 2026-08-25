import {Container, Graphics} from 'pixi.js'
import {SOKOBAN_COLORS} from './config.js'

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
    const inset = this.#tileSize * 0.12
    const size = this.#tileSize - inset * 2
    const box = new Graphics({label: 'sokoban-box-shape-' + index})

    box
      .roundRect(inset, inset, size, size, this.#tileSize * 0.1)
      .fill(SOKOBAN_COLORS.box)
      .stroke({color: SOKOBAN_COLORS.boxBorder, width: this.#tileSize * 0.06})
    box
      .roundRect(inset * 1.55, inset * 1.55, size - inset * 1.1, size - inset * 1.1, this.#tileSize * 0.06)
      .stroke({color: SOKOBAN_COLORS.boxInset, width: this.#tileSize * 0.05})

    return box
  }

  #createGoalMark(index) {
    const center = this.#tileSize / 2
    const goalMark = new Graphics({label: 'sokoban-box-goal-mark-' + index})

    goalMark
      .circle(center, center, this.#tileSize * 0.16)
      .fill(SOKOBAN_COLORS.boxOnTarget)
      .stroke({color: 0xffffff, width: this.#tileSize * 0.04})
    goalMark.visible = false

    return goalMark
  }
}
