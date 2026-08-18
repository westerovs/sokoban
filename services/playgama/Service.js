import Adapter from '../adapters/PlaygamaAdapter.js'
import {DEFAULT_FLAGS, PLATFORM_SCENARIOS} from '@/game/gameConfig/constants.js'

const flags = {...DEFAULT_FLAGS, ...PLATFORM_SCENARIOS.PLAYGAMA}
const ADAPTER = new Adapter({game_name: 'PLAYGAMA_HOG_CLUES_AND_MYSTERIES', flags})

const gameStart = () => {
  if (window.createGame) window.createGame(ADAPTER)
}

gameStart()
