import {createRequire} from 'node:module'
import {pixiPipes} from '@assetpack/core/pixi'
import {ATLAS_RESOLUTIONS} from './src/game/gameConfig/resolutionConfig.mjs'

const require = createRequire(import.meta.url)
const tinify = require('tinify')
const tinifyKey = process.env.TINIFY_API_KEY

if (tinifyKey) tinify.key = tinifyKey

const tinifyAtlases = {
  name: 'tinify-atlases',
  defaultOptions: {},
  test(asset) {
    return !asset.isFolder && asset.extension === '.png' && asset.allMetaData.tps
  },
  async transform(asset) {
    asset.buffer = await tinify.fromBuffer(asset.buffer).toBuffer()
    return [asset]
  }
}

export default {
  entry: './raw-assets',
  output: './public/assets',
  cache: true,
  cacheLocation: './.assetpack',
  strict: true,
  pipes: [
    ...pixiPipes({
      cacheBust: false, // не добавляет хеш версии к именам файлов
      resolutions: ATLAS_RESOLUTIONS, // список разрешений атласов, например 1x, 0.5x, 0.25x

      compression: {
        png: true, // создавать и сжимать текстуры в формате PNG
        webp: true, // создавать и сжимать текстуры в формате WebP
        jpg: false // не создавать текстуры в формате JPG
      },
      texturePacker: {
        texturePacker: {
          nameStyle: 'short', // использовать короткие имена фреймов в атласе
          padding: 1, // отступ между спрайтами в атласе в пикселях
          allowRotation: true, // разрешить поворот спрайтов для плотной упаковки
          allowTrim: true, // обрезать прозрачные края у изображений
          alphaThreshold: 0, // порог прозрачности при обрезке изображения
          removeFileExtension: true // убрать расширение файла из имени фрейма
        },
        resolutionOptions: {
          maximumTextureSize: 2048 // максимальная ширина или высота одного атласа
        }
      },
      manifest: {
        output: './.assetpack/manifest.json' // путь для сохранения сгенерированного manifest-файла
      }
    }),
    ...(tinifyKey ? [tinifyAtlases] : []) // подключить Tinify-сжатие атласов, если задан API-ключ
  ]
}
