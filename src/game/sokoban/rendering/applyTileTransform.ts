import type {Sprite} from 'pixi.js'
import type {TileAppearance} from '../appearance/tileAppearance.js'
import {getTileTransform} from '../appearance/tileAppearance.js'

/** Apply once, after the sprite's base position and visual scale have been set. */
const applyTileTransform = (sprite: Sprite, appearance: TileAppearance | undefined) => {
  const {rotation, flipX, flipY} = getTileTransform(appearance)
  if (!rotation && !flipX && !flipY) return

  // Preserve the untrimmed texture's visual center, including non-square assets.
  const {x: scaleX, y: scaleY} = sprite.scale
  sprite.x += (0.5 - sprite.anchor.x) * sprite.texture.orig.width * scaleX
  sprite.y += (0.5 - sprite.anchor.y) * sprite.texture.orig.height * scaleY
  sprite.anchor.set(0.5)
  sprite.rotation = (rotation * Math.PI) / 180
  sprite.scale.set(scaleX * (flipX ? -1 : 1), scaleY * (flipY ? -1 : 1))
}

export {applyTileTransform}
