import {Howl, Howler} from 'howler'
import {ASSETS_URL} from '../../gameConfig/constants.js'
import {ADAPTER_EVENTS,GAME_EVENTS} from '../../gameConfig/gameEvents.js'
import YaMetrika, {ERROR_TYPES} from '../../modules/metrika/YaMetrika.js'
import {Logger, MODULES} from '../../utils/Logger.js'
import Locator from '../Locator.ts'
import SdkManager from '../SdkManager.js'
import {STORAGE_KEYS} from '../storage/defaultData.js'
import {antiMuteIOS} from './antiMuteIOS.js'
import MusicManager from './MusicManager.js'
import {createPreloadAudioList} from './preloadAudioList.ts'

export default class SoundManager {
  #game
  #preloadAudioList
  #musicManager = new MusicManager(this)
  #musicVolume = 1
  #sfxVolume = 1
  #isInit = false
  #musicList = []
  #sfxList = []
  #levelMusicAliases = []
  
  get preloadAudioList() {
    return this.#preloadAudioList
  }
  
  get musicList() {
    return this.#musicList
  }
  
  getAudioDebugStats = () => {
    const allSounds = [...new Set(Howler._howls ?? [])]
      .filter(sound => sound?.state?.() !== 'unloaded')
    const musicSounds = [...new Set(Object.entries(this.#musicList)
      .filter(([alias]) => alias !== 'silence')
      .map(([, sound]) => sound))]
      .filter(sound => sound?.state?.() !== 'unloaded')

    return {
      totalFiles: allSounds.length,
      musicFiles: musicSounds.length,
      totalDecodedBytes: this.#calcDecodedAudioBytes(allSounds),
      musicDecodedBytes: this.#calcDecodedAudioBytes(musicSounds),
    }
  }
  
  constructor(game) {
    if (typeof SoundManager.instance === 'object') {
      return SoundManager.instance
    }
    
    this.#game = game
    
    SoundManager.instance = this
    return SoundManager.instance
  }

  #calcDecodedAudioBytes = (sounds) => {
    const sampleRate = Howler.ctx?.sampleRate ?? 44100
    const bytesPerFloatSample = 4
    const fallbackChannels = 2

    return sounds.reduce((totalBytes, sound) => {
      const audioBuffer = sound?._sounds
        ?.map(item => item?._node?.bufferSource?.buffer)
        .find(buffer => buffer?.length > 1)

      if (audioBuffer) {
        return totalBytes + audioBuffer.length * audioBuffer.numberOfChannels * bytesPerFloatSample
      }

      const duration = Number(sound?.duration?.())
      if (!Number.isFinite(duration) || duration <= 0) return totalBytes

      return totalBytes + duration * sampleRate * fallbackChannels * bytesPerFloatSample
    }, 0)
  }
  
  init = () => {
    this.#mute(true)
    
    this.#preloadAudioList = createPreloadAudioList()
    this.#setInitVolume()
    document.addEventListener('click', this.#onFirstClick, {once: true})
  }
  
  clearSoundList = (soundList) => {
    Object.entries(soundList).forEach(([key, sound]) => {
      sound?.unload?.()
      delete soundList[key]
      // console.log('[clearSoundList] sound unload', key)
    })
    soundList.length = 0
  }
  
  // ----------------- init -----------------
  #onFirstClick = async () => {
    if (this.#isInit) return
    await this.#initAction()
    this.#setEvents()
  }
  
  #initAction = async () => {
    try {
      const basePath = ASSETS_URL.local
      antiMuteIOS(`${basePath}assets/audio/silence.mp3`)
    } catch (err) {
      console.error('initAction', err)
    } finally {
      this.#isInit = true
      this.#musicManager.init()

      this.#game.emit(GAME_EVENTS.firstClick)
    }
  }
  
  #setInitVolume() {
    const {option_isPlayMusic, option_isPlaySFX} = Locator.storage.playerData
    this.#setVolume(STORAGE_KEYS.option_isPlayMusic, option_isPlayMusic)
    this.#setVolume(STORAGE_KEYS.option_isPlaySFX, option_isPlaySFX)
  }
  
  #setEvents = () => {
    SdkManager.adapter.on(ADAPTER_EVENTS.AUDIO_OFF_EVENT, () => {
      this.#mute(true)
    })
    SdkManager.adapter.on(ADAPTER_EVENTS.AUDIO_ON_EVENT, () => {
      // if (SdkManager.adapter.isPaused()) return // todo вернуть если будут проблемы с playgama
      this.#mute(false)
    })
    
    this.#game.on(GAME_EVENTS.Options.toggleAudioVolume, this.#setVolume)
  }
  
  // ----------------- preload todo вынести в класс PreloadSound
  startLevelMusic = () => {
    this.#musicManager.startLevelMusic()
  }

  stopLevelMusic = () => {
    this.#musicManager.stopLevelMusic()
  }

  preloadLevelMusic = async (trackAlias) => {
    this.unloadLevelMusic()

    const basePath = ASSETS_URL.local
    const track = {
      alias: trackAlias,
      src: `${basePath}assets/audio/music/level-music/${trackAlias}.mp3`,
    }

    const victory = {
      alias: 'm_victory',
      src: `${basePath}assets/audio/music/m_victory.mp3`,
    }

    this.#levelMusicAliases = [track.alias, victory.alias]
    this.preload(this.#musicList, [victory])
    await this.preload(this.#musicList, [track])

    return this.#musicList[trackAlias]?.state() === 'loaded'
  }

  unloadLevelMusic = () => {
    this.#levelMusicAliases.forEach(alias => {
      const sound = this.#musicList[alias]
      sound?.stop()
      sound?.unload()
      delete this.#musicList[alias]
    })

    this.#levelMusicAliases = []
  }
  
  preloadSFXFMain = async () => {
    try {
      const {SFX} = this.#preloadAudioList

      await this.preload(this.#sfxList, SFX, true)

      Logger.log(MODULES.SOUND_MANAGER, 'soundManager loaded: sfx')
    } catch (err) {
      console.error(`[SoundManager firstLoadAndInit error]: ${err}`)
    }
  }
  
  preloadSFXFLevel = async () => {
    try {
      const {SFX} = this.#preloadAudioList
      
      await this.preload(this.#sfxList, SFX, true)
    } catch (err) {
      console.error(`[SoundManager firstLoadAndInit error]: ${err}`)
    }
  }
  
  preload = (array, assets, preload = true, callBack) => {
    const promises = assets.map(audio => {
      return new Promise(resolve => {
        try {
          if (array[audio.alias]) {
            resolve() // Если звук уже существует, сразу разрешаем промис
            return
          }

          const src = Array.isArray(audio.src) ? audio.src : [audio.src]
          const sound = new Howl({src: src, preload})
          array[audio.alias] = sound

          // Разрешаем промис после завершения загрузки
          sound.once('load', () => {
            try {
              if (callBack) callBack()
              Logger.log(MODULES.SOUND_MANAGER, `sound is loaded:  ${audio.alias}`)
              resolve()
            } catch (e) {
              YaMetrika.preloadError(ERROR_TYPES?.SOUND_PRELOAD?.loading, e)
              resolve()
            }
          })

          // Обработка ошибок при загрузке
          sound.once('loaderror', (id, err) => {
            // hardcode проверка для теста
            if (audio.alias === 'm_start-screen') {
              const backupUrl = ''
              const backupSrc = `${backupUrl}assets/audio/music/m_start-screen.mp3`

              const fallbackSound = new Howl({ src: [backupSrc], preload })

              fallbackSound.once('load', () => {
                array[audio.alias] = fallbackSound
                Logger.log(MODULES.SOUND_MANAGER, `sound is loaded from fallback: ${audio.alias}`)
                if (callBack) callBack()
                this.#game.emit(GAME_EVENTS.firstClick)
                resolve()
              })

              fallbackSound.once('loaderror', (id2, err2) => {
                console.log(`[fallback] Failed to load backup for ${audio.alias}:`, err2)
                YaMetrika.soundLoadErr(audio, err2)
                resolve()
              })

              return // важно: не идём дальше после fallback

            }
            YaMetrika.soundLoadErr(audio, err)
            resolve() // Пропускаем файл и продолжаем
          })

        } catch (err) {
          console.error('[preload] Error during sound setup', err)
          YaMetrika.preloadError(ERROR_TYPES?.SOUND_PRELOAD?.loading, err)
          resolve() // Пропускаем ошибку
        }
      })
    })

    // Возвращаем промис, который разрешится, когда все звуки загрузятся
    return Promise.all(promises).catch(e => {
      console.error('[preload] Error in Promise.all', e)
    })
  }
  
  /* метод мгновенно подгружает звук и воспроизводит. Используется для уникальных звуков и амбиента
   возможно стоит переделать такие звуки грузить фоном, но т.к они очень мало весят, проблемы не создают*/
  loadAndPlaySFX = (keySound, src, {loop = true, volume = 1.0} = {}) => {
    if (this.#sfxList[keySound]) {
      // Если уже загружен, просто воспроизводим
      this.#playSound(this.#sfxList[keySound], {loop, volume})
      return
    }
    
    const sound = new Howl({src: [src], loop, volume, preload: true,})
    this.#sfxList[keySound] = sound
    
    sound.once('load', () => {
      this.#playSound(sound, {loop, volume})
    })
    
    sound.once('loaderror', (id, err) => {
      Logger.warn(MODULES.SOUND_MANAGER, `[loadAndPlaySFX] Load error: ${keySound}`, err)
    })
  }
  
  
  // ----------------- play / stop -----------------
  async play(keySound, {loop = false, volume = 1.0} = {}) {
    try {
      if (!this.#isInit) return Promise.resolve(false) // Возвращаем resolved промис, если звук не инициализирован

      const sound = this.#getSound(keySound)

      if (sound) {
        if (this.#musicList[keySound]) {
          this.#playSound(sound, {loop, volume, isMusic: true})
        }
        else if (this.#sfxList[keySound]) {
          this.#playSound(sound, {loop, volume})
        }

        // Возвращаем промис, который разрешится по завершению звука
        return new Promise(resolve => {
          sound.once('end', resolve)
        })
      } else {
        console.log('No found sound', keySound)
        return Promise.resolve() // Если звук не найден, возвращаем resolved промис
      }
    } catch (e) {
      console.error('[play]', e)
    }
  }
  
  #playSound(sound, {loop = false, volume = 1.0, isMusic = false}) {
    if (isMusic) {
      Object.values(this.#musicList).forEach(music => music.stop())
    }
    
    const finalVolume = isMusic
      ? volume * this.#musicVolume
      : volume * this.#sfxVolume
    
    sound.loop(loop)
    sound.volume(finalVolume)
    sound.play()
  }
  
  #getSound(keySound) {
    return this.#musicList[keySound] || this.#sfxList[keySound]
  }
  
  stop(keySound, fadeDuration = 0) {
    const sound = this.#getSound(keySound)
    if (sound) {
      if (sound.playing()) {
        sound.fade(sound.volume(), 0, fadeDuration)
        setTimeout(() => sound.stop(), fadeDuration)
      }
    }
  }
  
  stopAll() {
    console.log('[stopAll sounds]')
    ;[this.#musicList, this.#sfxList].forEach(type => {
      Object.values(type).forEach(sound => {
        if (sound.playing()) sound.stop()
      })
    })
  }
  
  isPlaying(keySound) {
    const sound = this.#getSound(keySound)
    return sound ? sound.playing() : false
  }
  
  
  // ------------- mute / unmute / volume -------------
  #mute = (bool) => {
    Howler.mute(bool)
  }
  
  #setVolume = (type, isMute) => {
    const volume = isMute ? 1 : 0
    
    if (type === STORAGE_KEYS.option_isPlayMusic) this.#musicVolume = volume
    if (type === STORAGE_KEYS.option_isPlaySFX) this.#sfxVolume = volume
    
    const soundMap = {
      [STORAGE_KEYS.option_isPlaySFX]: [this.#sfxList],
      [STORAGE_KEYS.option_isPlayMusic]: [this.#musicList],
    }
    
    const soundGroups = soundMap[type]
    if (!soundGroups) return
    
    soundGroups.forEach(group => {
      Object.values(group).forEach(track => track.volume(volume))
    })
  }
}
