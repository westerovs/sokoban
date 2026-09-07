import {normalizeTileTransform} from '../../../src/game/sokoban/appearance/tileAppearance.js'
import type {TileTransform} from '../../../src/game/sokoban/appearance/tileAppearance.js'
import type {EditorBrush} from './editorTypes.js'

type BrushTransformAction = 'flipX' | 'flipY' | 'rotate'

const isTransformableBrush = (brush: EditorBrush | null): brush is EditorBrush => {
  return brush?.mode === 'tile' && Boolean(brush.texture) && ['wall', 'decor', 'ground', 'box', 'target'].includes(brush.role ?? '')
}

// Buttons always reflect along the visible X/Y axes, even after a quarter turn.
const getBrushFlipAxis = (transform: TileTransform, axis: 'flipX' | 'flipY') => {
  if (transform.rotation % 180 === 0) return axis
  return axis === 'flipX' ? 'flipY' : 'flipX'
}

const transformEditorBrush = (brush: EditorBrush, action: BrushTransformAction): EditorBrush => {
  if (!isTransformableBrush(brush)) return brush
  const transform = normalizeTileTransform(brush.transform)
  if (action === 'rotate') transform.rotation = (transform.rotation + 90) % 360
  else {
    const axis = getBrushFlipAxis(transform, action)
    transform[axis] = !transform[axis]
  }
  return {...brush, transform}
}

export {getBrushFlipAxis, isTransformableBrush, transformEditorBrush}
export type {BrushTransformAction}
