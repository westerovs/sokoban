import type {SokobanDirection, SokobanDirectionName} from '../config/config.js'
import {SOKOBAN_DIRECTIONS, SOKOBAN_SYMBOLS} from '../config/config.js'
import {SOKOBAN_SETTINGS} from '../config/settings.js'

/**
 * Хранит игровое состояние уровня и применяет правила перемещения Sokoban.
 */

type SokobanPosition = {
  x: number
  y: number
}

type SokobanBox = SokobanPosition & {
  id: string
}

type PushedBox = {
  id: string
  from: SokobanPosition
  to: SokobanPosition
}

type SokobanMoveResult = {
  moved: boolean
  completed: boolean
  deadlockedBox?: SokobanPosition | null
  pushedBox?: PushedBox | null
}

type BoxMoveResult = {
  canMove: boolean
  pushedBox: PushedBox | null
}

type LevelState = {
  boxes: Map<string, string>
  playerPosition: SokobanPosition
  isCompleted: boolean
}

export default class SokobanLevel {
  #width = 0
  #height = 0
  #voids = new Set<string>()
  #walls = new Set<string>()
  #targets = new Set<string>()
  #boxes = new Map<string, string>()
  #nextBoxId = 0
  #playerPosition: SokobanPosition | null = null
  #isCompleted = false
  #initialState!: LevelState
  #history: LevelState[] = []

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(map: string[]) {
    this.#init(map)
  }

  // Возвращает значение свойства `width`.
  get width() {
    return this.#width
  }

  // Возвращает значение свойства `height`.
  get height() {
    return this.#height
  }

  // Возвращает значение свойства `walls`.
  get walls() {
    return this.#getPositions(this.#walls)
  }

  // Возвращает значение свойства `targets`.
  get targets() {
    return this.#getPositions(this.#targets)
  }

  // Возвращает значение свойства `boxes`.
  get boxes() {
    return Array.from(this.#boxes, ([id, positionKey]) => ({id, ...this.#parsePositionKey(positionKey)}))
  }

  // Возвращает значение свойства `playerPosition`.
  get playerPosition() {
    return {...this.#playerPosition!}
  }

  // Возвращает значение свойства `isCompleted`.
  get isCompleted() {
    return this.#isCompleted
  }

  // Возвращает значение свойства `steps`.
  get steps() {
    return this.#history.length
  }

  // Проверяет, является ли клетка стеной.
  isWall(position: SokobanPosition) {
    return this.#walls.has(this.#getPositionKey(position))
  }

  // Проверяет, находится ли клетка вне игрового поля.
  isVoid(position: SokobanPosition) {
    return this.#voids.has(this.#getPositionKey(position))
  }

  // Проверяет, является ли клетка целью.
  isTarget(position: SokobanPosition) {
    return this.#targets.has(this.#getPositionKey(position))
  }

  // Пытается выполнить перемещение в заданном направлении.
  move(direction: SokobanDirectionName): SokobanMoveResult {
    const offset = SOKOBAN_DIRECTIONS[direction]
    if (!offset || this.#isCompleted) return {moved: false, completed: this.#isCompleted}

    const previousState = this.#createStateSnapshot()
    const nextPosition = this.#addPositions(this.#playerPosition!, offset)
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

  // Возвращает состояние на один шаг назад.
  undo() {
    const previousState = this.#history.pop()
    if (!previousState) return false

    this.#restoreState(previousState)
    return true
  }

  // Возвращает уровень в исходное состояние.
  restart() {
    if (this.#history.length === 0) return false

    this.#restoreState(this.#initialState)
    this.#history = []
    return true
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init(map: string[]) {
    this.#validateMap(map)
    this.#width = map[0].length
    this.#height = map.length
    this.#parseMap(map)
    this.#validateEntities()
    this.#isCompleted = this.#checkCompleted()
    this.#initialState = this.#createStateSnapshot()
  }

  // Проверяет размеры и прямоугольную форму карты.
  #validateMap(map: string[]) {
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

  // Разбирает все строки карты во внутреннее состояние уровня.
  #parseMap(map: string[]) {
    map.forEach((row, y) => {
      Array.from(row).forEach((symbol, x) => {
        this.#parseSymbol(symbol, {x, y})
      })
    })
  }

  // Добавляет один символ карты в соответствующую коллекцию.
  #parseSymbol(symbol: string, position: SokobanPosition) {
    if (symbol === SOKOBAN_SYMBOLS.void) return this.#addPosition(this.#voids, position)
    if (symbol === SOKOBAN_SYMBOLS.floor) return
    if (symbol === SOKOBAN_SYMBOLS.wall) return this.#addPosition(this.#walls, position)
    if (symbol === SOKOBAN_SYMBOLS.target) return this.#addPosition(this.#targets, position)
    if (symbol === SOKOBAN_SYMBOLS.box) return this.#addBox(position)
    if (symbol === SOKOBAN_SYMBOLS.player) return this.#setPlayerPosition(position)

    if (symbol === SOKOBAN_SYMBOLS.boxOnTarget) {
      this.#addPosition(this.#targets, position)
      this.#addBox(position)
      return
    }

    if (symbol === SOKOBAN_SYMBOLS.playerOnTarget) {
      this.#addPosition(this.#targets, position)
      this.#setPlayerPosition(position)
      return
    }

    throw new Error('Unsupported Sokoban symbol: ' + symbol)
  }

  // Проверяет количество игрока, ящиков и целей.
  #validateEntities() {
    if (!this.#playerPosition) throw new Error('Sokoban level must contain one player')
    if (this.#boxes.size === 0) throw new Error('Sokoban level must contain at least one box')
    if (this.#boxes.size !== this.#targets.size) {
      throw new Error('Sokoban boxes count must match targets count')
    }
  }

  // Сохраняет новую позицию игрока.
  #setPlayerPosition(position: SokobanPosition) {
    if (this.#playerPosition) throw new Error('Sokoban level must contain only one player')
    this.#playerPosition = position
  }

  // Пытается передвинуть ящик и возвращает результат толчка.
  #tryMoveBox(position: SokobanPosition, offset: SokobanDirection): BoxMoveResult {
    const positionKey = this.#getPositionKey(position)
    const boxId = this.#getBoxIdAt(positionKey)
    if (!boxId) return {canMove: true, pushedBox: null}

    const boxNextPosition = this.#addPositions(position, offset)
    if (this.#isBlocked(boxNextPosition)) return {canMove: false, pushedBox: null}

    this.#boxes.set(boxId, this.#getPositionKey(boxNextPosition))
    return {
      canMove: true,
      pushedBox: {id: boxId, from: position, to: boxNextPosition},
    }
  }

  // Проверяет, занята ли клетка стеной или ящиком.
  #isBlocked(position: SokobanPosition) {
    if (this.#isWallOrOutside(position)) return true
    return Boolean(this.#getBoxIdAt(this.#getPositionKey(position)))
  }

  // Проверяет, является ли клетка стеной или находится за картой.
  #isWallOrOutside(position: SokobanPosition) {
    if (!this.#isInside(position)) return true
    const positionKey = this.#getPositionKey(position)

    return this.#voids.has(positionKey) || this.#walls.has(positionKey)
  }

  // Проверяет, находится ли координата внутри карты.
  #isInside(position: SokobanPosition) {
    return position.x >= 0 && position.y >= 0 && position.x < this.#width && position.y < this.#height
  }

  // Обновляет признак завершения по положению всех ящиков.
  #checkCompleted() {
    return this.#boxes.size > 0 && Array.from(this.#boxes.values()).every((positionKey) => this.#targets.has(positionKey))
  }

  // Возвращает ящик, попавший после толчка в статический тупик.
  #getDeadlockedBox(pushedBox: PushedBox | null) {
    if (!pushedBox || this.isTarget(pushedBox.to)) return null
    if (!this.#isStaticCorner(pushedBox.to)) return null

    return {...pushedBox.to}
  }

  // Проверяет, является ли клетка статическим угловым тупиком.
  #isStaticCorner(position: SokobanPosition) {
    const verticalBlocked =
      this.#isTerrainBlocked(this.#addPositions(position, SOKOBAN_DIRECTIONS.up)) ||
      this.#isTerrainBlocked(this.#addPositions(position, SOKOBAN_DIRECTIONS.down))
    const horizontalBlocked =
      this.#isTerrainBlocked(this.#addPositions(position, SOKOBAN_DIRECTIONS.left)) ||
      this.#isTerrainBlocked(this.#addPositions(position, SOKOBAN_DIRECTIONS.right))

    return verticalBlocked && horizontalBlocked
  }

  // Проверяет, блокирует ли рельеф соседнюю клетку.
  #isTerrainBlocked(position: SokobanPosition) {
    return this.#isWallOrOutside(position)
  }

  // Создаёт снимок изменяемого состояния уровня.
  #createStateSnapshot() {
    return {
      boxes: new Map(this.#boxes),
      playerPosition: {...this.#playerPosition!},
      isCompleted: this.#isCompleted,
    }
  }

  // Восстанавливает модель уровня из снимка состояния.
  #restoreState(state: LevelState) {
    this.#boxes = new Map(state.boxes)
    this.#playerPosition = {...state.playerPosition}
    this.#isCompleted = state.isCompleted
  }

  // Добавляет координату в коллекцию в строковом формате.
  #addPosition(collection: Set<string>, position: SokobanPosition) {
    collection.add(this.#getPositionKey(position))
  }

  // Добавляет ящик в модель и назначает ему уникальный идентификатор.
  #addBox(position: SokobanPosition) {
    const boxId = `box-${this.#nextBoxId}`
    this.#nextBoxId++
    this.#boxes.set(boxId, this.#getPositionKey(position))
  }

  // Возвращает идентификатор ящика в заданной клетке.
  #getBoxIdAt(positionKey: string) {
    return Array.from(this.#boxes).find(([, boxPositionKey]) => boxPositionKey === positionKey)?.[0] ?? null
  }

  // Возвращает координаты из коллекции строковых ключей.
  #getPositions(collection: Set<string>): SokobanPosition[] {
    return Array.from(collection)
      .map((positionKey) => this.#parsePositionKey(positionKey))
      .sort((first, second) => first.y - second.y || first.x - second.x)
  }

  // Преобразует координату клетки в строковый ключ.
  #getPositionKey(position: SokobanPosition) {
    return position.x + ':' + position.y
  }

  // Преобразует строковый ключ обратно в координату.
  #parsePositionKey(positionKey: string): SokobanPosition {
    const [x, y] = positionKey.split(':').map(Number)
    return {x, y}
  }

  // Складывает две координаты клеток.
  #addPositions(first: SokobanPosition, second: SokobanPosition): SokobanPosition {
    return {
      x: first.x + second.x,
      y: first.y + second.y,
    }
  }
}

export type {PushedBox, SokobanBox, SokobanMoveResult, SokobanPosition}
