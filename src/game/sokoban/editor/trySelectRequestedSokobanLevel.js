import LevelProgress from '../../gameConfig/levels/LevelProgress.js'
import {applySokobanLevelDraft} from './applySokobanLevelDraft.js'

/**
 * Выбирает запрошенный из URL уровень и при необходимости применяет его черновик.
 */

const LEVEL_QUERY_PARAMETER = 'sokobanLevel' // Параметр URL с идентификатором запускаемого уровня

// Выбирает указанный в URL уровень в режиме разработки.
const trySelectRequestedSokobanLevel = (storage) => {
  if (!import.meta.env.DEV) return false

  const searchParams = new URLSearchParams(window.location.search)
  const levelId = searchParams.get(LEVEL_QUERY_PARAMETER)
  if (!levelId) return false

  const isDraftApplied = applySokobanLevelDraft(levelId, searchParams)
  if (isDraftApplied) storage.enableReadOnlyMode()

  const progress = new LevelProgress(storage)
  return progress.selectLevel(levelId, {ignoreLock: true, save: false})
}

export {trySelectRequestedSokobanLevel}
