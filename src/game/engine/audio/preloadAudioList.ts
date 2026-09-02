import {createSfxList} from '@/game/generatedAssets/soundList.js'
import {ASSETS_URL} from '../../gameConfig/constants.js'
import type {PreloadAudioList} from './audioTypes.js'

// Формирует списки музыки и звуков для предварительной загрузки.

// Создаёт полный список стартовых аудиоресурсов.
const createPreloadAudioList = (): PreloadAudioList => {
  // const locale = (testLocale) ? testLocale : Locator.gameConfig.locale
  const {local: localPath} = ASSETS_URL

  return {
    START_MUSIC: [
      {alias: `m_start-screen`, src: `${localPath}assets/audio/music/m_start-screen.mp3`},
      {alias: `silence`, src: `${localPath}assets/audio/silence.mp3`},
    ],
    SFX: [...createSfxList()],
  }
}

export {createPreloadAudioList}
