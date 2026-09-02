import {gsap} from 'gsap'
import Locator from '../../engine/Locator.ts'
import type Game from '../../Game.js'
import {GAME_STATES} from '../../gameConfig/constants.js'
import BaseState from '../BaseState.js'
import Level from './Level.js'
import LevelView from './LevelView.js'

// Управляет входом, повторным запуском и завершением состояния уровня.

export default class StateLevel extends BaseState {
  #game: Game
  #view: LevelView | null = null
  #refs: Record<string, any> | null = null
  #controller: unknown = null
  level: Level | null = null

  // Сохраняет игру и регистрирует состояние уровня.
  constructor(game: Game) {
    super(game)
    this.#game = game
  }

  // Возвращает событие запуска состояния уровня.
  get initEventName() {
    return GAME_STATES.levelState
  }

  // Создаёт представление и запускает уровень.
  initialize() {
    super.initialize()

    this.game.state = this
    this.game.stateName = this.initEventName

    this.#view = new LevelView(this.#game)
    this.#game.gameContainer.addChild(this.#view)

    this.#game.view = this.#view
    this.#game.refs = this.#view.refs
    this.#refs = this.#view.refs
    this.isInitialized = true
    this.start()
  }

  // Создаёт и инициализирует контроллер уровня.
  async start() {
    this.level = new Level(this)
    await this.level.init()
    await Locator.gameResize.resize()
    Locator.soundManager.startLevelMusic()
  }

  // Завершает уровень и запускает предзагрузку следующего.
  runNextLevel = async () => {
    await this.level?.exit()

    this.terminate()
    this.#game.emit(GAME_STATES.levelPreload)
  }

  // Завершает уровень и переключает игру в указанное состояние.
  checkoutState = async (stateName = GAME_STATES.gameState) => {
    super.checkoutState()
    await this.level?.exit()

    this.terminate()
    this.#game.emit(stateName)
  }

  // Очищает сцену и сбрасывает состояние уровня.
  terminate() {
    Locator.soundManager.stopLevelMusic()

    // Общая очистка
    gsap.killTweensOf('*')
    gsap.globalTimeline.clear()
    Locator.uiLayer.destroyStateUiLayerChildren()
    // view destroy
    this.#view?.destroy({children: true})
    this.#view = null
    this.#controller = null

    this.isInitialized = false
  }
}
