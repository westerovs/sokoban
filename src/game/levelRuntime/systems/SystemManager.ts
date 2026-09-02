import AdLvlTimer from '../../features/AdLvlTimer.js'
import type EntityManager from '../entities/EntityManager.js'
import MetrikaSystem from './MetrikaSystem.js'
import RenderSystem from './RenderSystem.js'

// Создаёт и координирует системы текущего уровня.

type LevelEntity = {
  entityManager: EntityManager
}

type ManagedSystem = {
  init: () => void
  destroy?: () => void
}

export default class SystemManager {
  #levelEntity: LevelEntity
  systems = new Map<string, ManagedSystem>()
  entityManager: EntityManager

  // Сохраняет сущность уровня и её менеджер сущностей.
  constructor(levelEntity: LevelEntity) {
    this.#levelEntity = levelEntity
    this.entityManager = levelEntity.entityManager
  }

  // Создаёт системы и передаёт сущности системе рендера.
  initSystems() {
    this.systems.set('adLvlTimer', new AdLvlTimer(this.#levelEntity))
    this.systems.set('metrikaSystem', new MetrikaSystem(this.#levelEntity))

    const renderSystem = new RenderSystem()
    this.systems.set('renderSystem', renderSystem)

    // todo нужно ли все? Добавляем все сущности в систему рендера
    this.entityManager.entities.forEach((entity) => {
      renderSystem.addEntity(entity)
    })

    this.systems.forEach((system) => system.init())
  }

  // Уничтожает и удаляет систему по имени.
  removeSystem(systemName: string) {
    const system = this.systems.get(systemName)

    if (system && system.destroy) {
      system.destroy()
      this.systems.delete(systemName)
    }
  }

  // Уничтожает все зарегистрированные системы.
  removeAllSystems() {
    this.systems.forEach((_, key) => this.removeSystem(key))
    this.systems.clear()
  }
}
