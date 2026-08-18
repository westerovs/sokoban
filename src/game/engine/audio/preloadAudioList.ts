import {ASSETS_URL} from '../../gameConfig/constants.js'
import Locator from '@/game/engine/Locator'
import {createClickItemSfxList, createClickItemsSpeechList, createSfxList} from '@/game/generatedAssets/soundList.js'

export const createPreloadAudioList = (testLocale?: string) => {
  const locale = (testLocale) ? testLocale : Locator.gameConfig.locale
  const {local: localPath, remote: remotePath} = ASSETS_URL

  // ru speech всегда загружает из локальной директории
  const speechPath = (locale === 'ru') ? localPath : remotePath

  return {
    START_MUSIC: [
      {alias: `m_start-screen`, src: `${localPath}assets/audio/music/m_start-screen.mp3`},
      {alias: `silence`, src: `${localPath}assets/audio/silence.mp3`},
    ],
    CLICK_ITEMS_SPEECH: [
      ...createClickItemsSpeechList({locale, basePath: speechPath})
    ],
    PARTS_SPEECH: [],
    CLICK_ITEMS: [...createClickItemSfxList()],
    SFX: [...createSfxList()],
  }
}
