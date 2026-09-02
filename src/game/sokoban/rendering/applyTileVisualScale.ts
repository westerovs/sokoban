import type {Sprite} from 'pixi.js'
import {ATLAS_RESOLUTIONS} from '../../gameConfig/resolutionConfig.js'
import {SOKOBAN_SETTINGS} from '../config/settings.js'

/**
 * Масштабирует визуал тайла независимо от логического размера клетки, сохраняя пропорции исходной текстуры.
 * Размер исходника влияет только на отображение и не изменяет координаты или коллизии сетки.
 */

const SOURCE_ASSET_RESOLUTION = Math.max(...Object.values(ATLAS_RESOLUTIONS)) // Плотность исходников до генерации вариантов атласа

// Устанавливает визуальный масштаб спрайта относительно клетки.
const applyTileVisualScale = (sprite: Sprite, tileSize: number) => {
  const scale = (tileSize / SOKOBAN_SETTINGS.textureTileSize) * SOURCE_ASSET_RESOLUTION
  sprite.scale.set(scale)
}

export {applyTileVisualScale}
