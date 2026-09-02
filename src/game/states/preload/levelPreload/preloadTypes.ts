import type {RuntimeLevelConfig} from '../../../gameConfig/levels/levelTypes.js'

// Описывает промежуточные данные предзагрузки одного уровня.

type LevelPreloadList = {
  levelList: any[]
  onceLoadList: any[]
  spineLevelData: Omit<RuntimeLevelConfig, 'bgTexture' | 'currentSkinName'>
}

type PreloadTextData = {
  partIndex: number
  textLevel: string
  textLoading: string
  textPart: string
  userLevel: number
}

export type {LevelPreloadList, PreloadTextData}
