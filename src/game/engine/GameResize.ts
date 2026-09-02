import {WORLD} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import type Game from '../Game.js'
import Locator from './Locator.js'

// Отслеживает изменение окна и пересчитывает размеры корневых контейнеров игры.

export default class GameResize {
  #game: Game
  #lastResizeWidth: number | undefined
  #lastResizeHeight: number | undefined
  #resizeTimer: ReturnType<typeof setTimeout> | undefined
  #prevWidth: number | undefined
  #prevHeight: number | undefined

  // Сохраняет игру и подключает наблюдение за размером окна.
  constructor(game: Game) {
    this.#game = game

    window.addEventListener('resize', this.#requestResize)
    this.#requestResize()
  }

  // Выполняет согласованное обновление размеров игры и интерфейса.
  public resize = async () => {
    this.#saveCurrentSize()
    this.#resizeRootContainers()
    this.#emitResize()
  }

  // Возвращает параметры масштабирования видимой области.
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

  // Рассчитывает масштаб игры по высоте окна.
  #getScaleFactor = () => {
    return +(window.innerHeight / WORLD.HEIGHT).toFixed(3)
  }

  // Откладывает изменение размеров до стабилизации окна.
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

  // Запоминает применённый размер окна.
  #saveCurrentSize = () => {
    this.#prevWidth = window.innerWidth
    this.#prevHeight = window.innerHeight
  }

  // Обновляет размеры корневых контейнеров.
  #resizeRootContainers = () => {
    this.#game?.gameContainer?.resize()
    Locator.uiLayer.resize()
  }

  // Сообщает игровым системам о завершении изменения размеров.
  #emitResize = () => {
    this.#game.emit(GAME_EVENTS.gameResize)
  }
}
