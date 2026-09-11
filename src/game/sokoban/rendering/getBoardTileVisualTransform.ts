/**
 * Рассчитывает компенсацию поворота доски для визуала, привязанного к логической клетке.
 */

type Position = {
  x: number
  y: number
}

type TileVisualTransformOptions = {
  position: Position
  anchorY: number
  tileSize: number
  rotation: number
  offset?: Position
}

// Возвращает экранно-ориентированные позицию и угол визуала внутри повёрнутой доски.
const getBoardTileVisualTransform = ({position, anchorY, tileSize, rotation, offset}: TileVisualTransformOptions) => {
  const isRotated = rotation !== 0
  const x = (position.x + (isRotated ? anchorY : 0.5)) * tileSize
  const y = (position.y + (isRotated ? 0.5 : anchorY)) * tileSize
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)

  return {
    position: {
      x: x + (offset?.x ?? 0) * cos + (offset?.y ?? 0) * sin,
      y: y - (offset?.x ?? 0) * sin + (offset?.y ?? 0) * cos,
    },
    rotation: rotation === 0 ? 0 : -rotation,
  }
}

export {getBoardTileVisualTransform}
