import System from './System.js'
import BackgroundComponent from '../components/BackgroundComponent.js'
import Locator from '../../engine/Locator.ts'

export default class RenderSystem extends System {
  #view = Locator.game.view

  constructor() {
    super()
  }

  init() {
    this.entities.forEach(entity => {
      this.#initializeBackground(entity)
    })
  }

  #initializeBackground(entity) {
    const backgroundComponent = entity.getComponent(BackgroundComponent)

    if (backgroundComponent) {
      const background = backgroundComponent.view

      if (!this.#view.children.includes(background)) {
        this.#view.addChild(background)
      }
    }
  }
}
