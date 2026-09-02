import Locator from '../../engine/Locator.ts'
import {GAME_EVENTS} from '../../gameConfig/gameEvents.js'
import Logger, {MODULES} from '../../utils/Logger.js'
import YaMetrika from './YaMetrika.js'

// Считает подсказки и промахи для метрик текущего уровня.

export default class MetrikaCounter {
  #game = Locator.game
  #hintCounter = 0
  #missClickCounter = 0

  // Подключает счётчик к игровым событиям.
  init = () => {
    Logger.log(MODULES.Metrika, 'MetrikaCounter init')
    this.#setEvents(true)
  }

  // Отключает события и сбрасывает накопленные значения.
  destroy = () => {
    Logger.log(MODULES.Metrika, 'destroy')

    this.#setEvents(false)
    this.#hintCounter = 0
    this.#missClickCounter = 0
  }

  // Подключает или отключает игровые события счётчика.
  #setEvents = (bool: boolean) => {
    const status = bool ? 'on' : 'off'

    this.#game[status](GAME_EVENTS.completeLevel, this.#getResult)
    this.#game[status](GAME_EVENTS.STORAGE.usedHint, this.#updateHintCounter)
    this.#game[status](GAME_EVENTS.missClick, this.#updateMissClickCounter)
  }

  // Отправляет накопленный результат в метрику.
  #getResult = () => {
    YaMetrika.hintCounter(Locator.storage, this.#hintCounter)
    YaMetrika.missClickCounter(Locator.storage, this.#missClickCounter)
  }

  // Увеличивает число использованных подсказок.
  #updateHintCounter = () => {
    this.#hintCounter++
  }

  // Увеличивает число промахов.
  #updateMissClickCounter = () => {
    this.#missClickCounter++
  }
}
