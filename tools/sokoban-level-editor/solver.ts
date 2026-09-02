/**
 * Проверяет решаемость карты Sokoban поиском по состояниям толчков.
 */

type Direction = {
  x: number
  y: number
}

type SolverBoard = {
  width: number
  height: number
  passable: Set<number>
  boxes: Set<number>
  targets: Set<number>
  player: number | null
}

type SolverState = {
  player: number
  boxes: Set<number>
  pushes: number
}

type SolverOptions = {
  maxStates?: number
  maxDurationMs?: number
}

type SolverLimits = Required<SolverOptions>

type SolverResult =
  | {status: 'solved'; pushes: number; explored: number}
  | {status: 'unsolved'; explored: number; durationMs: number}
  | {status: 'limit'; reason: string; explored: number; durationMs: number}

const DIRECTIONS = Object.freeze([
  {x: 0, y: -1},
  {x: 1, y: 0},
  {x: 0, y: 1},
  {x: -1, y: 0},
]) // Направления перемещения игрока и ящиков

const DEFAULT_SOLVER_LIMITS = Object.freeze({
  maxStates: 150000, // Максимальное количество исследуемых состояний
  maxDurationMs: 4000, // Максимальная длительность поиска решения в миллисекундах
})

// Выполняет отдельную операцию `toIndex`.
const toIndex = (x: number, y: number, width: number) => y * width + x

// Выполняет отдельную операцию `toPosition`.
const toPosition = (index: number, width: number) => ({x: index % width, y: Math.floor(index / width)})

// Возвращает данные, за которые отвечает операция `getAdjacentIndex`.
const getAdjacentIndex = (index: number, direction: Direction, width: number, height: number) => {
  const position = toPosition(index, width)
  const x = position.x + direction.x
  const y = position.y + direction.y
  if (x < 0 || y < 0 || x >= width || y >= height) return null
  return toIndex(x, y, width)
}

// Разбирает входные данные через операцию `parseMap`.
const parseMap = (map: string[]): SolverBoard => {
  const width = map[0].length
  const passable = new Set<number>()
  const boxes = new Set<number>()
  const targets = new Set<number>()
  let player: number | null = null

  map.forEach((row, y) => {
    Array.from(row).forEach((symbol, x) => {
      const index = toIndex(x, y, width)
      if (!'_#'.includes(symbol)) passable.add(index)
      if ('$-'.includes(symbol)) boxes.add(index)
      if ('.-*'.includes(symbol)) targets.add(index)
      if ('@*'.includes(symbol)) player = index
    })
  })
  return {width, height: map.length, passable, boxes, targets, player}
}

// Возвращает данные, за которые отвечает операция `getReachable`.
const getReachable = (player: number, boxes: Set<number>, board: SolverBoard) => {
  const visited = new Set([player])
  const queue = [player]
  for (let index = 0; index < queue.length; index++) {
    DIRECTIONS.forEach((direction) => {
      const next = getAdjacentIndex(queue[index], direction, board.width, board.height)
      if (next !== null && board.passable.has(next) && !boxes.has(next) && !visited.has(next)) {
        visited.add(next)
        queue.push(next)
      }
    })
  }
  return visited
}

// Создаёт данные или представление для операции `createStateKey`.
const createStateKey = (player: number, boxes: Set<number>, board: SolverBoard) => {
  const reachableAnchor = Math.min(...getReachable(player, boxes, board))
  return `${Array.from(boxes)
    .sort((first, second) => first - second)
    .join(',')}|${reachableAnchor}`
}

// Проверяет условие, описанное операцией `isSolved`.
const isSolved = (boxes: Set<number>, targets: Set<number>) => {
  return boxes.size > 0 && Array.from(boxes).every((box) => targets.has(box))
}

// Проверяет условие, описанное операцией `isStaticCorner`.
const isStaticCorner = (index: number, board: SolverBoard) => {
  const blocked = DIRECTIONS.map((direction) => {
    const neighbor = getAdjacentIndex(index, direction, board.width, board.height)
    return neighbor === null || !board.passable.has(neighbor)
  })
  return (blocked[0] || blocked[2]) && (blocked[1] || blocked[3])
}

// Создаёт данные или представление для операции `createPush`.
const createPush = (box: number, direction: Direction, reachable: Set<number>, boxes: Set<number>, board: SolverBoard) => {
  const destination = getAdjacentIndex(box, direction, board.width, board.height)
  const behindDirection = {x: -direction.x, y: -direction.y}
  const behind = getAdjacentIndex(box, behindDirection, board.width, board.height)
  if (destination === null || behind === null || !reachable.has(behind)) return null
  if (!board.passable.has(destination) || boxes.has(destination)) return null

  const nextBoxes = new Set(boxes)
  nextBoxes.delete(box)
  nextBoxes.add(destination)
  if (!board.targets.has(destination) && isStaticCorner(destination, board)) return null
  return {player: box, boxes: nextBoxes}
}

// Возвращает данные, за которые отвечает операция `getNextStates`.
const getNextStates = (state: SolverState, board: SolverBoard): SolverState[] => {
  const reachable = getReachable(state.player, state.boxes, board)
  return Array.from(state.boxes).flatMap((box) => {
    return DIRECTIONS.flatMap((direction) => {
      const push = createPush(box, direction, reachable, state.boxes, board)
      return push ? [{...push, pushes: state.pushes + 1}] : []
    })
  })
}

// Создаёт данные или представление для операции `createLimitResult`.
const createLimitResult = (explored: number, startedAt: number, limits: SolverLimits): SolverResult => {
  const reason = explored >= limits.maxStates ? 'state-limit' : 'time-limit'
  return {status: 'limit', reason, explored, durationMs: Date.now() - startedAt}
}

// Ищет решение карты в пределах заданных ограничений.
const solveSokoban = (map: string[], options: SolverOptions = {}): SolverResult => {
  const limits = {...DEFAULT_SOLVER_LIMITS, ...options}
  const board = parseMap(map)
  const initial: SolverState = {player: board.player as number, boxes: board.boxes, pushes: 0}
  const queue = [initial]
  const visited = new Set([createStateKey(initial.player, initial.boxes, board)])
  const startedAt = Date.now()

  for (let index = 0; index < queue.length; index++) {
    const state = queue[index]
    if (isSolved(state.boxes, board.targets)) return {status: 'solved', pushes: state.pushes, explored: visited.size}
    if (visited.size >= limits.maxStates || Date.now() - startedAt >= limits.maxDurationMs) {
      return createLimitResult(visited.size, startedAt, limits)
    }
    getNextStates(state, board).forEach((nextState) => {
      const key = createStateKey(nextState.player, nextState.boxes, board)
      if (visited.has(key)) return
      visited.add(key)
      queue.push(nextState)
    })
  }
  return {status: 'unsolved', explored: visited.size, durationMs: Date.now() - startedAt}
}

export {
  solveSokoban, // Поиск минимального числа толчков
}

export type {SolverOptions, SolverResult}
