import Locator from '../../engine/Locator.ts'
import {GAME_NAMES, PLATFORM_ID} from '../../gameConfig/constants.js'
import LocalStorage from '../../engine/storage/LocalStorage.js'

/**
 * Первая версия класса для работы с эвентами по расписанию.
 * Отвечает за поддержку игровых эвентов, проверяет актуальную дату
 * Проверка доступности: Locator.liveOps.isActive(LIVE_OPS_ID.NEW_YEAR)
 * */

export const LIVE_OPS_ID = {
  NEW_YEAR: 'newYear',
}

// перед сборкой для продакшена тут можно потестировать, выставляя различные даты
const LIVE_OPS_EVENTS = {
  newYear: {
    id: LIVE_OPS_ID.NEW_YEAR,
    isDisabled: true, // меняется динамически в init в зависимости от игры и платформы
    repeat: 'yearly',
    start: {day: 1, month: 12}, // todo можно добавить в админку даты для проверки
    end: {day: 31, month: 1}
  },
  mockTimeEvent: {
    id: 'someOneTimeEvent',
    isDisabled: true,
    // возможно альтернативное указание даты
    startAt: '2025-05-01T00:00:00Z',
    endAt: '2025-05-10T23:59:59Z'
  }
}

export default class LiveOpsController {
  #events = {}
  
  // todo не должно быть тут. Смешанная логика
  static get newYearIsActiveAndPurchased() {
    if (Locator.liveOps.isActive(LIVE_OPS_ID.NEW_YEAR)) {
      // если куплены уровни
       if (Locator.storage.playerData.eventPurchasedNewYear) return true
      // если не куплены
      return false
    }
    
    return false
  }
  
  /**  тут можно добавить поддерживаемые игры и платформы
   если нужно добавить новый год в некоторые платформы, добавь это как && в константу isAvailable
   если нужно разрешить для всех платформ - удали && NEW_YEAR_ENABLED_PLATFORMS*/
  static get isNewYearAvailable() {
    const NEW_YEAR_ENABLED_GAMES = [GAME_NAMES.detective, GAME_NAMES.test]
    const NEW_YEAR_ENABLED_PLATFORMS = [PLATFORM_ID.yandex, PLATFORM_ID.vk, PLATFORM_ID.ok, PLATFORM_ID.base]
    const isAvailable = NEW_YEAR_ENABLED_GAMES.includes(GAME_NAMES.currentName) && NEW_YEAR_ENABLED_PLATFORMS
    
    if (!isAvailable) {
      console.log('[LiveOpsController] new Year is not available')
      return false
    }
    
    return true
  }
  
  // вызывается в gamePreload
  init = () => {
    if (LiveOpsController.isNewYearAvailable) {
      // isDisabled false - НГ доступен и будет активирован в указанную дату
      LIVE_OPS_EVENTS.newYear.isDisabled = false
    }
    if (LocalStorage.forceNewYear && LiveOpsController.isNewYearAvailable) {
      LIVE_OPS_EVENTS.newYear.isDisabled = false
      LIVE_OPS_EVENTS.newYear.start = {day: 1, month: 1}
      LIVE_OPS_EVENTS.newYear.end = {day: 31, month: 12}
    }
    
    this.#updateEventsActivity()
  }
  
  // проверяет любой эвент на доступность
  isActive = (eventName) => {
    const config = LIVE_OPS_EVENTS[eventName]
    if (!config || config.isDisabled) return false
    
    return Boolean(this.#events[eventName])
  }
  
  // Заполняет список эвентов на основе конфига и текущего времени
  #updateEventsActivity = () => {
    Object.entries(LIVE_OPS_EVENTS).forEach(([key, config]) => {
      if (config.isDisabled) {
        this.#events[key] = false
        return
      }
      
      this.#events[key] = this.#isInTimeRange(config)
    })
  }
  
  // Проверяет, попадает ли текущее время в интервал эвента
  #isInTimeRange = config => {
    if (config.repeat === 'yearly') {
      return this.#isInYearlyRange(config)
    }
    
    if (config.startAt && config.endAt) {
      const now = Date.now()
      return now >= Date.parse(config.startAt) && now <= Date.parse(config.endAt)
    }
    
    return false
  }
  
  #isInYearlyRange = ({ start, end }) => {
    const now = new Date()
    const year = now.getUTCFullYear()
    
    const startDate = Date.UTC(year, start.month - 1, start.day, 0, 0, 0)
    const endDate = Date.UTC(year, end.month - 1, end.day, 23, 59, 59)
    
    // диапазон внутри одного года (например: март → май)
    if (start.month <= end.month) {
      return now >= startDate && now <= endDate
    }
    
    // диапазон через Новый год (например: декабрь → январь)
    return now >= startDate || now <= endDate
  }
}

