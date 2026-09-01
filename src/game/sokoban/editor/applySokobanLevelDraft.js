import {getLevelEntryById} from '../../gameConfig/levels/locationCatalog.js'

/**
 * Подменяет выбранный уровень несохранённым черновиком редактора.
 */

const DRAFT_QUERY_PARAMETER = 'sokobanDraft' // Параметр URL, разрешающий загрузку черновика
const DRAFT_STORAGE_KEY = 'sokoban-level-editor-draft' // Ключ черновика в sessionStorage

// Читает черновик уровня из текущей браузерной сессии.
const readDraft = () => {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY))
  } catch {
    return null
  }
}

// Проверяет структуру и принадлежность сохранённого черновика.
const isValidDraft = (draft, levelId) => {
  const hasMap = Array.isArray(draft?.map) && draft.map.length > 0 && draft.map.every((row) => typeof row === 'string')
  const hasAppearance = draft?.appearance && typeof draft.appearance === 'object' && !Array.isArray(draft.appearance)
  return draft?.levelId === levelId && hasMap && hasAppearance
}

// Применяет подходящий черновик к выбранному игровому уровню.
const applySokobanLevelDraft = (levelId, searchParams) => {
  if (searchParams.get(DRAFT_QUERY_PARAMETER) !== '1') return false
  const draft = readDraft()
  const entry = getLevelEntryById(levelId)
  if (!entry || !isValidDraft(draft, levelId)) return false

  entry.level.map = [...draft.map]
  entry.level.appearance = structuredClone(draft.appearance)
  delete entry.level.solver
  delete entry.level.pushRecord
  return true
}

export {applySokobanLevelDraft}
