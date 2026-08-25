import {SOKOBAN_DIRECTIONS, SOKOBAN_SYMBOLS} from './config.js'
import {SOKOBAN_SETTINGS} from './settings.js'

export default class SokobanLevel {
  #width = 0
  #height = 0
  #voids = new Set()
  #walls = new Set()
  #targets = new Set()
  #boxes = new Set()
  #playerPosition = null
  #isCompleted = false
  #initialState = null
  #history = []

  constructor(map) {
    this.#init(map)
  }

  get width() {
    return this.#width
  }

  get height() {
    return this.#height
  }

  get walls() {
    return this.#getPositions(this.#walls)
  }

  get targets() {
    return this.#getPositions(this.#targets)
  }

  get boxes() {
    return this.#getPositions(this.#boxes)
  }

  get playerPosition() {
    return {...this.#playerPosition}
  }

  get isCompleted() {
    return this.#isCompleted
  }

  get steps() {
    return this.#history.length
  }

  isWall(position) {
    return this.#walls.has(this.#getPositionKey(position))
  }

  isVoid(position) {
    return this.#voids.has(this.#getPositionKey(position))
  }

  isTarget(position) {
    return this.#targets.has(this.#getPositionKey(position))
  }

  move(direction) {
    const offset = SOKOBAN_DIRECTIONS[direction]
    if (!offset || this.#isCompleted) return {moved: false, completed: this.#isCompleted}

    const previousState = this.#createStateSnapshot()
    const nextPosition = this.#addPositions(this.#playerPosition, offset)
    if (this.#isWallOrOutside(nextPosition)) return {moved: false, completed: false}
    const boxMove = this.#tryMoveBox(nextPosition, offset)
    if (!boxMove.canMove) return {moved: false, completed: false}

    this.#history.push(previousState)
    this.#playerPosition = nextPosition
    this.#isCompleted = this.#checkCompleted()
    return {
      moved: true,
      completed: this.#isCompleted,
      deadlockedBox: this.#getDeadlockedBox(boxMove.pushedBox),
      pushedBox: boxMove.pushedBox,
    }
  }

  undo() {
    const previousState = this.#history.pop()
    if (!previousState) return false

    this.#restoreState(previousState)
    return true
  }

  restart() {
    if (this.#history.length === 0) return false

    this.#restoreState(this.#initialState)
    this.#history = []
    return true
  }

  #init(map) {
    this.#validateMap(map)
    this.#width = map[0].length
    this.#height = map.length
    this.#parseMap(map)
    this.#validateEntities()
    this.#isCompleted = this.#checkCompleted()
    this.#initialState = this.#createStateSnapshot()
  }

  #validateMap(map) {
    if (!Array.isArray(map) || map.length === 0) {
      throw new Error('Sokoban map must be a non-empty array')
    }

    const width = map[0]?.length
    if (!width || map.some((row) => typeof row !== 'string' || row.length !== width)) {
      throw new Error('Sokoban map rows must have equal length')
    }

    if (width > SOKOBAN_SETTINGS.maxBoardColumns || map.length > SOKOBAN_SETTINGS.maxBoardRows) {
      throw new Error('Sokoban map exceeds the maximum board size')
    }
  }

  #parseMap(map) {
    map.forEach((row, y) => {
      Array.from(row).forEach((symbol, x) => {
        this.#parseSymbol(symbol, {x, y})
      })
    })
  }

  #parseSymbol(symbol, position) {
    if (symbol === SOKOBAN_SYMBOLS.void) return this.#addPosition(this.#voids, position)
    if (symbol === SOKOBAN_SYMBOLS.floor) return
    if (symbol === SOKOBAN_SYMBOLS.wall) return this.#addPosition(this.#walls, position)
    if (symbol === SOKOBAN_SYMBOLS.target) return this.#addPosition(this.#targets, position)
    if (symbol === SOKOBAN_SYMBOLS.box) return this.#addPosition(this.#boxes, position)
    if (symbol === SOKOBAN_SYMBOLS.player) return this.#setPlayerPosition(position)

    if (symbol === SOKOBAN_SYMBOLS.boxOnTarget) {
      this.#addPosition(this.#targets, position)
      this.#addPosition(this.#boxes, position)
      return
    }

    if (symbol === SOKOBAN_SYMBOLS.playerOnTarget) {
      this.#addPosition(this.#targets, position)
      this.#setPlayerPosition(position)
      return
    }

    throw new Error('Unsupported Sokoban symbol: ' + symbol)
  }

  #validateEntities() {
    if (!this.#playerPosition) throw new Error('Sokoban level must contain one player')
    if (this.#boxes.size === 0) throw new Error('Sokoban level must contain at least one box')
    if (this.#boxes.size !== this.#targets.size) {
      throw new Error('Sokoban boxes count must match targets count')
    }
  }

  #setPlayerPosition(position) {
    if (this.#playerPosition) throw new Error('Sokoban level must contain only one player')
    this.#playerPosition = position
  }

  #tryMoveBox(position, offset) {
    const positionKey = this.#getPositionKey(position)
    if (!this.#boxes.has(positionKey)) return {canMove: true, pushedBox: null}

    const boxNextPosition = this.#addPositions(position, offset)
    if (this.#isBlocked(boxNextPosition)) return {canMove: false, pushedBox: null}

    this.#boxes.delete(positionKey)
    this.#boxes.add(this.#getPositionKey(boxNextPosition))
    return {
      canMove: true,
      pushedBox: {from: position, to: boxNextPosition},
    }
  }

  #isBlocked(position) {
    if (this.#isWallOrOutside(position)) return true
    return this.#boxes.has(this.#getPositionKey(position))
  }

  #isWallOrOutside(position) {
    if (!this.#isInside(position)) return true
    const positionKey = this.#getPositionKey(position)

    return this.#voids.has(positionKey) || this.#walls.has(positionKey)
  }

  #isInside(position) {
    return position.x >= 0 && position.y >= 0 && position.x < this.#width && position.y < this.#height
  }

  #checkCompleted() {
    return this.#boxes.size > 0 && Array.from(this.#boxes).every((positionKey) => this.#targets.has(positionKey))
  }

  #getDeadlockedBox(pushedBox) {
    if (!pushedBox || this.isTarget(pushedBox.to)) return null
    if (!this.#isStaticCorner(pushedBox.to)) return null

    return {...pushedBox.to}
  }

  #isStaticCorner(position) {
    const verticalBlocked = this.#isTerrainBlocked(this.#addPositions(position, SOKOBAN_DIRECTIONS.up))
      || this.#isTerrainBlocked(this.#addPositions(position, SOKOBAN_DIRECTIONS.down))
    const horizontalBlocked = this.#isTerrainBlocked(this.#addPositions(position, SOKOBAN_DIRECTIONS.left))
      || this.#isTerrainBlocked(this.#addPositions(position, SOKOBAN_DIRECTIONS.right))

    return verticalBlocked && horizontalBlocked
  }

  #isTerrainBlocked(position) {
    return this.#isWallOrOutside(position)
  }

  #createStateSnapshot() {
    return {
      boxes: new Set(this.#boxes),
      playerPosition: {...this.#playerPosition},
      isCompleted: this.#isCompleted,
    }
  }

  #restoreState(state) {
    this.#boxes = new Set(state.boxes)
    this.#playerPosition = {...state.playerPosition}
    this.#isCompleted = state.isCompleted
  }

  #addPosition(collection, position) {
    collection.add(this.#getPositionKey(position))
  }

  #getPositions(collection) {
    return Array.from(collection)
      .map((positionKey) => this.#parsePositionKey(positionKey))
      .sort((first, second) => first.y - second.y || first.x - second.x)
  }

  #getPositionKey(position) {
    return position.x + ':' + position.y
  }

  #parsePositionKey(positionKey) {
    const [x, y] = positionKey.split(':').map(Number)
    return {x, y}
  }

  #addPositions(first, second) {
    return {
      x: first.x + second.x,
      y: first.y + second.y,
    }
  }
}
