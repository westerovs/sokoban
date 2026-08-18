import Locator from '../engine/Locator.ts'
import {GAME_EVENTS} from '../gameConfig/gameEvents.js'
import BackgroundComponent from '../levelRuntime/components/BackgroundComponent.js'

export default class ClearLevel {
  #game = Locator.game
  #view = this.#game.view
  
  constructor(level) {
    this.level = level
  }
  
  clear = (entities, systems) => {
    this.#game.emit(GAME_EVENTS.clearLevel)
    
    this.#removeView(entities)
    this.#cleaEntitiesAndSystems(entities, systems)
    this.#clearParams()
  }
  
  #removeView = (entities) => {
    entities.forEach(entity => {
      const backgroundComponent = entity.getComponent(BackgroundComponent)
      
      if (backgroundComponent) {
        this.#view.removeChild(backgroundComponent.view)
      }
    })
  }
  
  #cleaEntitiesAndSystems = (entities, systems) => {
    entities.clear()
    systems.clear()
  }
  
  #clearParams = () => {
    const {level} = this
    
    // main params
    level.entityManager = null
    level.camera = null
    level.clearLevel = null
  }
}
