import LevelConfig from '../../../gameConfig/LevelConfig.js'

const createPreloadList = (levelIndex) => {
  const levelData = LevelConfig.getGameLevelData(levelIndex)

  return {
    levelData,
    levelList: [levelData.background],
  }
}

export {
  createPreloadList,
}
