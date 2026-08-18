import Adapter from '../adapters/VkAdapter.js'
import {DEFAULT_FLAGS, PLATFORM_SCENARIOS} from '@/game/gameConfig/constants.js'


const app_id = 53585935
const catalog_url = 'https://dravk.ru/hog/detective/vk/catalog/storeCatalog.json'

const flags = {...DEFAULT_FLAGS, ...PLATFORM_SCENARIOS.VK}
const ADAPTER = new Adapter({app_id, catalog_url, flags})

const gameStart = () => {
  if (window.createGame) window.createGame(ADAPTER)
}

gameStart()
