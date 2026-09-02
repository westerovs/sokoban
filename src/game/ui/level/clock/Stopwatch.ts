import {gsap} from 'gsap'
import type Game from '../../../Game.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'
import Logger, {MODULES} from '../../../utils/Logger.js'

// Измеряет время прохождения уровня и публикует секундные обновления.

const STOPWATCH_LABELS = {
  level: 'level', // Метка секундомера игрового уровня
}

type StopwatchOptions = {
  game: Game
  label?: string
}

// todo remove duration
export default class Stopwatch {
  game: Game
  duration: number
  label: string
  remainingTime: number
  timerTween: gsap.core.Tween | null
  elapsedTime: number

  // Сохраняет игру и начальные значения секундомера.
  constructor({game, label = 'defaultStopwatch'}: StopwatchOptions) {
    this.game = game
    this.duration = Math.floor(9999)
    this.label = label
    this.remainingTime = this.duration
    this.timerTween = null
    this.elapsedTime = 0
  }

  // Запускает отсчёт и ежесекундные события.
  start = () => {
    this.#setEvents(true)

    let lastTime = Math.ceil(this.remainingTime)

    this.timerTween = gsap.to(this, {
      elapsedTime: this.duration, // Время идет вперед
      duration: this.duration,
      ease: 'none',
      onUpdate: () => {
        const currentTime = Math.floor(this.elapsedTime) // Округляем в меньшую сторону

        if (currentTime !== lastTime) {
          lastTime = currentTime
          this.#tick(currentTime)
        }
      },
      onComplete: () => {
        this.clear()
      },
    })
  }

  // Возвращает прошедшее время по часам, минутам и секундам.
  get fullDataTime() {
    const elapsed = Math.floor(this.elapsedTime)

    return {
      h: Math.floor(elapsed / 3600),
      m: Math.floor((elapsed % 3600) / 60),
      s: elapsed % 60,
    }
  }

  // Возвращает целое число прошедших секунд.
  get seconds() {
    return Math.floor(this.elapsedTime)
  }

  // Включает или отключает события автоматической остановки.
  #setEvents = (bool: boolean) => {
    const status = bool ? 'on' : 'off'

    this.game[status](GAME_EVENTS.completeLevel, this.clear)
    this.game[status](GAME_EVENTS.clearLevel, this.clear)
  }

  // Публикует очередное секундное обновление.
  #tick = (currentTime: number) => {
    this.game.emit(GAME_EVENTS.Stopwatch.tick, {
      label: this.label,
      currentTime,
      currentTimeWithZero: currentTime > 9 ? currentTime : `0${currentTime}`,
    })
  }

  // Останавливает секундомер и удаляет его события.
  clear = (log = false) => {
    if (log) Logger.log(MODULES.DestroyMessage, '[Stopwatch] module clear')
    if (this.timerTween) {
      this.timerTween.kill()
      this.timerTween = null
      this.game.emit(GAME_EVENTS.Stopwatch.kill, {label: this.label})
    }

    this.#setEvents(false)
  }
}

export {STOPWATCH_LABELS}
