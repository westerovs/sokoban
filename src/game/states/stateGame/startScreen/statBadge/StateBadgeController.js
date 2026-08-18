import Locator from '../../../../engine/Locator.ts'
import StatBadge from './StatBadge.js'

export default class StateBadgeController {
  #game = Locator.game
  #userLevel
  #userCoins
  
  constructor() {
    this.#init()
  }
  
  #init = () => {
    this.#createBadges()
  }
  
  #createBadges = () => {
    this.#createUserLevel()
    this.#createUserCoins()
    
    Locator.uiLayer.stateUiLayer.addChild(this.#userLevel, this.#userCoins)
  }
  
  #createUserLevel = () => {
    this.#userLevel = new StatBadge({
      label: 'userLevel',
      iconTexture: 'stat-badge-level-icon',
      alignRight: true,
      basePosition: {x: 0, y: 80},
    })
    this.#game.refs.userLevel = this.#userLevel
  }
  
  #createUserCoins = () => {
    this.#userCoins = new StatBadge({
      label: 'userCoins',
      iconTexture: 'coin',
      alignRight: true,
      basePosition: {x: 0, y: 150},
    })
    this.#game.refs.userCoins = this.#userCoins
    
  }
}
