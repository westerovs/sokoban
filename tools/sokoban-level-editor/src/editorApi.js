/**
 * Связывает браузерный редактор с API сохранения, решателя и буфера обмена.
 */

const EDITOR_API_URL = '/__sokoban-level-editor/data'
const SOLVER_API_URL = '/__sokoban-level-editor/solve'
const DRAFT_STORAGE_KEY = 'sokoban-level-editor-draft'

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

// Записывает данные через операцию `writeClipboardText`.
const writeClipboardText = async (text) => {
  if (navigator.clipboard?.writeText) return await navigator.clipboard.writeText(text)

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.append(textArea)
  textArea.select()
  document.execCommand('copy')
  textArea.remove()
}

// Выполняет отдельную операцию `copyLevelData`.
const copyLevelData = async (levelId, map, appearance) => {
  return await writeClipboardText(JSON.stringify({levelId, map, appearance}, null, 2))
}

// Записывает данные через операцию `storeLevelDraft`.
const storeLevelDraft = (levelId, map, appearance) => {
  sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({levelId, map, appearance}))
}

export {
  checkLevelSolvability,
  copyLevelData,
  loadEditorData,
  saveEditorLevel,
  storeLevelDraft,
}
