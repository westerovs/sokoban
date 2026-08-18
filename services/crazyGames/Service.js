import Adapter from '../adapters/CrazyGamesBasicAdapter.js'
import {DEFAULT_FLAGS, PLATFORM_SCENARIOS} from '@/game/gameConfig/constants.js'

/**
 * перед первым релизом игры собирать CrazyGamesBasicAdapter!
 * до 50мб можно одним архивом отправлять. Если больше, то динамически подгружать ассеты с хоста, делать remote конфиг
 * */

const flags = {...DEFAULT_FLAGS, ...PLATFORM_SCENARIOS.CRAZY_GAMES}
const ADAPTER = new Adapter({game_name: 'CRAZY_GAMES_CLUES_AND_MYSTERIES', flags})

const gameStart = () => {
  if (window.createGame) window.createGame(ADAPTER)
}

gameStart()
