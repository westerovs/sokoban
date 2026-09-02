import {GrayscaleFilter} from 'pixi-filters'
import type {Container} from 'pixi.js'
import Locator from '../../engine/Locator.ts'
import SdkManager from '../../engine/SdkManager.js'
import {STORAGE_KEYS} from '../../engine/storage/defaultData.js'
import {GAME_EVENTS} from '../../gameConfig/gameEvents.js'
import {rewardsCatalog} from '../../gameConfig/rewardsCatalog.js'
import ABTest from '../../modules/ABTest.js'
import {HINT_BUTTON_NAMES} from '../../modules/hints/HintsController.js'
import Timer from '../../ui/level/clock/Timer.js'
import Logger, {MODULES} from '../../utils/Logger.js'

// Управляет рекламной наградой и временем блокировки кнопки.

type RewardTimerKey =
  | typeof STORAGE_KEYS.timer_RewardMagnifier
  | typeof STORAGE_KEYS.timer_RewardDarts
  | typeof STORAGE_KEYS.timer_RewardCompass

type TimerTickEvent = {
  label: string
  currentTimeWithZero: number | string
}

type TimerEndEvent = {
  label: string
}

export default class RewardTimer {
  #game = Locator.game
  #storage = Locator.storage
  #isDisabledBtn = false
  #timerLabel = ''
  #timerKey!: RewardTimerKey
  #hasReward = false
  btn: Container | null = null
  btnHintName = ''
  timer: Timer | null = null
  initiatorName = ''
  #duration = ABTest.getTimerRewardDuration()

  // Подключает кнопку к рекламной награде и восстанавливает активный таймер.
  init(btn: Container, timerLabel: string, timerKeys: RewardTimerKey) {
    this.btn = btn
    this.btn.on('pointerup', this.#showAd)
    this.#timerLabel = timerLabel
    this.#timerKey = timerKeys

    this.#setTimerEvents(true)
    this.#restoreTimerIfActive()
  }

  // Останавливает таймер и удаляет подписки.
  destroy = () => {
    Logger.log(MODULES.DestroyMessage, '[BtnTimer] destroy')
    this.timer?.kill()
    if (this.btn) this.btn.off('pointerup', this.#showAd)
    this.#setTimerEvents(false)
  }

  // Обрабатывает ошибку показа рекламы в наследнике.
  onError(_error?: unknown) {}

  // Обрабатывает окончание таймера в наследнике.
  onTimerEnd() {}

  // Обрабатывает очередную секунду таймера в наследнике.
  onTimerTick(_currentTimeWithZero: number | string) {}

  // ------------- ↓ timer ↓ -------------
  // Создаёт и запускает таймер блокировки кнопки.
  #startTimer = (duration: number) => {
    this.timer = new Timer({
      game: this.#game,
      duration: duration,
      label: this.#timerLabel,
    })
    this.timer.start()
  }

  // Переключает доступность и визуальное состояние кнопки.
  #checkoutDisabled = (bool: boolean) => {
    if (!this.btn) return
    if (bool) {
      this.#isDisabledBtn = true

      const grayscale = new GrayscaleFilter()
      this.btn.filters = [grayscale]
      this.btn.eventMode = 'none'
      return
    }

    this.#isDisabledBtn = false
    this.btn.filters = []
    this.btn.eventMode = 'static'
  }

  // Подключает или отключает события таймера.
  #setTimerEvents = (bool: boolean) => {
    const status = bool ? 'on' : 'off'

    this.#game[status](GAME_EVENTS.Timer.tick, this.#timerTick)
    this.#game[status](GAME_EVENTS.Timer.kill, this.#timerEnd)
  }

  // Передаёт обновление нужного таймера публичному обработчику.
  #timerTick = ({label, currentTimeWithZero}: TimerTickEvent) => {
    if (label === this.#timerLabel) {
      this.onTimerTick(currentTimeWithZero)
    }
  }

  // Восстанавливает кнопку после завершения нужного таймера.
  #timerEnd = ({label}: TimerEndEvent) => {
    if (label === this.#timerLabel) {
      this.#checkoutDisabled(false)
      this.onTimerEnd()
    }
  }

  // ------------- ↓ time ↓ -------------
  // Получает серверное время в секундах.
  #getServerTime = async () => {
    const serverTime = await SdkManager.getServerTime()
    return Math.floor(serverTime / 1000)
  }

  // Вычисляет оставшееся время сохранённой блокировки.
  findServerTime = async () => {
    const savedTime = this.#storage.playerData[this.#timerKey]

    if (savedTime) {
      const currentServerSeconds = await this.#getServerTime()
      const timePassed = currentServerSeconds - savedTime
      // если прошло меньше чем duration сек, блокируем
      return this.#duration - timePassed
    }

    return false
  }

  // Восстанавливает таймер из сохранённых данных.
  #restoreTimerIfActive = async () => {
    const remainingTime = await this.findServerTime()

    if (remainingTime) {
      this.#startTimer(remainingTime)
      this.#checkoutDisabled(true)
      return true
    }

    return false
  }

  // Сохраняет серверное время начала блокировки.
  #saveTime = async () => {
    // Сохраняем в нужный таймер серверное время
    this.#storage.playerData[this.#timerKey] = await this.#getServerTime()
    this.#storage.save()
  }

  // ------------- ↓ AD ↓ -------------
  // Запускает показ рекламы с наградой.
  #showAd = () => {
    if (this.#isDisabledBtn) return

    this.#isDisabledBtn = true
    this.#hasReward = false

    SdkManager.showRewarded({
      onRewarded: this.#onRewarded,
      onFinally: this.#onFinally,
      onError: this.onError,
    })
  }

  // --------- rewarded callbacks
  // Выдаёт награду после успешного просмотра рекламы.
  #onRewarded = () => {
    this.#hasReward = true
    this.#game.emit(GAME_EVENTS.AD.onRewarded, this.initiatorName)

    this.#giveReward()

    this.#startTimer(this.#duration)
    this.#checkoutDisabled(true)
    this.#saveTime()
  }

  // Добавляет соответствующий тип подсказки в профиль игрока.
  #giveReward = () => {
    if (this.initiatorName === 'store' && this.btnHintName === HINT_BUTTON_NAMES.hints) {
      this.#storage.addHints(STORAGE_KEYS.hints, rewardsCatalog.store.free.amount, true)
      return
    }

    if (this.btnHintName === HINT_BUTTON_NAMES.hints) this.#storage.addHints(STORAGE_KEYS.hints, 1, false)
    if (this.btnHintName === HINT_BUTTON_NAMES.hintDarts) this.#storage.addHints(STORAGE_KEYS.hintDarts, 1, false)
    if (this.btnHintName === HINT_BUTTON_NAMES.hintCompass) this.#storage.addHints(STORAGE_KEYS.hintCompass, 1, false)

    Locator.storage.save(true)
  }

  // Снимает внутреннюю блокировку после завершения рекламы.
  #onFinally = () => {
    this.#isDisabledBtn = false
  }
}

export type {
  RewardTimerKey,
}
