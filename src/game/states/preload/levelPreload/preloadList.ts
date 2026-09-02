import LevelConfig from '../../../gameConfig/levels/LevelConfig.js'
import type Game from '../../../Game.js'
import type Storage from '../../../engine/storage/Storage.js'
import type {LevelPreloadList} from './preloadTypes.js'

// Формирует данные и списки ресурсов для выбранного уровня.

// Создаёт описание загрузки уровня по его индексу.
const createPreloadList = (_game: Game, _storage: Storage, levelIndex: number): LevelPreloadList => {
  const levelData = LevelConfig.getGameLevelData(levelIndex)

  return {
    spineLevelData: levelData,
    levelList: [],
    onceLoadList: [],
  }
}

export {createPreloadList}
