import type UiLayer from '@/game/engine/uiLayer/UiLayer.ts'
import type LiveOpsController from '../components/liveOpsController/LiveOpsController.js'
import type Game from '../Game.js'
import type GameConfig from '../gameConfig/GameConfig.js'
import type PaymentManager from '../modules/PaymentManager.js'
import type Options from '../ui/common/options/Options.js'
import type UIFader from '../ui/UIFader.js'
import type SoundManager from './audio/SoundManager.js'
import type GameResize from './GameResize.js'
import type Storage from './storage/Storage.js'

type Service = {
  name: string
  instance: unknown
}

export const SERVICES = {
  GAME: 'GAME',
  GAME_RESIZE: 'GAME_RESIZE',
  STORAGE: 'storage',
  OPTIONS: 'options',
  SOUND_MANAGER: 'soundManager',
  GAME_CONFIG: 'gameConfig',
  PAYMENT_MANAGER: 'PAYMENT_MANAGER',
  UI_LAYER: 'UI_LAYER',
  UI_FADER: 'UI_FADER',
  LIVE_OPS: 'LIVE_OPS',
}

export default class Locator {
  static services: Set<Service> = new Set()

  static register(name: string, instance: unknown) {
    const service = {name, instance}
    if (![...Locator.services].some((service) => service.name === name)) {
      Locator.services.add(service)
    }
  }

  static get(name: string) {
    const service = [...Locator.services].find((service) => service.name === name)
    return service ? service.instance : undefined
  }

  static get game(): Game {
    return Locator.get(SERVICES.GAME) as Game
  }

  static get gameResize(): GameResize {
    return Locator.get(SERVICES.GAME_RESIZE) as GameResize
  }

  static get storage(): Storage {
    return Locator.get(SERVICES.STORAGE) as Storage
  }

  static get options(): Options {
    return Locator.get(SERVICES.OPTIONS) as Options
  }

  static get soundManager(): SoundManager {
    return Locator.get(SERVICES.SOUND_MANAGER) as SoundManager
  }

  static get gameConfig(): GameConfig {
    return Locator.get(SERVICES.GAME_CONFIG) as GameConfig
  }

  static get paymentManager(): PaymentManager {
    return Locator.get(SERVICES.PAYMENT_MANAGER) as PaymentManager
  }

  static get uiLayer(): UiLayer {
    return Locator.get(SERVICES.UI_LAYER) as UiLayer
  }

  static get uiFader(): UIFader {
    return Locator.get(SERVICES.UI_FADER) as UIFader
  }

  static get liveOps(): LiveOpsController {
    return Locator.get(SERVICES.LIVE_OPS) as LiveOpsController
  }
}
