import {getLevelEntryById} from '../../gameConfig/levels/locationCatalog.js'

/**
 * Подменяет выбранный уровень несохранённым черновиком редактора.
 */

const DRAFT_QUERY_PARAMETER = 'sokobanDraft' // Параметр URL с идентификатором запускаемого черновика
const DRAFT_STORAGE_PREFIX = 'sokoban-level-editor-draft:' // Префикс черновиков в общем хранилище вкладок

// Читает указанный черновик из локального хранилища браузера.
const readDraft = (token) => {
  try {
    return JSON.parse(localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${token}`))
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

// Показывает поверх игры HTML-плашку режима черновика.
const showDraftBanner = () => {
  document.querySelector('#sokoban-draft-banner')?.removeAttribute('hidden')
}

// Применяет подходящий черновик к выбранному игровому уровню.
const applySokobanLevelDraft = (levelId, searchParams) => {
  const token = searchParams.get(DRAFT_QUERY_PARAMETER)
  if (!token) return false
  const draft = readDraft(token)
  const entry = getLevelEntryById(levelId)
  if (!entry || !isValidDraft(draft, levelId)) return false

  entry.level.map = [...draft.map]
  entry.level.appearance = structuredClone(draft.appearance)
  delete entry.level.solver
  delete entry.level.pushRecord
  showDraftBanner()
  return true
}

export {applySokobanLevelDraft}
