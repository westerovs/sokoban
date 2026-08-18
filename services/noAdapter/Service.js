import {DEFAULT_FLAGS, PLATFORM_SCENARIOS} from '@/game/gameConfig/constants.js'
import Adapter from '../adapters/BaseAdapter.js'

/**
 * Запуск в режиме NoAdapter позволяет быстро потестить игру переключая сценарии, имитируя разные платформы
 * Можно ip забить в телефон и тестить игру. Иногда если не удаётся подключиться, нужно перезапустить сборку.
 * Например, CrazyGamesAdapter
 * */

console.clear()

const flags = {...DEFAULT_FLAGS, ...PLATFORM_SCENARIOS.DEV}
const ADAPTER = new Adapter({flags})

const gameStart = () => {
  if (window.createGame) window.createGame(ADAPTER)
}

gameStart()
