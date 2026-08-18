import Locator from '../../engine/Locator.ts'
import Timer from '../../ui/level/clock/Timer.js'
import {Logger, MODULES} from '../../utils/Logger.js'
import ABTest from '../../modules/ABTest.js'
import {GAME_EVENTS} from '../../gameConfig/gameEvents.js'
import SdkManager from '../../engine/SdkManager.js'
import {rewardsCatalog} from '../../gameConfig/rewardsCatalog.js'
import {GrayscaleFilter} from 'pixi-filters'
import {STORAGE_KEYS} from '../../engine/storage/defaultData.js'
import {HINT_BUTTON_NAMES} from '../../modules/hints/HintsController.js'

export default class RewardTimer {
  #game = Locator.game
  #storage = Locator.storage
  #isDisabledBtn = false
  #timerLabel
  #timerKey
  #hasReward
  btn
  btnHintName
  timer
  initiatorName = ''
  #duration = ABTest.getTimerRewardDuration()
  
  init(btn, timerLabel, timerKeys) {
    this.btn = btn
    this.btn.on('pointerup', this.#showAd)
    this.#timerLabel = timerLabel
    this.#timerKey = timerKeys
    
    this.#setTimerEvents(true)
    this.#restoreTimerIfActive()
  }
  
  destroy = () => {
    Logger.log(MODULES.DestroyMessage,'[BtnTimer] destroy')
    this.timer?.kill()
    if (this.btn) this.btn.off('pointerup', this.#showAd)
    this.#setTimerEvents(false)
  }
  
  // Публичные методы, который можно переопределить
  onError(onError) {}
  
  onTimerEnd() {}
  
  onTimerTick(currentTimeWithZero) {}
  
  // ------------- ↓ timer ↓ -------------
  #startTimer = (duration) => {
    this.timer = new Timer({
      game: this.#game,
      duration: duration,
      label: this.#timerLabel
    })
    this.timer.start()
  }
  
  #checkoutDisabled = (bool) => {
    if (bool) {
      this.#isDisabledBtn = true
      
      const grayscale = new GrayscaleFilter(1)
      this.btn.filters = [grayscale]
      this.btn.eventMode = 'none'
      return
    }
    
    this.#isDisabledBtn = false
    this.btn.filters = []
    this.btn.eventMode = 'static'
  }
  
  #setTimerEvents = (bool) => {
    const status = bool ? 'on' : 'off'
    
    this.#game[status](GAME_EVENTS.Timer.tick, this.#timerTick)
    this.#game[status](GAME_EVENTS.Timer.kill, this.#timerEnd)
  }
  
  #timerTick = ({label, currentTimeWithZero}) => {
    if (label === this.#timerLabel) {
      this.onTimerTick(currentTimeWithZero)
    }
  }
  
  #timerEnd = ({label}) => {
    if (label === this.#timerLabel) {
      this.#checkoutDisabled(false)
      this.onTimerEnd()
    }
  }
  
  // ------------- ↓ time ↓ -------------
  #getServerTime = async () => {
    const serverTime = await SdkManager.getServerTime()
    return Math.floor(serverTime / 1000)
  }
  
  findServerTime = async () => {
    const savedTime = this.#storage.playerData[this.#timerKey]
    
    if (savedTime) {
      const currentServerSeconds = await this.#getServerTime()
      const timePassed = currentServerSeconds - savedTime
      // если прошло меньше чем duration сек, блокируем
      return this.#duration - timePassed
    }
    
    return  false
  }
  
  #restoreTimerIfActive = async () => {
    const remainingTime = await this.findServerTime()
    
    if (remainingTime) {
      this.#startTimer(remainingTime)
      this.#checkoutDisabled(true)
      return true
    }
    
    return false
  }
  
  #saveTime = async () => {
    // Сохраняем в нужный таймер серверное время
    this.#storage.playerData[this.#timerKey] = await this.#getServerTime()
    this.#storage.save()
  }
  
  // ------------- ↓ AD ↓ -------------
  #showAd = () => {
    if (this.#isDisabledBtn) return
    
    this.#isDisabledBtn = true
    this.#hasReward = false
    
    SdkManager.showRewarded({
      onRewarded: this.#onRewarded,
      onFinally: this.#onFinally,
      onError: this.onError
    })
  }
  
  // --------- rewarded callbacks
  #onRewarded = () => {
    this.#hasReward = true
    this.#game.emit(GAME_EVENTS.AD.onRewarded, this.initiatorName)
    
    this.#giveReward()
    
    this.#startTimer(this.#duration)
    this.#checkoutDisabled(true)
    this.#saveTime()
  }

  
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
  
  #onFinally = () => {
    if (this.#hasReward) {

    }
    
    this.#isDisabledBtn = false
  }
}
