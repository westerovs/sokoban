import type Game from '../../Game.js'
import {GAME_STATES} from '../../gameConfig/constants.js'
import {GAME_EVENTS} from '../../gameConfig/gameEvents.js'
import LevelConfig from '../../gameConfig/levels/LevelConfig.js'
import Logger, {MODULES} from '../../utils/Logger.js'
import Locator from '../Locator.ts'
import {STORAGE_KEYS} from '../storage/defaultData.js'
import type SoundManager from './SoundManager.js'

/*
 * Отвечает за запуск и приостановку музыки на конкретном уровне
 * */

export default class MusicManager {
  #game: Game
  #soundManager: SoundManager
  #levelMusicRequestId = 0
  #currentLevelTrack: string | null = null

  // Сохраняет аудиосистему и игровую шину событий.
  constructor(soundManager: SoundManager) {
    this.#game = Locator.game
    this.#soundManager = soundManager
  }

  // Ждёт первый клик
  init() {
    this.#setEvents()
    this.#loadStartMusic()
  }

  // Подключает события смены состояния и громкости.
  #setEvents = () => {
    this.#game.on(GAME_EVENTS.checkoutState, this.#play)
    this.#game.once(GAME_EVENTS.firstClick, this.#onFirstClick)
    this.#game.on(GAME_EVENTS.Options.toggleAudioVolume, (type: string, isMute: boolean) => {
      if (type === STORAGE_KEYS.option_isPlayMusic && !isMute) this.#play()
    })
  }

  // Запускает предварительную загрузку музыки главного экрана.
  #loadStartMusic() {
    const {START_MUSIC} = this.#soundManager.preloadAudioList
    this.#soundManager.preload(this.#soundManager.musicList, START_MUSIC)
  }

  // Запускает музыку после первого пользовательского действия.
  #onFirstClick = () => {
    this.#play()
  }

  // Загружает и запускает музыку текущего уровня.
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

  // Останавливает и выгружает музыку уровня.
  stopLevelMusic = () => {
    this.#levelMusicRequestId++
    this.#currentLevelTrack = null
    this.#soundManager.unloadLevelMusic()
  }

  // Возвращает имя музыкального трека текущего уровня.
  #getLevelTrackName = () => {
    const levelIndex = Locator.storage.playerData.levelIndex
    const {music: trackName} = LevelConfig.getGameLevelData(levelIndex)

    if (!trackName) {
      Logger.warn(MODULES.SOUND_MANAGER, `[MusicManager] Music is not configured for level: ${levelIndex}`)
      return null
    }

    return trackName
  }

  // Выбирает и запускает музыку активного состояния игры.
  #play = () => {
    const stateName = this.#game.currentStateName
    if (!stateName) return

    Logger.log(MODULES.SOUND_MANAGER, `[MusicManager state]: ${stateName}`)

    const musicMap: Record<string, string | null> = {
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
      console.error('[MusicManager]: playback failed', e)
    }
  }
}
