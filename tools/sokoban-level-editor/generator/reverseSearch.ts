import {DIRECTIONS, getAdjacentIndex, randomInteger, shuffle, toPosition, type Direction, type Random} from './grid.js'
import {getEligibleGoalPositions, type TopologyBoard} from './topology.js'

/**
 * Ищет удалённые от решения состояния обратными вытягиваниями ящиков.
 */

type ReverseBox = {
  id: number
  position: number
}

type ReverseState = {
  boxes: ReverseBox[]
  player: number
  pulls: number
  boxLines: number
  boxChanges: number
  lastBoxId: number | null
  lastDirection: string | null
  movedBoxIds: Set<number>
}

type ReverseCandidate = {
  state: ReverseState
  goals: number[]
  reverseScore: number
}

type ReverseConfig = {
  beamWidth: number
  pullsPerBox: number
  movedBoxRatio: number
  placementAttempts: number
  candidateCount: number
}

// Возвращает клетки, доступные игроку без перемещения ящиков.
const getReachablePositions = (player: number, occupied: Set<number>, board: TopologyBoard) => {
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
const createStateKey = (state: ReverseState) => {
  const boxes = state.boxes.map(({position}) => position).sort((first, second) => first - second)
  return `${boxes.join(',')}|${state.player}`
}

// Возвращает манхэттенское расстояние между двумя клетками.
const getDistance = (first: number, second: number, width: number) => {
  const firstPosition = toPosition(first, width)
  const secondPosition = toPosition(second, width)
  return Math.abs(firstPosition.x - secondPosition.x) + Math.abs(firstPosition.y - secondPosition.y)
}

// Считает соседние стены и границы вокруг клетки.
const countBlockedNeighbors = (position: number, board: TopologyBoard) => {
  return DIRECTIONS.filter((direction) => {
    const neighbor = getAdjacentIndex(position, direction, board.width, board.height)
    return neighbor === null || !board.floors.has(neighbor)
  }).length
}

// Оценивает клетку-кандидат для размещения цели.
const getGoalPositionScore = (position: number, selected: number[], board: TopologyBoard) => {
  const wallScore = countBlockedNeighbors(position, board) * 5
  if (selected.length === 0) return wallScore
  const nearest = Math.min(...selected.map((goal) => getDistance(position, goal, board.width)))
  const spacingScore = 5 - Math.abs(nearest - 3)
  const neighborScore = selected.some((goal) => getDistance(position, goal, board.width) === 1) ? 4 : 0
  return wallScore + spacingScore + neighborScore
}

// Выбирает цели рядом с геометрическими ограничениями и друг с другом.
const selectGoals = (board: TopologyBoard, boxCount: number, random: Random) => {
  let available = shuffle(getEligibleGoalPositions(board), random)
  const selected: number[] = []
  while (selected.length < boxCount && available.length > 0) {
    available.sort((first, second) => getGoalPositionScore(second, selected, board) - getGoalPositionScore(first, selected, board))
    const poolSize = Math.min(6, Math.max(1, Math.ceil(available.length * 0.16)))
    const [goal] = available.splice(randomInteger(random, 0, poolSize), 1)
    selected.push(goal)
  }
  return selected
}

// Выбирает начальную позицию игрока вне решённых ящиков.
const selectInitialPlayer = (board: TopologyBoard, goals: number[], random: Random) => {
  const blocked = new Set(goals)
  const positions = Array.from(board.floors).filter((position) => !blocked.has(position))
  return positions[randomInteger(random, 0, positions.length)]
}

// Создаёт начальное полностью решённое состояние.
const createSolvedState = (board: TopologyBoard, goals: number[], random: Random): ReverseState => ({
  boxes: goals.map((position, id) => ({id, position})),
  player: selectInitialPlayer(board, goals, random),
  pulls: 0,
  boxLines: 0,
  boxChanges: 0,
  lastBoxId: null,
  lastDirection: null,
  movedBoxIds: new Set<number>(),
})

// Создаёт следующее состояние после одного допустимого обратного вытягивания.
const createPullState = (
  state: ReverseState,
  boxIndex: number,
  direction: Direction,
  nextBoxPosition: number,
  nextPlayer: number,
): ReverseState => {
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
const tryCreatePull = (
  state: ReverseState,
  boxIndex: number,
  direction: Direction,
  reachable: Set<number>,
  occupied: Set<number>,
  board: TopologyBoard,
) => {
  const boxPosition = state.boxes[boxIndex].position
  const nextBoxPosition = getAdjacentIndex(boxPosition, direction, board.width, board.height)
  const nextPlayer = getAdjacentIndex(boxPosition, direction, board.width, board.height, 2)
  if (nextBoxPosition === null || nextPlayer === null || !reachable.has(nextBoxPosition)) return null
  if (!board.floors.has(nextPlayer) || occupied.has(nextPlayer)) return null
  return createPullState(state, boxIndex, direction, nextBoxPosition, nextPlayer)
}

// Перечисляет все допустимые обратные вытягивания состояния.
const getPullStates = (state: ReverseState, board: TopologyBoard): ReverseState[] => {
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
const getGoalDistance = (state: ReverseState, goals: number[], board: TopologyBoard) => {
  return state.boxes.reduce((total, box) => total + getDistance(box.position, goals[box.id], board.width), 0)
}

// Оценивает глубину, смены направлений и взаимодействие нескольких ящиков.
const getReverseScore = (state: ReverseState, goals: number[], board: TopologyBoard) => {
  const distance = getGoalDistance(state, goals, board)
  return state.boxLines * 12 + state.boxChanges * 9 + state.movedBoxIds.size * 16 + distance * 2 + state.pulls
}

// Возвращает размер луча с поправкой на большое количество ящиков.
const getBeamWidth = (config: ReverseConfig, boxCount: number) => {
  const scale = Math.sqrt(4 / Math.max(4, boxCount))
  return Math.max(6, Math.round(config.beamWidth * scale))
}

// Возвращает глубину обратного поиска для выбранной сложности.
const getPullLimit = (config: ReverseConfig, boxCount: number, floorCount: number) => {
  const desired = boxCount * config.pullsPerBox + Math.round(Math.sqrt(floorCount))
  return Math.min(240, Math.max(10, desired))
}

// Отбирает лучшие уникальные состояния следующей глубины.
const selectFrontier = (
  states: ReverseState[],
  goals: number[],
  board: TopologyBoard,
  config: ReverseConfig,
  boxCount: number,
  random: Random,
) => {
  const scored = states.map((state) => ({state, rank: getReverseScore(state, goals, board) + random() * 18}))
  scored.sort((first, second) => second.rank - first.rank)
  return scored.slice(0, getBeamWidth(config, boxCount)).map(({state}) => state)
}

// Выполняет ограниченный лучевой поиск назад от решённой позиции.
const searchFromGoals = (board: TopologyBoard, goals: number[], config: ReverseConfig, random: Random) => {
  const initial = createSolvedState(board, goals, random)
  const visited = new Set([createStateKey(initial)])
  const candidates: ReverseState[] = []
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
const hasEnoughMovedBoxes = (candidate: ReverseCandidate, boxCount: number, config: ReverseConfig) => {
  return candidate.state.movedBoxIds.size >= Math.ceil(boxCount * config.movedBoxRatio)
}

// Оборачивает состояние метаданными целей и обратной оценки.
const createCandidate = (state: ReverseState, goals: number[], board: TopologyBoard): ReverseCandidate => ({
  state,
  goals,
  reverseScore: getReverseScore(state, goals, board),
})

// Подбирает несколько удалённых решаемых состояний для последующей оценки решателем.
const createReverseCandidates = (board: TopologyBoard, boxCount: number, config: ReverseConfig, random: Random) => {
  const attemptScale = Math.sqrt(4 / Math.max(4, boxCount))
  const attempts = Math.max(3, Math.round(config.placementAttempts * attemptScale))
  const candidates: ReverseCandidate[] = []
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

export type {
  ReverseCandidate,
  ReverseConfig,
  ReverseState,
}
