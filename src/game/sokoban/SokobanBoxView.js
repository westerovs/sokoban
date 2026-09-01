import {Container} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {applyTileVisualScale} from './applyTileVisualScale.js'
import {SOKOBAN_SETTINGS} from './settings.js'

export default class SokobanBoxView extends Container {
  #tileSize
  #box

  constructor(id, tileSize, textureName) {
    super({label: 'sokoban-' + id})

    this.#tileSize = tileSize
    this.#init(id, textureName)
  }

  setOnTarget(isOnTarget) {
    this.#box.tint = isOnTarget ? SOKOBAN_SETTINGS.boxOnTargetTint : 0xffffff
  }

  #init(id, textureName) {
    this.#box = this.#createBox(id, textureName)
    this.addChild(this.#box)
  }

  #createBox(id, textureName) {
    const box = GameUtils.createSprite(textureName, {
      label: 'sokoban-box-sprite-' + id,
      anchorY: 1,
    })

    box.position.set(this.#tileSize / 2, this.#tileSize)
    applyTileVisualScale(box, this.#tileSize)

    return box
  }
}
