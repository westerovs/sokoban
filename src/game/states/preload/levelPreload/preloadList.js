import LevelConfig from '../../../gameConfig/LevelConfig.js'

// при формировании листа берет отфильтрованные уровни по флагам из LevelConfig (а в нем ABTest)
export const createPreloadList = (game, storage, levelIndex) => {
  const spineLevelData = LevelConfig.getGameLevelData(levelIndex)
  
  const {background} = spineLevelData

  return {
    spineLevelData,

    levelList: [
      background,
    ],
    onceLoadList: [],
  }
}
