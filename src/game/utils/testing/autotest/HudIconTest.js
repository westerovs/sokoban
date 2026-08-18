import {gsap} from 'gsap'
import Locator from '@/game/engine/Locator.ts'
import LevelConfig from '@/game/gameConfig/LevelConfig.js'
import {Assets, Cache, Sprite, Texture} from 'pixi.js'
import LoadUtils from '@/game/utils/gameUtils/LoadUtils.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {ASSETS_URL} from '@/game/gameConfig/constants.js'
import SpineUtils from '@/game/utils/SpineUtils.js'
import {Logger, MODULES} from '@/game/utils/Logger.js'
import {Physics} from '@esotericsoftware/spine-pixi-v8'


// todo - много дублирования с LevelSlotTester. Создать общий класс, либо вынести в TestController повторяющиеся куски
export default class HudIconTest {
  #testController
  #levels
  #loadedHud = []
  #boneName
  #spines = []
  #slots = []
  #slotNames = []
  #levelTextures = new Map()
  
  constructor(testController) {
    this.#testController = testController
    this.#levels = this.#testController.levels
  }
  
  start = async (boneName) => {
    this.#boneName = boneName
    
    console.group('%c\nHud Test', this.#testController.consoleHeaderStyle)
    console.log('Последовательно загружает все hud атласы')
    
    let counter = 0
    for (const {spineName, isRemote} of Object.values(this.#levels)) {
      await this.#createHudSpriteSheet(spineName, isRemote)
      await this.#levelSpineParse(spineName, isRemote, counter)
      this.#checkSlots(spineName)
      await this.#destroy(spineName)
      
      counter++
    }
    
    console.groupEnd()
  }
  
  #createHudSpriteSheet = async (spineName, isRemote) => {
    const hybridPath = isRemote ? ASSETS_URL.remote : ASSETS_URL.local
    const levelJsonNumber = LevelConfig.getLevelNumber(spineName)
    const hudDataName = `hudData-${levelJsonNumber}`
    const hudJson = `${hybridPath}assets/levels/hud/${hudDataName}.json`
    
    try {
      const hudSpriteSheet = {alias: hudDataName, src: `${hybridPath}assets/levels/hud/${hudDataName}.png`}
      await Assets.load(hudSpriteSheet)
      console.log(`${hudDataName} / ${this.#testController.maxLevels}`)
      console.log(`✅ spriteSheet ${hudDataName} загружен`)
      
      const atlasJson = await LoadUtils.loadJson(hudJson)
      console.log(`✅ json: ${hudDataName} загружен`)
      
      const atlasPng = Assets.get(hudDataName)
      await GameUtils.createSpriteSheet(atlasPng, atlasJson)
      this.#loadedHud.push({spineName, atlasJson, hudDataName})
      
      // await this.#testRenderSpriteSheet(hudSpriteSheet)
    } catch (err) {
      console.error(`[createHudSpriteSheet ${hudDataName}]`, err)
    }
  }
  
  async #testRenderSpriteSheet(hudSpriteSheet) {
    const sprite = new Sprite(Texture.from(hudSpriteSheet.alias))
    Locator.game.app.stage.addChildAt(sprite, 0)
    await gsap.to({}, {delay: 0.1})
  }
  
  #destroy = async (spineName) => {
    const unloadPromises = []
    
    this.#spines.forEach(spine => {
      SpineUtils.destroySpine(spine, spine.spineName)
    })
    
    this.#levelTextures.forEach(atlasLines => {
      unloadPromises.push(SpineUtils.destroyLevelAssets(atlasLines))
    })
    
    await Promise.all(unloadPromises)
    
    this.#spines.length = 0
    this.#levelTextures.clear()
    
    this.#slotNames = []
    
    
    await this.#destroyHudSpriteSheet(spineName)
  }
  
  #destroyHudSpriteSheet = async (spineName) => {
    const index = this.#loadedHud.findIndex(item => item.spineName === spineName)
    if (index === -1) return
    
    const {atlasJson, hudDataName} = this.#loadedHud[index]
    
    GameUtils.destroySpriteSheet(atlasJson)
    await Assets.unload(hudDataName)
    
    this.#loadedHud.splice(index, 1)
  }
  
  // --------------- логика загрузки спайн уровня
  #levelSpineParse = async (spineName, isRemote, counter) => {
    console.log(`[${counter}/${this.#testController.maxLevels}] ${spineName}:`)

    const hybridPath = isRemote ? ASSETS_URL.remote : ASSETS_URL.local
    const atlas = await LoadUtils.loadAtlas(`${hybridPath}assets/levels/gameLevels/${spineName}.atlas`)
    const json = await LoadUtils.loadJson(`${hybridPath}assets/levels/gameLevels/${spineName}.json`)
    
    // проверка на случай если уровень с двумя и более атласами изображений todo проверить двойные атласы
    const atlasLines = atlas
      .split('\n')
      .filter(line => line.includes(`.webp`))
      .map(line => line.trim())
    this.#levelTextures.set(spineName, atlasLines)
    
    await Promise.all(atlasLines.map(line => {
      const spriteSheetUrl = `${hybridPath}assets/levels/gameLevels/${line}`
      const alias = line.replace(`.webp`, '').trim()
      return Assets.load({alias, src: spriteSheetUrl})
    }))
    // console.log(`✅ спрайтшит загружен успешно`)
    
    const levelSpine = {name: spineName, json, atlas}
    SpineUtils.spineParser([levelSpine], 'webp')
    // console.log(`✅ levelSpine парсинг успешно`)
  }
  
  #checkSlots = (spineName) => {
    const spine = SpineUtils.createSpine({spineName, skinName: this.#testController.skinName})
    spine.spineName = spineName
    this.#spines.push(spine)
    
    for (let skin = 1; skin <= this.#testController.maxSkins; skin++) {
      console.log(`Проверка соответствия иконок по скинам / skin${skin}`)
      this.#findSlots(spine, `mode1/skin_mode1_v${skin}`)
      this.#createSlotNames(spineName)
    }
  }
  
  #findSlots = (spine, skinName) => {
    spine.skeleton.setSkin(skinName)
    spine.skeleton.setupPoseSlots()
    spine.skeleton.updateWorldTransform(Physics.update)
    
    const config = {
      spineName: spine.spineName,
      currentSkinName: skinName,
      hogItemsBone: this.#boneName,
    }
    
    this.#slots = SpineUtils.findSlots(spine, config)
  }
  
  // получает имена из интерактивных слотов
  #createSlotNames = (spineName) => {
    this.#slotNames = []
    
    this.#slots.forEach((slot, i) => {
      const attachmentName = SpineUtils.getAttachment(slot).name.split('/').pop()
      // console.log(`${i+1} slotName: ${slot.data.name} / slot / sprite name:`, attachmentName)
      
      const levelType = GameUtils.extractSuffix(spineName)
      if (levelType === 'words') {
        const match = attachmentName.match(/\d+_(\w+)/)
        const extractedWord = match ? match[1] : attachmentName // если не найдено слово после_  берем оригинал
        this.#slotNames.push(extractedWord)
        return
      }
      
      this.#slotNames.push(attachmentName)
      
      this.#checkHudIcons(attachmentName)
    })
  }
  
  // ------------------ логика проверки hud иконок
  #checkHudIcons = (attachmentName) => {
    const hudIconName = `hud-icon-${attachmentName}`

    if (!Cache.has(hudIconName)) {
      console.error(`[HUD createItems]: текстура ${hudIconName} не найдена. Проверь имя спайна`)
    }
  }
  
}
