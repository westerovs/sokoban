import Locator from '../engine/Locator.ts'
import SdkManager from '../engine/SdkManager.js'
import {GAME_EVENTS} from '../gameConfig/gameEvents.js'
import ABTest from '../modules/ABTest.js'
import Timer, {TIMER_LABELS} from '../ui/level/clock/Timer.js'
import GameUtils from '../utils/gameUtils/GameUtils.js'
import Logger, {MODULES} from '../utils/Logger.js'

/*
 * - проверка, куплена ли опция - пропуск рекламы
 * - старт таймера
 * - старт слушателя событий
 * - при событии hit проверяем прошло ли N секунд
 * - если прошло, показываем рекламу и делаем рестарт таймера, если только это не последний предмет
 * */

export default class AdLvlTimer {
  #game = Locator.game
  #storage
  #timer = null
  #timerDuration = ABTest.levelAdDelay
  #lastItem = false

  constructor(level) {
    this.level = level
  }

  init() {
    this.#storage = Locator.storage
    const {levelIndex} = this.#storage.playerData

    if (SdkManager.flags?.skipLevelTimer) return
    if (GameUtils.skipAdInFirstLevel(levelIndex)) {
      Logger.warn('', '[AdLvlTimer] The first level. Skip Ad')
      return
    }
    if (this.#storage.playerData.hasAdPass) return

    this.#setEvents(true)
    this.#createTimer()
  }

  destroy() {
    this.#setEvents(false)
    Logger.log(MODULES.DestroyMessage, '[AdLvlTimer] destroy')
  }

  #createTimer = () => {
    this.#timer = new Timer({
      game: this.#game,
      duration: this.#timerDuration,
      label: TIMER_LABELS.adLvlTimer,
      log: false,
    })
    this.#timer.start()
  }

  #setEvents = (bool) => {
    const status = bool ? 'on' : 'off'

    this.#game[status](GAME_EVENTS.startHit, this.#hitAction)
    this.#game[status](GAME_EVENTS.lvCounterStat, this.#checkLastItem)
    this.#game[status](GAME_EVENTS.completePartLevel, this.#resetLastItemIfNextPart)
  }

  #resetLastItemIfNextPart = () => {
    this.#lastItem = false
  }

  // не воспроизводим звук на последнем предмете
  #checkLastItem = ({maxItems, itemsFound}) => {
    if (itemsFound + 1 >= maxItems) {
      this.#lastItem = true
    }
  }

  #hitAction = async () => {
    if (this.#lastItem) return

    const time = Math.ceil(this.#timer?.remainingTime)
    Logger.log('', `time to AD: ${time}`)
    if (time > 0) return

    await SdkManager.showInterstitial()
    this.#createTimer()
  }
}
