import Locator from '../../engine/Locator.ts'
import SdkManager from '../../engine/SdkManager.js'
import {STORAGE_KEYS} from '../../engine/storage/defaultData.js'
import {rewardsCatalog} from '../../gameConfig/rewardsCatalog.js'
import YaMetrika from '../../modules/metrika/YaMetrika.js'
import ButtonAnimator from '../../utils/animations/ButtonAnimator.js'
import {eventToggle} from '../../utils/gameUtils/GameUtils.js'

export default class RateUs {
  #game = Locator.game
  #refs = this.#game.refs
  #view = this.#refs.rateUsView
  #innerModal = this.#view.getChildByLabel('innerModal', 1)
  #innerContainer = this.#view.getChildByLabel('innerContainer')
  #btnLater = this.#innerContainer.getChildByLabel('btnLater', 1)
  #btnEnter = this.#innerContainer.getChildByLabel('btnEnter')
  #completePromise
  #resolveComplete = null

  constructor() {
    this.btnClose.visible = false

    ButtonAnimator.initOverHandler([this.#btnLater, this.#btnEnter])

    this.#innerModal.addChild(this.#innerContainer)
    this.#completePromise = new Promise((resolve) => {
      this.#resolveComplete = resolve
    })
  }

  // механика доступна на этой платформе?
  static get checkAvailable() {
    return SdkManager.makeReview.isAvailable()
  }

  // механика была выполнена? (true - отзыв оставлен)
  static get userHasRated() {
    return SdkManager.makeReview.getStatus()
  }

  // стоит предлагать игроку выполнить механику?
  static get shouldAct() {
    return SdkManager.makeReview.shouldAct()
  }

  static checkAndShowRateUs = async (storage, levelEntity) => {
    const {levelIndex} = storage.playerData
    if (levelIndex !== 4) return
    if (!RateUs.shouldAct) return

    const {uiManager} = levelEntity
    await uiManager.showModule(MODULE_NAMES.RATE_US.moduleName, true)
    const rateUs = uiManager.getModule(MODULE_NAMES.RATE_US.moduleName)

    await rateUs.waitForCompletion()
  }

  waitForCompletion = () => this.#completePromise

  show() {
    super.show()
    this.#setEvents(true)
  }

  #setEvents = (bool) => {
    const toggle = eventToggle(bool)

    this.#btnLater[toggle.gameOnceOff]('pointerup', this.#btnLaterAction)
    this.#btnEnter[toggle.gameOnceOff]('pointerup', this.#btnEnterAction)
  }

  #btnLaterAction = async () => {
    YaMetrika.userReviewClickLater()

    this.#setEvents(false)
    this.uiManager.closeModule(RateUs.moduleName)
    this.#resolveComplete()
  }

  #btnEnterAction = async () => {
    YaMetrika.userReviewClickOk()

    this.#setEvents(false)

    this.uiManager.closeModule(RateUs.moduleName)
    this.#resolveComplete()

    await this.makeReview()
  }

  #simulateReviewAct = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const isServerAvailable = Math.random() > 0.5

          if (isServerAvailable) {
            console.log('review ok')
            resolve('ok')
            return
          }

          reject('сервер недоступен')
        } catch (err) {
          reject(err)
        }
      }, 1000)
    })
  }

  /*
   * пока не введут функцию удаления комментария, буду начислять награду всем кто нажал на кнопку оценить,
   * вне зависимости от того что яндекс вернул
   * */
  makeReview = async () => {
    try {
      this.#giveReward()

      // await this.#simulateReviewAct()
      await SdkManager.makeReview
        .act()
        // .then(res => this.#giveReward(res))
        .catch((err) => console.error('----- [rejectReview]', err))
    } catch (err) {
      console.log('[makeReview]', err)
    }
  }

  #giveReward = () => {
    Locator.storage.addHints(STORAGE_KEYS.hints, rewardsCatalog.rateUsHints.amount)
    console.warn('----- [начислено хинтов]', rewardsCatalog.rateUsHints.amount)
  }
}
