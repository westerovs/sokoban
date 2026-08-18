import {Assets} from 'pixi.js'
import {ASSETS_URL} from '@/game/gameConfig/constants.js'
import LoadUtils from '@/game/utils/gameUtils/LoadUtils.js'
import SpineUtils from '@/game/utils/SpineUtils.js'
import {Physics} from '@esotericsoftware/spine-pixi-v8'

export default class LevelSlotTester {
  #testController
  #levels
  #boneName
  #spines = []
  #levelTextures = new Map()
  
  constructor(testController) {
    this.#testController = testController
    
    this.#levels = this.#testController.levels
  }
  
  async start(boneName) {
    console.group('%c\nПроверка наличия hogItems (спрайты на уровне для поиска)', this.#testController.consoleHeaderStyle)
    console.log(`Данная проверка проверяет что внутри спайн-слота содержится изображение. иначе слот будет пустой.
Если есть ошибка:
- следует проверить что галочка экспорт включена, иначе слот будет пустой и следовательно в игре будет отсутствовать hotItem для поиска
- следует проверить что на всех скинах в attachment есть спрайты, если на каком-то скине забыли, то будет ошибка.
- При наличии этой ошибки игра не падает, в hud такие предметы не попадают, просто число предметов для поиска будет меньше.`)
    
    this.#boneName = boneName
    let counter = 0
    
    for (const {spineName, isRemote} of Object.values(this.#levels)) {
      await this.#levelSpineParse(spineName, isRemote, counter)
      this.#checkSlots(spineName)
      counter++
    }
    console.groupEnd()
    
    await this.#destroy()
  }

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
    console.log(`✅ спрайтшит загружен успешно`)
    
    const levelSpine = {name: spineName, json, atlas}
    SpineUtils.spineParser([levelSpine], 'webp')
    console.log(`✅ levelSpine парсинг успешно`)
  }
  
  #checkSlots = (spineName) => {
    const spine = SpineUtils.createSpine({spineName, skinName: 'mode1/skin_mode1_v1',})
    spine.spineName = spineName
    this.#spines.push(spine)
    
    for (let skin = 1; skin <= this.#testController.maxSkins; skin++) {
      console.log(`проверка слотов внутри skin${skin}`)
      this.#findSlots(spine, `mode1/skin_mode1_v${skin}`)
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
    
    SpineUtils.findSlots(spine, config)
  }
  
  #destroy = async () => {
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
  }
}
