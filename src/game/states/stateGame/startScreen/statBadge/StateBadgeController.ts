import Locator from '../../../../engine/Locator.ts'
import StatBadge from './StatBadge.js'

/**
 * Управляет созданием бейджей на главном экране
 * */

export default class StateBadgeController {
  #game = Locator.game
  #userLevel!: StatBadge
  #userCoins!: StatBadge
  #badgeWidth = 244 / 2

  constructor() {
    this.#init()
  }

  #init = () => {
    this.#createUserCoins()
    this.#createUserLevel()
  }

  #createUserCoins = () => {
    this.#userCoins = new StatBadge({
      label: 'userCoins',
      iconTexture: 'coin',
      basePosition: {x: this.#badgeWidth, y: 60},
    })
    this.#game.refs.userCoins = this.#userCoins
    Locator.uiLayer.stateUiLayer.addChild(this.#userCoins)
  }

  #createUserLevel = () => {
    this.#userLevel = new StatBadge({
      label: 'userLevel',
      iconTexture: 'stat-badge-level-icon',
      basePosition: {x: this.#badgeWidth * 2 + 50, y: 60},
    })
    this.#game.refs.userLevel = this.#userLevel
    Locator.uiLayer.stateUiLayer.addChild(this.#userLevel)
  }
}
