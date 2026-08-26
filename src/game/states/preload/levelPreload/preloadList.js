import LevelConfig from '../../../gameConfig/levels/LevelConfig.js'

const createPreloadList = (game, storage, levelIndex) => {
  const levelData = LevelConfig.getGameLevelData(levelIndex)

  return {
    spineLevelData: levelData,
    levelList: [],
    onceLoadList: [],
  }
}

export {createPreloadList}
