import {Container} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {applyTileVisualScale} from './applyTileVisualScale.js'
import {SOKOBAN_TEXTURES} from './config.js'
import {SOKOBAN_SETTINGS} from './settings.js'

export default class SokobanBoxView extends Container {
  #tileSize
  #box

  constructor(index, tileSize) {
    super({label: 'sokoban-box-' + index})

    this.#tileSize = tileSize
    this.#init(index)
  }

  setOnTarget(isOnTarget) {
    this.#box.tint = isOnTarget ? SOKOBAN_SETTINGS.boxOnTargetTint : 0xffffff
  }

  #init(index) {
    this.#box = this.#createBox(index)
    this.addChild(this.#box)
  }

  #createBox(index) {
    const box = GameUtils.createSprite(SOKOBAN_TEXTURES.box, {
      label: 'sokoban-box-sprite-' + index,
      anchorY: 1,
    })

    box.position.set(this.#tileSize / 2, this.#tileSize)
    applyTileVisualScale(box, this.#tileSize)

    return box
  }
}
