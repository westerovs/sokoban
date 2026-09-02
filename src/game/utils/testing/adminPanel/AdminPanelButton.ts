import {Container, Graphics} from 'pixi.js'
import Locator from '../../../engine/Locator.ts'
import LocalStorage from '../../../engine/storage/LocalStorage.js'
import type Storage from '../../../engine/storage/Storage.js'
import type Game from '../../../Game.js'
import {GAME_STATES, WORLD} from '../../../gameConfig/constants.js'
import type GameConfig from '../../../gameConfig/GameConfig.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'
import AdminPanel from './AdminPanel.js'

// Открывает панель разработчика после секретной последовательности нажатий.

/*
 * Алгоритм работы: 3 клика по левой, 3 клика по правой, 1 клик по левой.
 * */

type AdminButtonSide = 'left' | 'right'

export default class AdminPanelButton {
  #game: Game
  #storage: Storage
  #gameConfig: GameConfig

  #size = 100 // Размер скрытой области нажатия
  #parent: Container
  #firstButton: Graphics | null = null
  #secondButton: Graphics | null = null

  #clicks: AdminButtonSide[] = []
  #pattern: AdminButtonSide[] = ['left', 'left', 'left', 'right', 'right', 'right', 'left'] // Секретная последовательность нажатий
  #resetTimeout = 4000 // Время сброса незавершённой последовательности
  #resetTimer: ReturnType<typeof setTimeout> | null = null

  // Сохраняет зависимости и подключает показ скрытых кнопок.
  constructor(game: Game, storage: Storage, gameConfig: GameConfig) {
    this.#game = game
    this.#storage = storage
    this.#gameConfig = gameConfig
    this.#parent = Locator.uiLayer.globalUiLayer

    this.#setEvents(true)

    // test
    // this.#createAdminPanel()
  }

  // Создаёт две скрытые области нажатия.
  #createButtons = () => {
    this.#firstButton = this.#createButton(this.#parent, {x: 0, y: WORLD.HEIGHT - this.#size})
    this.#firstButton.on('pointerup', this.#onPointerFirstBtn)

    this.#secondButton = this.#createButton(this.#parent, {
      x: Locator.uiLayer.uiData.width - this.#size,
      y: WORLD.HEIGHT - this.#size,
    })
    this.#secondButton.on('pointerup', this.#onPointerSecondBtn)

    this.#resize()
  }

  // Создаёт одну скрытую область нажатия.
  #createButton = (_parent: Container, {x, y}: {x: number; y: number}) => {
    const isVisible = LocalStorage.isDebug ? 0.3 : 0

    const button = new Graphics({label: 'adminBtn'})
    button.alpha = isVisible
    button.rect(0, 0, this.#size, this.#size).fill(0xff0000)
    button.eventMode = 'static'
    button.position.set(x, y)
    this.#parent.addChild(button)

    return button
  }

  // Привязывает правую область к текущей ширине интерфейса.
  #resize = () => {
    if (!this.#secondButton) return
    this.#secondButton.x = Locator.uiLayer.uiData.width - this.#size
  }

  // Включает или отключает игровые события скрытых кнопок.
  #setEvents = (bool: boolean) => {
    const status = bool ? 'on' : 'off'

    this.#game[status](GAME_EVENTS.checkoutState, this.#showAndHideButtons)
    this.#game[status](GAME_EVENTS.gameResize, this.#resize)
  }

  // Показывает кнопки в меню и удаляет их внутри уровня.
  #showAndHideButtons = () => {
    if (this.#game.currentStateName === GAME_STATES.gameState) {
      this.#createButtons()
      this.#game.on(GAME_EVENTS.gameResize, this.#resize)
    }
    if (this.#game.currentStateName === GAME_STATES.levelState) {
      if (!this.#firstButton && !this.#secondButton) return

      this.#firstButton!.off('pointerup', this.#onPointerFirstBtn)
      this.#secondButton!.off('pointerup', this.#onPointerSecondBtn)
      this.#game.off(GAME_EVENTS.gameResize, this.#resize)

      this.#firstButton!.destroy()
      this.#secondButton!.destroy()
      this.#firstButton = null
      this.#secondButton = null
    }
  }

  // Регистрирует нажатие левой области.
  #onPointerFirstBtn = () => this.#registerClick('left')

  // Регистрирует нажатие правой области.
  #onPointerSecondBtn = () => this.#registerClick('right')

  // Добавляет нажатие и проверяет секретную последовательность.
  #registerClick(btn: AdminButtonSide) {
    this.#clicks.push(btn)

    if (this.#resetTimer) clearTimeout(this.#resetTimer)
    this.#resetTimer = setTimeout(() => (this.#clicks = []), this.#resetTimeout)

    if (this.#clicks.length > this.#pattern.length) {
      this.#clicks.shift()
    }

    if (this.#clicks.join(',') === this.#pattern.join(',')) {
      this.#clicks = []
      this.#createAdminPanel()
    }
  }

  // Открывает панель разработчика.
  #createAdminPanel = () => {
    new AdminPanel(this.#storage, this.#gameConfig)
  }
}
