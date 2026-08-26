import type {Sprite, Texture} from 'pixi.js'
import {Assets} from 'pixi.js'
import Locator from '@/game/engine/Locator'
import SdkManager from '@/game/engine/SdkManager.js'
import {ASSETS_URL, GAME_NAMES, PLATFORM_ID} from '@/game/gameConfig/constants.js'
import GameUtils from '../../../utils/gameUtils/GameUtils.js'

type GameLogoView = Sprite & {
  label: string
  updateAdaptive: () => void
  _customPosition?: {
    x?: number
    y?: number
  }
}

export default class GameLogo {
  #view: GameLogoView | null = null
  #isDestroyed = false
  #customPosition = {y: 320}

  get view(): GameLogoView | null {
    return this.#view
  }

  init = async (): Promise<void> => {
    if (!SdkManager.flags?.noStore) return

    try {
      const texture = await Assets.load(this.#getLogoUrl())
      if (this.#isDestroyed) return

      this.#createLogo(texture)
      this.updateAdaptive()
    } catch (error) {
      console.warn('[GameLogo] Не удалось загрузить логотип', error)
    }
  }

  destroy = (): void => {
    this.#isDestroyed = true
    this.#view?.destroy()
    this.#view = null
  }

  updateAdaptive = (): void => {
    const {x} = Locator.uiLayer.uiData.center
    this.#view?.position.set(x, this.#customPosition.y)
  }

  #getLogoUrl = (): string => {
    const currentGameName = String(GAME_NAMES.currentName)
    const isYoutubeLogo = SdkManager.isPlatform(PLATFORM_ID.youtube) && currentGameName === GAME_NAMES.detective
    const fileName = isYoutubeLogo ? 'youtube-logo.png' : `game-logo-${Locator.gameConfig.locale}.png`

    return `${ASSETS_URL.local}assets/images/${fileName}`
  }

  #createLogo = (texture: Texture): void => {
    this.#view = GameUtils.createSprite(texture) as GameLogoView
    this.#view.label = 'gameLogo'
    this.#view.updateAdaptive = this.updateAdaptive
    this.#view._customPosition = this.#customPosition

    Locator.uiLayer.stateUiLayer.addChild(this.#view)
    Locator.uiLayer.resizeAdaptive(this.#view)
  }
}
