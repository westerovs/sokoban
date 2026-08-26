import ABTest from '../../modules/ABTest.js'

/**
 * Даёт единый доступ к иерархии локаций и уровням без привязки вызывающего к структуре JSON.
 * Формирует плоские записи уровней и выполняет поиск по глобальному индексу или стабильному идентификатору.
 */

const DEFAULT_LOCATION_PAGE_SIZE = 4 // Количество локаций на одной вкладке экрана выбора

const getLocations = () => ABTest.getFilteredLocations()

const getLevelEntries = () => {
  return getLocations().flatMap((location, locationIndex) => {
    return location.levels.map((level, locationLevelIndex) => ({
      level,
      location,
      locationIndex,
      locationLevelIndex,
    }))
  })
}

const getLevelEntryByIndex = (levelIndex) => {
  const entries = getLevelEntries()
  const safeIndex = Math.min(Math.max(Number(levelIndex) || 0, 0), Math.max(entries.length - 1, 0))

  return {...entries[safeIndex], globalIndex: safeIndex}
}

const getLevelEntryById = (levelId) => {
  const entries = getLevelEntries()
  const globalIndex = entries.findIndex(({level}) => level.id === levelId)
  if (globalIndex < 0) return null

  return {...entries[globalIndex], globalIndex}
}

const getLocationById = (locationId) => {
  return getLocations().find((location) => location.id === locationId) ?? null
}

const getLocationIndexById = (locationId) => {
  return getLocations().findIndex((location) => location.id === locationId)
}

const getLocationPageIndex = (locationId, pageSize = DEFAULT_LOCATION_PAGE_SIZE) => {
  return Math.max(Math.floor(getLocationIndexById(locationId) / pageSize), 0)
}

export {getLevelEntries, getLevelEntryById, getLevelEntryByIndex, getLocationById, getLocationIndexById, getLocationPageIndex, getLocations}
