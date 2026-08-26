import {Assets, Texture} from 'pixi.js'
import SdkManager from '../../engine/SdkManager.js'
import {ASSETS_URL} from '../../gameConfig/constants.js'
import {getAtlasResolutionSuffix} from '../../gameConfig/resolutionConfig.mjs'
import {CACHE_VERSION} from '../../generatedAssets/buildMeta.js'
import GameUtils from './GameUtils.js'

const spriteSheetPromises = new Map()

export default class LoadUtils {
  static forceFreshCache = (url) => {
    if (SdkManager.flags.disableFreshCache) return url

    const assetsVer = CACHE_VERSION
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}v=${assetsVer}`
  }

  static loadJson = async (url) => {
    const finalUrl = LoadUtils.forceFreshCache(url)

    const response = await fetch(finalUrl, {cache: 'no-store'})
    if (!response.ok) console.error(`Ошибка загрузки JSON: ${response.status}`)

    return await response.json()
  }

  static loadAtlas = async (url) => {
    const finalUrl = LoadUtils.forceFreshCache(url)

    const response = await fetch(finalUrl)
    if (!response.ok) console.error(`Ошибка загрузки .atlas: ${response.status}`)
    return await response.text() // Загружаем как текст
  }

  static loadTexture = async (url) => {
    return new Promise((resolve, reject) => {
      Texture.fromURL(url)
        .then((loadedTexture) => {
          resolve(loadedTexture)
        })
        .catch((error) => {
          console.warn('Failed to load texture:', error)
          reject(error)
        })
    })
  }

  static loadSpriteSheet = async ({spriteSheetName, folderPath = 'ui', exists = GameUtils.checkWebp('png')}) => {
    const basePath = ASSETS_URL.local
    const atlasName = `${spriteSheetName}${getAtlasResolutionSuffix()}.${exists}`
    const cacheKey = `${folderPath}/${atlasName}`
    const cachedPromise = spriteSheetPromises.get(cacheKey)
    if (cachedPromise) return await cachedPromise

    const jsonUrl = `${basePath}assets/${folderPath}/${atlasName}.json`
    const atlasUrl = LoadUtils.forceFreshCache(`${basePath}assets/${folderPath}/${atlasName}`)

    const loadPromise = (async () => {
      const [json, baseTexture] = await Promise.all([
        LoadUtils.loadJson(jsonUrl),
        Assets.load({
          alias: spriteSheetName,
          src: atlasUrl,
        }),
      ])

      await GameUtils.createSpriteSheet(baseTexture, json)
    })().catch((error) => {
      spriteSheetPromises.delete(cacheKey)
      throw error
    })

    spriteSheetPromises.set(cacheKey, loadPromise)
    await loadPromise
  }
}
