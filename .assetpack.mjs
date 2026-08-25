import {createRequire} from 'node:module'
import {audio as createAudioPipe} from '@assetpack/core/ffmpeg'
import {pixiPipes} from '@assetpack/core/pixi'
import {ATLAS_RESOLUTIONS} from './src/game/gameConfig/resolutionConfig.mjs'

/**
 * Конфигурация сборки игровых ресурсов через AssetPack.
 *
 * Аудио хранится в `raw-assets/audio` в исходном MP3 и при каждой сборке
 * кодируется заново из оригинала по профилю своей категории. Правила заданы
 * масками директорий, поэтому замена существующего файла или добавление нового
 * автоматически применит нужный битрейт без привязки к имени файла. Если
 * сжатая версия оказывается не меньше оригинала, в сборку попадает оригинал.
 *
 * Музыка сохраняет больше деталей, ambience и SFX получают более компактный
 * профиль, а служебные файлы в корне audio используют минимальный битрейт.
 * AssetPack также собирает текстурные атласы, варианты разрешений, manifest
 * и при наличии `TINIFY_API_KEY` дополнительно сжимает PNG-атласы через Tinify.
 */

const require = createRequire(import.meta.url)
const tinify = require('tinify')
const tinifyKey = process.env.TINIFY_API_KEY

if (tinifyKey) tinify.key = tinifyKey

const AUDIO_COMPRESSION_PROFILES = {
  default: {bitrate: 128, channels: 2},
  ambience: {bitrate: 96, channels: 2},
  music: {bitrate: 128, channels: 2},
  sfx: {bitrate: 96, channels: 2},
  service: {bitrate: 32, channels: 1},
}

// Создаёт FFmpeg-настройки MP3 для одной категории аудио.
const createCompressedMp3Output = ({bitrate, channels}) => ({
  formats: ['.mp3'],
  recompress: true,
  options: {
    audioBitrate: bitrate,
    audioChannels: channels,
    audioFrequency: 44100,
  },
})

// Задаёт безопасный профиль для MP3 вне известных аудиокатегорий.
const audioConfig = {
  inputs: ['.mp3'],
  outputs: [createCompressedMp3Output(AUDIO_COMPRESSION_PROFILES.default)],
}

// Назначает профиль сжатия по расположению файла, а не по его имени.
const audioAssetSettings = [
  {
    files: ['audio/ambience/**/*.mp3'],
    settings: {
      audio: {
        outputs: [createCompressedMp3Output(AUDIO_COMPRESSION_PROFILES.ambience)],
      },
    },
  },
  {
    files: ['audio/music/**/*.mp3'],
    settings: {
      audio: {
        outputs: [createCompressedMp3Output(AUDIO_COMPRESSION_PROFILES.music)],
      },
    },
  },
  {
    files: ['audio/sfx/**/*.mp3'],
    settings: {
      audio: {
        outputs: [createCompressedMp3Output(AUDIO_COMPRESSION_PROFILES.sfx)],
      },
    },
  },
  {
    files: ['audio/*.mp3'],
    settings: {
      audio: {
        outputs: [createCompressedMp3Output(AUDIO_COMPRESSION_PROFILES.service)],
      },
    },
  },
]

// Создаёт аудиопайп, который не заменяет оригинал более крупным MP3.
const createSizeAwareAudioPipe = (options) => {
  const audioPipe = createAudioPipe(options)
  const transformAudio = audioPipe.transform.bind(audioPipe)

  return {
    ...audioPipe,

    // Сжимает MP3 и выбирает наименьший из исходного и полученного файлов.
    async transform(asset, resolvedOptions, pipeSystem) {
      const [compressedAsset] = await transformAudio(asset, resolvedOptions, pipeSystem)
      if (!compressedAsset) return [asset]

      return compressedAsset.buffer.length < asset.buffer.length
        ? [compressedAsset]
        : [asset]
    },
  }
}

const sizeAwareAudioPipe = createSizeAwareAudioPipe(audioConfig)

// Заменяет стандартный FFmpeg-пайп PixiJS на версию с проверкой размера.
const replaceAudioPipe = (pipe) => pipe.name === 'audio' ? sizeAwareAudioPipe : pipe

const tinifyAtlases = {
  name: 'tinify-atlases',
  defaultOptions: {},

  // Определяет PNG-атласы TexturePacker, которые нужно отправить в Tinify.
  test(asset) {
    return !asset.isFolder && asset.extension === '.png' && asset.allMetaData.tps
  },

  // Заменяет буфер PNG-атласа результатом сжатия через Tinify.
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
  assetSettings: audioAssetSettings,
  pipes: [
    ...pixiPipes({
      cacheBust: false, // не добавляет хеш версии к именам файлов
      resolutions: ATLAS_RESOLUTIONS, // список разрешений атласов, например 1x, 0.5x, 0.25x
      audio: audioConfig,

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
    }).map(replaceAudioPipe),
    ...(tinifyKey ? [tinifyAtlases] : []) // подключить Tinify-сжатие атласов, если задан API-ключ
  ]
}
