import {SOKOBAN_SETTINGS} from '../../../src/game/sokoban/config/settings.js'
import {solveSokoban} from '../solver.mjs'
import {DIFFICULTY_CONFIG, normalizeGeneratorOptions} from './config.mjs'
import {createRandom} from './grid.mjs'
import {createReverseCandidates} from './reverseSearch.mjs'
import {
  createGeneratedTopology,
  createTopologyBoard,
  getMaximumBoxCount,
  getRecommendedBoxCount,
  isTopologyConnected,
  normalizeTopology,
} from './topology.mjs'

/**
 * Создаёт решаемый уровень, отбирая лучшие обратные состояния на новой или сохранённой геометрии.
 */

const STRUCTURE_ATTEMPTS = 8 // Число попыток создать подходящую новую геометрию

// Возвращает случайное 32-битное зерно или нормализует переданное.
const resolveSeed = (seed) => {
  const parsed = Number(seed)
  if (Number.isInteger(parsed)) return parsed >>> 0
  return Math.floor(Math.random() * 4294967296) >>> 0
}

// Проверяет размеры структуры с учётом ограничений игрового поля.
const validateTopologyDimensions = (topology) => {
  const width = topology[0].length
  const height = topology.length
  if (width > SOKOBAN_SETTINGS.maxBoardColumns || height > SOKOBAN_SETTINGS.maxBoardRows) {
    throw new Error(`Максимальный размер структуры — ${SOKOBAN_SETTINGS.maxBoardColumns}×${SOKOBAN_SETTINGS.maxBoardRows}`)
  }
  if (width < 3 || height < 3) throw new Error('Структура слишком мала для генерации')
}

// Определяет количество ящиков для текущей структуры.
const resolveBoxCount = (requestedBoxCount, board, config) => {
  const maximum = getMaximumBoxCount(board)
  const boxCount = requestedBoxCount ?? getRecommendedBoxCount(board, config)
  if (boxCount > maximum) throw new Error(`В этой структуре можно разместить не более ${maximum} ящиков`)
  return {boxCount, maximum}
}

// Собирает игровой символ одной клетки из структуры, целей и объектов.
const getMapSymbol = (index, board, targets, boxes, player) => {
  const baseSymbol = board.topology[Math.floor(index / board.width)][index % board.width]
  if ('_#'.includes(baseSymbol)) return baseSymbol
  const isTarget = targets.has(index)
  if (boxes.has(index)) return isTarget ? '-' : '$'
  if (index === player) return isTarget ? '*' : '@'
  return isTarget ? '.' : ' '
}

// Преобразует найденное состояние в карту Sokoban.
const createMap = (candidate, board) => {
  const targets = new Set(candidate.goals)
  const boxes = new Set(candidate.state.boxes.map(({position}) => position))
  return board.topology.map((row, y) => {
    return Array.from(row, (_, x) => getMapSymbol(y * board.width + x, board, targets, boxes, candidate.state.player)).join('')
  })
}

// Возвращает сокращённые лимиты решателя для быстрого отбора кандидатов.
const getSolverLimits = (config, boxCount) => {
  const scale = boxCount > 9 ? 0.45 : 1
  return {
    maxStates: Math.max(12000, Math.round(config.solverStateLimit * scale)),
    maxDurationMs: Math.max(160, Math.round(config.solverDurationMs * scale)),
  }
}

// Оценивает кандидата минимальным решением и шириной пространства состояний.
const evaluateCandidate = (candidate, board, config, boxCount) => {
  const map = createMap(candidate, board)
  const solution = solveSokoban(map, getSolverLimits(config, boxCount))
  if (solution.status === 'unsolved') return null
  const pushes = solution.status === 'solved' ? solution.pushes : candidate.state.pulls
  const searchComplexity = Math.log2(solution.explored + 1) * 14
  return {candidate, map, solution, score: candidate.reverseScore + pushes * 6 + searchComplexity}
}

// Выбирает лучшего кандидата после ограниченной проверки решателем.
const selectBestCandidate = (candidates, board, config, boxCount) => {
  const limit = boxCount > 9 ? 1 : config.candidateCount
  const evaluated = candidates
    .slice(0, limit)
    .map((candidate) => evaluateCandidate(candidate, board, config, boxCount))
    .filter(Boolean)
  return evaluated.sort((first, second) => second.score - first.score)[0] ?? null
}

// Собирает статистику, объясняющую качество получившейся головоломки.
const createGenerationStats = (result, options, capacity, seed) => ({
  width: result.map[0].length,
  height: result.map.length,
  difficulty: options.difficulty,
  boxCount: capacity.boxCount,
  maxBoxCount: capacity.maximum,
  solutionPushes: result.candidate.state.pulls,
  boxLines: result.candidate.state.boxLines,
  boxChanges: result.candidate.state.boxChanges,
  solverStatus: result.solution.status,
  minimumPushes: result.solution.status === 'solved' ? result.solution.pushes : null,
  exploredStates: result.solution.explored,
  seed,
})

// Наполняет заданную структуру целями, ящиками и игроком.
const tryPopulateTopology = (topology, options, config, random, seed) => {
  const board = createTopologyBoard(topology)
  if (!isTopologyConnected(board)) throw new Error('Все клетки пола должны образовывать одну связную область')
  const capacity = resolveBoxCount(options.boxCount, board, config)
  const candidates = createReverseCandidates(board, capacity.boxCount, config, random)
  const result = selectBestCandidate(candidates, board, config, capacity.boxCount)
  if (!result) return null
  return {map: result.map, stats: createGenerationStats(result, options, capacity, seed)}
}

// Генерирует новую геометрию до получения качественно наполненного варианта.
const generateWithNewTopology = (options, config, random, seed) => {
  for (let attempt = 0; attempt < STRUCTURE_ATTEMPTS; attempt++) {
    const topology = createGeneratedTopology(options.width, options.height, config, random)
    const result = tryPopulateTopology(topology, options, config, random, seed)
    if (result) return result
  }
  throw new Error('Не удалось подобрать интересный вариант; попробуйте запустить генерацию ещё раз')
}

// Создаёт уровень на новой или переданной из редактора структуре.
const generateSokobanLevel = (request = {}) => {
  const options = normalizeGeneratorOptions(request)
  const config = DIFFICULTY_CONFIG[options.difficulty]
  const seed = resolveSeed(options.seed)
  const random = createRandom(seed)
  if (!request.topology) return generateWithNewTopology(options, config, random, seed)

  const topology = normalizeTopology(request.topology)
  validateTopologyDimensions(topology)
  const result = tryPopulateTopology(topology, options, config, random, seed)
  if (!result) throw new Error('Не удалось расставить объекты в этой структуре; попробуйте другой вариант')
  return result
}

export {
  generateSokobanLevel, // Главная операция процедурной генерации
}
