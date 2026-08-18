import GameUtils from '../utils/gameUtils/GameUtils.js'
import {LEVEL_TYPES, TIMER_REWARD_DURATION_IF_STORE_UNAVAILABLE} from '../gameConfig/constants.js'
import Locator from '../engine/Locator.ts'
import SdkManager from '../engine/SdkManager.js'
import LiveOpsController from '../components/liveOpsController/LiveOpsController.js'

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
    const MODES = {
      [LEVEL_TYPES.NEW_YEAR.name]: LiveOpsController.newYearIsActiveAndPurchased,
    }

    // Получаем список отключённых типов
    const disabledModes = Object.entries(MODES)
      .filter(([, flag]) => !GameUtils.isStringTrue(flag))
      .map(([mode]) => mode.toLowerCase())
    
    const levels = Locator.gameConfig.levels
    // Фильтрует уровни, исключая spineName с disabled-модами в названии
    const filteredLevels = Object.fromEntries(
      Object.entries(levels).filter(([, { spineName }]) => {
        return !disabledModes.some(mode => spineName.toLowerCase().includes(mode))
      })
    )
    
    return filteredLevels
  }
}
