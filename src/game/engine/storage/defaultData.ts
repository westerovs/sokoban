import {PACKAGE_VERSION} from '../../generatedAssets/buildMeta.js'

// Описывает ключи, значения по умолчанию и сериализуемые поля профиля игрока.

const STORAGE_KEYS = {
  version: 'version',
  userLevel: 'userLevel',
  coins: 'coins',

  // store
  hints: 'hints',
  hintDarts: 'hintDarts',
  hintCompass: 'hintCompass',
  hasAdPass: 'hasAdPass',
  eventPurchasedNewYear: 'eventPurchasedNewYear',

  // default
  levelIndex: 'levelIndex',
  levelProgressVersion: 'levelProgressVersion',
  selectedLevelId: 'selectedLevelId',
  lastPlayedLevelId: 'lastPlayedLevelId',
  selectedLocationId: 'selectedLocationId',
  completedLevelIds: 'completedLevelIds',
  unlockedLocationIds: 'unlockedLocationIds',
  celebratedLocationIds: 'celebratedLocationIds',
  locationPageIndex: 'locationPageIndex',
  skinIndex: 'skinIndex',
  partIndex: 'partIndex',

  option_isPlayMusic: 'option_isPlayMusic',
  option_isPlaySFX: 'option_isPlaySFX',
  option_zoom: 'option_zoom',
  option_sokobanDpad: 'option_sokobanDpad',

  timer_RewardMagnifier: 'timer_RewardMagnifier',
  timer_RewardDarts: 'timer_RewardDarts',
  timer_RewardCompass: 'timer_RewardCompass',

  isTutorial_shadows: 'isTutorial_shadows',
  isTutorial_words: 'isTutorial_words',
  isTutorial_anagrams: 'isTutorial_anagrams',
  isTutorial_generator: 'isTutorial_generator',
  isTutorial_identical: 'isTutorial_identical',

  hintDartsIsAvailable: 'hintDartsIsAvailable',
  hintCompassIsAvailable: 'hintCompassIsAvailable',

  playerId: 'playerId',
  savedAt: 'savedAt',

  // skins
  currentSkin: 'currentSkin',
  skins: 'skins',
} as const

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

type PlayerData = {
  version: string
  userLevel: number
  coins: number
  hints: number
  hintDarts: number
  hintCompass: number
  hasAdPass: boolean
  eventPurchasedNewYear: boolean
  levelIndex: number
  levelProgressVersion: number
  selectedLevelId: string | null
  lastPlayedLevelId: string | null
  selectedLocationId: string | null
  completedLevelIds: string[]
  unlockedLocationIds: string[]
  celebratedLocationIds: string[]
  locationPageIndex: number
  skinIndex: number
  partIndex: number
  option_isPlayMusic: boolean
  option_isPlaySFX: boolean
  option_zoom: boolean | null
  option_sokobanDpad: boolean
  timer_RewardMagnifier: number | null
  timer_RewardDarts: number | null
  timer_RewardCompass: number | null
  isTutorial_shadows: boolean
  isTutorial_words: boolean
  isTutorial_anagrams: boolean
  isTutorial_generator: boolean
  isTutorial_identical: boolean
  hintDartsIsAvailable: boolean
  hintCompassIsAvailable: boolean
  playerId: string | null
  savedAt: string | null
  currentSkin: string
  skins: string[]
}

type DataType = 'array' | 'bool' | 'number' | 'object' | 'string'

type DefaultDataEntry = {
  type: DataType
  value: unknown
}

const DEFAULT_DATA: Record<StorageKey, DefaultDataEntry> = {
  [STORAGE_KEYS.version]: {type: 'string', value: PACKAGE_VERSION},

  [STORAGE_KEYS.userLevel]: {type: 'number', value: 1},
  [STORAGE_KEYS.coins]: {type: 'number', value: 10},
  [STORAGE_KEYS.hints]: {type: 'number', value: 3},
  [STORAGE_KEYS.hintDarts]: {type: 'number', value: 3},
  [STORAGE_KEYS.hintCompass]: {type: 'number', value: 3},
  [STORAGE_KEYS.hasAdPass]: {type: 'bool', value: false},
  [STORAGE_KEYS.eventPurchasedNewYear]: {type: 'bool', value: false},

  [STORAGE_KEYS.levelIndex]: {type: 'number', value: 0},
  [STORAGE_KEYS.levelProgressVersion]: {type: 'number', value: 0},
  [STORAGE_KEYS.selectedLevelId]: {type: 'string', value: null},
  [STORAGE_KEYS.lastPlayedLevelId]: {type: 'string', value: null},
  [STORAGE_KEYS.selectedLocationId]: {type: 'string', value: null},
  [STORAGE_KEYS.completedLevelIds]: {type: 'array', value: []},
  [STORAGE_KEYS.unlockedLocationIds]: {type: 'array', value: []},
  [STORAGE_KEYS.celebratedLocationIds]: {type: 'array', value: []},
  [STORAGE_KEYS.locationPageIndex]: {type: 'number', value: 0},
  [STORAGE_KEYS.skinIndex]: {type: 'number', value: 1},
  [STORAGE_KEYS.partIndex]: {type: 'number', value: 1},

  [STORAGE_KEYS.option_isPlayMusic]: {type: 'bool', value: true},
  [STORAGE_KEYS.option_isPlaySFX]: {type: 'bool', value: true},
  [STORAGE_KEYS.option_zoom]: {type: 'bool', value: null},
  [STORAGE_KEYS.option_sokobanDpad]: {type: 'bool', value: false},

  [STORAGE_KEYS.timer_RewardMagnifier]: {type: 'number', value: null},
  [STORAGE_KEYS.timer_RewardDarts]: {type: 'number', value: null},
  [STORAGE_KEYS.timer_RewardCompass]: {type: 'number', value: null},

  [STORAGE_KEYS.isTutorial_shadows]: {type: 'bool', value: false},
  [STORAGE_KEYS.isTutorial_words]: {type: 'bool', value: false},
  [STORAGE_KEYS.isTutorial_anagrams]: {type: 'bool', value: false},
  [STORAGE_KEYS.isTutorial_generator]: {type: 'bool', value: false},
  [STORAGE_KEYS.isTutorial_identical]: {type: 'bool', value: false},

  [STORAGE_KEYS.hintDartsIsAvailable]: {type: 'bool', value: false},
  [STORAGE_KEYS.hintCompassIsAvailable]: {type: 'bool', value: false},

  [STORAGE_KEYS.playerId]: {type: 'string', value: null},
  [STORAGE_KEYS.savedAt]: {type: 'string', value: null},

  // skins
  [STORAGE_KEYS.currentSkin]: {type: 'string', value: 'standard'},
  [STORAGE_KEYS.skins]: {type: 'array', value: ['standard']},
}

const DEFAULT_DATA_VALUES = Object.fromEntries(Object.entries(DEFAULT_DATA).map(([key, val]) => [key, val?.value])) as PlayerData

const SERIALIZED_ARRAY_KEYS = Object.freeze([
  STORAGE_KEYS.celebratedLocationIds,
  STORAGE_KEYS.completedLevelIds,
  STORAGE_KEYS.skins,
  STORAGE_KEYS.unlockedLocationIds,
])

export {
  DEFAULT_DATA,
  DEFAULT_DATA_VALUES,
  SERIALIZED_ARRAY_KEYS,
  STORAGE_KEYS,
}

export type {
  DataType,
  PlayerData,
  StorageKey,
}
