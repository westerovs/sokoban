import Locator from '@/game/engine/Locator.ts'
import type Game from '@/game/Game.ts'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.ts'

// Измеряет время прохождения уровня и публикует секундные обновления.

const STOPWATCH_LABELS = {
  level: 'level', // Метка секундомера игрового уровня
}
const UPDATE_INTERVAL_MS = 250 // Частота проверки текущей секунды

type StopwatchOptions = {
  game: Game
  label?: string
}

export default class Stopwatch {
  game: Game
  label: string
  #elapsedMs = 0
  #startedAt: number | null = null
  #interval: ReturnType<typeof setInterval> | null = null
  #lastSecond = -1

  // Сохраняет игру и начальные значения секундомера.
  constructor({game, label = 'defaultStopwatch'}: StopwatchOptions) {
    this.game = game
    this.label = label
  }

  // Запускает отсчёт и ежесекундные события.
  start() {
    this.clear()
    this.#elapsedMs = 0
    this.#lastSecond = -1
    this.#startedAt = Locator.options.isVisible ? null : Date.now()
    this.#setEvents(true)
    this.#interval = setInterval(() => this.#update(), UPDATE_INTERVAL_MS)
    this.#update()
  }

  // Возвращает прошедшее время по часам, минутам и секундам.
  get fullDataTime() {
    const elapsed = this.seconds

    return {
      h: Math.floor(elapsed / 3600),
      m: Math.floor((elapsed % 3600) / 60),
      s: elapsed % 60,
    }
  }

  // Возвращает целое число прошедших секунд.
  get seconds() {
    const runningMs = this.#startedAt === null ? 0 : Math.max(0, Date.now() - this.#startedAt)
    return Math.floor((this.#elapsedMs + runningMs) / 1000)
  }

  // Приостанавливает отсчёт с сохранением долей секунды.
  pause() {
    if (this.#startedAt === null) return
    this.#elapsedMs += Math.max(0, Date.now() - this.#startedAt)
    this.#startedAt = null
    this.#update()
  }

  // Продолжает только запущенный секундомер после закрытия настроек.
  resume() {
    if (this.#interval === null || this.#startedAt !== null) return
    this.#startedAt = Date.now()
  }

  // Останавливает секундомер и удаляет его события.
  clear() {
    this.pause()
    if (this.#interval !== null) {
      clearInterval(this.#interval)
      this.#interval = null
      this.game.emit(GAME_EVENTS.Stopwatch.kill, {label: this.label})
    }
    this.#setEvents(false)
  }

  // Включает или отключает события автоматической остановки.
  #setEvents(bool: boolean) {
    const status = bool ? 'on' : 'off'

    this.game[status](GAME_EVENTS.completeLevel, this.clear, this)
    this.game[status](GAME_EVENTS.clearLevel, this.clear, this)
    this.game[status](GAME_EVENTS.Options.show, this.pause, this)
    this.game[status](GAME_EVENTS.Options.hide, this.resume, this)
  }

  // Публикует обновление только при смене целой секунды.
  #update() {
    const seconds = this.seconds
    if (seconds === this.#lastSecond) return
    this.#lastSecond = seconds
    this.#tick(seconds)
  }

  // Публикует очередное секундное обновление.
  #tick(currentTime: number) {
    this.game.emit(GAME_EVENTS.Stopwatch.tick, {
      label: this.label,
      currentTime,
      currentTimeWithZero: currentTime > 9 ? currentTime : `0${currentTime}`,
    })
  }
}

export {
  STOPWATCH_LABELS, // Метки игровых секундомеров
}
