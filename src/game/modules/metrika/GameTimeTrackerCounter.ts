import Logger, {MODULES} from '../../utils/Logger.js'
import YaMetrika from './YaMetrika.js'

// Периодически отправляет метрику времени игровой сессии.

export default class GameTimeTrackerCounter {
  static instance: GameTimeTrackerCounter | null = null
  #interval = 1000 * 60 // 3 минуты

  // Возвращает общий экземпляр и запускает отслеживание времени.
  constructor() {
    if (GameTimeTrackerCounter.instance) {
      return GameTimeTrackerCounter.instance
    }

    this.#start()

    GameTimeTrackerCounter.instance = this
    return this
  }

  // Запускает периодическую отправку метрики.
  #start = () => {
    Logger.log(MODULES.Metrika, 'GameTimeTrackerCounter start')
    setInterval(this.#tick, this.#interval)
  }

  // Отправляет очередную метрику игрового времени.
  #tick = () => {
    Logger.log(MODULES.Metrika, 'GameTimeTrackerCounter tick')
    YaMetrika.gameTimeTracker()
  }
}
