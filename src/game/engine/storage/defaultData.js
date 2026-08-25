import {PACKAGE_VERSION} from '../../generatedAssets/buildMeta.js'

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
}

const DEFAULT_DATA = {
  [STORAGE_KEYS.version]: {type: 'string', value: PACKAGE_VERSION},
  
  [STORAGE_KEYS.userLevel]:    {type: 'number', value: 1},
  [STORAGE_KEYS.coins]:        {type: 'number', value: 10},
  [STORAGE_KEYS.hints]:        {type: 'number', value: 3},
  [STORAGE_KEYS.hintDarts]:   {type: 'number', value: 3},
  [STORAGE_KEYS.hintCompass]: {type: 'number', value: 3},
  [STORAGE_KEYS.hasAdPass]:    {type: 'bool', value: false},
  [STORAGE_KEYS.eventPurchasedNewYear]:    {type: 'bool', value: false},
  
  [STORAGE_KEYS.levelIndex]: {type: 'number', value: 0},
  [STORAGE_KEYS.skinIndex]:  {type: 'number', value: 1},
  [STORAGE_KEYS.partIndex]:  {type: 'number', value: 1},
  
  [STORAGE_KEYS.option_isPlayMusic]: {type: 'bool', value: true},
  [STORAGE_KEYS.option_isPlaySFX]:   {type: 'bool', value: true},
  [STORAGE_KEYS.option_zoom]:   {type: 'bool', value: null},
  [STORAGE_KEYS.option_sokobanDpad]: {type: 'bool', value: false},
  
  [STORAGE_KEYS.timer_RewardMagnifier]: {type: 'number', value: null},
  [STORAGE_KEYS.timer_RewardDarts]: {type: 'number', value: null},
  [STORAGE_KEYS.timer_RewardCompass]: {type: 'number', value: null},
  
  [STORAGE_KEYS.isTutorial_shadows]:   {type: 'bool', value: false},
  [STORAGE_KEYS.isTutorial_words]:     {type: 'bool', value: false},
  [STORAGE_KEYS.isTutorial_anagrams]:  {type: 'bool', value: false},
  [STORAGE_KEYS.isTutorial_generator]: {type: 'bool', value: false},
  [STORAGE_KEYS.isTutorial_identical]: {type: 'bool', value: false},
  
  [STORAGE_KEYS.hintDartsIsAvailable]:   {type: 'bool', value: false},
  [STORAGE_KEYS.hintCompassIsAvailable]: {type: 'bool', value: false},
  
  [STORAGE_KEYS.playerId]: {type: 'string', value: null},
  [STORAGE_KEYS.savedAt]:  {type: 'string', value: null},
  
  // skins
  [STORAGE_KEYS.currentSkin]:  {type: 'string', value: 'standard'},
  [STORAGE_KEYS.skins]:  {type: 'array', value: ['standard']},
}

const DEFAULT_DATA_VALUES = Object.fromEntries(
  Object.entries(DEFAULT_DATA).map(([key, val]) => [key, val?.value])
)

export {
  DEFAULT_DATA,
  DEFAULT_DATA_VALUES,
  STORAGE_KEYS,
}
