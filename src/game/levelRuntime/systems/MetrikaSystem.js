import MetrikaCounter from '../../modules/metrika/MetrikaCounter.js'
import {Logger, MODULES} from '../../utils/Logger.js'

export default class MetrikaSystem {
  #components = {}
  
  constructor(level) {
    this.level = level
  }
  
  init() {
    this.#initComponents()
    Logger.log(MODULES.Metrika, 'MetrikaSystem init')
  }
  
  destroy() {
    Object.values(this.#components).forEach(component => component.destroy())
    this.#components = {}
    
    Logger.log(MODULES.Metrika,'MetrikaSystem destroy')
  }
  
  #initComponents = () => {
    this.#components.hintCounter = new MetrikaCounter()
    Object.values(this.#components).forEach(component => component.init())
  }
}
