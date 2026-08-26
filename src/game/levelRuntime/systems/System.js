export default class System {
  constructor() {
    this.entities = new Set()
  }

  addEntity(entity) {
    this.entities.add(entity)
  }

  removeEntity(entity) {
    this.entities.delete(entity)
  }

  init() {
    throw new Error('System update method not implemented')
  }
}
