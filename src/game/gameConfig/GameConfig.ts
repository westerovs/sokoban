import LoadUtils from '../utils/gameUtils/LoadUtils.js'
import {ASSETS_URL} from './constants.js'
import {levels} from './levels/levels.js'
import type {GameLevels} from './levels/levelTypes.js'

// Загружает уровни и локализации, используемые текущей сборкой игры.

type Locales = Record<string, Record<string, string>>

export default class GameConfig {
  static instance: GameConfig | undefined
  #basePath = ASSETS_URL.local
  #locale = ''
  #levelConfigurationPromise: Promise<void> | null = null
  levels: GameLevels | undefined
  locales: Locales | undefined

  // Поддерживает единственный экземпляр игровой конфигурации.
  constructor() {
    if (typeof GameConfig.instance === 'object') {
      return GameConfig.instance
    }

    GameConfig.instance = this
    return GameConfig.instance
  }

  // Сохраняет выбранную локаль.
  set locale(locale: string) {
    this.#locale = locale
  }

  // Возвращает выбранную локаль.
  get locale() {
    return this.#locale
  }

  // Возвращает путь к удалённой конфигурации игры.
  get gameConfigUrl() {
    return `${this.#basePath}assets/gameConfig`
  }

  // Подключает сгенерированный каталог уровней.
  loadLevelsJson = async () => {
    this.levels = levels as GameLevels
  }

  // Повторно использует текущую загрузку каталога уровней.
  loadLevelConfiguration = () => {
    if (!this.#levelConfigurationPromise) {
      this.#levelConfigurationPromise = this.loadLevelsJson().catch((error) => {
        this.#levelConfigurationPromise = null
        throw error
      })
    }

    return this.#levelConfigurationPromise
  }

  // Загружает словари локализаций.
  loadLocalesJson = async () => {
    const url = `${this.#basePath}assets/gameConfig/locales/locales.json`
    this.locales = (await LoadUtils.loadJson(url)) as Locales
  }
}

export type {Locales}
