import Adapter from '../adapters/YandexAdapter.js'

const ADAPTER = new Adapter({leaderboard_name: 'MainLeaders'})

const gameStart = () => {
  if (window.createGame) window.createGame(ADAPTER)
}

gameStart()
