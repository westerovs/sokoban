import LiveOpsController from '../components/liveOpsController/LiveOpsController.js'
import Locator from '../engine/Locator.ts'
import SdkManager from '../engine/SdkManager.js'
import {LEVEL_TYPES, TIMER_REWARD_DURATION_IF_STORE_UNAVAILABLE} from '../gameConfig/constants.js'
import type {LevelDefinition} from '../gameConfig/levels/levelTypes.js'
import GameUtils from '../utils/gameUtils/GameUtils.js'

// Выбирает игровые настройки и контент с учётом платформенных флагов.

export default class ABTest {
  static instance: ABTest | null = null

  // Возвращает общий экземпляр конфигуратора экспериментов.
  constructor() {
    if (ABTest.instance) {
      return ABTest.instance
    }

    ABTest.instance = this
    return this
  }

  // Возвращает длительность таймера рекламной награды.
  static getTimerRewardDuration = () => {
    if (!SdkManager.adapter.purchase.isAvailable()) {
      return TIMER_REWARD_DURATION_IF_STORE_UNAVAILABLE
    }

    return Number(SdkManager.adapter.options.flags.timerRewardDuration)
  }

  // Возвращает задержку рекламы между уровнями.
  static get levelAdDelay() {
    return Number(SdkManager.adapter.options.flags.levelAdDelay)
  }

  // Возвращает длительность таймера подсказки-компаса.
  static get timerCompassDuration() {
    return Number(SdkManager.adapter.options.flags.timerCompassDuration)
  }

  // получает отфильтрованный список уровней, исключая уровни под флагом
  static getFilteredLevels = () => {
    const levels = ABTest.getFilteredLocations().flatMap((location) => location.levels)
    return Object.fromEntries(levels.map((level) => [level.levelName, level]))
  }

  // Возвращает локации без отключённых экспериментом уровней.
  static getFilteredLocations = () => {
    const disabledModes = ABTest.#getDisabledModes()
    const locations = Locator.gameConfig.levels?.locations ?? []

    return locations.map((location) => ({
      ...location,
      levels: location.levels.filter((level) => !ABTest.#isDisabledLevel(level, disabledModes)),
    }))
  }

  static #getDisabledModes = () => {
    const MODES = {
      [LEVEL_TYPES.NEW_YEAR.name]: LiveOpsController.newYearIsActiveAndPurchased,
    }

    return Object.entries(MODES)
      .filter(([, flag]) => !GameUtils.isStringTrue(flag))
      .map(([mode]) => mode.toLowerCase())
  }

  // Проверяет, относится ли уровень к отключённому режиму.
  static #isDisabledLevel = (level: LevelDefinition, disabledModes: string[]) => {
    return disabledModes.some((mode) => level.levelName.toLowerCase().includes(mode))
  }
}
