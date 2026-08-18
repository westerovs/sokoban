import Adapter from '../adapters/FRVRAdapter.js'
import {DEFAULT_FLAGS, PLATFORM_SCENARIOS} from '@/game/gameConfig/constants.js'

const flags = {...DEFAULT_FLAGS, ...PLATFORM_SCENARIOS.FRVR}
const ADAPTER = new Adapter({game_name: 'FRVR_HOG_CLUES_AND_MYSTERIES', game_code: 'FRVR_HOG_CLUES_AND_MYSTERIES', flags})

const gameStart = () => {
  if (window.createGame) window.createGame(ADAPTER)
}

gameStart()
