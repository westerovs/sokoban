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

type LevelAppearance = Record<string, Record<string, string> | undefined>

type AppearanceCatalog = {
  levels: Record<string, LevelAppearance>
}

type EditorLevel = {
  id: string
  map: string[]
  authorId: string
  number?: number
  libraryPath?: string
}

type LibraryLevel = EditorLevel & {
  libraryPath: string
  appearance: LevelAppearance
}

type LibraryDirectory = {
  path: string
  collection: string
  section: string
  authorId: string
}

type LibraryData = {
  directories: LibraryDirectory[]
  levels: LibraryLevel[]
  usedIds: string[]
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
  decorGroups: {name: string; textures: string[]}[]
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
  LibraryData,
  LibraryDirectory,
  LibraryLevel,
  Offset,
  Position,
  ValidationIssue,
  ValidationResult,
}
