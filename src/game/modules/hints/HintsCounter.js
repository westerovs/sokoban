import {gsap} from 'gsap'
import {GrayscaleFilter} from 'pixi-filters'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import {STORAGE_KEYS} from '@/game/engine/storage/defaultData.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {clearTimeLine, destroyTimeLine} from '@/game/utils/animations/gsapUtils.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'

/*
 * Класс отвечает за инициализацию числа хинтов на игровом экране.
 * Ведет их подсчет и обновление
 * */

export default class HintsCounter {
  #game = Locator.game
  #storage
  #buttons = []

  constructor(buttons) {
    this.#buttons = buttons.filter((btn) => btn.label !== 'optionsToggleBtn')
    this.init()
  }

  init = () => {
    this.#initComponents()
    this.#updateButtons()
    this.#setEvents(true)
  }

  #initComponents = () => {
    this.#storage = Locator.storage
  }

  #setEvents = (bool) => {
    const status = bool ? 'on' : 'off'

    this.#game[status](GAME_EVENTS.STORAGE.hintsUpdated, this.#hintsUpdated)
    this.#game[status](GAME_EVENTS.clearLevel, this.#clear)
  }

  #clear = () => {
    this.#setEvents(false)
  }

  #updateButtons = () => {
    this.#buttons.forEach(this.#updateButtonView)
  }

  #hintsUpdated = ({storageName}) => {
    if (storageName === STORAGE_KEYS.coins) return
    const button = this.#buttons.find((btn) => btn.label === storageName)

    if (button.destroyed) return
    this.#updateButtonView(button)
  }

  #updateButtonView = (button) => {
    this.#updateButtonCounterText(button)

    const plus = button.getChildByLabel('plus')
    const value = this.#storage.playerData[button.label]
    const icon = button.getChildByLabel('icon', 1)

    if (value >= 1) {
      this.#setButtonActive(button, plus, icon)
      return
    }

    this.#setButtonInactive(icon)

    if (!SdkManager.isRewardedAvailableNow() && SdkManager.flags.noStore) return

    if (button.plusTimeLine) {
      destroyTimeLine(button.plusTimeLine)
      button.plusTimeLine = null
    }

    plus.visible = true
    button.plusTimeLine = gsap
      .timeline({repeatDelay: 1})
      .fromTo(plus.scale, {x: 1, y: 1}, {x: 0.9, y: 0.9, yoyo: true, repeat: -1, ease: 'linear'})
  }

  #updateButtonCounterText = (button) => {
    const valueText = button.getChildByLabel('valueText', 1)
    valueText.text = this.#storage.playerData[button.label]
  }

  #setButtonInactive = (icon) => {
    if (GameUtils.isFirstLevel && icon.parent.label === 'hints') return

    const grayscale = new GrayscaleFilter(1)
    icon.filters = [grayscale]
  }

  #setButtonActive = (button, plus, icon) => {
    plus.visible = false
    icon.filters = []
    if (button.plusTimeLine) clearTimeLine(button.plusTimeLine, true)
  }
}
