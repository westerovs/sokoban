// Описывает фиксированные категории сложности игровых уровней.

const LEVEL_DIFFICULTIES = ['easy', 'medium', 'hard', 'veryHard'] as const // Допустимые категории сложности

type LevelDifficulty = (typeof LEVEL_DIFFICULTIES)[number]

export {
  // Полный перечень категорий для проверок и генерации
  LEVEL_DIFFICULTIES,
}

export type {
  // Тип категории сложности игрового уровня
  LevelDifficulty,
}
