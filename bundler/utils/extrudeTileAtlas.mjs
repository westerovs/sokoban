import {stripTags} from '@assetpack/core'
import sharp from 'sharp'

// Добавляет защитную рамку к кадрам атласа тайлов до сжатия, сохраняя их размеры и координаты.

const EXTRUDE_SIZE = 1 // Толщина рамки в физических пикселях каждого разрешения атласа

// Возвращает фактический прямоугольник кадра с учётом поворота при упаковке.
const getPackedFrame = ({frame, rotated}) => ({
  x: frame.x,
  y: frame.y,
  width: rotated ? frame.h : frame.w,
  height: rotated ? frame.w : frame.h,
})

// Копирует ближайший пиксель кадра в одну точку защитной рамки.
const copyBorderPixel = (source, target, atlasWidth, frame, x, y) => {
  const sourceX = Math.max(frame.x, Math.min(x, frame.x + frame.width - 1))
  const sourceY = Math.max(frame.y, Math.min(y, frame.y + frame.height - 1))
  const sourceOffset = (sourceY * atlasWidth + sourceX) * 4
  const targetOffset = (y * atlasWidth + x) * 4
  source.copy(target, targetOffset, sourceOffset, sourceOffset + 4)
}

// Заполняет только внешнюю рамку кадра, не изменяя его содержимое.
const extrudeFrame = (source, target, info, frame) => {
  const left = frame.x - EXTRUDE_SIZE
  const top = frame.y - EXTRUDE_SIZE
  const right = frame.x + frame.width + EXTRUDE_SIZE
  const bottom = frame.y + frame.height + EXTRUDE_SIZE
  if (left < 0 || top < 0 || right > info.width || bottom > info.height) {
    throw new Error('[TileAtlas]: insufficient atlas border padding')
  }

  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      if (x >= frame.x && x < frame.x + frame.width && y >= frame.y && y < frame.y + frame.height) continue
      copyBorderPixel(source, target, info.width, frame, x, y)
    }
  }
}

// Дополняет одну PNG-страницу рамками из исходных краевых пикселей.
const extrudePage = async (image, frames) => {
  const {data, info} = await sharp(image.buffer).ensureAlpha().raw().toBuffer({resolveWithObject: true})
  const result = Buffer.from(data)
  Object.values(frames).forEach((frame) => extrudeFrame(data, result, info, getPackedFrame(frame)))
  image.buffer = await sharp(result, {raw: {width: info.width, height: info.height, channels: 4}})
    .png()
    .toBuffer()
}

// Обрабатывает все страницы и разрешения, возвращённые стандартным упаковщиком.
const extrudePages = async (assets) => {
  for (const asset of assets) {
    if (asset.extension !== '.json') continue
    const atlas = JSON.parse(asset.buffer.toString())
    const image = assets.find((candidate) => candidate.filename === atlas.meta.image)
    if (!image) throw new Error(`[TileAtlas]: atlas image ${atlas.meta.image} is missing`)
    await extrudePage(image, atlas.frames)
  }
}

// Дополняет стандартный упаковщик обработкой исключительно исходной папки tiles.
const withTileAtlasExtrusion = (pipe) => {
  if (pipe.name !== 'texture-packer') return pipe

  return {
    ...pipe,
    defaultOptions: {
      ...pipe.defaultOptions,
      tileExtrusionSize: EXTRUDE_SIZE, // Включает толщину рамки в ключ кэша AssetPack
    },
    // Создаёт рамки только для тайлов до передачи изображений пайпам сжатия.
    async transform(asset, options, pipeSystem) {
      const isTiles = stripTags(asset.filename) === 'tiles'
      if (isTiles && options.texturePacker.padding < EXTRUDE_SIZE * 2) {
        throw new Error('[TileAtlas]: frame padding must be at least twice the extrusion size')
      }
      const assets = await pipe.transform.call(this, asset, options, pipeSystem)
      if (isTiles) await extrudePages(assets)
      return assets
    },
  }
}

export {
  withTileAtlasExtrusion,
}
