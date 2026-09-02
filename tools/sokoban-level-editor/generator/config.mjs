import {SOKOBAN_SETTINGS} from '../../../src/game/sokoban/config/settings.js'
import {clamp} from './grid.mjs'

/**
 * Хранит режимы сложности и нормализует параметры процедурной генерации уровней.
 */

const MIN_BOARD_SIZE = 8 // Минимальная ширина и высота новой структуры с достаточным пространством для сложной задачи
const DEFAULT_BOARD_WIDTH = 10 // Начальная ширина карты в интерфейсе
const DEFAULT_BOARD_HEIGHT = 8 // Начальная высота карты в интерфейсе
const DEFAULT_DIFFICULTY = 'normal' // Начальная сложность генератора

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

// Проверяет целочисленный размер карты и ограничивает его возможностями игры.
const normalizeDimension = (value, fallback, maximum) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) return fallback
  return clamp(parsed, MIN_BOARD_SIZE, maximum)
}

// Возвращает существующий режим сложности.
const normalizeDifficulty = (difficulty) => (DIFFICULTY_CONFIG[difficulty] ? difficulty : DEFAULT_DIFFICULTY)

// Возвращает положительное целое количество ящиков или автоматический режим.
const normalizeBoxCount = (boxCount) => {
  if (boxCount === null || boxCount === undefined || boxCount === '') return null
  const parsed = Number(boxCount)
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error('Количество ящиков должно быть положительным целым числом')
  return parsed
}

// Нормализует параметры одного запроса генерации.
const normalizeGeneratorOptions = (options = {}) => {
  const width = normalizeDimension(options.width, DEFAULT_BOARD_WIDTH, SOKOBAN_SETTINGS.maxBoardColumns)
  const height = normalizeDimension(options.height, DEFAULT_BOARD_HEIGHT, SOKOBAN_SETTINGS.maxBoardRows)
  const difficulty = normalizeDifficulty(options.difficulty)
  return {width, height, difficulty, boxCount: normalizeBoxCount(options.boxCount), seed: options.seed}
}

export {
  DEFAULT_BOARD_HEIGHT, // Начальная высота
  DEFAULT_BOARD_WIDTH, // Начальная ширина
  DEFAULT_DIFFICULTY, // Начальная сложность
  DIFFICULTY_CONFIG, // Настройки режимов сложности
  MIN_BOARD_SIZE, // Минимальный размер новой структуры
  normalizeGeneratorOptions, // Нормализация входных параметров
}
