/**
 * Проверяет решаемость карты Sokoban поиском по состояниям толчков.
 */

const DIRECTIONS = Object.freeze([
  {x: 0, y: -1},
  {x: 1, y: 0},
  {x: 0, y: 1},
  {x: -1, y: 0},
])

const DEFAULT_SOLVER_LIMITS = Object.freeze({
  maxStates: 150000, // Максимальное количество исследуемых состояний
  maxDurationMs: 4000, // Максимальная длительность поиска решения в миллисекундах
})

// Выполняет отдельную операцию `toIndex`.
const toIndex = (x, y, width) => y * width + x

// Выполняет отдельную операцию `toPosition`.
const toPosition = (index, width) => ({x: index % width, y: Math.floor(index / width)})

// Возвращает данные, за которые отвечает операция `getAdjacentIndex`.
const getAdjacentIndex = (index, direction, width, height) => {
  const position = toPosition(index, width)
  const x = position.x + direction.x
  const y = position.y + direction.y
  if (x < 0 || y < 0 || x >= width || y >= height) return null
  return toIndex(x, y, width)
}

// Разбирает входные данные через операцию `parseMap`.
const parseMap = (map) => {
  const width = map[0].length
  const passable = new Set()
  const boxes = new Set()
  const targets = new Set()
  let player = null

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
const getReachable = (player, boxes, board) => {
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
const createStateKey = (player, boxes, board) => {
  const reachableAnchor = Math.min(...getReachable(player, boxes, board))
  return `${Array.from(boxes)
    .sort((first, second) => first - second)
    .join(',')}|${reachableAnchor}`
}

// Проверяет условие, описанное операцией `isSolved`.
const isSolved = (boxes, targets) => {
  return boxes.size > 0 && Array.from(boxes).every((box) => targets.has(box))
}

// Проверяет условие, описанное операцией `isStaticCorner`.
const isStaticCorner = (index, board) => {
  const blocked = DIRECTIONS.map((direction) => {
    const neighbor = getAdjacentIndex(index, direction, board.width, board.height)
    return neighbor === null || !board.passable.has(neighbor)
  })
  return (blocked[0] || blocked[2]) && (blocked[1] || blocked[3])
}

// Создаёт данные или представление для операции `createPush`.
const createPush = (box, direction, reachable, boxes, board) => {
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
const getNextStates = (state, board) => {
  const reachable = getReachable(state.player, state.boxes, board)
  return Array.from(state.boxes).flatMap((box) => {
    return DIRECTIONS.flatMap((direction) => {
      const push = createPush(box, direction, reachable, state.boxes, board)
      return push ? [{...push, pushes: state.pushes + 1}] : []
    })
  })
}

// Создаёт данные или представление для операции `createLimitResult`.
const createLimitResult = (explored, startedAt, limits) => {
  const reason = explored >= limits.maxStates ? 'state-limit' : 'time-limit'
  return {status: 'limit', reason, explored, durationMs: Date.now() - startedAt}
}

// Ищет решение карты в пределах заданных ограничений.
const solveSokoban = (map, options = {}) => {
  const limits = {...DEFAULT_SOLVER_LIMITS, ...options}
  const board = parseMap(map)
  const initial = {player: board.player, boxes: board.boxes, pushes: 0}
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
