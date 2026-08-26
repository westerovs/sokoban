import i18next from 'i18next'
import Locator from '@/game/engine/Locator.ts'
import PreloadView from '@/game/states/preload/PreloadView.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import LoadUtils from '@/game/utils/gameUtils/LoadUtils.js'
import SpineUtils from '@/game/utils/SpineUtils.js'

let onceLoadIsLoaded = false

// загружается единожды при первом запуске
export default class InitialLoad {
  #game
  #view
  #preloadText
  static _characterSpinePromise = null
  static _characterSpineIsLoaded = false
  static _promoSpriteSheetPromise = null
  static _skinsSpriteSheetPromise = null

  constructor(levelEntity) {
    this.#game = levelEntity.game
  }

  get view() {
    return this.#view
  }

  initView = () => {
    this.#view = new PreloadView(this.#game)
    this.#game.gameContainer.addChild(this.#view)
    this.#preloadText = this.#view.refs.preloadText
  }

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
        console.error(err)
      }
    }
  }

  #onceLoadActions = async () => {
    this.#updateProgress(0)

    await Locator.gameConfig.loadLevelConfiguration()
    this.#updateProgress(10)

    await this.#loadSpines()

    await this.#createUiSpriteSheet()
    this.#updateProgress(100)

    onceLoadIsLoaded = true
  }

  #loadSpines = async () => {
    InitialLoad.characterSpinePromise()
    this.#updateProgress(40)

    await SpineUtils.loadAndParseSpineAsset({
      spineName: 'startLevelAnimation',
      folderPath: 'spines/startLevelAnimation',
    })

    this.#updateProgress(80)
  }

  #createUiSpriteSheet = async () => {
    await LoadUtils.loadSpriteSheet({spriteSheetName: 'levelUi'})

    // фоновая загрузка
    InitialLoad.promoSpriteSheetPromise()
    InitialLoad.skinsSpriteSheetPromise()
  }

  #updateProgress = (progress) => {
    this.#preloadText.text = i18next.t('textLoading.init') + ` \n${progress}%`
  }

  // ----------------- фоновые загрузки
  static get characterSpineIsLoaded() {
    return InitialLoad._characterSpineIsLoaded
  }

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

  static promoSpriteSheetPromise = () => {
    if (!InitialLoad._promoSpriteSheetPromise) {
      InitialLoad._promoSpriteSheetPromise = LoadUtils.loadSpriteSheet({spriteSheetName: 'promo'}).catch((error) => {
        InitialLoad._promoSpriteSheetPromise = null
        throw error
      })
    }

    return InitialLoad._promoSpriteSheetPromise
  }

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
