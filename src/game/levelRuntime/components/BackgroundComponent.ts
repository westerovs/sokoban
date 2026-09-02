import {Sprite, Texture} from 'pixi.js'
import {WORLD} from '../../gameConfig/constants.js'
import type Entity from '../entities/Entity.js'

// Представляет фоновый спрайт уровня как компонент сущности.

export default class BackgroundComponent extends Sprite {
  #view = this

  // Создаёт и размещает фон по размерам игрового мира.
  constructor(_entity: Entity, textureName: string) {
    super({texture: Texture.from(textureName), label: 'level-background'})
    this.anchor.set(0.5)
    this.position.set(WORLD.HALF_W, WORLD.HALF_H)
    this.height = WORLD.HEIGHT
  }

  // Возвращает отображаемый объект компонента.
  get view() {
    return this.#view
  }
}
