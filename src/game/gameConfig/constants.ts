import {URL_PRESET} from '../../../utils/getAssetsUrl.js'
import {GAME_NAME} from '../generatedAssets/buildMeta.js'

// Содержит основные размеры, состояния, платформы и флаги игры.

// ---------- game app settings ----------
const width = 2560
const height = 1080
const WORLD = Object.freeze({
  WIDTH: width,
  HEIGHT: height,
  HALF_W: width / 2,
  HALF_H: height / 2,

  get CENTER() {
    return {x: width / 2, y: height / 2}
  },

  get isLandscape() {
    return matchMedia('(orientation: landscape)').matches
  },

  get isPortrait() {
    return matchMedia('(orientation: portrait)').matches
  },
})

const GAME_STATES = Object.freeze({
  baseState: 'baseState',
  preloadState: 'preloadState',
  gameState: 'gameState',
  levelState: 'levelState',
  levelPreload: 'levelPreload',
})

// ---------- platform settings ----------
const GAME_NAMES = Object.freeze({
  currentName: GAME_NAME,
  detective: 'dra.detective',
  detectiveGirl: 'dra.detective-girl',
  hotel: 'dra.hotel',
  adventure: 'dra.adventure',
  test: 'hog.test',
})

const PLATFORM_ID = Object.freeze({
  base: 'base',
  vk: 'vk',
  ok: 'ok',
  yandex: 'yandex',
  cg: 'cg',
  youtube: 'youtube',
})

/**
 * Для тестирования платформ в режиме noAdapter следует подключить желаемый адаптер в файле noAdapter и задать соответствующий сценарий
 * Примечание: если платформа относится к семейству playgama, например youtube - то при тестировании getPlatformId вернется как playgama, что может помешать
 * проверить уникальные сценарии работы. Поэтому рекомендуется использовать для таких случаев BaseAdapter, где жестко вернуть 'имя желаемой платформы'
 * в методе getPlatformId
 * */
const PLATFORM_SCENARIOS = {
  DEV: {
    skipFirstScreen: false, // если true - грузится сразу уровень
    noStore: false, // если true - выключает лидеры и магазин
    noPreroll: false, // если true - реклама выключена при запуске игры
    skipLevelTimer: false, // если true - выключает таймер на уровне
    skipAdInFirstLevel: false, // если true - реклама при 0 уровне и на первом уровне и после его окончания не будет показана.
    enableStartStopOnFocusChange: true, // если true события старт/stop отправляются при смене фокуса игры
    cacheOff: false, // если true - игра не будет кешировать свои файлы
  },

  // режим для сайтов, собирается из base адаптера
  BASE: {
    noStore: true,
  },
  CRAZY_GAMES: {
    noStore: true,
    noPreroll: true,
    skipLevelTimer: true,
    skipFirstScreen: true,
    skipAdInFirstLevel: true,
  },
  FRVR: {
    noStore: true,
    noPreroll: true,
  },
  GAME_DISTRIBUTION: {
    noStore: true,
  },
  PLAYGAMA: {
    noStore: true,
    noPreroll: true,
  },
  OK: {
    noPreroll: true,
  },
  VK: {
    noPreroll: true,
  },
  VK_OK: {
    noPreroll: true,
  },
  YANDEX: {
    enableStartStopOnFocusChange: true,
  },
  YOUTUBE: {
    noStore: true,
    noPreroll: true,
    skipLevelTimer: true,
    skipFirstScreen: true,
    skipAdInFirstLevel: true,
    disableFreshCache: true, // если true - не работает сброс кеша. На youtube playables символы ? и = запрещены
    hideSoundButtons: true, // если true - игра скрывает кнопки громкости, за звук отвечает только платформа
  },
}

/**
 * Имена [words, shadows, generator и тд] это имена из кости спайна, например level55_shadows
 * Поле difficulty определяет какой лейбл создавать перед запуском этого уровня
 */
const LEVEL_TYPES = {
  DEFAULT: {name: 'default', difficulty: null},
  NEW_YEAR: {name: 'ny', difficulty: null},

  SHADOWS: {name: 'shadows', difficulty: 'hard'},
  WORDS: {name: 'words', difficulty: 'veryHard'},
  ANAGRAMS: {name: 'anagrams', difficulty: 'veryHard'},
  GENERATOR: {name: 'generator', difficulty: 'extreme'},
  IDENTICAL: {name: 'identical', difficulty: 'hard'},
}

// ---------- other settings ----------
const DEFAULT_FLAGS = {
  DEFAULT_TEST: 'DEFAULT_TEST',

  timerRewardDuration: '1800',
  levelAdDelay: '120',
  timerCompassDuration: '15',
}

const TIMER_REWARD_DURATION_IF_STORE_UNAVAILABLE = 600 // (60 * 10) = 10min

// ---------- build settings ----------

// для всех платформ, кроме тех, которые не проходят по весу
const ASSETS_URL = URL_PRESET.LOCAL
// const ASSETS_URL = URL_PRESET.GIT_TEST
// const ASSETS_URL = URL_PRESET.DRA_TEST // Блокируется (CORS):
// const ASSETS_URL = URL_PRESET.CRAZY_GAMES_BUILD
// const ASSETS_URL = URL_PRESET.YANDEX_BUILD

export {
  ASSETS_URL,
  DEFAULT_FLAGS,
  GAME_NAMES,
  GAME_STATES,
  LEVEL_TYPES,
  PLATFORM_ID,
  PLATFORM_SCENARIOS,
  TIMER_REWARD_DURATION_IF_STORE_UNAVAILABLE,
  WORLD,
}
