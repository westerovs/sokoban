import Adapter from '../adapters/OkAdapter.js'
import {DEFAULT_FLAGS, PLATFORM_SCENARIOS} from '@/game/gameConfig/constants.js'

const app_id = 512002768164
const catalog_url = 'https://dravk.ru/poisk_ok/detective/catalog/storeCatalog.json'

const flags = {...DEFAULT_FLAGS, ...PLATFORM_SCENARIOS.OK}
const ADAPTER = new Adapter({app_id, catalog_url, flags})

const gameStart = () => {
  if (window.createGame) window.createGame(ADAPTER)
}

gameStart()
