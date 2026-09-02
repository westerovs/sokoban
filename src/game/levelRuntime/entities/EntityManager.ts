import BackgroundComponent from '@/game/levelRuntime/components/BackgroundComponent.js'
import Entity from '@/game/levelRuntime/entities/Entity.js'

// Создаёт и хранит сущности текущего уровня.

type EntityManagerConfig = {
  bgTexture: string
}

export default class EntityManager {
  #config: EntityManagerConfig
  #entities = new Map<string, Entity>()

  // Сохраняет конфигурацию сущностей уровня.
  constructor(config: EntityManagerConfig) {
    this.#config = config
  }

  // Возвращает коллекцию созданных сущностей.
  get entities() {
    return this.#entities
  }

  // Создаёт все сущности уровня.
  createEntities = async () => {
    await this.#createBackgroundEntity()
  }

  // Создаёт сущность фонового изображения.
  #createBackgroundEntity = async () => {
    const textureName = this.#config.bgTexture

    const backgroundEntity = new Entity(textureName)
    const backgroundComponent = new BackgroundComponent(backgroundEntity, textureName)
    backgroundComponent.view.alpha = 1

    backgroundEntity.addComponent(backgroundComponent)
    this.#entities.set(backgroundEntity.id, backgroundEntity)

    return Promise.resolve()
  }

  // Находит сущность по идентификатору.
  #findEntity = (id: string) => {
    return this.#entities.get(id)
  }
}
