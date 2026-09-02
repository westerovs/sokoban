import Locator from '../../engine/Locator.ts'
import {GAME_STATES} from '../../gameConfig/constants.js'
import {GAME_EVENTS} from '../../gameConfig/gameEvents.js'
import type StateLevel from '../../states/stateLevel/StateLevel.js'
import GameUtils from '../gameUtils/GameUtils.js'
import AdminPanel from './adminPanel/AdminPanel.js'

// Обрабатывает отладочные горячие клавиши выбора облика и перехода между уровнями.

export default class DebugHotkeys {
  #game = Locator.game
  #skinIndex = 0

  // Подключает горячие клавиши к окну.
  constructor() {
    this.#init()
  }

  // Сохраняет текущий облик и регистрирует клавиатурное событие.
  #init = () => {
    const {levelIndex, skinIndex} = Locator.storage.playerData
    this.#skinIndex = skinIndex

    GameUtils.showPopUp(`level ${levelIndex} / skin ${skinIndex}`)
    window.addEventListener('keydown', this.#onKeysHandler)
  }

  // Распределяет нажатие по доступным отладочным действиям.
  #onKeysHandler = (event: KeyboardEvent) => {
    if (event.repeat) return
    const numKey = parseInt(event.key)
    const target = event.target as HTMLElement | null
    const tag = target?.tagName

    this.#showAdminPanel(numKey)

    if (this.#game.stateName !== GAME_STATES.levelState) return
    if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return

    this.#checkoutSkin(numKey)
    this.#runNextPart(numKey)
    this.#runFastWin(numKey)
    this.#runNextLevel(numKey)
  }

  // Открывает панель разработчика по клавише 0.
  #showAdminPanel = (numKey: number) => {
    if (numKey === 0) {
      if (!document.querySelector('.admin-panel__bg')) {
        new AdminPanel()
      }
    }
  }

  // Переключает тестовый облик по цифровой клавише.
  #checkoutSkin = (numKey: number) => {
    if (numKey >= 1 && numKey <= 5) {
      if (numKey === this.#skinIndex) {
        GameUtils.showPopUp(`skin ${numKey}`)
        return
      }

      this.#softReset(numKey)
    }
  }

  // Показывает служебное сообщение для перехода к следующей части.
  #runNextPart = (numKey: number) => {
    if (numKey === 7) {
      GameUtils.showPopUp('next part not found')
    }
  }

  // Принудительно запускает завершение уровня.
  #runFastWin = (numKey: number) => {
    if (numKey === 8) {
      setTimeout(() => this.#game.emit(GAME_EVENTS.completeLevelWin), 0)
      GameUtils.showPopUp('fast win')
    }
  }

  // Принудительно сохраняет и запускает следующий уровень.
  #runNextLevel = (numKey: number) => {
    if (numKey === 9) {
      this.#game.emit(GAME_EVENTS.LEVEL.forceNextLevel)
      GameUtils.showPopUp('next level')
      setTimeout(() => (this.#game.state as StateLevel | null)?.runNextLevel(), 500)
    }
  }

  // Сохраняет выбранный облик и мягко перезапускает уровень.
  #softReset = (skinIndex: number) => {
    this.#skinIndex = skinIndex

    Locator.storage.playerData.skinIndex = skinIndex
    Locator.storage.save()
    ;(this.#game.state as StateLevel | null)?.runNextLevel().then(() => GameUtils.showPopUp(`skin ${skinIndex}`))
  }
}
