import type Entity from '../entities/Entity.js'

// Задаёт базовый контракт системы, работающей с игровыми сущностями.

export default class System {
  entities = new Set<Entity>()

  // Регистрирует сущность в системе.
  addEntity(entity: Entity) {
    this.entities.add(entity)
  }

  // Удаляет сущность из системы.
  removeEntity(entity: Entity) {
    this.entities.delete(entity)
  }

  // Требует от наследника реализовать инициализацию системы.
  init() {
    throw new Error('[System]: init method is not implemented')
  }
}
