import {PLATFORM_SCENARIOS} from '@/game/gameConfig/constants.js'
import Adapter from '../adapters/YandexAdapter.js'

/**
 * Запуск в режиме Dev позволяет потестить яндекс так, как если бы игра была залита на сервер яндекса
 * Но в этом режиме не будет работать доступ по IP для теста с телефона. Он работает только в noAdapter
 * См настройки bundler/platformConfig.mjs
 */


console.clear()
const flags = {...PLATFORM_SCENARIOS.YANDEX}
const ADAPTER = new Adapter({app_id: 393972, leaderboard_name: 'MainLeaders', flags})

const gameStart = () => {
  if (window.createGame) window.createGame(ADAPTER)
}

gameStart()
