import Locator from '../engine/Locator.ts'
import {GAME_STATES} from '../gameConfig/constants.js'
import {GAME_EVENTS} from '../gameConfig/gameEvents.js'
import type {Container} from 'pixi.js'
import type Game from '../Game.js'

// Задаёт общий жизненный цикл игровых состояний.

export default class BaseState {
  isInitialized = false
  game: Game
  view: Container | null = null

  // Возвращает событие запуска базового состояния.
  get initEventName(): string {
    return GAME_STATES.baseState
  }

  // Сохраняет игру и подписывает состояние на событие запуска.
  constructor(game: Game) {
    this.game = game
    this.game.on(this.initEventName, this.checkInitialize)
  }

  // Инициализирует состояние только один раз.
  checkInitialize = () => {
    if (this.isInitialized) return
    this.initialize()
  }

  // Делает состояние текущим и сообщает о переключении.
  initialize() {
    this.game.currentStateName = this.initEventName
    this.game.currentState = this
    this.game.emit(GAME_EVENTS.checkoutState, this.initEventName)
  }

  // Выполняет общую подготовку при входе в состояние.
  checkoutState(_stateName?: string) {
    Locator.soundManager.stopAll()
    Locator.options.setVisibleToggle(false)
  }

  // Обновляет состояние на игровом кадре.
  update() {}

  // Обрабатывает изменение размера игры.
  resize() {}

  // Завершает работу состояния.
  terminate() {}
}
