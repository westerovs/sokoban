import {gsap} from 'gsap'
import i18next from 'i18next'
import Locator from '../engine/Locator.ts'
import SdkManager from '../engine/SdkManager.js'
import {ADAPTER_EVENTS} from '../gameConfig/gameEvents.js'

// Синхронизирует паузу игры с событиями платформенного адаптера.

export default class GamePause {
  #game = Locator.game
  #wrapper: HTMLDivElement
  #canvas: HTMLCanvasElement | null
  #isPaused = false

  // Находит DOM-элементы игры и подключает события паузы.
  constructor() {
    this.#wrapper = document.querySelector<HTMLDivElement>('#canvas-wrapper')!
    this.#canvas = this.#wrapper.querySelector('canvas')
    this.#init()
  }

  // Запускает настройку контроллера паузы.
  #init = () => {
    this.#setEvents()
  }

  // Приостанавливает рендеринг и ввод игры.
  #setPause = () => {
    if (this.#isPaused) return
    this.#isPaused = true

    if (this.#canvas) this.#canvas.classList.add('game-pause-filter')
    this.#setInteractiveApp(true)
    this.#createTextPause()
    SdkManager.gameplayStop()
  }

  // Возобновляет рендеринг и ввод игры.
  #setResume = () => {
    if (!this.#isPaused) return
    this.#isPaused = false

    if (this.#canvas) this.#canvas.classList.remove('game-pause-filter')
    setTimeout(() => this.#setInteractiveApp(false), 150)

    const textPause = this.#wrapper.querySelector('.game-pause-text')
    if (textPause) textPause.remove()

    SdkManager.gameplayStart()
  }

  // Добавляет поверх игры текст паузы.
  #createTextPause = () => {
    const textPause = document.createElement('p')
    textPause.innerText = `${i18next.t('pause')}`
    textPause.classList.add('game-pause-text')
    this.#wrapper.appendChild(textPause)
  }

  // Переключает активность PixiJS и временной шкалы GSAP.
  #setInteractiveApp = (isPause: boolean) => {
    if (isPause) {
      this.#game.app.stop()
      gsap.globalTimeline.pause()
      this.#game.app.stage.interactiveChildren = false
    } else {
      this.#game.app.start()
      gsap.globalTimeline.resume()
      this.#game.app.stage.interactiveChildren = true
    }
  }

  // Подписывается на события паузы платформенного адаптера.
  #setEvents = () => {
    SdkManager.adapter.on(ADAPTER_EVENTS.PAUSE_EVENT, this.#setPause)
    SdkManager.adapter.on(ADAPTER_EVENTS.RESUME_EVENT, this.#setResume)
  }
}
