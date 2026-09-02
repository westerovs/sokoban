import i18next from 'i18next'
import {Cache, Container, Matrix, RenderTexture, Sprite, Spritesheet, Text, Texture} from 'pixi.js'
import type {Application, ContainerChild, SpritesheetData, TextStyleOptions} from 'pixi.js'
import {applyInteractive} from '@/game/components/buttons/buttons.js'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import LocalStorage from '@/game/engine/storage/LocalStorage.js'
import {LEVEL_TYPES, PLATFORM_ID} from '@/game/gameConfig/constants.js'
import {FONT_COLORS, primaryFontStyle} from '@/game/styles.js'
import PurchaseError from '@/game/ui/common/purchaseError/PurchaseError.js'
import {Logger} from '../Logger.js'

// Содержит общие фабрики PixiJS и небольшие игровые утилиты.

type CreateSpriteOptions = {
  label?: string
  name?: string
  anchorX?: number
  anchorY?: number
  scale?: number
  interactive?: boolean
}

type CreateCheckboxOptions = {
  text?: string
  name?: string
  interactive?: boolean
  style?: TextStyleOptions
}

type CreateTextOptions = {
  name?: string
  style?: TextStyleOptions
  anchorX?: number
  anchorY?: number
}

type PopUpOptions = {
  color?: string
  duration?: number
}

type GradientStop = {
  color: string
  offset: number
}

type GradientOptions = {
  width: number
  height: number
  angle?: number
  stops?: GradientStop[]
}

export default class GameUtils {
  static popupEl: HTMLDivElement | null | undefined
  static popupTimeout: ReturnType<typeof setTimeout> | null | undefined

  static get isFirstLevel() {
    const {levelIndex, skinIndex} = Locator.storage.playerData
    return levelIndex === 0 && skinIndex === 1
  }

  static createSprite(
    textureSource: string | Texture,
    {label, name, anchorX = 0.5, anchorY = 0.5, scale = 1, interactive}: CreateSpriteOptions = {},
  ): Sprite {
    let texture = textureSource instanceof Texture ? textureSource : null

    if (!texture && Cache.has(textureSource)) {
      const cachedAsset = Cache.get(textureSource)
      texture = cachedAsset instanceof Texture ? cachedAsset : cachedAsset?.texture
    }

    if (!texture) {
      console.error(`[GameUtils] Texture '${textureSource}' not found in caches, using white fallback`)
      texture = Texture.WHITE
    }

    const sprite = new Sprite(texture)
    sprite.anchor.set(anchorX, anchorY)
    sprite.scale.set(scale)
    sprite._initScale = scale
    sprite.label = label ?? name ?? (typeof textureSource === 'string' ? textureSource : '')

    if (texture === Texture.WHITE) {
      sprite.width = 10
      sprite.height = 10
    }

    if (interactive) {
      sprite.type = 'button'
      sprite.cursor = 'pointer'
      sprite.eventMode = 'static'
    }
    return sprite
  }

  static createCheckbox = ({
    text,
    name,
    interactive = true,
    style = {
      ...primaryFontStyle,
      fill: FONT_COLORS.secondFont,
      fontSize: 26,
    },
  }: CreateCheckboxOptions = {}) => {
    const checkboxContainer = new Container({label: name})
    if (interactive) applyInteractive(checkboxContainer)

    const checkboxText = new Text({label: `${name}-text`, text, style})
    checkboxText.anchor.set(0, 0.5)
    checkboxText.x = 30

    const checkbox = GameUtils.createSprite('checkbox')
    const checkboxMark = GameUtils.createSprite('checkbox-mark', {label: 'checkboxMark'})

    checkboxContainer.addChild(checkbox, checkboxMark, checkboxText)

    const {width, height} = checkboxContainer
    checkboxContainer.pivot.set(width / 2 - checkbox.width / 2, height / 2)

    return checkboxContainer
  }

  static createText(text: string | number, {name, style = {}, anchorX = 0.5, anchorY = 0.5}: CreateTextOptions = {}) {
    const textElement = new Text({text, style})
    textElement.anchor.set(anchorX, anchorY)
    if (name) textElement.label = name

    return textElement
  }

  static getPositionIndex(parent: Container, view: ContainerChild) {
    console.log(parent.children)
    return parent.children.indexOf(view)
  }

  static getLocalPosition(targetA: Container, targetB: Container) {
    const globalCenter = targetA.toGlobal({x: targetA.width / 2, y: 0})
    const localPos = targetB.parent!.toLocal(globalCenter)

    return {
      x: localPos.x,
      y: localPos.y,
    }
  }

  static getLocalPositionVarB(target: Container, parent: Container) {
    const globalPoint = target.getGlobalPosition()
    const {x, y} = parent.toLocal(globalPoint)

    return {x, y}
  }

  // пример object_cat_28 -> cat
  static hasWord(str: string, word: string) {
    return new RegExp(word, 'i').test(str)
  }

  static removeTexturesFromCache = (frames: Record<string, unknown>) => {
    for (const key in frames) {
      if (!Cache.has(key)) continue

      const texture = Cache.get(key)
      Cache.remove(key)
      if (texture instanceof Texture) texture.destroy(false)
    }
  }

  static createSpriteSheet = async (atlasPng: Texture, atlasJson: SpritesheetData, clearCache = false) => {
    if (clearCache) GameUtils.removeTexturesFromCache(atlasJson.frames)

    // 2. Создать и распарсить спрайтшит
    const spriteSheet = new Spritesheet({texture: atlasPng, data: atlasJson})
    await spriteSheet.parse()

    for (const [key, texture] of Object.entries(spriteSheet.textures)) {
      Cache.set(key, texture)
    }

    return spriteSheet
  }

  static destroySpriteSheet = (atlasJson: SpritesheetData) => {
    const frameKeys = Object.keys(atlasJson.frames)
    for (const key of frameKeys) {
      if (!Cache.has(key)) continue

      const texture = Cache.get(key)
      Cache.remove(key)
      if (texture instanceof Texture) texture.destroy(false)
    }
  }

  // Превращает строки 'true' в булево значение true. Нужно для корректного приёма данных из ABTest
  static isStringTrue = (value: boolean | string) => value === true || value === 'true'

  // возвращает слово после первого нижнего подчеркивания
  static extractSuffix = (value?: string | null) => {
    if (!value) return
    const match = value.match(/_(.+)$/)
    return match ? match[1] : null
  }

  // пример работы: level131_identical_cup -> levelType: identical / identicalName: cup
  static extractLevelSuffix = (levelName?: string | null) => {
    if (!levelName) return {levelType: null, identicalName: null}

    const firstUnderscoreIndex = levelName.indexOf('_')
    if (firstUnderscoreIndex === -1) return {levelType: null, identicalName: null}

    const suffix = levelName.slice(firstUnderscoreIndex + 1)
    const [levelType, identicalNamePart] = suffix.split('_')

    if (levelType === LEVEL_TYPES.IDENTICAL.name) {
      return {
        levelType,
        identicalName: identicalNamePart,
      }
    }

    return {
      levelType,
      identicalName: null,
    }
  }

  static checkWebp = (fallback = 'jpg') => {
    if (typeof document === 'undefined') return fallback

    const canvas = document.createElement('canvas')
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'webp' : fallback
  }

  static showError = (err: unknown, {message = `${i18next.t('purchaseError')}`}: {message?: string} = {}) => {
    new PurchaseError(message)
    console.error('[GameUtils showError]:', err)
  }

  static skipAdInFirstLevel = (levelIndex: number) => {
    return SdkManager.flags?.skipAdInFirstLevel && levelIndex === 0
  }

  static showTextPreloadAttempts = async (preloadText: Text | null, attempts: number, maxAttempts: number, err: unknown) => {
    const baseDelay = 3000 // первая попытка — 1 секунда
    const delay = baseDelay * attempts // вторая — 2с, третья — 3с и т.д.

    if (attempts >= maxAttempts) {
      if (preloadText) preloadText.text = 'Download error. \n reloading...'
      console.error('Download error. \n reloading...')

      return await new Promise(() => {
        setTimeout(() => location.reload(), 1000)
      })
    }

    if (preloadText) preloadText.text = `Download error. \nAttempt ${attempts + 1} out of ${maxAttempts}`
    console.error(`Download error. \nAttempt ${attempts + 1} out of ${maxAttempts} \n${err}`)

    if (attempts < maxAttempts) await new Promise((res) => setTimeout(res, delay))
  }

  static formatKeysToLowerCase = <Value>(obj: Record<string, Value>) => {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value]))
  }

  static checkLoadTime = (startTime: number, message = '') => {
    const endTime = performance.now()
    const loadDuration = Math.trunc(endTime - startTime)
    Logger.log('[checkLoadTime]', `${message} ${loadDuration}ms`)

    return loadDuration
  }

  // делает захват спайна и возвращает спрайт
  static captureToSprite = (app: Application, targetSprite: Container) => {
    // 1. Берём локальные границы меша
    const {x, y, width, height} = targetSprite.getLocalBounds()

    // 2. Создаём текстуру под размер меша
    const renderTexture = RenderTexture.create({
      width: Math.ceil(width),
      height: Math.ceil(height),
    })

    // 3. Смещаем, чтобы центр меша попал в текстуру
    const matrix = new Matrix()
    matrix.translate(-x, -y)

    // 4. Рендерим только меш (без окружения)
    app.renderer.render({container: targetSprite, target: renderTexture, transform: matrix, clear: true})

    // 5. Создаём обычный спрайт прямо из RenderTexture
    const snapshot = new Sprite(renderTexture)
    snapshot.anchor.set(0.5)
    snapshot.position.set(x + width / 2, y + height / 2)

    return snapshot
  }

  static showPopUp = (text: string | number = '', {color = 'green', duration = 1000}: PopUpOptions = {}) => {
    if (!LocalStorage.isDebug) return
    // создаём div только один раз
    if (!GameUtils.popupEl) {
      const popUp = document.createElement('div')
      popUp.className = 'debugSkinText'
      popUp.style.color = color
      document.body.appendChild(popUp)
      GameUtils.popupEl = popUp
    }

    // сбрасываем прошлый таймер, чтобы popup не исчез раньше
    if (GameUtils.popupTimeout) {
      clearTimeout(GameUtils.popupTimeout)
      GameUtils.popupTimeout = null
    }

    // просто обновляем текст
    GameUtils.popupEl.textContent = text.toString()
    GameUtils.popupEl.style.color = color

    // назначаем новый таймер скрытия
    GameUtils.popupTimeout = setTimeout(() => {
      if (!GameUtils.popupEl) return
      GameUtils.popupEl.remove()
      GameUtils.popupEl = null
      GameUtils.popupTimeout = null
    }, duration)
  }

  static capitalize(value: unknown = '') {
    const str = String(value)
    return str[0]?.toUpperCase() + str.slice(1)
  }

  // ---------------- ↓ special conditions for platforms ↓ ----------------
  // ↓ спец.условия для вк и ок ↓
  static get isPlatformVkOk() {
    return SdkManager.isPlatform(PLATFORM_ID.vk) || SdkManager.isPlatform(PLATFORM_ID.ok)
  }

  static showVkOkAdAfterLevelStart = async () => {
    const levelIndex = Locator.storage.levelIndex

    if (GameUtils.isPlatformVkOk && levelIndex > 0) {
      await SdkManager.showInterstitial()
    }
  }
  // ------------- ↑  special conditions for platforms ↑ -------------
}

const createGradientTexture = ({
  width,
  height,
  angle = 0,
  stops = [
    {color: '#002542', offset: 0},
    {color: 'transparent', offset: 0.5},
    {color: '#d2ebff', offset: 1},
  ],
}: GradientOptions) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // перевод угла в радианы
  const rad = angle * (Math.PI / 180)

  // вычисляем направление градиента по углу
  const x1 = width / 2 - Math.cos(rad) * width
  const y1 = height / 2 - Math.sin(rad) * height
  const x2 = width / 2 + Math.cos(rad) * width
  const y2 = height / 2 + Math.sin(rad) * height

  const gradient = ctx!.createLinearGradient(x1, y1, x2, y2)

  stops.forEach((s) => gradient.addColorStop(s.offset, s.color))

  ctx!.fillStyle = gradient
  ctx!.fillRect(0, 0, width, height)

  return Texture.from({resource: canvas, autoGenerateMipmaps: false})
}

const logReadableTime = (timeMs: number) => {
  const totalSeconds = Math.floor(timeMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return {
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  }
}

const eventToggle = (bool: boolean) => ({
  domAddRemove: bool ? 'addEventListener' : 'removeEventListener',
  gameOnOff: bool ? 'on' : 'off',
  gameOnceOff: bool ? 'once' : 'off',
  gameAddRemove: bool ? 'add' : 'remove',
}) as const

export {createGradientTexture, eventToggle, logReadableTime}
