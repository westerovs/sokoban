import type {EditorBrush, EditorLevel, LevelAppearance} from './editorTypes.js'

/**
 * Связывает браузерный редактор с API сохранения, решателя и запуска черновика.
 */

const EDITOR_API_URL = '/__sokoban-level-editor/data' // Путь чтения и сохранения данных редактора
const LIBRARY_API_URL = '/__sokoban-level-editor/library' // Путь чтения и сохранения самостоятельных уровней
const GENERATOR_API_URL = '/__sokoban-level-editor/generate' // Путь процедурной генерации уровня
const SOLVER_API_URL = '/__sokoban-level-editor/solve' // Путь отдельной проверки решаемости
const LOCATION_FILL_API_URL = '/__sokoban-level-editor/fill-location' // Путь заливки всей локации
const DRAFT_STORAGE_PREFIX = 'sokoban-level-editor-draft:' // Префикс временных черновиков в общем хранилище вкладок

// Разбирает входные данные через операцию `parseResponse`.
const parseResponse = async (response: Response): Promise<any> => {
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`)
  return data
}

// Возвращает данные, за которые отвечает операция `loadEditorData`.
const loadEditorData = async () => {
  return await parseResponse(await fetch(EDITOR_API_URL, {cache: 'no-store'}))
}

// Загружает существующие папки и уровни, ещё не включённые в игру.
const loadEditorLibrary = async () => parseResponse(await fetch(LIBRARY_API_URL, {cache: 'no-store'}))

// Создаёт новый исходник либо обновляет открытый уровень библиотеки.
const saveEditorLibraryLevel = async (directory: string, name: string, map: string[], appearance: LevelAppearance, create: boolean) => {
  return parseResponse(
    await fetch(LIBRARY_API_URL, {
      method: create ? 'POST' : 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({directory, name, map, appearance}),
    }),
  )
}

// Выполняет отдельную операцию `saveEditorLevel`.
const saveEditorLevel = async (levelId: string, map: string[], appearance: LevelAppearance) => {
  const response = await fetch(EDITOR_API_URL, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({levelId, map, appearance}),
  })
  return await parseResponse(response)
}

// Сохраняет выбранную текстуру на всех уровнях локации.
const fillEditorLocation = async (locationId: string, brush: EditorBrush) => {
  const response = await fetch(LOCATION_FILL_API_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({locationId, brush}),
  })
  return await parseResponse(response)
}

// Выполняет отдельную операцию `checkLevelSolvability`.
const checkLevelSolvability = async (map: string[]) => {
  const response = await fetch(SOLVER_API_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({map}),
  })
  return await parseResponse(response)
}

// Запрашивает решаемую головоломку с новой или переданной структурой стен.
const generateEditorLevel = async (options: Record<string, any>) => {
  const response = await fetch(GENERATOR_API_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(options),
  })
  return await parseResponse(response)
}

// Создаёт уникальный идентификатор для одной вкладки черновика.
const createDraftToken = () => {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// Записывает черновик в доступное новой вкладке локальное хранилище.
const storeLevelDraft = (levelId: EditorLevel['id'], map: string[], appearance: LevelAppearance) => {
  const token = createDraftToken()
  localStorage.setItem(`${DRAFT_STORAGE_PREFIX}${token}`, JSON.stringify({levelId, map, appearance}))
  return token
}

export {
  checkLevelSolvability, // Проверка карты решателем
  fillEditorLocation,
  generateEditorLevel, // Процедурная генерация карты
  loadEditorData, // Загрузка каталога уровней
  loadEditorLibrary,
  saveEditorLevel, // Перезапись открытого уровня
  saveEditorLibraryLevel,
  storeLevelDraft, // Передача черновика в игровую вкладку
}
