import RenderSystem from './RenderSystem.js'
import AdLvlTimer from '../../features/AdLvlTimer.js'
import MetrikaSystem from './MetrikaSystem.js'

export default class SystemManager {
  #levelEntity
  systems = new Map()
  entityManager
  
  constructor(levelEntity) {
    this.#levelEntity = levelEntity
    this.entityManager = levelEntity.entityManager
  }
  
  initSystems() {
    this.systems.set('adLvlTimer', new AdLvlTimer(this.#levelEntity))
    this.systems.set('metrikaSystem', new MetrikaSystem(this.#levelEntity))
    
    const renderSystem = new RenderSystem()
    this.systems.set('renderSystem', renderSystem)
    
    // todo нужно ли все? Добавляем все сущности в систему рендера
    this.entityManager.entities.forEach(entity => {
      renderSystem.addEntity(entity)
    })
    
    this.systems.forEach(system => system.init())
  }
  
  removeSystem(systemName) {
    const system = this.systems.get(systemName)
    
    if (system && system.destroy) {
      system.destroy()
      this.systems.delete(systemName)
    }
  }
  
  removeAllSystems() {
    this.systems.forEach((_, key) => this.removeSystem(key))
    this.systems.clear()
  }
}
