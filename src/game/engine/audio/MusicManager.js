import {GAME_STATES} from '../../gameConfig/constants.js'
import {GAME_EVENTS} from '../../gameConfig/gameEvents.js'
import LevelConfig from '../../gameConfig/LevelConfig.js'
import {Logger, MODULES} from '../../utils/Logger.js'
import Locator from '../Locator.ts'
import {STORAGE_KEYS} from '../storage/defaultData.js'

/*
 * Отвечает за запуск и приостановку музыки на конкретном уровне
 * */

export default class MusicManager {
  #game
  #soundManager
  #levelMusicRequestId = 0
  #currentLevelTrack = null

  constructor(soundManager) {
    this.#game = Locator.game
    this.#soundManager = soundManager
  }

  // Ждёт первый клик
  init() {
    this.#setEvents()
    this.#loadStartMusic()
  }

  #setEvents = () => {
    this.#game.on(GAME_EVENTS.checkoutState, this.#play)
    this.#game.once(GAME_EVENTS.firstClick, this.#onFirstClick)
    this.#game.on(GAME_EVENTS.Options.toggleAudioVolume, (type, isMute) => {
      if (type === STORAGE_KEYS.option_isPlayMusic && !isMute) this.#play()
    })
  }

  #loadStartMusic() {
    const {START_MUSIC} = this.#soundManager.preloadAudioList
    this.#soundManager.preload(this.#soundManager.musicList, START_MUSIC)
  }

  #onFirstClick = () => {
    this.#play()
  }

  startLevelMusic = async () => {
    this.stopLevelMusic()

    const trackName = this.#getLevelTrackName()
    if (!trackName) return

    const requestId = ++this.#levelMusicRequestId
    this.#currentLevelTrack = trackName
    const isLoaded = await this.#soundManager.preloadLevelMusic(trackName)

    if (!isLoaded || requestId !== this.#levelMusicRequestId) return
    if (this.#game.currentStateName !== GAME_STATES.levelState) return

    this.#play()
  }

  stopLevelMusic = () => {
    this.#levelMusicRequestId++
    this.#currentLevelTrack = null
    this.#soundManager.unloadLevelMusic()
  }

  #getLevelTrackName = () => {
    const levelIndex = Locator.storage.playerData.levelIndex
    const {music: trackName} = LevelConfig.getGameLevelData(levelIndex)

    if (!trackName) {
      Logger.warn(MODULES.SOUND_MANAGER, `[MusicManager] Music is not configured for level: ${levelIndex}`)
      return null
    }

    return trackName
  }

  #play = () => {
    const stateName = this.#game.currentStateName
    if (!stateName) return

    Logger.log(MODULES.SOUND_MANAGER, `[MusicManager state]: ${stateName}`)

    const musicMap = {
      [GAME_STATES.gameState]: 'm_start-screen',
      [GAME_STATES.levelState]: this.#currentLevelTrack,
    }

    const musicName = musicMap[stateName]
    if (!musicName) return

    try {
      if (this.#soundManager.isPlaying(musicName)) return

      const sound = this.#soundManager.musicList[musicName]
      if (!sound) return

      if (sound.state() === 'loaded' || sound.state() === 'loading') {
        this.#soundManager.play(musicName, {loop: true, isMusic: true})
      } else {
        sound.on('load', () => this.#soundManager.play(musicName, {loop: true, isMusic: true}))
      }
    } catch (e) {
      console.log('MusicManager play', e)
    }
  }
}
