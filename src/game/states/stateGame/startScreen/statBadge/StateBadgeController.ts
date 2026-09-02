import Locator from '../../../../engine/Locator.ts'
import StatBadge from './StatBadge.js'

// Создаёт показатели уровня и монет игрока на стартовом экране.

export default class StateBadgeController {
  #game = Locator.game
  #userLevel!: StatBadge
  #userCoins!: StatBadge
  #badgeWidth = 244 / 2 // Половина ширины фона показателя

  // Запускает создание показателей.
  constructor() {
    this.#init()
  }

  // Инициализирует набор показателей.
  #init = () => {
    this.#createBadges()
  }

  // Создаёт оба показателя и добавляет их на UI-слой.
  #createBadges = () => {
    this.#createUserCoins()
    this.#createUserLevel()

    Locator.uiLayer.stateUiLayer.addChild(this.#userLevel, this.#userCoins)
  }

  // Создаёт показатель монет.
  #createUserCoins = () => {
    this.#userCoins = new StatBadge({
      label: 'userCoins',
      iconTexture: 'coin',
      basePosition: {x: this.#badgeWidth, y: 60},
    })
    this.#game.refs.userCoins = this.#userCoins
  }

  // Создаёт показатель уровня игрока.
  #createUserLevel = () => {
    this.#userLevel = new StatBadge({
      label: 'userLevel',
      iconTexture: 'stat-badge-level-icon',
      basePosition: {x: this.#badgeWidth * 2 + 50, y: 60},
    })
    this.#game.refs.userLevel = this.#userLevel
  }
}
