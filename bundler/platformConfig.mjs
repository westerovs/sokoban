/**
 * Единая конфигурация платформ, production-папок и локального dev-сервера.
 *
 * Платформы для обычного `npm run build` выбираются в PLATFORMS_TO_BUILD.
 * Финальное имя production-папки формируется как `<PLATFORM>_<GAME>`, где GAME
 * автоматически берётся из последней части поля name в package.json.
 */
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
const {name: packageName} = require('../package.json')

/** Имя игры для production-папок берётся из последней части package.json name.
 * Например, `hog.test` превращается в `test`. */
const GAME_BUILD_NAME = String(packageName || '').split('.').at(-1)?.trim()

if (!GAME_BUILD_NAME) {
  throw new Error('package.json name must contain a non-empty game name')
}

/** Создаёт неизменяемое описание платформы. aliases позволяют использовать
 * короткие имена в командах, например `cg` вместо `crazyGames`. */
const createPlatform = (name, serviceDir, outputDir = null, options = {}) => Object.freeze({
  name,
  serviceDir,
  outputDir: outputDir ? `${outputDir}_${GAME_BUILD_NAME}` : null,
  aliases: Object.freeze(options.aliases || []),
  https: options.https || false
})


/** name используется в CLI, serviceDir указывает папку внутри services,
 * outputDir задаёт платформенную часть production-папки внутри dist. Имя игры добавляется автоматически. */
const PLATFORMS = Object.freeze({
  base: createPlatform('base', 'base', 'BASE'),
  crazyGames: createPlatform('crazyGames', 'crazyGames', 'CG', {aliases: ['cg']}),
  frvr: createPlatform('frvr', 'FRVR', 'FRVR'),
  gameDistribution: createPlatform('gameDistribution', 'gameDistribution', 'GD', {aliases: ['gd']}),
  playgama: createPlatform('playgama', 'playgama', 'PLAYGAMA'),
  ok: createPlatform('ok', 'ok', 'OK'),
  vk: createPlatform('vk', 'vk', 'VK'),
  yandex: createPlatform('yandex', 'yandex', 'YANDEX'),
  youtube: createPlatform('youtube', 'youtube', 'YOUTUBE'),
  playgamaYoutube: createPlatform('playgamaYoutube', 'playgamaYoutube', 'PLAYGAMA_YOUTUBE'),

  // Локальный Яндекс: HTTPS обязателен для корректной загрузки SDK.
  yandexTest: createPlatform('dev', 'dev', null, {https: true}),
  noAdapter: createPlatform('noAdapter', 'noAdapter')
})

const DEFAULT_DEV_PLATFORM = PLATFORMS.base.name

const PLATFORMS_TO_BUILD = Object.freeze([
  PLATFORMS.base,
  PLATFORMS.crazyGames,
  PLATFORMS.frvr,
  PLATFORMS.gameDistribution,
  PLATFORMS.playgama,
  PLATFORMS.playgamaYoutube,
  PLATFORMS.ok,
  PLATFORMS.vk,
  PLATFORMS.yandex,
  PLATFORMS.youtube,
])

const DEV_SERVER_CONFIG = Object.freeze({
  access: 'network', // поменять на 'localhost' для запуска только на этом ПК
  port: 8080,
  openBrowser: false,
})

// Формирует список для понятной ошибки неизвестной платформы.
const getPlatformNames = () => Object.values(PLATFORMS).map(({name}) => name).join(', ')

// Принимает name, serviceDir, outputDir или alias без учёта регистра.
const resolvePlatform = (platformName) => {
  const normalizedName = String(platformName || '').trim().toLowerCase()
  const platform = Object.values(PLATFORMS).find((item) => {
    const availableNames = [item.name, item.serviceDir, item.outputDir, ...item.aliases]
    return availableNames.some((name) => name?.toLowerCase() === normalizedName)
  })

  if (!platform) {
    throw new Error(`Unknown platform "${platformName}". Available platforms: ${getPlatformNames()}`)
  }

  return platform
}

// Dev-only записи без outputDir не участвуют в сборке `all`.
const getProductionPlatforms = () => Object.values(PLATFORMS).filter(({outputDir}) => outputDir)

/** Разворачивает `all`, запрещает dev-only платформы в production build
 * и удаляет дубликаты, сохраняя порядок пользователя. */
const resolveBuildPlatforms = (platformNames) => {
  if (platformNames === undefined) {
    platformNames = PLATFORMS_TO_BUILD.map(({name}) => name)
  }

  const requestedNames = platformNames.length === 1 && platformNames[0].toLowerCase() === 'all'
    ? getProductionPlatforms().map(({name}) => name)
    : platformNames

  const platforms = requestedNames.map(resolvePlatform)

  for (const platform of platforms) {
    if (!platform.outputDir) {
      throw new Error(`Platform "${platform.name}" is intended only for local development`)
    }
  }

  return [...new Map(platforms.map((platform) => [platform.name, platform])).values()]
}


export {
  GAME_BUILD_NAME,
  PLATFORMS,
  DEFAULT_DEV_PLATFORM,
  PLATFORMS_TO_BUILD,
  DEV_SERVER_CONFIG,
  resolvePlatform,
  getProductionPlatforms,
  resolveBuildPlatforms,
}
