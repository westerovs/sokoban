import MetrikaCounter from '../../modules/metrika/MetrikaCounter.js'
import Logger, {MODULES} from '../../utils/Logger.js'

// Управляет счётчиками метрик в течение жизненного цикла уровня.

type MetrikaComponent = {
  init: () => void
  destroy: () => void
}

export default class MetrikaSystem {
  #components: Record<string, MetrikaComponent> = {}
  readonly level: object

  // Сохраняет ссылку на текущий уровень.
  constructor(level: object) {
    this.level = level
  }

  // Инициализирует счётчики метрик.
  init() {
    this.#initComponents()
    Logger.log(MODULES.Metrika, 'MetrikaSystem init')
  }

  // Уничтожает все счётчики метрик.
  destroy() {
    Object.values(this.#components).forEach((component) => component.destroy())
    this.#components = {}

    Logger.log(MODULES.Metrika, 'MetrikaSystem destroy')
  }

  // Создаёт и запускает компоненты метрик.
  #initComponents = () => {
    this.#components.hintCounter = new MetrikaCounter()
    Object.values(this.#components).forEach((component) => component.init())
  }
}
