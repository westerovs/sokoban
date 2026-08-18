import {ASSETS_URL} from '../../../gameConfig/constants.js'
import LevelConfig from '../../../gameConfig/LevelConfig.js'
import Locator from '../../../engine/Locator.ts'

// при формировании листа берет отфильтрованные уровни по флагам из LevelConfig (а в нем ABTest)
export const createPreloadList = (game, storage, levelIndex) => {
  const spineLevelData = LevelConfig.getGameLevelData(levelIndex)
  const {introSpeech, outroSpeech} = LevelConfig.getSpeechAndTextData()
  
  const {hudSpriteSheet, background} = spineLevelData
  
  const locale = Locator.gameConfig.locale
  const localPath = ASSETS_URL.local
  const remotePath = ASSETS_URL.remote
  const speechPath = (locale === 'ru') ? localPath : remotePath // вся ру озвучка в архиве, остальные на сервере, если не поместилась
  
  return {
    spineLevelData,

    levelList: [
      hudSpriteSheet,
      background,
    ],
    onceLoadList: [],
    speechList: [
      {
        alias: introSpeech,
        src: `${speechPath}assets/audio/speech/${locale}/intro/${introSpeech}.mp3`
      },
      {
        alias: outroSpeech,
        src: `${speechPath}assets/audio/speech/${locale}/outro/${outroSpeech}.mp3`
      },
    ],
  }
}
