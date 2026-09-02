import type {Container} from 'pixi.js'
import {rewardsCatalog} from '@/game/gameConfig/rewardsCatalog'
import Locator from '../../engine/Locator.ts'
import SdkManager from '../../engine/SdkManager.ts'
import {STORAGE_KEYS} from '../../engine/storage/defaultData.ts'
import YaMetrika from '../../modules/metrika/YaMetrika.ts'
import ButtonAnimator from '../../utils/animations/ButtonAnimator.ts'
import RateUsView from './RateUsView.ts'

// Управляет показом предложения оценить игру и выдачей награды.

export default class RateUs {
  static displayLevelIndex = 4 // Номер завершённого уровня для показа окна оценки

  #view!: RateUsView
  #btnLater!: Container
  #btnEnter!: Container
  #completePromise!: Promise<void>
  #resolveComplete: (() => void) | null = null

  // Создаёт и подготавливает окно оценки.
  constructor() {
    this.#init()
  }

  // Возвращает доступность запроса оценки в SDK.
  static get checkAvailable() {
    return SdkManager.makeReview?.isAvailable?.() ?? false
  }

  // Возвращает сохранённый SDK-статус оценки пользователя.
  static get userHasRated() {
    return SdkManager.makeReview?.getStatus?.() ?? false
  }

  // Возвращает необходимость действия по мнению SDK.
  static get shouldAct() {
    return SdkManager.makeReview?.shouldAct?.() ?? false
  }

  // Показывает окно оценки после заданного уровня.
  static checkAndShowRateUs = async (_storage?: unknown, _levelEntity?: unknown) => {
    const completedLevelIndex = Locator.storage.playerData.levelIndex - 1
    if (completedLevelIndex !== RateUs.displayLevelIndex) return
    // if (!RateUs.shouldAct) return // не удалять!

    const rateUs = new RateUs()
    await rateUs.show()
  }

  // Показывает окно и ждёт его закрытия.
  show = async () => {
    this.#setEvents(true)

    const isShown = await this.#view.show()
    if (!isShown) this.#view.destroy()

    await this.#completePromise
  }

  // Находит элементы окна и готовит ожидание завершения.
  #init = () => {
    this.#view = new RateUsView()
    this.#btnLater = this.#view.getChildByLabel('btnLater', true) as Container
    this.#btnEnter = this.#view.getChildByLabel('btnEnter', true) as Container
    this.#completePromise = new Promise<void>((resolve) => {
      this.#resolveComplete = resolve
    })

    this.#view.once('destroyed', this.#complete)
    ButtonAnimator.initOverHandler([this.#btnLater, this.#btnEnter])
  }

  // Включает или отключает события кнопок.
  #setEvents = (isEnabled: boolean) => {
    if (isEnabled) {
      this.#btnLater.once('pointerup', this.#btnLaterAction)
      this.#btnEnter.once('pointerup', this.#btnEnterAction)
      return
    }

    this.#btnLater.off('pointerup', this.#btnLaterAction)
    this.#btnEnter.off('pointerup', this.#btnEnterAction)
  }

  // Закрывает окно без перехода в SDK.
  #btnLaterAction = async () => {
    YaMetrika.userReviewClickLater()
    await this.#close()
  }

  // Закрывает окно и запускает запрос оценки.
  #btnEnterAction = async () => {
    YaMetrika.userReviewClickOk()
    await this.#close()
    await this.#makeReview()
  }

  // Отключает события и скрывает окно.
  #close = async () => {
    this.#setEvents(false)
    await this.#view.hide()
  }

  // Завершает ожидание закрытия окна.
  #complete = () => {
    if (!this.#resolveComplete) return

    const resolve = this.#resolveComplete
    this.#resolveComplete = null
    resolve()
  }

  /** Награда выдаётся за попытку оставить отзыв независимо от ответа SDK. */
  #makeReview = async () => {
    try {
      this.#giveReward()
      await SdkManager.makeReview?.act?.()
    } catch (err) {
      console.error('[RateUs]: review request failed', err)
    }
  }

  // Добавляет пользователю награду за попытку оценки.
  #giveReward = () => {
    Locator.storage.addHints(STORAGE_KEYS.hints, rewardsCatalog.rateUsHints.amount)
  }
}
