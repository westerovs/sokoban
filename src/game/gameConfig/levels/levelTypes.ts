import type {LevelDifficulty} from './levelDifficulty.js'

// Описывает структуру локаций, уровней и подготовленной конфигурации Sokoban.

type LevelAppearance = Partial<Record<'box' | 'decor' | 'ground' | 'target' | 'wall', Record<string, string>>>

type LevelSolver = {
  verified: boolean
  name: string
  version: string
  moves: number
  pushes: number
  timeSeconds: number
}

type LevelDefinition = {
  id: string
  levelName: string
  difficulty: LevelDifficulty
  authorId: string
  authorName: string
  isRemote?: boolean
  appearance?: LevelAppearance
  solver?: LevelSolver
  map: string[]
}

type LocationDefinition = {
  id: string
  titleKey: string
  cardTexture: string
  background: string
  ambience: string
  music: string
  levels: LevelDefinition[]
}

type GameLevels = {
  locations: LocationDefinition[]
}

type CatalogEntry = {
  level: LevelDefinition
  location: LocationDefinition
  locationIndex: number
  locationLevelIndex: number
}

type LevelEntry = CatalogEntry & {
  globalIndex: number
}

type RuntimeLevelConfig = LevelDefinition & {
  levelData: LevelDefinition
  levelIndex: number
  locationId: string
  locationIndex: number
  locationLevelIndex: number
  locationLevelNumber: number
  locationTitleKey: string
  levelType: 'sokoban'
  amb: string
  music: string
  backgroundName: string
  background: {
    alias: string
    src: string
  }
  bgTexture: string
  currentSkinName: 'sokoban'
}

export type {CatalogEntry, GameLevels, LevelAppearance, LevelDefinition, LevelEntry, LocationDefinition, RuntimeLevelConfig}
