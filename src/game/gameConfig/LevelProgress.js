import {getLevelEntries, getLevelEntryById, getLevelEntryByIndex, getLocationPageIndex, getLocations} from './locationCatalog.js'

/**
 * Хранит прогресс по стабильным идентификаторам карт и синхронизирует старый числовой levelIndex.
 */

export default class LevelProgress {
  #pageSize = 4
  #progressVersion = 1
  #storage

  constructor(storage) {
    this.#storage = storage
  }

  initialize = () => {
    const before = this.#createSnapshot()
    if (this.#storage.playerData.levelProgressVersion < this.#progressVersion) this.#migrateLegacyProgress()

    this.#sanitizeProgress()
    this.#unlockEligibleLocations()
    this.#syncSelectedEntry()
    this.#saveIfChanged(before)
  }

  get locationPageIndex() {
    return this.#storage.playerData.locationPageIndex
  }

  get selectedLocationId() {
    return this.#storage.playerData.selectedLocationId
  }

  getLocationStates = () => {
    const continueLocationId = this.getLastPlayedEntry()?.location.id

    return getLocations().map((location) => ({
      ...location,
      ...this.#getLocationProgress(location),
      isCurrent: location.id === continueLocationId,
    }))
  }

  getLevelStates = (locationId) => {
    const location = getLocations().find(({id}) => id === locationId)
    if (!location) return []

    const completedIds = this.#getCompletedIds()
    const isUnlocked = this.isLocationUnlocked(locationId)

    return location.levels.map((level, index) => ({
      ...level,
      isCompleted: completedIds.has(level.id),
      isUnlocked,
      locationLevelIndex: index,
    }))
  }

  getContinueEntry = () => {
    const completedIds = this.#getCompletedIds()
    const entry = getLevelEntries().find(({level, location}) => {
      return this.isLocationUnlocked(location.id) && !completedIds.has(level.id)
    })

    if (entry) return getLevelEntryById(entry.level.id)

    const lastEntry = getLevelEntries().at(-1)
    return lastEntry ? getLevelEntryById(lastEntry.level.id) : null
  }

  getLastPlayedEntry = () => {
    const entry = getLevelEntryById(this.#storage.playerData.lastPlayedLevelId)
    if (entry && this.isLocationUnlocked(entry.location.id)) return entry

    return this.getContinueEntry()
  }

  getSelectedEntry = (locationId = this.selectedLocationId) => {
    const selected = getLevelEntryById(this.#storage.playerData.selectedLevelId)
    if (selected?.location.id === locationId) return selected

    const continued = this.getContinueEntry()
    if (continued?.location.id === locationId) return continued

    const firstLevel = getLocations().find(({id}) => id === locationId)?.levels[0]
    return firstLevel ? getLevelEntryById(firstLevel.id) : null
  }

  isLocationUnlocked = (locationId) => {
    return this.#storage.playerData.unlockedLocationIds.includes(locationId)
  }

  selectPage = (pageIndex) => {
    const maxPage = Math.max(Math.ceil(getLocations().length / this.#pageSize) - 1, 0)
    this.#storage.playerData.locationPageIndex = Math.min(Math.max(pageIndex, 0), maxPage)
    this.#storage.save()
  }

  selectLocation = (locationId) => {
    if (!this.isLocationUnlocked(locationId)) return false

    this.#storage.playerData.selectedLocationId = locationId
    this.#storage.playerData.locationPageIndex = getLocationPageIndex(locationId, this.#pageSize)
    this.#storage.save()
    return true
  }

  selectLevel = (levelId, {ignoreLock = false, save = true} = {}) => {
    const entry = getLevelEntryById(levelId)
    if (!entry || (!ignoreLock && !this.#isLevelUnlocked(entry))) return false

    this.#setSelectedEntry(entry)
    if (save) this.#storage.save()
    return true
  }

  markLevelPlayed = (levelId) => {
    const entry = getLevelEntryById(levelId)
    if (!entry || !this.isLocationUnlocked(entry.location.id)) return false

    this.#storage.playerData.lastPlayedLevelId = levelId
    this.#storage.save()
    return true
  }

  completeLevel = (levelId) => {
    const entry = getLevelEntryById(levelId)
    if (!entry) throw new Error(`Уровень ${levelId} не найден`)

    const isFirstCompletion = this.#addCompletedLevel(levelId)
    this.#unlockEligibleLocations()
    this.#setSelectedEntry(this.getContinueEntry() ?? entry)
    if (isFirstCompletion) this.#storage.updateUserRecord()
    this.#storage.save()

    return {isFirstCompletion, isGameCompleted: this.#getCompletedIds().size === getLevelEntries().length}
  }

  #migrateLegacyProgress = () => {
    const entries = getLevelEntries()
    const legacyIndex = Math.min(Math.max(this.#storage.playerData.levelIndex, 0), entries.length)
    const completedCount = legacyIndex === 0 && this.#storage.playerData.userLevel > 1 ? entries.length : legacyIndex

    this.#storage.playerData.completedLevelIds = entries.slice(0, completedCount).map(({level}) => level.id)
    this.#storage.playerData.selectedLevelId = getLevelEntryByIndex(Math.min(legacyIndex, entries.length - 1)).level.id
    this.#storage.playerData.lastPlayedLevelId = this.#storage.playerData.selectedLevelId
    this.#storage.playerData.levelProgressVersion = this.#progressVersion
  }

  #sanitizeProgress = () => {
    const levelIds = new Set(getLevelEntries().map(({level}) => level.id))
    const locationIds = new Set(getLocations().map(({id}) => id))

    this.#storage.playerData.completedLevelIds = this.#uniqueExistingIds(this.#storage.playerData.completedLevelIds, levelIds)
    this.#storage.playerData.unlockedLocationIds = this.#uniqueExistingIds(this.#storage.playerData.unlockedLocationIds, locationIds)
    if (!levelIds.has(this.#storage.playerData.lastPlayedLevelId)) this.#storage.playerData.lastPlayedLevelId = null
  }

  #uniqueExistingIds = (ids, validIds) => {
    return [...new Set(Array.isArray(ids) ? ids : [])].filter((id) => validIds.has(id))
  }

  #unlockEligibleLocations = () => {
    const locations = getLocations()
    if (locations[0]) this.#addUnlockedLocation(locations[0].id)

    locations.slice(1).forEach((location, index) => {
      if (this.#isLocationCompleted(locations[index])) this.#addUnlockedLocation(location.id)
    })
  }

  #syncSelectedEntry = () => {
    const selected = getLevelEntryById(this.#storage.playerData.selectedLevelId)
    const fallback = getLevelEntryByIndex(this.#storage.playerData.levelIndex) ?? this.getContinueEntry()
    this.#setSelectedEntry(selected ?? fallback)
  }

  #setSelectedEntry = (entry) => {
    if (!entry) return

    this.#storage.playerData.selectedLevelId = entry.level.id
    this.#storage.playerData.selectedLocationId = entry.location.id
    this.#storage.playerData.locationPageIndex = getLocationPageIndex(entry.location.id, this.#pageSize)
    this.#storage.playerData.levelIndex = entry.globalIndex
  }

  #getLocationProgress = (location) => {
    const completedIds = this.#getCompletedIds()
    const completedCount = location.levels.filter((level) => completedIds.has(level.id)).length

    return {
      completedCount,
      totalCount: location.levels.length,
      isCompleted: completedCount === location.levels.length,
      isUnlocked: this.isLocationUnlocked(location.id),
    }
  }

  #isLevelUnlocked = (entry) => {
    const state = this.getLevelStates(entry.location.id).find(({id}) => id === entry.level.id)
    return Boolean(state?.isUnlocked)
  }

  #isLocationCompleted = (location) => {
    const completedIds = this.#getCompletedIds()
    return location.levels.every((level) => completedIds.has(level.id))
  }

  #addCompletedLevel = (levelId) => {
    if (this.#storage.playerData.completedLevelIds.includes(levelId)) return false

    this.#storage.playerData.completedLevelIds.push(levelId)
    return true
  }

  #addUnlockedLocation = (locationId) => {
    if (!this.#storage.playerData.unlockedLocationIds.includes(locationId)) {
      this.#storage.playerData.unlockedLocationIds.push(locationId)
    }
  }

  #getCompletedIds = () => new Set(this.#storage.playerData.completedLevelIds)

  #createSnapshot = () => {
    const data = this.#storage.playerData
    return JSON.stringify({
      version: data.levelProgressVersion,
      selectedLevelId: data.selectedLevelId,
      lastPlayedLevelId: data.lastPlayedLevelId,
      selectedLocationId: data.selectedLocationId,
      completedLevelIds: data.completedLevelIds,
      unlockedLocationIds: data.unlockedLocationIds,
      locationPageIndex: data.locationPageIndex,
      levelIndex: data.levelIndex,
    })
  }

  #saveIfChanged = (before) => {
    if (before !== this.#createSnapshot()) this.#storage.save()
  }
}
