import LoadUtils from '../utils/gameUtils/LoadUtils.js'
import {ASSETS_URL} from './constants.js'
import levels from './levels.json'


export default class GameConfig {
  #basePath = ASSETS_URL.local
  #locale
  #levelConfigurationPromise = null
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
    this.levels = levels
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
}
