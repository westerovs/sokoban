import LiveOpsController from '../components/liveOpsController/LiveOpsController.js'
import Locator from '../engine/Locator.ts'
import SdkManager from '../engine/SdkManager.js'
import {LEVEL_TYPES, TIMER_REWARD_DURATION_IF_STORE_UNAVAILABLE} from '../gameConfig/constants.js'
import GameUtils from '../utils/gameUtils/GameUtils.js'

export default class ABTest {
  constructor() {
    if (typeof ABTest.instance === 'object') {
      return ABTest.instance
    }

    ABTest.instance = this
    return ABTest.instance
  }

  static getTimerRewardDuration = () => {
    if (!SdkManager.adapter.purchase.isAvailable()) {
      return TIMER_REWARD_DURATION_IF_STORE_UNAVAILABLE
    }

    return +SdkManager.adapter.options.flags.timerRewardDuration
  }

  static get levelAdDelay() {
    return +SdkManager.adapter.options.flags.levelAdDelay
  }

  static get timerCompassDuration() {
    return +SdkManager.adapter.options.flags.timerCompassDuration
  }

  // получает отфильтрованный список уровней, исключая уровни под флагом
  static getFilteredLevels = () => {
    const levels = ABTest.getFilteredLocations().flatMap((location) => location.levels)
    return Object.fromEntries(levels.map((level) => [level.levelName, level]))
  }

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

  static #isDisabledLevel = (level, disabledModes) => {
    return disabledModes.some((mode) => level.levelName.toLowerCase().includes(mode))
  }
}
