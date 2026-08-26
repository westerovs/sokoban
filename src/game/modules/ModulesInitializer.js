import Locator from '../engine/Locator.ts'
import {GAME_EVENTS} from '../gameConfig/gameEvents.js'
import Stopwatch from '../ui/level/clock/Stopwatch.js'

export default class ModulesInitializer {
  #game = Locator.game
  modules = {}

  constructor() {
    this.modules = {}
    this.#game.on(GAME_EVENTS.clearLevel, this.#destroy)
  }

  getMod(name) {
    return this.modules[name]
  }

  init(props) {
    if (props.stopwatch) {
      this.modules.stopwatch = new Stopwatch(props.stopwatch)
      this.modules.stopwatch.start()
    }
  }

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
