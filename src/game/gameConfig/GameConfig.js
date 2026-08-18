import {ASSETS_URL} from './constants.js'
import LoadUtils from '../utils/gameUtils/LoadUtils.js'
import Locator from '../engine/Locator.ts'
import {Logger, MODULES} from '../utils/Logger.js'


export default class GameConfig {
  #basePath = ASSETS_URL.local
  #locale
  #levelConfigurationPromise = null
  localesHud
  storyText
  levels
  musicPlaylists
  locales
  
  constructor() {
    if (typeof GameConfig.instance === 'object') {
      return GameConfig.instance
    }
    
    GameConfig.instance = this
    return GameConfig.instance
  }
  
  set locale(locale) {
    this.#locale = locale
  }
  
  get locale() {
    return this.#locale
  }
  
  get gameConfigUrl() {
    return `${this.#basePath}assets/gameConfig`
  }
  
  loadLevelsJson = async () => {
    const url = `${this.gameConfigUrl}/levels.json`
    this.levels = await LoadUtils.loadJson(url)
  }

  loadMusicPlaylistsJson = async () => {
    const url = `${this.gameConfigUrl}/musicPlaylists.json`
    this.musicPlaylists = await LoadUtils.loadJson(url)
  }

  loadLevelConfiguration = () => {
    if (!this.#levelConfigurationPromise) {
      this.#levelConfigurationPromise = Promise.all([
        this.loadLevelsJson(),
        this.loadMusicPlaylistsJson(),
      ]).catch((error) => {
        this.#levelConfigurationPromise = null
        throw error
      })
    }

    return this.#levelConfigurationPromise
  }
  
  loadLocalesJson = async () => {
    const url = `${this.#basePath}assets/gameConfig/locales/locales.json`
    this.locales = await LoadUtils.loadJson(url)
  }
  
  loadLocalesHud = async () => {
    const url = `${this.#basePath}assets/gameConfig/locales/localesHud.json`
    this.localesHud = await LoadUtils.loadJson(url)
    Logger.log(MODULES.LOAD_ACTION, 'loadLocalesHud downloaded')
  }
  
  loadStoryTexts = async (testLocale) => {
    const locale = (testLocale) ? testLocale : Locator.gameConfig.locale
    const url = `${this.gameConfigUrl}/locales/storyTexts_${locale}.json`
    this.storyText = await LoadUtils.loadJson(url)
    // Logger.log(MODULES.LOAD_ACTION, `loadStoryTexts [${locale}] downloaded`)
    
    return {
      url,
      storyText: this.storyText
    }
  }
}
