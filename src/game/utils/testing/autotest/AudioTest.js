import {CLICK_ITEMS_SPEECH_COUNT} from '../../../generatedAssets/soundList.js'
import {createPreloadAudioList} from '../../../engine/audio/preloadAudioList.ts'
import {Howl} from 'howler'
import Locator from '../../../engine/Locator.ts'
import {ASSETS_URL} from '../../../gameConfig/constants.js'
import LocaleManager from '../../../modules/LocaleManager.js'

export default class AudioTest {
  #testController
  
  constructor(testController) {
    this.#testController = testController
  }
  
  start = async () => {
    console.group(`%cТест загрузки AUDIO`, this.#testController.consoleHeaderStyle)
    
    await this.#testCommonAudio()
    await this.#testClickSItemSpeech()
    await this.#testLevelIntroOutroSpeech()
    
    console.groupEnd()
  }
  
  #testCommonAudio = async () => {
    const baseLocale = Locator.gameConfig.locale
    const preloadList = createPreloadAudioList(baseLocale)
    
    console.group(`%c[Тест SFX & MUSIC]`, this.#testController.consoleSubHeaderStyle)
    
    for (const [categoryName, audioList] of Object.entries(preloadList)) {
      if (categoryName === 'CLICK_ITEMS_SPEECH') continue // проверяется отдельным методом
      console.group(categoryName)
      
      for (const {alias, src} of audioList) {
        await this.#checkAudioFile({alias, src, categoryName})
      }
      console.groupEnd()
    }
    console.groupEnd()
  }
  
  #testClickSItemSpeech = async () => {
    console.group('%c[Тест звуков речи по клику]', this.#testController.consoleSubHeaderStyle)
    
    for (const locale of LocaleManager.supportedLocales) {
      const preloadList = createPreloadAudioList(locale)
      const clickItemsSpeech = preloadList.CLICK_ITEMS_SPEECH
      
      console.group(`${locale}: ${CLICK_ITEMS_SPEECH_COUNT}`)
      for (const {alias, src} of clickItemsSpeech) {
        await this.#checkAudioFile({alias, src, categoryName: 'CLICK_ITEMS_SPEECH'})
      }
      console.groupEnd()
    }
    
    console.groupEnd()
  }
  
  #testLevelIntroOutroSpeech = async () => {
    const {storyTexts} = this.#testController
    const localPath = ASSETS_URL.local
    const remotePath = ASSETS_URL.remote
    
    console.group('%c[Тест звуков речи intro/outro]', this.#testController.consoleSubHeaderStyle)
    
    for (const localeData of storyTexts) {
      const [locale, levels] = Object.entries(localeData)[0]
      const speechPath = locale === 'ru' ? localPath : remotePath
      
      console.group(locale)
      
      for (const [levelKey, levelData] of Object.entries(levels)) {
        console.log(levelKey)
        
        await this.#checkSpeechList({
          speechList: levelData.intro.speech,
          locale,
          speechPath,
          type: 'intro',
        })
        
        await this.#checkSpeechList({
          speechList: levelData.outro.speech,
          locale,
          speechPath,
          type: 'outro',
        })
      }
      
      console.groupEnd()
    }
    
    console.groupEnd()
  }
  
  #checkSpeechList = async ({speechList, locale, speechPath, type}) => {
    for (const speech of speechList) {
      const alias = speech.trim()
      const src = `${speechPath}assets/audio/speech/${locale}/${type}/${alias}.mp3`
      await this.#checkAudioFile({alias, src, categoryName: type})
    }
  }
  
  #checkAudioFile = ({alias, src, categoryName}) => {
    return new Promise(resolve => {
      const sound = new Howl({
        src: [src],
        preload: true,
        autoplay: false,
        loop: false,
        volume: 0,
        onload: () => {
          console.log(`✅ [${categoryName}] ${alias}`)
          sound.unload()
          resolve({alias, src, ok: true})
        },
        onloaderror: (_, error) => {
          console.error(`❌ [${categoryName}] ${alias}`)
          console.error(`src: ${src}`)
          console.error(`howler error:`, error)
          sound.unload()
          resolve({alias, src, ok: false, error})
        }
      })
    })
  }
}
