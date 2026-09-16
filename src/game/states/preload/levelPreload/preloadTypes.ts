import type {RuntimeLevelConfig} from '@/game/gameConfig/levels/levelTypes.ts'

// Описывает промежуточные данные предзагрузки одного уровня.

type LevelPreloadList = {
  levelList: any[]
  onceLoadList: any[]
  spineLevelData: Omit<RuntimeLevelConfig, 'bgTexture' | 'currentSkinName'>
}

type PreloadTextData = {
  textLevel: string
  textLoading: string
  userLevel: number
}

export type {LevelPreloadList, PreloadTextData}
