import {WORLD} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import Locator from './Locator.js'

export default class GameResize {
  #game
  #lastResizeWidth
  #lastResizeHeight
  #resizeTimer
  #prevWidth
  #prevHeight

  constructor(game) {
    this.#game = game

    window.addEventListener('resize', this.#requestResize)
    this.#requestResize()
  }

  public resize = async () => {
    this.#saveCurrentSize()
    this.#resizeRootContainers()
    await this.#resizeCurrentState()
    this.#emitResize()
  }

  get resizeData() {
    const scaleFactor = this.#getScaleFactor()

    return {
      scaleFactor,
      x: +((window.innerWidth - WORLD.WIDTH * scaleFactor) / 2).toFixed(3),
      y: +((window.innerHeight - WORLD.HEIGHT * scaleFactor) / 2).toFixed(3),
      differentX: Math.abs((window.innerWidth - WORLD.WIDTH) / 2),
      differentY: Math.abs((window.innerHeight - WORLD.HEIGHT) / 2),
    }
  }

  #getScaleFactor = () => {
    return +(window.innerHeight / WORLD.HEIGHT).toFixed(3)
  }

  #requestResize = () => {
    const width = window.innerWidth
    const height = window.innerHeight

    // Запоминаем последние полученные значения
    this.#lastResizeWidth = width
    this.#lastResizeHeight = height

    if (this.#resizeTimer) clearTimeout(this.#resizeTimer)

    // Ждем 120мс после последнего resize, чтобы поймать “конечный” размер
    this.#resizeTimer = setTimeout(() => {
      // Проверяем, совпадает ли размер с последним зарегистрированным
      if (window.innerWidth === this.#lastResizeWidth && window.innerHeight === this.#lastResizeHeight) {
        // Делает resize только если реально устаканилось
        if (width !== this.#prevWidth || height !== this.#prevHeight) {
          void this.resize()
        }
      }
    }, 120)
  }

  #saveCurrentSize = () => {
    this.#prevWidth = window.innerWidth
    this.#prevHeight = window.innerHeight
  }

  #resizeRootContainers = () => {
    Locator.uiLayer.resize()
    this.#game?.gameContainer?.resize()
  }

  #resizeCurrentState = async () => {
    const state = this.#game.currentState
    if (!state?.isInitialized) return

    await state.resize()
  }

  #emitResize = () => {
    this.#game.emit(GAME_EVENTS.gameResize)
  }
}
