import ABTest from '../../modules/ABTest.js'
import type {CatalogEntry, LevelEntry, LocationDefinition} from './levelTypes.js'

/**
 * Даёт единый доступ к иерархии локаций и уровням без привязки вызывающего к структуре JSON.
 * Формирует плоские записи уровней и выполняет поиск по глобальному индексу или стабильному идентификатору.
 */

const DEFAULT_LOCATION_PAGE_SIZE = 4 // Количество локаций на одной вкладке экрана выбора

// Возвращает доступные в текущем сценарии локации.
const getLocations = (): LocationDefinition[] => ABTest.getFilteredLocations() as LocationDefinition[]

// Создаёт плоский каталог уровней с координатами внутри локаций.
const getLevelEntries = (): CatalogEntry[] => {
  return getLocations().flatMap((location, locationIndex) => {
    return location.levels.map((level, locationLevelIndex) => ({
      level,
      location,
      locationIndex,
      locationLevelIndex,
    }))
  })
}

// Возвращает запись уровня по глобальному индексу.
const getLevelEntryByIndex = (levelIndex: number): LevelEntry => {
  const entries = getLevelEntries()
  const safeIndex = Math.min(Math.max(Number(levelIndex) || 0, 0), Math.max(entries.length - 1, 0))

  return {...entries[safeIndex], globalIndex: safeIndex} as LevelEntry
}

// Возвращает запись уровня по стабильному идентификатору.
const getLevelEntryById = (levelId: string | null): LevelEntry | null => {
  const entries = getLevelEntries()
  const globalIndex = entries.findIndex(({level}) => level.id === levelId)
  if (globalIndex < 0) return null

  return {...entries[globalIndex], globalIndex}
}

// Возвращает локацию по стабильному идентификатору.
const getLocationById = (locationId: string) => {
  return getLocations().find((location) => location.id === locationId) ?? null
}

// Возвращает индекс локации в отфильтрованном каталоге.
const getLocationIndexById = (locationId: string) => {
  return getLocations().findIndex((location) => location.id === locationId)
}

// Рассчитывает страницу, на которой расположена локация.
const getLocationPageIndex = (locationId: string, pageSize = DEFAULT_LOCATION_PAGE_SIZE) => {
  return Math.max(Math.floor(getLocationIndexById(locationId) / pageSize), 0)
}

export {
  getLevelEntries,
  getLevelEntryById,
  getLevelEntryByIndex,
  getLocationById,
  getLocationIndexById,
  getLocationPageIndex,
  getLocations,
}
