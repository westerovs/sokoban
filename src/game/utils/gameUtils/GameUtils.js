import {Cache, Container, Matrix, RenderTexture, Sprite, Spritesheet, Text, Texture} from 'pixi.js'
import {Logger} from '../Logger.js'
import {LEVEL_TYPES, PLATFORM_ID} from '@/game/gameConfig/constants.js'
import PurchaseError from '@/game/ui/common/purchaseError/PurchaseError.js'
import SdkManager from '@/game/engine/SdkManager.js'
import Locator from '@/game/engine/Locator.ts'
import LocalStorage from '@/game/engine/storage/LocalStorage.js'
import {FONT_COLORS, primaryFontStyle} from '@/game/styles.js'
import {applyInteractive} from '@/game/components/buttons/buttons.js'
import i18next from 'i18next'

export default class GameUtils {
  static popupEl
  static popupTimeout
  
  static get isFirstLevel() {
    const {levelIndex, skinIndex} = Locator.storage.playerData
    return (levelIndex === 0 && skinIndex === 1)
  }
  
  static createSprite(textureSource, {label, name, anchorX = 0.5, anchorY = 0.5, scale = 1, interactive} = {}) {
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
    }
  } = {}) => {
    const checkboxContainer = new Container()
    if (interactive) applyInteractive(checkboxContainer)
    checkboxContainer.label = name
    
    const checkboxText = new Text({text, style})
    checkboxText.anchor.set(0, 0.5)
    checkboxText.x = 30
    
    const checkbox = GameUtils.createSprite('checkbox')
    const checkboxMark = GameUtils.createSprite('checkbox-mark', {label: 'checkboxMark'})
    
    checkboxContainer.addChild( checkbox, checkboxMark, checkboxText)
    
    const {width, height} = checkboxContainer
    checkboxContainer.pivot.set((width / 2) - checkbox.width / 2, height / 2)
    
    return checkboxContainer
  }
  
  static createText(text, {name, style = {}, anchorX = 0.5, anchorY = 0.5} = {}) {
    const textElement = new Text({text, style})
    textElement.anchor.set(anchorX, anchorY)
    if (name) textElement.label = name
    
    return textElement
  }
  
  static getPositionIndex(parent, view) {
    console.log(parent.children)
    return parent.children.indexOf(view)
  }
  
  static getLocalPosition(targetA, targetB) {
    const globalCenter = targetA.toGlobal({x: targetA.width / 2, y: 0})
    const localPos = targetB.parent.toLocal(globalCenter)
    
    return {
      x: localPos.x,
      y: localPos.y,
    }
  }
  
  static getLocalPositionVarB(target, parent) {
    const globalPoint = target.getGlobalPosition()
    const {x, y} = parent.toLocal(globalPoint)
    
    return {x, y}
  }
  
  // пример object_cat_28 -> cat
  static hasWord(str, word) {
    return new RegExp(word, 'i').test(str)
  }
  
  static removeTexturesFromCache = (frames) => {
    for (const key in frames) {
      if (!Cache.has(key)) continue

      const texture = Cache.get(key)
      Cache.remove(key)
      if (texture instanceof Texture) texture.destroy(false)
    }
  }
  
  static createSpriteSheet = async (atlasPng, atlasJson, clearCache = false) => {
    if (clearCache) GameUtils.removeTexturesFromCache(atlasJson.frames)
    
    // 2. Создать и распарсить спрайтшит
    const spriteSheet = new Spritesheet({texture: atlasPng, data: atlasJson})
    await spriteSheet.parse()

    for (const [key, texture] of Object.entries(spriteSheet.textures)) {
      Cache.set(key, texture)
    }
    
    return spriteSheet
  }
  
  static destroySpriteSheet = (atlasJson) => {
    const frameKeys = Object.keys(atlasJson.frames)
    for (const key of frameKeys) {
      if (!Cache.has(key)) continue

      const texture = Cache.get(key)
      Cache.remove(key)
      if (texture instanceof Texture) texture.destroy(false)
    }
  }
  
  // Превращает строки 'true' в булево значение true. Нужно для корректного приёма данных из ABTest
  static isStringTrue = (value) => value === true || value === 'true'
  
  // возвращает слово после первого нижнего подчеркивания
  static extractSuffix = (value) => {
    if (!value) return
    const match = value.match(/_(.+)$/)
    return match ? match[1] : null
  }
  
  // пример работы: level131_identical_cup -> levelType: identical / identicalName: cup
  static extractSpineLevelSuffix = (spineName) => {
    if (!spineName) return {levelType: null, identicalName: null}
    
    const firstUnderscoreIndex = spineName.indexOf('_')
    if (firstUnderscoreIndex === -1) return {levelType: null, identicalName: null}
    
    const suffix = spineName.slice(firstUnderscoreIndex + 1)
    const [levelType, identicalNamePart] = suffix.split('_')
    
    if (levelType === LEVEL_TYPES.IDENTICAL.name) {
      return {
        levelType,
        identicalName: identicalNamePart
      }
    }
    
    return {
      levelType,
      identicalName: null
    }
  }
  
  static checkWebp = (fallback = 'jpg') => {
    if (typeof document === 'undefined') return fallback
    
    const canvas = document.createElement('canvas')
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'webp' : fallback
  }
  
  static showError = (err, {message = `${i18next.t('purchaseError')}`} = {}) => {
    new PurchaseError(message)
    console.error('[GameUtils showError]:', err)
  }
  
  static skipAdInFirstLevel = (levelIndex) => {
    return (SdkManager.flags?.skipAdInFirstLevel && (levelIndex === 0))
  }

  static showTextPreloadAttempts = async (preloadText, attempts, maxAttempts, err) => {
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
    
    if (attempts < maxAttempts) await new Promise(res => setTimeout(res, delay))
  }
  
  static formatKeysToLowerCase = (obj) => {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key.toLowerCase(), value])
    )
  }
  
  static checkLoadTime = (startTime, message = '') => {
    const endTime = performance.now()
    const loadDuration = Math.trunc(endTime - startTime)
    Logger.log('[checkLoadTime]', `${message} ${loadDuration}ms`)
    
    return loadDuration
  }
  
  // делает захват спайна и возвращает спрайт
  static captureToSprite = (app, targetSprite) => {
    // 1. Берём локальные границы меша
    const {x, y, width, height} = targetSprite.getLocalBounds()
    
    // 2. Создаём текстуру под размер меша
    const renderTexture = RenderTexture.create({
      width: Math.ceil(width),
      height: Math.ceil(height)
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
  
  static showPopUp = (text = '', {color = 'green', duration = 1000} = {}) => {
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
  
  static capitalize(value = '') {
    const str = String(value)
    return str[0]?.toUpperCase() + str.slice(1)
  }
  
  // ---------------- ↓ special conditions for platforms ↓ ----------------
  // ↓ спец.условия для вк и ок ↓
  static get isPlatformVkOk() {
    return SdkManager.isPlatform(PLATFORM_ID.vk) || SdkManager.isPlatform(PLATFORM_ID.ok)
  }
  
  static showVkOkAdAfterLevelStart  = async () => {
    const levelIndex = Locator.storage.levelIndex
    
    if (GameUtils.isPlatformVkOk && (levelIndex > 0)) {
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
                                   {color: '#d2ebff', offset: 1}
                                 ]
                               }) => {
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
  
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
  
  stops.forEach(s => gradient.addColorStop(s.offset, s.color))
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  return Texture.from({resource: canvas, autoGenerateMipmaps: false})
}

const viewResize = (refs) => {
  const promises = Object.keys(refs).map(key => {
    if (refs[key].resize) {
      return Promise.resolve(refs[key].resize())
    }
    return Promise.resolve()
  })
  
  return Promise.all(promises)
}

const logReadableTime = (timeMs) => {
  const totalSeconds = Math.floor(timeMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  
  return {
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0')
  }
}

const eventToggle = (bool) => ({
  domAddRemove: bool ? 'addEventListener' : 'removeEventListener',
  gameOnOff: bool ? 'on' : 'off',
  gameOnceOff: bool ? 'once' : 'off',
  gameAddRemove: bool ? 'add' : 'remove'
})

export {
  viewResize,
  logReadableTime,
  eventToggle,
  createGradientTexture
}
