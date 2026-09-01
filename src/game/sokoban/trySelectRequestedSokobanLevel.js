import LevelProgress from '../gameConfig/levels/LevelProgress.js'

const LEVEL_QUERY_PARAMETER = 'sokobanLevel'

const trySelectRequestedSokobanLevel = (storage) => {
  if (!import.meta.env.DEV) return false

  const levelId = new URLSearchParams(window.location.search).get(LEVEL_QUERY_PARAMETER)
  if (!levelId) return false

  const progress = new LevelProgress(storage)
  return progress.selectLevel(levelId, {ignoreLock: true, save: false})
}

export {
  trySelectRequestedSokobanLevel,
}
