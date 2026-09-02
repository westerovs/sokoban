import {getLevelEntryById} from '../../gameConfig/levels/locationCatalog.js'
import type {LevelAppearance} from '../../gameConfig/levels/levelTypes.js'

/**
 * Подменяет выбранный уровень несохранённым черновиком редактора.
 */

const DRAFT_QUERY_PARAMETER = 'sokobanDraft' // Параметр URL с идентификатором запускаемого черновика
const DRAFT_STORAGE_PREFIX = 'sokoban-level-editor-draft:' // Префикс черновиков в общем хранилище вкладок

type SokobanLevelDraft = {
  levelId: string
  map: string[]
  appearance: LevelAppearance
}

// Читает указанный черновик из локального хранилища браузера.
const readDraft = (token: string): unknown => {
  try {
    const serializedDraft = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${token}`)
    return serializedDraft ? JSON.parse(serializedDraft) : null
  } catch {
    return null
  }
}

// Проверяет структуру и принадлежность сохранённого черновика.
const isValidDraft = (draft: unknown, levelId: string): draft is SokobanLevelDraft => {
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return false

  const candidate = draft as Partial<SokobanLevelDraft>
  const hasMap = Array.isArray(candidate.map) && candidate.map.length > 0 && candidate.map.every((row) => typeof row === 'string')
  const hasAppearance = candidate.appearance && typeof candidate.appearance === 'object' && !Array.isArray(candidate.appearance)
  return candidate.levelId === levelId && Boolean(hasMap && hasAppearance)
}

// Показывает поверх игры HTML-плашку режима черновика.
const showDraftBanner = () => {
  document.querySelector('#sokoban-draft-banner')?.removeAttribute('hidden')
}

// Применяет подходящий черновик к выбранному игровому уровню.
const applySokobanLevelDraft = (levelId: string, searchParams: URLSearchParams) => {
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

export {
  applySokobanLevelDraft,
}
