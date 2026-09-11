import type {Sprite, Texture} from 'pixi.js'
import {Container} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import type {SokobanDirectionName} from '../config/config.js'
import {SOKOBAN_PLAYER_TEXTURES} from '../config/config.js'
import {applyTileVisualScale} from './applyTileVisualScale.js'

/**
 * Отображает игрока Sokoban и выбирает его ракурс с учётом направления и поворота доски.
 */

type PlayerTextureSource = string | Texture
type PlayerTextureSources = Record<keyof typeof SOKOBAN_PLAYER_TEXTURES, PlayerTextureSource>
type PlayerVisual = {texture: keyof PlayerTextureSources; mirrored: boolean}

// Возвращает направление игрока на экране после поворота доски по часовой стрелке.
const getScreenDirection = (direction: SokobanDirectionName, isBoardRotated: boolean): SokobanDirectionName => {
  if (!isBoardRotated) return direction
  if (direction === 'up') return 'right'
  if (direction === 'right') return 'down'
  if (direction === 'down') return 'left'
  return 'up'
}

// Возвращает текстуру и зеркальность для экранного направления игрока.
const getPlayerVisual = (direction: SokobanDirectionName): PlayerVisual => {
  if (direction === 'up') return {texture: 'back', mirrored: false}
  if (direction === 'down') return {texture: 'front', mirrored: false}
  return {texture: 'side', mirrored: direction === 'left'}
}

export default class SokobanPlayerView extends Container {
  #direction: SokobanDirectionName = 'down'
  #isBoardRotated = false
  #sprites!: Record<keyof PlayerTextureSources, Sprite>
  #textureSources: PlayerTextureSources
  #tileSize: number

  // Создаёт представление игрока с переданными текстурами.
  constructor(tileSize: number, textureSources: PlayerTextureSources = SOKOBAN_PLAYER_TEXTURES) {
    super({label: 'sokoban-player'})

    this.#tileSize = tileSize
    this.#textureSources = textureSources
    this.#init()
  }

  // Меняет направление игрока в координатах уровня.
  setDirection(direction: SokobanDirectionName) {
    this.#direction = direction
    this.#updateVisual()
  }

  // Компенсирует поворот доски и пересчитывает экранный ракурс игрока.
  setBoardRotation(rotation: number) {
    this.#isBoardRotated = rotation !== 0
    Object.values(this.#sprites).forEach((sprite) => (sprite.rotation = -rotation))
    this.#updateVisual()
  }

  // Создаёт спрайты всех доступных ракурсов игрока.
  #init() {
    this.#sprites = {
      front: this.#createSprite('front'),
      back: this.#createSprite('back'),
      side: this.#createSprite('side'),
    }
    this.addChild(this.#sprites.front, this.#sprites.back, this.#sprites.side)
    this.#updateVisual()
  }

  // Создаёт один ракурс игрока и масштабирует его относительно клетки.
  #createSprite(texture: keyof PlayerTextureSources) {
    const sprite = GameUtils.createSprite(this.#textureSources[texture], {
      label: `sokoban-player-${texture}`,
      anchorY: 1,
    })
    applyTileVisualScale(sprite, this.#tileSize)
    return sprite
  }

  // Показывает подходящий ракурс и применяет зеркальность профиля.
  #updateVisual() {
    const screenDirection = getScreenDirection(this.#direction, this.#isBoardRotated)
    const visual = getPlayerVisual(screenDirection)
    Object.values(this.#sprites).forEach((sprite) => (sprite.visible = false))
    const sprite = this.#sprites[visual.texture]
    sprite.scale.x = Math.abs(sprite.scale.x) * (visual.mirrored ? -1 : 1)
    sprite.visible = true
  }
}

export {getPlayerVisual, getScreenDirection}

export type {PlayerTextureSources, PlayerVisual}
