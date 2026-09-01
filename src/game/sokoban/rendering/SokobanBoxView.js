import {Container} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {SOKOBAN_SETTINGS} from '../config/settings.js'
import {applyTileVisualScale} from './applyTileVisualScale.js'

/**
 * Отображает один ящик Sokoban и его состояние на цели.
 */

export default class SokobanBoxView extends Container {
  #tileSize
  #box

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(id, tileSize, textureName) {
    super({label: 'sokoban-' + id})

    this.#tileSize = tileSize
    this.#init(id, textureName)
  }

  // Обновляет визуальное состояние ящика на цели.
  setOnTarget(isOnTarget) {
    this.#box.tint = isOnTarget ? SOKOBAN_SETTINGS.boxOnTargetTint : 0xffffff
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init(id, textureName) {
    this.#box = this.#createBox(id, textureName)
    this.addChild(this.#box)
  }

  // Создаёт спрайт ящика с выбранной текстурой.
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
