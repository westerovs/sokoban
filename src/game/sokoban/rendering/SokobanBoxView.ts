import type {Sprite} from 'pixi.js'
import {Container} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {SOKOBAN_SETTINGS} from '../config/settings.js'
import {applyTileVisualScale} from './applyTileVisualScale.js'

/**
 * Отображает один ящик Sokoban и его состояние на цели.
 */

export default class SokobanBoxView extends Container {
  #tileSize: number
  #box!: Sprite

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(id: string, tileSize: number, textureName: string) {
    super({label: 'sokoban-' + id})

    this.#tileSize = tileSize
    this.#init(id, textureName)
  }

  // Обновляет визуальное состояние ящика на цели.
  setOnTarget(isOnTarget: boolean) {
    this.#box.tint = isOnTarget ? SOKOBAN_SETTINGS.boxOnTargetTint : 0xffffff
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init(id: string, textureName: string) {
    this.#box = this.#createBox(id, textureName)
    this.addChild(this.#box)
  }

  // Создаёт спрайт ящика с выбранной текстурой.
  #createBox(id: string, textureName: string) {
    const box = GameUtils.createSprite(textureName, {
      label: 'sokoban-box-sprite-' + id,
      anchorY: 1,
    })

    box.position.set(this.#tileSize / 2, this.#tileSize)
    applyTileVisualScale(box, this.#tileSize)

    return box
  }
}
