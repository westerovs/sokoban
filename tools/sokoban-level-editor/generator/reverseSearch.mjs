import {DIRECTIONS, getAdjacentIndex, randomInteger, shuffle, toPosition} from './grid.mjs'
import {getEligibleGoalPositions} from './topology.mjs'

/**
 * Ищет удалённые от решения состояния обратными вытягиваниями ящиков.
 */

// Возвращает клетки, доступные игроку без перемещения ящиков.
const getReachablePositions = (player, occupied, board) => {
  const visited = new Set([player])
  const queue = [player]
  for (let index = 0; index < queue.length; index++) {
    DIRECTIONS.forEach((direction) => {
      const next = getAdjacentIndex(queue[index], direction, board.width, board.height)
      if (next !== null && board.floors.has(next) && !occupied.has(next) && !visited.has(next)) {
        visited.add(next)
        queue.push(next)
      }
    })
  }
  return visited
}

// Возвращает ключ состояния ящиков и точной позиции игрока.
const createStateKey = (state) => {
  const boxes = state.boxes.map(({position}) => position).sort((first, second) => first - second)
  return `${boxes.join(',')}|${state.player}`
}

// Возвращает манхэттенское расстояние между двумя клетками.
const getDistance = (first, second, width) => {
  const firstPosition = toPosition(first, width)
  const secondPosition = toPosition(second, width)
  return Math.abs(firstPosition.x - secondPosition.x) + Math.abs(firstPosition.y - secondPosition.y)
}

// Считает соседние стены и границы вокруг клетки.
const countBlockedNeighbors = (position, board) => {
  return DIRECTIONS.filter((direction) => {
    const neighbor = getAdjacentIndex(position, direction, board.width, board.height)
    return neighbor === null || !board.floors.has(neighbor)
  }).length
}

// Оценивает клетку-кандидат для размещения цели.
const getGoalPositionScore = (position, selected, board) => {
  const wallScore = countBlockedNeighbors(position, board) * 5
  if (selected.length === 0) return wallScore
  const nearest = Math.min(...selected.map((goal) => getDistance(position, goal, board.width)))
  const spacingScore = 5 - Math.abs(nearest - 3)
  const neighborScore = selected.some((goal) => getDistance(position, goal, board.width) === 1) ? 4 : 0
  return wallScore + spacingScore + neighborScore
}

// Выбирает цели рядом с геометрическими ограничениями и друг с другом.
const selectGoals = (board, boxCount, random) => {
  let available = shuffle(getEligibleGoalPositions(board), random)
  const selected = []
  while (selected.length < boxCount && available.length > 0) {
    available.sort((first, second) => getGoalPositionScore(second, selected, board) - getGoalPositionScore(first, selected, board))
    const poolSize = Math.min(6, Math.max(1, Math.ceil(available.length * 0.16)))
    const [goal] = available.splice(randomInteger(random, 0, poolSize), 1)
    selected.push(goal)
  }
  return selected
}

// Выбирает начальную позицию игрока вне решённых ящиков.
const selectInitialPlayer = (board, goals, random) => {
  const blocked = new Set(goals)
  const positions = Array.from(board.floors).filter((position) => !blocked.has(position))
  return positions[randomInteger(random, 0, positions.length)]
}

// Создаёт начальное полностью решённое состояние.
const createSolvedState = (board, goals, random) => ({
  boxes: goals.map((position, id) => ({id, position})),
  player: selectInitialPlayer(board, goals, random),
  pulls: 0,
  boxLines: 0,
  boxChanges: 0,
  lastBoxId: null,
  lastDirection: null,
  movedBoxIds: new Set(),
})

// Создаёт следующее состояние после одного допустимого обратного вытягивания.
const createPullState = (state, boxIndex, direction, nextBoxPosition, nextPlayer) => {
  const box = state.boxes[boxIndex]
  const boxes = state.boxes.map((item, index) => (index === boxIndex ? {...item, position: nextBoxPosition} : item))
  const isNewLine = state.lastBoxId !== box.id || state.lastDirection !== direction.key
  const isBoxChange = state.lastBoxId !== null && state.lastBoxId !== box.id
  const movedBoxIds = new Set(state.movedBoxIds).add(box.id)
  return {
    boxes,
    player: nextPlayer,
    pulls: state.pulls + 1,
    boxLines: state.boxLines + Number(isNewLine),
    boxChanges: state.boxChanges + Number(isBoxChange),
    lastBoxId: box.id,
    lastDirection: direction.key,
    movedBoxIds,
  }
}

// Пытается вытянуть один ящик в указанном направлении.
const tryCreatePull = (state, boxIndex, direction, reachable, occupied, board) => {
  const boxPosition = state.boxes[boxIndex].position
  const nextBoxPosition = getAdjacentIndex(boxPosition, direction, board.width, board.height)
  const nextPlayer = getAdjacentIndex(boxPosition, direction, board.width, board.height, 2)
  if (nextBoxPosition === null || nextPlayer === null || !reachable.has(nextBoxPosition)) return null
  if (!board.floors.has(nextPlayer) || occupied.has(nextPlayer)) return null
  return createPullState(state, boxIndex, direction, nextBoxPosition, nextPlayer)
}

// Перечисляет все допустимые обратные вытягивания состояния.
const getPullStates = (state, board) => {
  const occupied = new Set(state.boxes.map(({position}) => position))
  const reachable = getReachablePositions(state.player, occupied, board)
  return state.boxes.flatMap((_, boxIndex) => {
    return DIRECTIONS.flatMap((direction) => {
      const next = tryCreatePull(state, boxIndex, direction, reachable, occupied, board)
      return next ? [next] : []
    })
  })
}

// Считает суммарное удаление ящиков от исходных целей.
const getGoalDistance = (state, goals, board) => {
  return state.boxes.reduce((total, box) => total + getDistance(box.position, goals[box.id], board.width), 0)
}

// Оценивает глубину, смены направлений и взаимодействие нескольких ящиков.
const getReverseScore = (state, goals, board) => {
  const distance = getGoalDistance(state, goals, board)
  return state.boxLines * 12 + state.boxChanges * 9 + state.movedBoxIds.size * 16 + distance * 2 + state.pulls
}

// Возвращает размер луча с поправкой на большое количество ящиков.
const getBeamWidth = (config, boxCount) => {
  const scale = Math.sqrt(4 / Math.max(4, boxCount))
  return Math.max(6, Math.round(config.beamWidth * scale))
}

// Возвращает глубину обратного поиска для выбранной сложности.
const getPullLimit = (config, boxCount, floorCount) => {
  const desired = boxCount * config.pullsPerBox + Math.round(Math.sqrt(floorCount))
  return Math.min(240, Math.max(10, desired))
}

// Отбирает лучшие уникальные состояния следующей глубины.
const selectFrontier = (states, goals, board, config, boxCount, random) => {
  const scored = states.map((state) => ({state, rank: getReverseScore(state, goals, board) + random() * 18}))
  scored.sort((first, second) => second.rank - first.rank)
  return scored.slice(0, getBeamWidth(config, boxCount)).map(({state}) => state)
}

// Выполняет ограниченный лучевой поиск назад от решённой позиции.
const searchFromGoals = (board, goals, config, random) => {
  const initial = createSolvedState(board, goals, random)
  const visited = new Set([createStateKey(initial)])
  const candidates = []
  let frontier = [initial]
  const pullLimit = getPullLimit(config, goals.length, board.floors.size)
  for (let depth = 0; depth < pullLimit && frontier.length > 0; depth++) {
    const nextStates = frontier.flatMap((state) => getPullStates(state, board))
    const uniqueStates = nextStates.filter((state) => {
      const key = createStateKey(state)
      if (visited.has(key)) return false
      visited.add(key)
      return true
    })
    frontier = selectFrontier(uniqueStates, goals, board, config, goals.length, random)
    candidates.push(...frontier)
  }
  return candidates
}

// Проверяет, что в задаче участвует достаточная доля ящиков.
const hasEnoughMovedBoxes = (candidate, boxCount, config) => {
  return candidate.state.movedBoxIds.size >= Math.ceil(boxCount * config.movedBoxRatio)
}

// Оборачивает состояние метаданными целей и обратной оценки.
const createCandidate = (state, goals, board) => ({state, goals, reverseScore: getReverseScore(state, goals, board)})

// Подбирает несколько удалённых решаемых состояний для последующей оценки решателем.
const createReverseCandidates = (board, boxCount, config, random) => {
  const attemptScale = Math.sqrt(4 / Math.max(4, boxCount))
  const attempts = Math.max(3, Math.round(config.placementAttempts * attemptScale))
  const candidates = []
  for (let attempt = 0; attempt < attempts; attempt++) {
    const goals = selectGoals(board, boxCount, random)
    if (goals.length !== boxCount) continue
    const states = searchFromGoals(board, goals, config, random)
    candidates.push(...states.map((state) => createCandidate(state, goals, board)))
  }
  const suitable = candidates.filter((candidate) => hasEnoughMovedBoxes(candidate, boxCount, config))
  const pool = suitable.length > 0 ? suitable : candidates
  return pool.sort((first, second) => second.reverseScore - first.reverseScore).slice(0, config.candidateCount * 3)
}

export {
  createReverseCandidates, // Кандидаты, гарантированно достижимые из решения
}
