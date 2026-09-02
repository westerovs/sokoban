// Хранит набор компонентов одной игровой сущности.

type ComponentConstructor<T> = {
  name: string
  prototype: T
}

export default class Entity {
  readonly id: string
  readonly components = new Map<string, object>()

  // Создаёт сущность с уникальным идентификатором.
  constructor(id: string) {
    this.id = id
  }

  // Добавляет компонент по имени его класса.
  addComponent(component: object) {
    this.components.set(component.constructor.name, component)
  }

  // Возвращает компонент указанного класса.
  getComponent<T extends object>(componentClass: ComponentConstructor<T>) {
    return this.components.get(componentClass.name) as T | undefined
  }

  // Проверяет наличие компонента указанного класса.
  hasComponent<T extends object>(componentClass: ComponentConstructor<T>) {
    return this.components.has(componentClass.name)
  }
}
