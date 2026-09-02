import Locator from '../../engine/Locator.ts'
import BackgroundComponent from '../components/BackgroundComponent.js'
import type Entity from '../entities/Entity.js'
import System from './System.js'

// Добавляет визуальные компоненты сущностей в игровую сцену.

export default class RenderSystem extends System {
  #view = Locator.game.view

  constructor() {
    super()
  }

  // Инициализирует визуальные компоненты зарегистрированных сущностей.
  init() {
    this.entities.forEach((entity) => {
      this.#initializeBackground(entity)
    })
  }

  // Добавляет фон сущности в сцену, если его там ещё нет.
  #initializeBackground(entity: Entity) {
    const backgroundComponent = entity.getComponent(BackgroundComponent)

    if (backgroundComponent) {
      const background = backgroundComponent.view

      if (!this.#view.children.includes(background)) {
        this.#view.addChild(background)
      }
    }
  }
}
