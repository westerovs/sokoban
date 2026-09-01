/**
 * Единая точка генерации метаданных сборки и списка звуков.
 * Запускается перед dev-сервером и production-сборкой через package.json.
 */
import {generateBuildMeta} from './utils/generateBuildMeta.mjs'
import {generateSokobanTileCatalog} from './utils/generateSokobanTileCatalog.mjs'
import {generateSoundList} from './utils/generateSoundList.mjs'

generateBuildMeta()
generateSoundList()
await generateSokobanTileCatalog()
