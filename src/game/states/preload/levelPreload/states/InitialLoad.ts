import i18next from 'i18next'
import Locator from '@/game/engine/Locator.ts'
import PreloadView from '@/game/states/preload/PreloadView.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import LoadUtils from '@/game/utils/gameUtils/LoadUtils.js'
import SpineUtils from '@/game/utils/SpineUtils.js'
import {Text} from 'pixi.js'
import type Game from '@/game/Game.js'
import type LevelPreload from '../LevelPreload.js'

let onceLoadIsLoaded = false // Показывает, завершена ли одноразовая загрузка

// Загружает общие ресурсы единожды при первом запуске уровня.
export default class InitialLoad {
  #game: Game
  #view!: PreloadView
  #preloadText!: Text
  static _characterSpinePromise: Promise<unknown> | null = null // Фоновая загрузка скелета персонажа
  static _characterSpineIsLoaded = false // Готовность скелета персонажа
  static _promoSpriteSheetPromise: Promise<unknown> | null = null // Фоновая загрузка промо-атласа
  static _skinsSpriteSheetPromise: Promise<unknown> | null = null // Фоновая загрузка атласа обликов

  // Сохраняет игровую шину из состояния предзагрузки.
  constructor(levelEntity: LevelPreload) {
    this.#game = levelEntity.game
  }

  // Возвращает созданное представление загрузки.
  get view() {
    return this.#view
  }

  // Создаёт представление и сохраняет ссылку на текст прогресса.
  initView = () => {
    this.#view = new PreloadView()
    this.#game.gameContainer.addChild(this.#view)
    this.#preloadText = this.#view.refs.preloadText
  }

  // Выполняет одноразовую загрузку с ограниченным числом повторов.
  execute = async () => {
    if (onceLoadIsLoaded) return

    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      try {
        await this.#onceLoadActions()
        break
      } catch (err) {
        attempts++
        await GameUtils.showTextPreloadAttempts(this.#preloadText, attempts, maxAttempts)
        console.error('[InitialLoad]: one-time loading failed', err)
      }
    }
  }

  // Последовательно загружает конфигурацию и общие ресурсы.
  #onceLoadActions = async () => {
    this.#updateProgress(0)

    await Locator.gameConfig.loadLevelConfiguration()
    this.#updateProgress(10)

    await this.#loadSpines()

    await this.#createUiSpriteSheet()
    this.#updateProgress(100)

    onceLoadIsLoaded = true
  }

  // Загружает необходимые Spine-ресурсы.
  #loadSpines = async () => {
    InitialLoad.characterSpinePromise()
    this.#updateProgress(40)

    await SpineUtils.loadAndParseSpineAsset({
      spineName: 'startLevelAnimation',
      folderPath: 'spines/startLevelAnimation',
    })

    this.#updateProgress(80)
  }

  // Загружает основной UI-атлас и запускает фоновые загрузки.
  #createUiSpriteSheet = async () => {
    await LoadUtils.loadSpriteSheet({spriteSheetName: 'levelUi'})

    // фоновая загрузка
    InitialLoad.promoSpriteSheetPromise()
    InitialLoad.skinsSpriteSheetPromise()
  }

  // Обновляет текст прогресса одноразовой загрузки.
  #updateProgress = (progress: number) => {
    this.#preloadText.text = i18next.t('textLoading.init') + ` \n${progress}%`
  }

  // ----------------- фоновые загрузки
  // Возвращает признак готовности скелета персонажа.
  static get characterSpineIsLoaded() {
    return InitialLoad._characterSpineIsLoaded
  }

  // Возвращает общий запрос загрузки скелета персонажа.
  static characterSpinePromise = () => {
    if (!InitialLoad._characterSpinePromise) {
      InitialLoad._characterSpinePromise = (async () => {
        await SpineUtils.loadAndParseSpineAsset({
          spineName: 'character',
          folderPath: 'spines/character',
        })

        InitialLoad._characterSpineIsLoaded = true
      })().catch((error) => {
        InitialLoad._characterSpinePromise = null
        InitialLoad._characterSpineIsLoaded = false
        throw error
      })
    }

    return InitialLoad._characterSpinePromise
  }

  // Возвращает общий запрос фоновой загрузки промо-атласа.
  static promoSpriteSheetPromise = () => {
    if (!InitialLoad._promoSpriteSheetPromise) {
      InitialLoad._promoSpriteSheetPromise = LoadUtils.loadSpriteSheet({spriteSheetName: 'promo'}).catch((error) => {
        InitialLoad._promoSpriteSheetPromise = null
        throw error
      })
    }

    return InitialLoad._promoSpriteSheetPromise
  }

  // Возвращает общий запрос фоновой загрузки атласа обликов.
  static skinsSpriteSheetPromise = () => {
    if (!InitialLoad._skinsSpriteSheetPromise) {
      InitialLoad._skinsSpriteSheetPromise = LoadUtils.loadSpriteSheet({spriteSheetName: 'skins'}).catch((error) => {
        InitialLoad._skinsSpriteSheetPromise = null
        throw error
      })
    }

    return InitialLoad._skinsSpriteSheetPromise
  }
}
