import {gsap} from 'gsap'
import type Game from '../../../Game.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'

// Управляет игровым таймером и рассылает события его обновления.

const TIMER_LABELS = {
  btnHintRewardTimer: 'btnHintRewardTimer',
  btnFreeTimer: 'btnFreeTimer',
  adLvlTimer: 'adLvlTimer',
  compassTimer: 'compassTimer',
}

type TimerOptions = {
  game: Game
  duration: number
  log?: boolean
  label?: string
}

export default class Timer {
  game: Game
  duration: number
  log: boolean
  label: string
  remainingTime: number
  timerTween: gsap.core.Tween | null = null

  // Создаёт таймер и подписывает его на завершение уровня.
  constructor({game, duration, log = false, label = 'defaultTimer'}: TimerOptions) {
    this.game = game
    this.duration = Math.floor(duration)
    this.log = log
    this.label = label
    this.remainingTime = this.duration
    this.game.on(GAME_EVENTS.completeLevel, this.kill.bind(this))
    this.game.on(GAME_EVENTS.clearLevel, this.kill.bind(this))
  }

  // Запускает обратный отсчёт.
  async start() {
    let lastTime = Math.ceil(this.remainingTime)

    return (this.timerTween = gsap.to(this, {
      remainingTime: 0,
      duration: this.duration,
      ease: 'none',
      onUpdate: () => {
        const currentTime = Math.ceil(this.remainingTime)

        if (currentTime !== lastTime) {
          lastTime = currentTime
          this.#tick(currentTime)
        }
      },
      onComplete: () => {
        this.kill()
      },
    }))
  }

  // Останавливает таймер и удаляет его подписки.
  kill() {
    if (this.timerTween) {
      this.timerTween.kill()
      this.timerTween = null

      this.game.off(GAME_EVENTS.completeLevel, this.kill)
      this.game.off(GAME_EVENTS.clearLevel, this.kill)
      this.game.emit(GAME_EVENTS.Timer.kill, {label: this.label})
    }
  }

  // Отправляет событие очередной секунды таймера.
  #tick(currentTime: number) {
    if (this.log) console.log(`[Timer] ${this.label} tick`, currentTime)

    this.game.emit(GAME_EVENTS.Timer.tick, {
      label: this.label,
      currentTime,
      currentTimeWithZero: currentTime > 9 ? currentTime : `0${currentTime}`,
    })
  }
}

export {TIMER_LABELS}
