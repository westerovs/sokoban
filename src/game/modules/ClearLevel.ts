import Locator from '../engine/Locator.ts'
import {GAME_EVENTS} from '../gameConfig/gameEvents.js'
import BackgroundComponent from '../levelRuntime/components/BackgroundComponent.js'
import type Entity from '../levelRuntime/entities/Entity.js'

// Освобождает сущности, системы и визуальные ресурсы завершённого уровня.

type ClearableLevel = {
  entityManager: object | null
  systemManager: object | null
}

export default class ClearLevel {
  #game = Locator.game
  #view = this.#game.view

  level: ClearableLevel

  // Сохраняет очищаемый уровень.
  constructor(level: ClearableLevel) {
    this.level = level
  }

  // Очищает отображение, сущности, системы и ссылки уровня.
  clear = (entities: Map<string, Entity>, systems: Map<string, unknown>) => {
    this.#game.emit(GAME_EVENTS.clearLevel)

    this.#removeView(entities)
    this.#clearEntitiesAndSystems(entities, systems)
    this.#clearParams()
  }

  // Удаляет визуальные компоненты сущностей со сцены.
  #removeView = (entities: Map<string, Entity>) => {
    entities.forEach((entity) => {
      const backgroundComponent = entity.getComponent(BackgroundComponent)

      if (backgroundComponent) {
        this.#view.removeChild(backgroundComponent.view)
        backgroundComponent.destroy()
      }
    })
  }

  // Очищает коллекции сущностей и систем.
  #clearEntitiesAndSystems = (entities: Map<string, Entity>, systems: Map<string, unknown>) => {
    entities.clear()
    systems.clear()
  }

  // Сбрасывает ссылки уровня на инфраструктуру выполнения.
  #clearParams = () => {
    const {level} = this

    // main params
    level.entityManager = null
    level.systemManager = null
  }
}
