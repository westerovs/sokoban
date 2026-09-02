import {SOKOBAN_SETTINGS} from '../../../src/game/sokoban/config/settings.js'
import {clamp} from './grid.js'

/**
 * Хранит режимы сложности и формы, нормализуя параметры процедурной генерации уровней.
 */

const MIN_BOARD_SIZE = 8 // Минимальная ширина и высота новой структуры с достаточным пространством для сложной задачи
const DEFAULT_BOARD_WIDTH = 10 // Начальная ширина карты в интерфейсе
const DEFAULT_BOARD_HEIGHT = 8 // Начальная высота карты в интерфейсе
const DEFAULT_DIFFICULTY = 'normal' // Начальная сложность генератора
const DEFAULT_SHAPE = 'random' // Начальный режим внешней формы уровня

const SHAPE_CONFIG = Object.freeze({
  random: Object.freeze({label: 'Случайная'}), // Случайный выбор конкретной формы
  compact: Object.freeze({label: 'Компактная'}), // Единая область с выемками по краям
  rooms: Object.freeze({label: 'Комнаты'}), // Несколько помещений с переходами
  winding: Object.freeze({label: 'Извилистая'}), // Ветвистая система широких коридоров
})

const DIFFICULTY_CONFIG = Object.freeze({
  easy: Object.freeze({
    label: 'Легко', // Название сложности в интерфейсе
    wallDensity: 0.1, // Доля внутренних стен
    pullsPerBox: 4, // Целевое число обратных толчков на ящик
    beamWidth: 12, // Число одновременно развиваемых состояний
    placementAttempts: 6, // Число вариантов расположения целей
    candidateCount: 3, // Число финальных кандидатов для решателя
    movedBoxRatio: 0.65, // Минимальная доля сдвинутых с целей ящиков
    solverStateLimit: 25000, // Лимит состояний решателя при отборе
    solverDurationMs: 220, // Лимит времени решателя на одного кандидата
    boxAreaRatio: 24, // Количество клеток пола на один ящик
    minimumBoxes: 2, // Желаемый минимум ящиков
  }),
  normal: Object.freeze({
    label: 'Средне', // Название сложности в интерфейсе
    wallDensity: 0.15, // Доля внутренних стен
    pullsPerBox: 7, // Целевое число обратных толчков на ящик
    beamWidth: 18, // Число одновременно развиваемых состояний
    placementAttempts: 9, // Число вариантов расположения целей
    candidateCount: 4, // Число финальных кандидатов для решателя
    movedBoxRatio: 0.8, // Минимальная доля сдвинутых с целей ящиков
    solverStateLimit: 45000, // Лимит состояний решателя при отборе
    solverDurationMs: 320, // Лимит времени решателя на одного кандидата
    boxAreaRatio: 18, // Количество клеток пола на один ящик
    minimumBoxes: 3, // Желаемый минимум ящиков
  }),
  hard: Object.freeze({
    label: 'Сложно', // Название сложности в интерфейсе
    wallDensity: 0.2, // Доля внутренних стен
    pullsPerBox: 11, // Целевое число обратных толчков на ящик
    beamWidth: 26, // Число одновременно развиваемых состояний
    placementAttempts: 12, // Число вариантов расположения целей
    candidateCount: 5, // Число финальных кандидатов для решателя
    movedBoxRatio: 0.95, // Минимальная доля сдвинутых с целей ящиков
    solverStateLimit: 70000, // Лимит состояний решателя при отборе
    solverDurationMs: 480, // Лимит времени решателя на одного кандидата
    boxAreaRatio: 13, // Количество клеток пола на один ящик
    minimumBoxes: 4, // Желаемый минимум ящиков
  }),
})

type Difficulty = keyof typeof DIFFICULTY_CONFIG
type Shape = keyof typeof SHAPE_CONFIG

type GeneratorRequest = {
  width?: unknown
  height?: unknown
  difficulty?: unknown
  shape?: unknown
  boxCount?: unknown
  seed?: unknown
  topology?: string[]
}

type GeneratorOptions = {
  width: number
  height: number
  difficulty: Difficulty
  shape: Shape
  boxCount: number | null
  seed: unknown
}

// Проверяет целочисленный размер карты и ограничивает его возможностями игры.
const normalizeDimension = (value: unknown, fallback: number, maximum: number) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return clamp(parsed, MIN_BOARD_SIZE, maximum)
}

// Возвращает существующий режим сложности.
const normalizeDifficulty = (difficulty: unknown): Difficulty => {
  return typeof difficulty === 'string' && difficulty in DIFFICULTY_CONFIG ? (difficulty as Difficulty) : DEFAULT_DIFFICULTY
}

// Возвращает существующий режим внешней формы.
const normalizeShape = (shape: unknown): Shape => {
  return typeof shape === 'string' && shape in SHAPE_CONFIG ? (shape as Shape) : DEFAULT_SHAPE
}

// Возвращает положительное целое количество ящиков или автоматический режим.
const normalizeBoxCount = (boxCount: unknown) => {
  if (boxCount === null || boxCount === undefined || boxCount === '') return null
  const parsed = Number(boxCount)
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error('Количество ящиков должно быть положительным целым числом')
  return parsed
}

// Нормализует параметры одного запроса генерации.
const normalizeGeneratorOptions = (options: GeneratorRequest = {}): GeneratorOptions => {
  const width = normalizeDimension(options.width, DEFAULT_BOARD_WIDTH, SOKOBAN_SETTINGS.maxBoardColumns)
  const height = normalizeDimension(options.height, DEFAULT_BOARD_HEIGHT, SOKOBAN_SETTINGS.maxBoardRows)
  const difficulty = normalizeDifficulty(options.difficulty)
  const shape = normalizeShape(options.shape)
  return {width, height, difficulty, shape, boxCount: normalizeBoxCount(options.boxCount), seed: options.seed}
}

export {
  DEFAULT_BOARD_HEIGHT, // Начальная высота
  DEFAULT_BOARD_WIDTH, // Начальная ширина
  DEFAULT_DIFFICULTY, // Начальная сложность
  DEFAULT_SHAPE, // Начальный режим формы
  DIFFICULTY_CONFIG, // Настройки режимов сложности
  MIN_BOARD_SIZE, // Минимальный размер новой структуры
  normalizeGeneratorOptions, // Нормализация входных параметров
  SHAPE_CONFIG, // Доступные формы внешнего контура
}

export type {
  Difficulty,
  GeneratorOptions,
  GeneratorRequest,
  Shape,
}
