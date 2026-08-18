import RewardTimer from './RewardTimer.js'
import {TIMER_LABELS} from '../../ui/level/clock/Timer.js'
import GameUtils from '../../utils/gameUtils/GameUtils.js'
import {STORAGE_KEYS} from '../../engine/storage/defaultData.js'
import DateUtils from '../../utils/DateUtils.js'
import {HINT_BUTTON_NAMES} from '../../modules/hints/HintsController.js'
import i18next from 'i18next'

export default class BtnRewardTimer extends RewardTimer {
  #priceText
  #iconPlay
  initiatorName
  btn
  btnHintName
  
  constructor() {
    super()
    
    if (typeof BtnRewardTimer.instance === 'object') {
      return BtnRewardTimer.instance
    }
    
    BtnRewardTimer.instance = this
    return BtnRewardTimer.instance
  }
  
  init(btn, initiatorName = '', btnHintName) {
    this.initiatorName = initiatorName
    this.btnHintName = btnHintName

    super.init(btn, this.timerLabel, this.dataTimerKey, this.btnHintName)
    
    this.#initializeTextProperties()
    this.#checkTime()
  }
  
  get dataTimerKey() {
    if (this.btnHintName === HINT_BUTTON_NAMES.hints) return STORAGE_KEYS.timer_RewardMagnifier
    if (this.btnHintName === HINT_BUTTON_NAMES.hintDarts) return STORAGE_KEYS.timer_RewardDarts
    if (this.btnHintName === HINT_BUTTON_NAMES.hintCompass) return STORAGE_KEYS.timer_RewardCompass
  }
  
  get timerLabel() {
    if (!this.btnHintName) return TIMER_LABELS.btnFreeTimer
    
    return `${TIMER_LABELS.btnFreeTimer}_${this.btnHintName}`
  }
  
  #checkTime = async () => {
    const seconds = await this.findServerTime()
    if (seconds && seconds > 0) {
      this.#updateTimerText(seconds)
    }
  }
  
  #initializeTextProperties = () => {
    this.#iconPlay = this.btn.getChildByLabel('iconPlay')
    this.#priceText = this.btn.getChildByLabel('priceText')
    
    const priceText = this.#priceText
    priceText.initText = priceText.text
    priceText.initFontSize = priceText.style.fontSize
    priceText.initPosX = priceText.x
  }
  
  onTimerTick(currentTimeWithZero) {
    this.#updateTimerText(currentTimeWithZero)
  }
  
  onTimerEnd() {
    super.onTimerEnd()
    
    if (this.#priceText.destroyed || this.#iconPlay.destroyed) return
    
    this.#priceText.text = this.#priceText.initText
    this.#priceText.style.fontSize = this.#priceText.initFontSize
    this.#priceText.x = this.#priceText.initPosX
    this.#iconPlay.visible = true
  }
  
  #updateTimerText = (timeSeconds) => {
    this.#priceText.style.fontSize = (this.initiatorName === 'store') ? 20 : 26
    this.#priceText.position.set(1, 0)
    this.#iconPlay.visible = false
    
    const {h, m, s} = DateUtils.formatTime(timeSeconds)
    this.#priceText.text = `${h}:${m}:${s}`
  }
  
  onError(err) {
    GameUtils.showError(err, {message: `${i18next.t('errors.ad')}`})
  }
}
