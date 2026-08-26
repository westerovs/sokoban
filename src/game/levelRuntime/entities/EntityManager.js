import BackgroundComponent from '@/game/levelRuntime/components/BackgroundComponent.js'
import Entity from '@/game/levelRuntime/entities/Entity.js'

export default class EntityManager {
  #config
  #entities = new Map()

  constructor(config) {
    this.#config = config
  }

  get entities() {
    return this.#entities
  }

  createEntities = async () => {
    await this.#createBackgroundEntity()
  }

  #createBackgroundEntity = async () => {
    const textureName = this.#config.bgTexture

    const backgroundEntity = new Entity(textureName)
    const backgroundComponent = new BackgroundComponent(backgroundEntity, textureName)
    backgroundComponent.view.alpha = 1

    backgroundEntity.addComponent(backgroundComponent)
    this.#entities.set(backgroundEntity.id, backgroundEntity)

    return Promise.resolve()
  }

  #findEntity = (id) => {
    return this.#entities.get(id)
  }
}
