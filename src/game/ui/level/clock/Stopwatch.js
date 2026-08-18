import {gsap} from 'gsap'
import {Logger, MODULES} from '../../../utils/Logger.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'

export const STOPWATCH_LABELS = {
  level: 'level',
}

// todo remove duration
export default class Stopwatch {
  constructor({game, label = 'defaultStopwatch'} = {}) {
    this.game = game
    this.duration = Math.floor(9999)
    this.label = label
    this.remainingTime = this.duration
    this.timerTween = null
    this.elapsedTime = 0
  }
  
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
      }
    })
  }
  
  get fullDataTime() {
    const elapsed = Math.floor(this.elapsedTime)
    
    return {
      h: Math.floor(elapsed / 3600),
      m: Math.floor((elapsed % 3600) / 60),
      s: elapsed % 60,
    }
  }
  
  get seconds() {
    return Math.floor(this.elapsedTime)
  }
  
  #setEvents = (bool) => {
    const status = bool ? 'on' : 'off'
    
    this.game[status](GAME_EVENTS.completeLevel, this.clear)
    this.game[status](GAME_EVENTS.clearLevel, this.clear)
  }

  #tick = (currentTime) =>{
    this.game.emit(GAME_EVENTS.Stopwatch.tick, {
      label: this.label,
      currentTime,
      currentTimeWithZero: currentTime > 9 ? currentTime : `0${currentTime}`
    })
  }
  
  clear = (log) => {
    if (log) Logger.log(MODULES.DestroyMessage,'[Stopwatch] module clear')
    if (this.timerTween) {
      this.timerTween.kill()
      this.timerTween = null
      this.game.emit(GAME_EVENTS.Stopwatch.kill, {label: this.label})
    }
    
    this.#setEvents(false)
  }
}

