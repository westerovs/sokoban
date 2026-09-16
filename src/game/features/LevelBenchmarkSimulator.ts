import type {LevelDifficulty} from '../gameConfig/levels/levelDifficulty.js'

// Рассчитывает условный процент игроков по времени и сложности уровня.

const SECONDS_PER_BOX = 20 // Эталонное время на один ящик
const DIFFICULTY_SECONDS: Record<LevelDifficulty, number> = {
  easy: 0, // Надбавка за лёгкий уровень
  medium: 10, // Надбавка за средний уровень
  hard: 20, // Надбавка за трудный уровень
  veryHard: 40, // Надбавка за очень трудный уровень
}
const MIN_VISIBLE_PERCENT = 40 // Нижняя граница отображаемого сравнения
const MAX_PERCENT = 95 // Верхняя граница условного сравнения

export default class LevelBenchmarkSimulator {
  // Возвращает процент для показа либо отсутствие сравнения при медленном прохождении.
  static calculate(boxCount: number, difficulty: LevelDifficulty, seconds: number): number | null {
    if (!Number.isInteger(boxCount) || boxCount < 1 || !Number.isFinite(seconds) || seconds < 0) return null

    const benchmarkSeconds = boxCount * SECONDS_PER_BOX + DIFFICULTY_SECONDS[difficulty]
    const percent = Math.min(MAX_PERCENT, Math.max(0, 100 - (50 * seconds) / benchmarkSeconds))
    return percent < MIN_VISIBLE_PERCENT ? null : Math.round(percent)
  }
}
