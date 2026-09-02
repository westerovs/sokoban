import Locator from '../engine/Locator.ts'
import SdkManager from '../engine/SdkManager.js'
import type Storage from '../engine/storage/Storage.js'
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
  #storage!: Storage
  #timer: Timer | null = null
  #timerDuration = ABTest.levelAdDelay
  #lastItem = false

  readonly level: object

  // Сохраняет текущий уровень.
  constructor(level: object) {
    this.level = level
  }

  // Запускает рекламный таймер, если реклама разрешена.
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

  // Отключает события таймера уровня.
  destroy() {
    this.#setEvents(false)
    Logger.log(MODULES.DestroyMessage, '[AdLvlTimer] destroy')
  }

  // Создаёт новый таймер до показа рекламы.
  #createTimer = () => {
    this.#timer = new Timer({
      game: this.#game,
      duration: this.#timerDuration,
      label: TIMER_LABELS.adLvlTimer,
      log: false,
    })
    this.#timer.start()
  }

  // Подключает или отключает игровые события таймера.
  #setEvents = (bool: boolean) => {
    const status = bool ? 'on' : 'off'

    this.#game[status](GAME_EVENTS.startHit, this.#hitAction)
    this.#game[status](GAME_EVENTS.lvCounterStat, this.#checkLastItem)
    this.#game[status](GAME_EVENTS.completePartLevel, this.#resetLastItemIfNextPart)
  }

  // Сбрасывает признак последнего предмета для новой части.
  #resetLastItemIfNextPart = () => {
    this.#lastItem = false
  }

  // не воспроизводим звук на последнем предмете
  #checkLastItem = ({maxItems, itemsFound}: {maxItems: number; itemsFound: number}) => {
    if (itemsFound + 1 >= maxItems) {
      this.#lastItem = true
    }
  }

  // Показывает рекламу, когда время вышло и предмет не последний.
  #hitAction = async () => {
    if (this.#lastItem) return

    const time = Math.ceil(this.#timer?.remainingTime as number)
    Logger.log('', `time to AD: ${time}`)
    if (time > 0) return

    await SdkManager.showInterstitial()
    this.#createTimer()
  }
}
