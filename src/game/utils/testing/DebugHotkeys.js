import Locator from '../../engine/Locator.ts'
import {GAME_STATES} from '../../gameConfig/constants.js'
import {GAME_EVENTS} from '../../gameConfig/gameEvents.js'
import GameUtils from '../gameUtils/GameUtils.js'
import AdminPanel from './adminPanel/AdminPanel.js'

export default class DebugHotkeys {
  #game = Locator.game
  #skinIndex

  constructor() {
    this.#init()
  }

  #init = () => {
    const {levelIndex, skinIndex} = Locator.storage.playerData
    this.#skinIndex = skinIndex

    GameUtils.showPopUp(`level ${levelIndex} / skin ${skinIndex}`)
    window.addEventListener('keydown', this.#onKeysHandler)
  }

  #onKeysHandler = (event) => {
    if (event.repeat) return
    const numKey = parseInt(event.key)
    const tag = event.target.tagName

    this.#showAdminPanel(numKey)

    if (this.#game.stateName !== GAME_STATES.levelState) return
    if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) return

    this.#checkoutSkin(numKey)
    this.#runNextPart(numKey)
    this.#runFastWin(numKey)
    this.#runNextLevel(numKey)
  }

  #showAdminPanel = (numKey) => {
    if (numKey === 0) {
      if (!document.querySelector('.admin-panel__bg')) {
        new AdminPanel()
      }
    }
  }

  #checkoutSkin = (numKey) => {
    if (numKey >= 1 && numKey <= 5) {
      if (numKey === this.#skinIndex) {
        GameUtils.showPopUp(`skin ${numKey}`)
        return
      }

      this.#softReset(numKey)
    }
  }

  #runNextPart = (numKey) => {
    if (numKey === 7) {
      GameUtils.showPopUp('next part not found')
    }
  }

  #runFastWin = (numKey) => {
    if (numKey === 8) {
      setTimeout(() => this.#game.emit(GAME_EVENTS.completeLevelWin), 0)
      GameUtils.showPopUp('fast win')
    }
  }

  #runNextLevel = (numKey) => {
    if (numKey === 9) {
      this.#game.emit(GAME_EVENTS.LEVEL.forceNextLevel)
      GameUtils.showPopUp('next level')
      setTimeout(() => this.#game.state.runNextLevel(), 500)
    }
  }

  #softReset = (skinIndex) => {
    this.#skinIndex = skinIndex

    Locator.storage.playerData.skinIndex = skinIndex
    Locator.storage.save()
    this.#game.state.runNextLevel().then(() => GameUtils.showPopUp(`skin ${skinIndex}`))
  }
}
