import Locator from '../engine/Locator.ts'
import {GAME_EVENTS} from '../gameConfig/gameEvents.js'
import Stopwatch from '../ui/level/clock/Stopwatch.js'
import type Game from '../Game.js'

// Создаёт и очищает подключаемые модули текущего уровня.

type ClearableModule = {
  clear?: (showLog?: boolean) => void
  start?: () => void
}

type Modules = Record<string, ClearableModule>

type ModuleOptions = {
  stopwatch?: {
    game: Game
    label?: string
  }
}

export default class ModulesInitializer {
  #game = Locator.game
  modules: Modules = {}

  // Создаёт пустой набор модулей и подписывается на очистку уровня.
  constructor() {
    this.modules = {}
    this.#game.on(GAME_EVENTS.clearLevel, this.#destroy)
  }

  // Возвращает модуль по имени.
  getMod(name: string) {
    return this.modules[name]
  }

  // Создаёт модули, переданные в параметрах уровня.
  init(props: ModuleOptions) {
    if (props.stopwatch) {
      this.modules.stopwatch = new Stopwatch(props.stopwatch)
      this.modules.stopwatch.start?.()
    }
  }

  // Очищает созданные модули и удаляет подписку.
  #destroy = () => {
    const isShowLog = true

    Object.values(this.modules).forEach((module) => {
      if (module?.clear) {
        module.clear(isShowLog)
      }
    })

    this.#game.off(GAME_EVENTS.clearLevel, this.#destroy)
    this.modules = {}
    // Logger.log(MODULES.DestroyMessage, '[ModulesInitializer] destroy')
  }
}
