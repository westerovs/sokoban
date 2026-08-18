import YaMetrika from './YaMetrika.js'
import {Logger, MODULES} from '../../utils/Logger.js'

export default class GameTimeTrackerCounter {
  #interval = 1000 * 60 // 3 минуты
  
  constructor() {
    if (typeof GameTimeTrackerCounter.instance === 'object') {
      return GameTimeTrackerCounter.instance
    }
    
    this.#start()
    
    GameTimeTrackerCounter.instance = this
    return GameTimeTrackerCounter.instance
  }
  
  #start = () => {
    Logger.log(MODULES.Metrika, 'GameTimeTrackerCounter start')
    setInterval(this.#tick, this.#interval)
  }
  
  #tick = () => {
    Logger.log(MODULES.Metrika, 'GameTimeTrackerCounter tick')
    YaMetrika.gameTimeTracker()
  }
}
