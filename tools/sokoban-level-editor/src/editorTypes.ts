import type {TileAppearance, TileTransform} from '../../../src/game/sokoban/appearance/tileAppearance.js'

/**
 * Описывает простые структуры данных браузерного редактора уровней Sokoban.
 */

type Position = {
  x: number
  y: number
}

type Offset = Position

type Bounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

type LevelAppearance = Record<string, Record<string, TileAppearance> | undefined>

type AppearanceCatalog = {
  levels: Record<string, LevelAppearance>
}

type EditorLevel = {
  id: string
  map: string[]
  number?: number
  isVerified?: boolean
}

type EditorState = {
  levelId: string
  map: string[]
  appearance: LevelAppearance
}

type EditorBrush = {
  mode: string
  label: string
  role?: string
  texture?: string
  transform?: TileTransform
}

type ValidationIssue = {
  type: 'error' | 'warning'
  message: string
  positions: Position[]
}

type ValidationResult = {
  isValid: boolean
  issues: ValidationIssue[]
  invalidPositions: Position[]
}

type EditorLocation = {
  id: string
  titleKey: string
  levels: EditorLevel[]
}

type EditorData = {
  locations: EditorLocation[]
  appearance: AppearanceCatalog
}

export type {
  AppearanceCatalog,
  Bounds,
  EditorBrush,
  EditorData,
  EditorLevel,
  EditorLocation,
  EditorState,
  LevelAppearance,
  Offset,
  Position,
  ValidationIssue,
  ValidationResult,
}
