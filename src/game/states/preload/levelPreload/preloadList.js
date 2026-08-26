import LevelConfig from '../../../gameConfig/LevelConfig.js'

const createPreloadList = (game, storage, levelIndex) => {
  const levelData = LevelConfig.getGameLevelData(levelIndex)

  return {
    spineLevelData: levelData,
    levelList: [],
    onceLoadList: [],
  }
}

export {createPreloadList}
