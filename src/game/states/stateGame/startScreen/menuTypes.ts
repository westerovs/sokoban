import type {LevelEntry, LevelDefinition, LocationDefinition} from '../../../gameConfig/levels/levelTypes.js'

// Описывает простые данные и обратные вызовы экранов выбора локации и уровня.

type LevelSelectionState = LevelDefinition & {
  isCompleted: boolean
  isSelected?: boolean
  isUnlocked: boolean
  locationLevelIndex: number
}

type LocationSelectionState = LocationDefinition & {
  completedCount: number
  isCompleted: boolean
  isCurrent: boolean
  isUnlocked: boolean
  totalCount: number
}

type GameMenuCallbacks = {
  onBack: () => void
  onContinue: () => void
  onLeaderboard: () => void
  onLevelSelect: (levelId: string) => void
  onLocationSelect: (locationId: string) => void
  onPageSelect: (pageIndex: number) => void
  onPlay: (levelId: string) => void
  onStore: () => void
}

export type {
  GameMenuCallbacks,
  LevelEntry,
  LevelSelectionState,
  LocationDefinition,
  LocationSelectionState,
}
