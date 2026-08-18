import ABTest from '../../../modules/ABTest.js'
import LevelSlotTester from './LevelSlotTest.js'
import {GAME_NAME} from '../../../generatedAssets/buildMeta.js'
import {GAME_NAMES} from '../../../gameConfig/constants.js'
import HudIconTest from './HudIconTest.js'
import AudioTest from './AudioTest.js'
import Locator from '../../../engine/Locator.ts'
import {gsap} from 'gsap'
import LocaleManager from '../../../modules/LocaleManager.js'
import LoadLevelResources from '../../../states/preload/levelPreload/states/LoadLevelResources.js'
import {logReadableTime} from '../../gameUtils/GameUtils.js'
import {Assets} from 'pixi.js'

const levelLog = (key, value) => {
  const {spineName, isRemote} = value
  const color = isRemote ? 'tomato' : 'white'
  const formattedLevelName = key.replace(/\d/, ' $&') // добавляет пробел
  console.log(
    `level: ${formattedLevelName} \nspineName ${spineName} | isRemote %c${isRemote}`,
    `color: ${color}; font-weight: bold`
  )
}

export default class TestController {
  #levels
  #maxLevels
  #levelPreload
  #HOG_ITEMS_BONE_NAME = {
    decorItems: 'decorItems',
    hogItems: 'hogItems',
    hogItems2: 'hogItems2',
  }
  #maxSkins = 5 // todo динамически получать число скинов
  consoleHeaderStyle = 'color: #375F96; font-weight: bold; font-size: 18px'
  consoleSubHeaderStyle = 'color: gray; font-weight: bold; font-size: 16px'
  #storyTexts = []
  #skinName = 'mode1/skin_mode1_v1'
  
  constructor(levelPreload) {
    this.#levelPreload = levelPreload
    
    this.#levels = ABTest.getFilteredLevels()
    this.#maxLevels = Object.keys(ABTest.getFilteredLevels()).length - 1
    
    this.#init()
      .catch((err) => console.error('[TestController ошибка тестирования]', err))
  }
  
  get levels() {
    return this.#levels
  }
  
  get maxLevels() {
    return this.#maxLevels
  }
  
  get maxSkins() {
    return this.#maxSkins
  }
  
  get skinName() {
    return this.#skinName
  }
  
  get storyTexts() {
    return this.#storyTexts
  }
  
  #init = async () => {
    console.clear()
    console.log('%cСТАРТ ТЕСТИРОВАНИЯ', 'color: green; font-weight: bold; font-size: 18px')
    
    const delay = 1
    this.#getFilteredLevels()
    await gsap.to({}, {delay})
    
    await this.#testLoadingAllLevels()
    await gsap.to({}, {delay})
    
    await this.#testLevelSlots()
    await gsap.to({}, {delay})

    await this.#loadStoryTexts()
    await gsap.to({}, {delay})

    await this.#testHudIcons()
    await gsap.to({}, {delay})

    await this.#testAudio()
    await gsap.to({}, {delay})
    console.log('%cВСЕ ПРОВЕРКИ ЗАВЕРШЕНЫ', 'color: green; font-weight: bold; font-size: 18px')
  }
  
  // [1] список доступных уровней
  #getFilteredLevels = () => {
    const levels = ABTest.getFilteredLevels()
    const maxLevels = Object.keys(levels).length
    console.log(`%cОтфильтрованных уровней: ${maxLevels}\nЗагружены по адресу: ${Locator.gameConfig.gameConfigUrl}`, this.consoleHeaderStyle, levels)
    console.log(`Возвращает отфильтрованный список уровней. На его содержание влияют флаги, какие типы уровней включены для пользователей + эвенты, например куплен ли новогодний список уровней`)
  }
  
  // [2] проверка на наличие hogItems на уровне (спрайты внутри слотов)
  #testLevelSlots = async () => {
    const levelSlotTester = new LevelSlotTester(this)
    await levelSlotTester.start(this.#HOG_ITEMS_BONE_NAME.hogItems)
    
    // только в Отеле применяются двойные уровни.
    if (GAME_NAME === GAME_NAMES.hotel) {
      await levelSlotTester.start(this.#HOG_ITEMS_BONE_NAME.hogItems2)
    }
  }
  
  #testAudio = async () => {
    const audioTest = new AudioTest(this)
    await audioTest.start()
  }
  
  #loadStoryTexts = async () => {
    console.group(`%cТест загрузки StoryTexts`, this.consoleHeaderStyle)
    console.log('StoryText - это объект который содержит текст для начала и конца уровня + ключ speech по которому будет загружена озвучка')
    
    for (const locale of LocaleManager.supportedLocales) {
      try {
        const {url, storyText} = await Locator.gameConfig.loadStoryTexts(locale)
        this.#storyTexts.push({[locale]: storyText})
        
        const maxItems = Object.values(storyText).length
        console.group(`%c[StoryTexts ${locale} ${maxItems}`, this.consoleSubHeaderStyle)
        console.log(`Загружены по адресу: ${url}`, Locator.gameConfig.storyText)
        console.groupEnd()
        
      } catch (err) {
        console.error('StoryTexts:', err)
      }
    }
    
    console.groupEnd()
  }
  
  #testHudIcons = async () => {
    const hudIconTest = new HudIconTest(this)
    await hudIconTest.start(this.#HOG_ITEMS_BONE_NAME.hogItems)
  }
  
  
  // -------------------- грузит все уровни
  #testLoadingAllLevels = async () => {
    console.group('%c\nИмитация полного цикла загрузки уровня', this.consoleHeaderStyle)
    
    const levels = Object.entries(ABTest.getFilteredLevels())
    const fullStartTime = performance.now()
    const failedLevels = []
    
    for (const [levelIndex, [key, value]] of levels.entries()) {
      const levelStartTime = performance.now()
      const {spineName} = value
      
      levelLog(key, value)
      
      const loadResourcesState = new LoadLevelResources(this.#levelPreload, false)
      
      try {
        await loadResourcesState.execute(levelIndex)
      } catch (err) {
        failedLevels.push({
          type: 'load',
          levelIndex,
          levelName: key,
          spineName,
          error: err
        })
        console.error(`[LEVEL ERROR] ${key}`, err)
      } finally {
        try {
          await this.#clearLoadedLevelForTest(loadResourcesState, spineName)
        } catch (err) {
          failedLevels.push({
            type: 'clear',
            levelIndex,
            levelName: key,
            spineName,
            error: err
          })
          console.error(`[CLEAR ERROR] ${key}`, err)
        }
      }
      
      const levelEndTime = performance.now()
      const loadDuration = Math.trunc(levelEndTime - levelStartTime)
      console.log(`Loading time: ${loadDuration}`)
      console.log('')
    }
    
    const endFullTime = performance.now()
    const loadDuration = Math.trunc(endFullTime - fullStartTime)
    const {minutes, seconds} = logReadableTime(loadDuration)
    console.log(`Все уровни загружены за ${minutes} : ${seconds}`)
    
    if (!failedLevels.length) {
      console.log('%cВсе уровни прошли проверку без ошибок', 'color: green; font-weight: bold')
      return
    }
    
    console.log(`%cПроблемных проходов: ${failedLevels.length}`, 'color: tomato; font-weight: bold')
    
    failedLevels.forEach(({type, levelIndex, levelName, spineName, error}) => {
      console.log(`%c${levelName}`, 'color: tomato; font-weight: bold')
      console.log('type:', type)
      console.log('levelIndex:', levelIndex)
      console.log('spineName:', spineName)
      console.error(error)
    })
    
    console.groupEnd()
  }
  
  #unloadAssetIfExists = async (assetId) => {
    if (!assetId || !Assets.cache.has(assetId)) return
    await Assets.unload(assetId)
  }
  
  #unloadBundleSafely = async (bundleName) => {
    try {
      await Assets.unloadBundle(bundleName)
    } catch (err) {
      return null
    }
  }
  
  #clearLoadedLevelForTest = async (loadResourcesState, spineName) => {
    await this.#unloadBundleSafely('levelBundle')
    await this.#unloadBundleSafely('levelBundle_2')
    
    await this.#unloadAssetIfExists(`${spineName}.spineData`)
    await this.#unloadAssetIfExists(spineName)
    await this.#unloadAssetIfExists(`${spineName}_2`)
    
    try {
      const {spriteSheet} = loadResourcesState.hudSpriteSheetData
      spriteSheet.destroy(true)
    } catch (err) {
      console.log('[hudSpriteSheet destroy]', err)
    }
    
    Locator.soundManager.clearSoundList(Locator.soundManager.speechList)
  }
  
}
