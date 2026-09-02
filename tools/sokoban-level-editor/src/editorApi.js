/**
 * Связывает браузерный редактор с API сохранения, решателя и запуска черновика.
 */

const EDITOR_API_URL = '/__sokoban-level-editor/data'
const SOLVER_API_URL = '/__sokoban-level-editor/solve'
const DRAFT_STORAGE_PREFIX = 'sokoban-level-editor-draft:' // Префикс временных черновиков в общем хранилище вкладок

// Разбирает входные данные через операцию `parseResponse`.
const parseResponse = async (response) => {
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`)
  return data
}

// Возвращает данные, за которые отвечает операция `loadEditorData`.
const loadEditorData = async () => {
  return await parseResponse(await fetch(EDITOR_API_URL, {cache: 'no-store'}))
}

// Выполняет отдельную операцию `saveEditorLevel`.
const saveEditorLevel = async (levelId, map, appearance) => {
  const response = await fetch(EDITOR_API_URL, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({levelId, map, appearance}),
  })
  return await parseResponse(response)
}

// Выполняет отдельную операцию `checkLevelSolvability`.
const checkLevelSolvability = async (map) => {
  const response = await fetch(SOLVER_API_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({map}),
  })
  return await parseResponse(response)
}

// Создаёт уникальный идентификатор для одной вкладки черновика.
const createDraftToken = () => {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// Записывает черновик в доступное новой вкладке локальное хранилище.
const storeLevelDraft = (levelId, map, appearance) => {
  const token = createDraftToken()
  localStorage.setItem(`${DRAFT_STORAGE_PREFIX}${token}`, JSON.stringify({levelId, map, appearance}))
  return token
}

export {checkLevelSolvability, loadEditorData, saveEditorLevel, storeLevelDraft}
