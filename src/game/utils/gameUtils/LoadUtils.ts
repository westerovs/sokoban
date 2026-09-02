import {Assets, Texture} from 'pixi.js'
import type {SpritesheetData} from 'pixi.js'
import SdkManager from '../../engine/SdkManager.js'
import {ASSETS_URL} from '../../gameConfig/constants.js'
import {getAtlasResolutionSuffix} from '../../gameConfig/resolutionConfig.mjs'
import {CACHE_VERSION} from '../../generatedAssets/buildMeta.js'
import GameUtils from './GameUtils.js'

// Загружает игровые ресурсы с версионированием URL и защитой от повторных запросов.

type SpriteSheetOptions = {
  spriteSheetName: string
  folderPath?: string
  exists?: string
}

type TextureWithLegacyLoader = typeof Texture & {
  fromURL: (url: string) => Promise<Texture>
}

const spriteSheetPromises = new Map<string, Promise<void>>()

export default class LoadUtils {
  // Добавляет к URL версию сборки, если кеширование не отключено платформой.
  static forceFreshCache = (url: string) => {
    if (SdkManager.flags.disableFreshCache) return url

    const assetsVer = CACHE_VERSION
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}v=${assetsVer}`
  }

  // Загружает JSON без использования браузерного кеша.
  static loadJson = async <T = unknown>(url: string): Promise<T> => {
    const finalUrl = LoadUtils.forceFreshCache(url)

    const response = await fetch(finalUrl, {cache: 'no-store'})
    if (!response.ok) console.error(`[LoadUtils]: JSON loading failed with status ${response.status}`)

    return (await response.json()) as T
  }

  // Загружает текстовое описание Spine-атласа.
  static loadAtlas = async (url: string) => {
    const finalUrl = LoadUtils.forceFreshCache(url)

    const response = await fetch(finalUrl)
    if (!response.ok) console.error(`[LoadUtils]: Atlas loading failed with status ${response.status}`)
    return await response.text() // Загружаем как текст
  }

  // Загружает текстуру через совместимый со старым кодом метод PixiJS.
  static loadTexture = async (url: string): Promise<Texture> => {
    return new Promise<Texture>((resolve, reject) => {
      ;(Texture as TextureWithLegacyLoader)
        .fromURL(url)
        .then((loadedTexture) => {
          resolve(loadedTexture)
        })
        .catch((error: unknown) => {
          console.warn('Failed to load texture:', error)
          reject(error)
        })
    })
  }

  // Загружает и кеширует спрайтшит по имени и папке.
  static loadSpriteSheet = async ({spriteSheetName, folderPath = 'ui', exists = GameUtils.checkWebp('png')}: SpriteSheetOptions) => {
    const basePath = ASSETS_URL.local
    const atlasName = `${spriteSheetName}${getAtlasResolutionSuffix()}.${exists}`
    const cacheKey = `${folderPath}/${atlasName}`
    const cachedPromise = spriteSheetPromises.get(cacheKey)
    if (cachedPromise) return await cachedPromise

    const jsonUrl = `${basePath}assets/${folderPath}/${atlasName}.json`
    const atlasUrl = LoadUtils.forceFreshCache(`${basePath}assets/${folderPath}/${atlasName}`)

    const loadPromise = (async () => {
      const [json, baseTexture] = await Promise.all([
        LoadUtils.loadJson<SpritesheetData>(jsonUrl),
        Assets.load<Texture>({
          alias: spriteSheetName,
          src: atlasUrl,
        }),
      ])

      await GameUtils.createSpriteSheet(baseTexture, json)
    })().catch((error: unknown) => {
      spriteSheetPromises.delete(cacheKey)
      throw error
    })

    spriteSheetPromises.set(cacheKey, loadPromise)
    await loadPromise
  }
}
