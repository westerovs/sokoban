import {gsap} from 'gsap'
import {GrayscaleFilter} from 'pixi-filters'
import type {Container, Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import {STORAGE_KEYS} from '@/game/engine/storage/defaultData.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {clearTimeLine, destroyTimeLine} from '@/game/utils/animations/gsapUtils.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import type Storage from '@/game/engine/storage/Storage.js'
import type {HintButton} from './hintTypes.js'

/*
 * Класс отвечает за инициализацию числа хинтов на игровом экране.
 * Ведет их подсчет и обновление
 * */

export default class HintsCounter {
  #game = Locator.game
  #storage!: Storage
  #buttons: HintButton[] = []

  // Сохраняет игровые кнопки и запускает счётчик.
  constructor(buttons: HintButton[]) {
    this.#buttons = buttons.filter((btn) => btn.label !== 'optionsToggleBtn')
    this.init()
  }

  // Инициализирует зависимости, значения и события счётчика.
  init = () => {
    this.#initComponents()
    this.#updateButtons()
    this.#setEvents(true)
  }

  // Получает хранилище игрока.
  #initComponents = () => {
    this.#storage = Locator.storage
  }

  // Подключает или отключает события обновления подсказок.
  #setEvents = (bool: boolean) => {
    const status = bool ? 'on' : 'off'

    this.#game[status](GAME_EVENTS.STORAGE.hintsUpdated, this.#hintsUpdated)
    this.#game[status](GAME_EVENTS.clearLevel, this.#clear)
  }

  // Отключает события счётчика.
  #clear = () => {
    this.#setEvents(false)
  }

  // Обновляет отображение всех кнопок.
  #updateButtons = () => {
    this.#buttons.forEach(this.#updateButtonView)
  }

  // Обновляет кнопку изменившегося типа подсказки.
  #hintsUpdated = ({storageName}: {storageName: string}) => {
    if (storageName === STORAGE_KEYS.coins) return
    const button = this.#buttons.find((btn) => btn.label === storageName)

    if (!button || button.destroyed) return
    this.#updateButtonView(button)
  }

  // Обновляет счётчик и активность одной кнопки.
  #updateButtonView = (button: HintButton) => {
    this.#updateButtonCounterText(button)

    const plus = button.getChildByLabel('plus')!
    const value = this.#storage.playerData[button.label as 'hintCompass' | 'hintDarts' | 'hints']
    const icon = button.getChildByLabel('icon', true)!

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

  // Обновляет числовую подпись кнопки.
  #updateButtonCounterText = (button: HintButton) => {
    const valueText = button.getChildByLabel('valueText', true) as Text
    valueText.text = this.#storage.playerData[button.label as 'hintCompass' | 'hintDarts' | 'hints']
  }

  // Применяет к недоступной подсказке серый фильтр.
  #setButtonInactive = (icon: Container) => {
    if (GameUtils.isFirstLevel && icon.parent?.label === 'hints') return

    const grayscale = new GrayscaleFilter()
    icon.filters = [grayscale]
  }

  // Возвращает активный вид кнопки и останавливает пульсацию плюса.
  #setButtonActive = (button: HintButton, plus: Container, icon: Container) => {
    plus.visible = false
    icon.filters = []
    if (button.plusTimeLine) clearTimeLine(button.plusTimeLine, true)
  }
}
