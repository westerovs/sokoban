import {SOKOBAN_SETTINGS} from '../../../src/game/sokoban/config/settings.js'
import {type SolverResult, solveSokoban} from '../solver.js'
import {DIFFICULTY_CONFIG, type GeneratorOptions, type GeneratorRequest, normalizeGeneratorOptions} from './config.js'
import {createRandom, type Random} from './grid.js'
import {createReverseCandidates, type ReverseCandidate} from './reverseSearch.js'
import {
  createGeneratedTopology,
  createTopologyBoard,
  getMaximumBoxCount,
  getRecommendedBoxCount,
  isTopologyConnected,
  normalizeTopology,
  type TopologyBoard,
} from './topology.js'

/**
 * Создаёт решаемый уровень, отбирая лучшие обратные состояния на новой или сохранённой геометрии.
 */

const STRUCTURE_ATTEMPTS = 8 // Число попыток создать подходящую новую геометрию

type GeneratorConfig = (typeof DIFFICULTY_CONFIG)[keyof typeof DIFFICULTY_CONFIG]

type PopulationOptions = Omit<GeneratorOptions, 'shape'> & {
  shape: string
}

type BoxCapacity = {
  boxCount: number
  maximum: number
}

type EvaluatedCandidate = {
  candidate: ReverseCandidate
  map: string[]
  solution: SolverResult
  score: number
}

// Возвращает случайное 32-битное зерно или нормализует переданное.
const resolveSeed = (seed: unknown) => {
  const parsed = Number(seed)
  if (Number.isInteger(parsed)) return parsed >>> 0
  return Math.floor(Math.random() * 4294967296) >>> 0
}

// Проверяет размеры структуры с учётом ограничений игрового поля.
const validateTopologyDimensions = (topology: string[]) => {
  const width = topology[0].length
  const height = topology.length
  if (width > SOKOBAN_SETTINGS.maxBoardColumns || height > SOKOBAN_SETTINGS.maxBoardRows) {
    throw new Error(`Максимальный размер структуры — ${SOKOBAN_SETTINGS.maxBoardColumns}×${SOKOBAN_SETTINGS.maxBoardRows}`)
  }
  if (width < 3 || height < 3) throw new Error('Структура слишком мала для генерации')
}

// Определяет количество ящиков для текущей структуры.
const resolveBoxCount = (requestedBoxCount: number | null, board: TopologyBoard, config: GeneratorConfig): BoxCapacity => {
  const maximum = getMaximumBoxCount(board)
  const boxCount = requestedBoxCount ?? getRecommendedBoxCount(board, config)
  if (boxCount > maximum) throw new Error(`В этой структуре можно разместить не более ${maximum} ящиков`)
  return {boxCount, maximum}
}

// Собирает игровой символ одной клетки из структуры, целей и объектов.
const getMapSymbol = (index: number, board: TopologyBoard, targets: Set<number>, boxes: Set<number>, player: number) => {
  const baseSymbol = board.topology[Math.floor(index / board.width)][index % board.width]
  if ('_#'.includes(baseSymbol)) return baseSymbol
  const isTarget = targets.has(index)
  if (boxes.has(index)) return isTarget ? '-' : '$'
  if (index === player) return isTarget ? '*' : '@'
  return isTarget ? '.' : ' '
}

// Преобразует найденное состояние в карту Sokoban.
const createMap = (candidate: ReverseCandidate, board: TopologyBoard) => {
  const targets = new Set(candidate.goals)
  const boxes = new Set(candidate.state.boxes.map(({position}) => position))
  return board.topology.map((row, y) => {
    return Array.from(row, (_, x) => getMapSymbol(y * board.width + x, board, targets, boxes, candidate.state.player)).join('')
  })
}

// Возвращает сокращённые лимиты решателя для быстрого отбора кандидатов.
const getSolverLimits = (config: GeneratorConfig, boxCount: number) => {
  const scale = boxCount > 9 ? 0.45 : 1
  return {
    maxStates: Math.max(12000, Math.round(config.solverStateLimit * scale)),
    maxDurationMs: Math.max(160, Math.round(config.solverDurationMs * scale)),
  }
}

// Оценивает кандидата минимальным решением и шириной пространства состояний.
const evaluateCandidate = (
  candidate: ReverseCandidate,
  board: TopologyBoard,
  config: GeneratorConfig,
  boxCount: number,
): EvaluatedCandidate | null => {
  const map = createMap(candidate, board)
  const solution = solveSokoban(map, getSolverLimits(config, boxCount))
  if (solution.status === 'unsolved') return null
  const pushes = solution.status === 'solved' ? solution.pushes : candidate.state.pulls
  const searchComplexity = Math.log2(solution.explored + 1) * 14
  return {candidate, map, solution, score: candidate.reverseScore + pushes * 6 + searchComplexity}
}

// Выбирает лучшего кандидата после ограниченной проверки решателем.
const selectBestCandidate = (candidates: ReverseCandidate[], board: TopologyBoard, config: GeneratorConfig, boxCount: number) => {
  const limit = boxCount > 9 ? 1 : config.candidateCount
  const evaluated = candidates
    .slice(0, limit)
    .map((candidate) => evaluateCandidate(candidate, board, config, boxCount))
    .filter((result): result is EvaluatedCandidate => Boolean(result))
  return evaluated.sort((first, second) => second.score - first.score)[0] ?? null
}

// Собирает статистику, объясняющую качество получившейся головоломки.
const createGenerationStats = (result: EvaluatedCandidate, options: PopulationOptions, capacity: BoxCapacity, seed: number) => ({
  width: result.map[0].length,
  height: result.map.length,
  difficulty: options.difficulty,
  shape: options.shape,
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
const tryPopulateTopology = (topology: string[], options: PopulationOptions, config: GeneratorConfig, random: Random, seed: number) => {
  const board = createTopologyBoard(topology)
  if (!isTopologyConnected(board)) throw new Error('Все клетки пола должны образовывать одну связную область')
  const capacity = resolveBoxCount(options.boxCount, board, config)
  const candidates = createReverseCandidates(board, capacity.boxCount, config, random)
  const result = selectBestCandidate(candidates, board, config, capacity.boxCount)
  if (!result) return null
  return {map: result.map, stats: createGenerationStats(result, options, capacity, seed)}
}

// Генерирует новую геометрию до получения качественно наполненного варианта.
const generateWithNewTopology = (options: GeneratorOptions, config: GeneratorConfig, random: Random, seed: number) => {
  for (let attempt = 0; attempt < STRUCTURE_ATTEMPTS; attempt++) {
    const generated = createGeneratedTopology(options.width, options.height, config, options.shape, random)
    const result = tryPopulateTopology(generated.topology, {...options, shape: generated.shape}, config, random, seed)
    if (result) return result
  }
  throw new Error('Не удалось подобрать интересный вариант; попробуйте запустить генерацию ещё раз')
}

// Создаёт уровень на новой или переданной из редактора структуре.
const generateSokobanLevel = (request: GeneratorRequest = {}) => {
  const options = normalizeGeneratorOptions(request)
  const config = DIFFICULTY_CONFIG[options.difficulty]
  const seed = resolveSeed(options.seed)
  const random = createRandom(seed)
  if (!request.topology) return generateWithNewTopology(options, config, random, seed)

  const topology = normalizeTopology(request.topology)
  validateTopologyDimensions(topology)
  const result = tryPopulateTopology(topology, {...options, shape: 'current'}, config, random, seed)
  if (!result) throw new Error('Не удалось расставить объекты в этой структуре; попробуйте другой вариант')
  return result
}

export {
  generateSokobanLevel, // Главная операция процедурной генерации
}
