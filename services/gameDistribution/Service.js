import Adapter from '../adapters/GameDistributionAdapter.js'
import {DEFAULT_FLAGS, PLATFORM_SCENARIOS} from '@/game/gameConfig/constants.js'

const flags = {...DEFAULT_FLAGS, ...PLATFORM_SCENARIOS.GAME_DISTRIBUTION}

/**
* Для каждой новой игры не забыть уточнить prodAccount ID!
* */
const GAME_ID = {
  testAccount: 'ff15abcd96ad443b8dda4bf25035134e',
  prodAccount: 'cc01f5db481e48898014c0a8bfb802cc',
}
const ADAPTER = new Adapter({app_id: GAME_ID.prodAccount, flags})

const gameStart = () => {
  if (window.createGame) window.createGame(ADAPTER)
}

gameStart()
