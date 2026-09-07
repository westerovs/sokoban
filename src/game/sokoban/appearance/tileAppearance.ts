/** Optional visual transforms keep legacy texture-name appearances unchanged. */
type TileTransform = {
  rotation: number
  flipX: boolean
  flipY: boolean
}

type TileAppearance = string | ({texture: string} & Partial<TileTransform>)

const normalizeTileTransform = (transform: Partial<TileTransform> = {}): TileTransform => {
  const rotation = transform.rotation ?? 0
  return {
    rotation: Number.isFinite(rotation) && rotation % 90 === 0 ? ((rotation % 360) + 360) % 360 : 0,
    flipX: transform.flipX === true,
    flipY: transform.flipY === true,
  }
}

const getTileTexture = (appearance: TileAppearance | undefined) => {
  return typeof appearance === 'string' ? appearance : appearance?.texture
}

const getTileTransform = (appearance: TileAppearance | undefined): TileTransform => {
  return normalizeTileTransform(typeof appearance === 'object' && appearance !== null ? appearance : undefined)
}

const createTileAppearance = (texture: string, transform?: Partial<TileTransform>): TileAppearance => {
  const normalized = normalizeTileTransform(transform)
  if (!normalized.rotation && !normalized.flipX && !normalized.flipY) return texture
  return {texture, ...normalized}
}

// Used by the level build before any appearance is saved or shipped.
const isTileAppearance = (value: unknown): value is TileAppearance => {
  if (typeof value === 'string') return value.length > 0
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const tile = value as Record<string, unknown>
  if (Object.keys(tile).some((key) => !['texture', 'rotation', 'flipX', 'flipY'].includes(key))) return false
  if (typeof tile.texture !== 'string' || !tile.texture) return false
  if (tile.rotation !== undefined && ![0, 90, 180, 270].includes(tile.rotation as number)) return false
  if (tile.flipX !== undefined && typeof tile.flipX !== 'boolean') return false
  return tile.flipY === undefined || typeof tile.flipY === 'boolean'
}

export {createTileAppearance, getTileTexture, getTileTransform, isTileAppearance, normalizeTileTransform}
export type {TileAppearance, TileTransform}
