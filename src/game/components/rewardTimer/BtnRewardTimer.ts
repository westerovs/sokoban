import i18next from 'i18next'
import type {Container} from 'pixi.js'
import {Sprite, Text} from 'pixi.js'
import {STORAGE_KEYS} from '../../engine/storage/defaultData.js'
import {HINT_BUTTON_NAMES} from '../../modules/hints/HintsController.js'
import {TIMER_LABELS} from '../../ui/level/clock/Timer.js'
import DateUtils from '../../utils/DateUtils.js'
import GameUtils from '../../utils/gameUtils/GameUtils.js'
import type {RewardTimerKey} from './RewardTimer.js'
import RewardTimer from './RewardTimer.js'

// Связывает таймер рекламной награды с визуальным состоянием кнопки.

type HintButtonName = (typeof HINT_BUTTON_NAMES)[keyof typeof HINT_BUTTON_NAMES]
type RewardPriceText = Text & {
  initText: string
  initFontSize: string | number
  initPosX: number
}

export default class BtnRewardTimer extends RewardTimer {
  static instance: BtnRewardTimer | null = null
  #priceText!: RewardPriceText
  #iconPlay!: Sprite

  // Возвращает общий экземпляр таймера рекламной кнопки.
  constructor() {
    super()

    if (BtnRewardTimer.instance) {
      return BtnRewardTimer.instance
    }

    BtnRewardTimer.instance = this
    return this
  }

  // Настраивает таймер для конкретной кнопки и типа подсказки.
  init(btn: Container, initiatorName = '', btnHintName: HintButtonName | RewardTimerKey) {
    this.initiatorName = initiatorName
    this.btnHintName = btnHintName as HintButtonName

    super.init(btn, this.timerLabel, this.dataTimerKey)

    this.#initializeTextProperties()
    this.#checkTime()
  }

  // Возвращает ключ сохранённого времени для выбранной подсказки.
  get dataTimerKey() {
    return {
      [HINT_BUTTON_NAMES.hints]: STORAGE_KEYS.timer_RewardMagnifier,
      [HINT_BUTTON_NAMES.hintDarts]: STORAGE_KEYS.timer_RewardDarts,
      [HINT_BUTTON_NAMES.hintCompass]: STORAGE_KEYS.timer_RewardCompass,
    }[this.btnHintName as HintButtonName]
  }

  // Возвращает уникальную метку таймера кнопки.
  get timerLabel() {
    if (!this.btnHintName) return TIMER_LABELS.btnFreeTimer

    return `${TIMER_LABELS.btnFreeTimer}_${this.btnHintName}`
  }

  // Восстанавливает текст активного таймера.
  #checkTime = async () => {
    const seconds = await this.findServerTime()
    if (seconds && seconds > 0) {
      this.#updateTimerText(seconds)
    }
  }

  // Сохраняет исходные свойства элементов кнопки.
  #initializeTextProperties = () => {
    this.#iconPlay = this.btn!.getChildByLabel('iconPlay') as Sprite
    this.#priceText = this.btn!.getChildByLabel('priceText') as RewardPriceText

    const priceText = this.#priceText
    priceText.initText = String(priceText.text)
    priceText.initFontSize = priceText.style.fontSize
    priceText.initPosX = priceText.x
  }

  // Обновляет текст очередной секунды таймера.
  onTimerTick(currentTimeWithZero: number | string) {
    this.#updateTimerText(currentTimeWithZero)
  }

  // Восстанавливает исходный вид кнопки после таймера.
  onTimerEnd() {
    super.onTimerEnd()

    if (this.#priceText.destroyed || this.#iconPlay.destroyed) return

    this.#priceText.text = this.#priceText.initText
    this.#priceText.style.fontSize = this.#priceText.initFontSize
    this.#priceText.x = this.#priceText.initPosX
    this.#iconPlay.visible = true
  }

  // Показывает оставшееся время вместо цены кнопки.
  #updateTimerText = (timeSeconds: number | string) => {
    this.#priceText.style.fontSize = this.initiatorName === 'store' ? 20 : 26
    this.#priceText.position.set(1, 0)
    this.#iconPlay.visible = false

    const {h, m, s} = DateUtils.formatTime(Number(timeSeconds))
    this.#priceText.text = `${h}:${m}:${s}`
  }

  // Показывает пользователю ошибку рекламной награды.
  onError(err?: unknown) {
    GameUtils.showError(err, {message: `${i18next.t('errors.ad')}`})
  }
}
