import {Application, Assets} from 'pixi.js'
import {levels} from '@/game/gameConfig/levels/levels.js'
import {GAME_NAME} from '@/game/generatedAssets/buildMeta.js'
import {SOKOBAN_TILE_CATALOG} from '@/game/generatedAssets/sokobanTileCatalog.js'
import {SOKOBAN_SETTINGS} from '@/game/sokoban/config/settings.js'
import {getLevelAppearance} from './appearanceState.js'
import {
  checkLevelSolvability,
  fillEditorLocation,
  generateEditorLevel,
  loadEditorData,
  loadEditorLibrary,
  saveEditorLevel,
  saveEditorLibraryLevel,
  storeLevelDraft,
} from './editorApi.js'
import EditorBoard from './EditorBoard.js'
import {expandEditorState} from './editorGrid.js'
import EditorPalette from './EditorPalette.js'
import EditorSession from './EditorSession.js'
import type {
  EditorBrush,
  EditorData,
  EditorLevel,
  EditorState,
  LevelAppearance,
  LibraryData,
  LibraryLevel,
  Position,
  ValidationResult,
} from './editorTypes.js'
import {applyEditorBrush, applyEditorFill, FILLABLE_ROLES} from './levelEditing.js'
import LevelGeneratorPanel from './LevelGeneratorPanel.js'
import LevelLibraryPanel from './LevelLibraryPanel.js'
import LevelNavigation from './LevelNavigation.js'
import {validateLevelMap} from './levelValidation.js'

/**
 * Инициализирует полноэкранный редактор и связывает прямые кисти с данными уровня.
 */

// Возвращает обязательный элемент интерфейса по селектору.
const getElement = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`[SokobanLevelEditor]: element ${selector} is missing`)
  return element
}

const elements = {
  canvasHost: getElement<HTMLElement>('#canvas-host'),
  emptyState: getElement<HTMLElement>('#empty-state'),
  fillButton: getElement<HTMLButtonElement>('#fill-button'),
  fillLocationButton: getElement<HTMLButtonElement>('#fill-location-button'),
  fillLocationDialog: getElement<HTMLDialogElement>('#fill-location-dialog'),
  fillLocationMessage: getElement<HTMLElement>('#fill-location-message'),
  fillLocationApply: getElement<HTMLButtonElement>('#fill-location-apply'),
  fillLocationCancel: getElement<HTMLButtonElement>('#fill-location-cancel'),
  generatorPanel: getElement<HTMLElement>('#generator-panel'),
  generatorTab: getElement<HTMLButtonElement>('#generator-tab'),
  launchButton: getElement<HTMLButtonElement>('#launch-button'),
  levelAuthor: getElement<HTMLOutputElement>('#level-author'),
  levelDimensions: getElement<HTMLOutputElement>('#level-dimensions'),
  levelSelect: getElement<HTMLSelectElement>('#level-select'),
  locationSelect: getElement<HTMLSelectElement>('#location-select'),
  manualToolsPanel: getElement<HTMLElement>('#manual-tools-panel'),
  manualToolsTab: getElement<HTMLButtonElement>('#manual-tools-tab'),
  modeTabs: getElement<HTMLElement>('#mode-tabs'),
  palette: getElement<HTMLElement>('#palette'),
  redoButton: getElement<HTMLButtonElement>('#redo-button'),
  resetButton: getElement<HTMLButtonElement>('#reset-button'),
  saveButton: getElement<HTMLButtonElement>('#save-button'),
  saveAsButton: getElement<HTMLButtonElement>('#save-as-button'),
  status: getElement<HTMLElement>('#status'),
  undoButton: getElement<HTMLButtonElement>('#undo-button'),
  utilityPalette: getElement<HTMLElement>('#utility-palette'),
  validateButton: getElement<HTMLButtonElement>('#validate-button'),
}

const isDebug = window.localStorage.getItem(`${GAME_NAME}-isDebug`) === 'true' // Показывает служебные сведения об уровне

let board: EditorBoard
let editorData: EditorData
let generatorPanel: LevelGeneratorPanel | null = null
let libraryPanel: LevelLibraryPanel
let navigation: LevelNavigation
let isSaving = false
let isGenerating = false
let palette: EditorPalette
let selectedBrush: EditorBrush | null = null
let selectedLevel: EditorLevel | null = null
let session: EditorSession | null = null
let statusTimer: ReturnType<typeof setTimeout> | null = null

// Возвращает безопасный текст перехваченной ошибки.
const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

// Показывает крупное временное уведомление в верхней части редактора.
const showStatus = (message: string, kind = 'info') => {
  if (statusTimer !== null) clearTimeout(statusTimer)
  elements.status.textContent = message
  elements.status.dataset.kind = kind
  elements.status.dataset.visible = 'true'
  statusTimer = setTimeout(() => (elements.status.dataset.visible = 'false'), 4000)
}

// Возвращает компактное состояние текущего уровня для внешних действий.
const getExportState = (): EditorState | null => {
  return session?.getExportState() ?? null
}

// Проверяет, поддерживает ли выбранная кисть массовую заливку.
const isFillBrush = (brush: EditorBrush | null): brush is EditorBrush => {
  return brush?.mode === 'tile' && FILLABLE_ROLES.includes(brush.role ?? '')
}

// Синхронизирует доступность заливки с текущей сессией и режимом редактора.
const updateFillButton = () => {
  elements.fillButton.disabled = !session || elements.manualToolsPanel.hidden || !isFillBrush(selectedBrush)
  elements.fillLocationButton.disabled = elements.fillButton.disabled || Boolean(selectedLevel?.libraryPath)
}

// Обновляет размер текущего уровня в клетках для ручного режима.
const updateLevelDimensions = () => {
  const map = getExportState()?.map
  const isVisible = Boolean(map && !elements.manualToolsPanel.hidden)
  elements.levelDimensions.hidden = !isVisible
  elements.levelDimensions.textContent = map ? `${map[0].length} × ${map.length}` : ''
}

// Показывает автора текущего уровня рядом с размером карты только в отладочном режиме.
const updateLevelAuthor = () => {
  const isVisible = Boolean(isDebug && selectedLevel && !elements.manualToolsPanel.hidden)
  elements.levelAuthor.hidden = !isVisible
  elements.levelAuthor.textContent = selectedLevel ? `Автор: ${selectedLevel.authorId}` : ''
}

// Показывает область перезаписи перед сохранением всей локации.
const confirmLocationFill = () => {
  if (!session || !isFillBrush(selectedBrush)) return
  const location = editorData.locations.find(({levels}) => levels.some(({id}) => id === selectedLevel?.id))
  if (!location) return
  const roleNames: Record<string, string> = {wall: 'стен', box: 'ящиков', ground: 'земли', target: 'целей'} // Названия слоёв предупреждения
  elements.fillLocationMessage.textContent = `Это действие перезапишет текстуры всех ${roleNames[selectedBrush.role!]} на всех уровнях локации «${location.id}» (уровней: ${location.levels.length}) текстурой «${selectedBrush.texture}». Изменения сразу сохранятся. Остальные несохранённые правки открытого уровня останутся в редакторе. Отмена редактора не отменяет заливку всей локации.`
  elements.fillLocationDialog.showModal()
}

// Обновляет сохранённую основу сессии, сохраняя остальные правки открытого уровня.
const applyLocationFillData = (data: EditorData, brush: EditorBrush) => {
  const nextState = applyEditorFill(session!.state, brush, SOKOBAN_TILE_CATALOG.defaults).state
  applySavedData(data)
  session!.apply(nextState)
  renderSession()
}

// Сохраняет подтверждённую заливку и блокирует повторное применение на время запроса.
const fillSelectedLocation = async () => {
  if (!session || !isFillBrush(selectedBrush) || elements.fillLocationApply.disabled) return
  const brush = {...selectedBrush}
  elements.fillLocationApply.disabled = true
  elements.fillLocationCancel.disabled = true
  try {
    const data = await fillEditorLocation(elements.locationSelect.value, brush)
    applyLocationFillData(data, brush)
    elements.fillLocationDialog.close()
    showStatus('Текстура сохранена на всех уровнях локации')
  } catch (error) {
    elements.fillLocationMessage.textContent = `Не удалось применить заливку: ${getErrorMessage(error)}`
  } finally {
    elements.fillLocationApply.disabled = false
    elements.fillLocationCancel.disabled = false
  }
}

// Подключает подтверждение заливки и защиту диалога во время сохранения.
const bindLocationFill = () => {
  elements.fillLocationButton.addEventListener('click', confirmLocationFill)
  elements.fillLocationApply.addEventListener('click', fillSelectedLocation)
  elements.fillLocationCancel.addEventListener('click', () => elements.fillLocationDialog.close())
  elements.fillLocationDialog.addEventListener('cancel', (event) => {
    if (elements.fillLocationApply.disabled) event.preventDefault()
  })
}

// Отрисовывает карту, проверку и доступность команд истории.
const renderSession = () => {
  updateSaveButtons()
  if (!session || !selectedLevel) {
    updateFillButton()
    updateLevelDimensions()
    updateLevelAuthor()
    return board.setState(null, {})
  }
  const validation = validateLevelMap(session.state.map)
  const level = {...selectedLevel, map: session.state.map}
  board.setState(level, session.state.appearance, validation.invalidPositions)
  board.layout(elements.canvasHost.clientWidth, elements.canvasHost.clientHeight)
  elements.resetButton.disabled = !session.isDirty
  elements.undoButton.disabled = !session.canUndo
  elements.redoButton.disabled = !session.canRedo
  elements.saveButton.dataset.dirty = String(session.isDirty)
  updateFillButton()
  updateLevelDimensions()
  updateLevelAuthor()
  generatorPanel?.setCurrentLevel(getExportState())
}

// Открывает выбранный уровень на полном рабочем поле редактора.
const updateSelectedLevel = (level: EditorLevel | null, libraryAppearance?: LevelAppearance) => {
  selectedLevel = level
  libraryPanel.selectPath(level?.libraryPath)
  const location = editorData.locations.find(({levels}) => levels.some(({id}) => id === level?.id))
  palette.setLocation(location?.id ?? '')
  elements.emptyState.hidden = Boolean(level)
  if (!level) {
    session = null
    renderSession()
    return
  }
  const appearance = libraryAppearance ?? getLevelAppearance(editorData.appearance, level.id)
  session = new EditorSession(level, appearance)
  const query = level.libraryPath ? `library=${encodeURIComponent(level.libraryPath)}` : `level=${encodeURIComponent(level.id)}`
  history.replaceState(null, '', `?${query}`)
  renderSession()
  generatorPanel?.setCurrentLevel(getExportState(), {syncDimensions: true})
}

// Разрешает смену уровня либо просит подтвердить потерю изменений.
const canChangeLevel = () => {
  if (isSaving || isGenerating) return false
  if (!session?.isDirty) return true
  return window.confirm('Отменить несохранённые изменения и открыть другой уровень?')
}

// Применяет выбранную кисть к клетке карты.
const handlePaint = ({brush, position}: {brush: EditorBrush; position: Position}) => {
  if (!session) return
  const result = applyEditorBrush(session.state, brush, position, SOKOBAN_TILE_CATALOG.defaults)
  if (session.apply(result.state)) renderSession()
}

// Передаёт выбранную кисть доске и обновляет подпись интерфейса.
const selectBrush = (brush: EditorBrush) => {
  board.setBrush(brush)
  selectedBrush = brush
  updateFillButton()
}

// Заливает все подходящие клетки текстурой выбранной кисти.
const fillSelectedRole = () => {
  if (!session || !isFillBrush(selectedBrush)) return
  const result = applyEditorFill(session.state, selectedBrush, SOKOBAN_TILE_CATALOG.defaults)
  if (!session.apply(result.state)) return showStatus('Все подходящие тайлы уже используют эту текстуру')
  renderSession()
  showStatus('Выбранная текстура применена ко всем подходящим тайлам')
}

// Оставляет оформление стен, декора и пола при перестановке игровых объектов.
const getStructuralAppearance = (appearance: LevelAppearance): LevelAppearance => {
  return Object.fromEntries(
    ['wall', 'decor', 'ground'].filter((role) => appearance[role]).map((role) => [role, structuredClone(appearance[role])]),
  )
}

// Создаёт полное состояние редактора из компактного результата генератора.
const createGeneratedState = (result: any, preserveTopology: boolean) => {
  const appearance = preserveTopology ? getStructuralAppearance((getExportState() as EditorState).appearance) : {}
  const level = {...(selectedLevel as EditorLevel), map: result.map}
  return expandEditorState(level, appearance, SOKOBAN_SETTINGS.maxBoardColumns, SOKOBAN_SETTINGS.maxBoardRows)
}

// Применяет всю сгенерированную головоломку одним шагом истории.
const applyGenerationResult = (result: any, preserveTopology: boolean) => {
  const nextState = createGeneratedState(result, preserveTopology)
  if (!session?.apply(nextState)) return false
  renderSession()
  return true
}

// Возвращает краткое описание результата автогенерации.
const getGenerationMessage = (stats: any) => {
  const solution = stats.minimumPushes
    ? `минимум ${stats.minimumPushes} толчков`
    : `решение гарантировано за ${stats.solutionPushes} толчков`
  return `Создан уровень ${stats.width}×${stats.height}, ящиков: ${stats.boxCount}, ${solution}`
}

// Запрашивает генерацию и применяет результат к текущему открытому уровню.
const generateLevel = async (options: Record<string, any>) => {
  if (!session || isSaving || isGenerating) return null
  isGenerating = true
  updateSaveButtons()
  const {preserveTopology, ...request} = options
  if (preserveTopology) request.topology = (getExportState() as EditorState).map
  showStatus(preserveTopology ? 'Переставляем объекты, стены останутся прежними…' : 'Создаём структуру и ищем сложную задачу…')
  try {
    const result = await generateEditorLevel(request)
    applyGenerationResult(result, preserveTopology)
    showStatus(getGenerationMessage(result.stats))
    return result.stats
  } catch (error) {
    showStatus(getErrorMessage(error), 'error')
    return null
  } finally {
    isGenerating = false
    updateSaveButtons()
  }
}

// Переключает ручные инструменты и вкладку автогенерации.
const selectSidebarPanel = (mode: string) => {
  const isGenerator = mode === 'generator'
  elements.manualToolsPanel.hidden = isGenerator
  elements.generatorPanel.hidden = !isGenerator
  elements.manualToolsTab.ariaSelected = String(!isGenerator)
  elements.generatorTab.ariaSelected = String(isGenerator)
  elements.saveAsButton.hidden = !isGenerator
  updateFillButton()
  updateLevelDimensions()
  updateLevelAuthor()
}

// Проверяет текущую карту и показывает ошибки перед внешним действием.
const getValidation = (): ValidationResult => {
  const validation = validateLevelMap((session as EditorSession).state.map)
  if (!validation.isValid) showStatus('Исправьте ошибки структуры перед этим действием', 'error')
  return validation
}

// Находит уровень по идентификатору в данных редактора.
const findLevel = (data: EditorData, levelId: string) => {
  return data.locations.flatMap((location) => location.levels).find((level) => level.id === levelId)
}

// Обновляет открытую сессию данными, перечитанными после сохранения.
const applySavedData = (data: EditorData) => {
  const currentLevel = selectedLevel as EditorLevel
  const savedLevel = findLevel(data, currentLevel.id) as EditorLevel
  currentLevel.map = [...savedLevel.map]
  currentLevel.authorId = savedLevel.authorId
  editorData = data
  navigation.setLocations(getActiveEditorLocations(data))
  const appearance = getLevelAppearance(editorData.appearance, currentLevel.id)
  session = new EditorSession(currentLevel, appearance)
  renderSession()
}

// Открывает файл библиотеки, проверив несохранённые изменения текущей карты.
const selectLibraryLevel = (level: LibraryLevel) => {
  if (!canChangeLevel()) return false
  navigation.clearSelection()
  updateSelectedLevel(level, level.appearance)
  return true
}

// Обновляет доступность сохранения на время генерации и записи.
const updateSaveButtons = () => {
  const disabled = !session || isSaving || isGenerating
  elements.saveButton.disabled = disabled
  elements.saveAsButton.disabled = disabled
}

// Блокирует изменения карты на время сохранения снимка.
const setSaving = (value: boolean) => {
  isSaving = value
  getElement<HTMLElement>('.editor-shell').inert = value
  updateSaveButtons()
}

// Записывает самостоятельную карту и делает сохранённый файл текущим.
const persistLibraryLevel = async (directory: string, name: string, create: boolean) => {
  const state = getExportState() as EditorState
  const result = await saveEditorLibraryLevel(directory, name, state.map, state.appearance, create)
  const level = result.data.levels.find((level: LibraryLevel) => level.libraryPath === result.libraryPath)
  if (!level) throw new Error('Сохранённый файл отсутствует в ответе библиотеки')
  libraryPanel.setData(result.data)
  navigation.clearSelection()
  updateSelectedLevel(level, level.appearance)
  showStatus(`Сохранено: ${result.libraryPath}`)
}

// Сохраняет новый файл из диалога, оставляя ошибку доступной форме.
const saveAs = async (directory: string, name: string) => {
  if (isSaving || isGenerating || !session) throw new Error('Дождитесь завершения текущей операции')
  if (!getValidation().isValid) throw new Error('Исправьте ошибки структуры перед сохранением')
  setSaving(true)
  try {
    await persistLibraryLevel(directory, name, true)
  } finally {
    setSaving(false)
  }
}

// Выбирает запись в библиотеку либо существующую игровую локацию.
const saveCurrentLevel = async () => {
  const level = selectedLevel as EditorLevel
  if (level.libraryPath) {
    const directory = level.libraryPath.slice(0, level.libraryPath.lastIndexOf('/'))
    return persistLibraryLevel(directory, level.id, false)
  }
  const state = getExportState() as EditorState
  applySavedData(await saveEditorLevel(level.id, state.map, state.appearance))
  showStatus('Уровень сохранён, файл локации и оформление обновлены')
}

// Сохраняет компактную карту и оформление в исходные файлы локации.
const save = async () => {
  if (!session || isSaving || isGenerating || !getValidation().isValid) return false
  setSaving(true)
  try {
    await saveCurrentLevel()
    return true
  } catch (error) {
    showStatus(getErrorMessage(error), 'error')
    return false
  } finally {
    setSaving(false)
  }
}

// Открывает несохранённый черновик уровня в новой вкладке игры.
const launchDraft = () => {
  if (!session || !getValidation().isValid) return
  const state = getExportState() as EditorState
  const currentLevel = selectedLevel as EditorLevel
  const draftLevelId = currentLevel.libraryPath ? getActiveEditorLocations(editorData)[0]?.levels[0]?.id : currentLevel.id
  if (!draftLevelId) return showStatus('Нет игровой локации для запуска черновика', 'error')
  const draftToken = storeLevelDraft(draftLevelId, state.map, state.appearance)
  const gameUrl = new URL('/', window.location.origin)
  gameUrl.searchParams.set('sokobanLevel', draftLevelId)
  gameUrl.searchParams.set('sokobanDraft', draftToken)
  window.open(gameUrl, '_blank', 'noopener')
  showStatus('Черновик открыт в новой вкладке')
}

// Возвращает понятное описание результата решателя.
const getSolvabilityMessage = (result: any) => {
  if (result.status === 'solved') return `Решение найдено: минимум ${result.pushes} толчков, проверено состояний: ${result.explored}`
  if (result.status === 'unsolved') return `Решений не найдено, проверено состояний: ${result.explored}`
  return `Проверка достигла лимита, исследовано состояний: ${result.explored}`
}

// Запускает серверный решатель для изменённой структуры уровня.
const checkSolvability = async () => {
  if (!session || !selectedLevel || !getValidation().isValid) return
  elements.validateButton.disabled = true
  showStatus('Проверяем решаемость…')
  try {
    const result = await checkLevelSolvability((getExportState() as EditorState).map)
    showStatus(getSolvabilityMessage(result), result.status === 'solved' ? 'info' : 'error')
  } catch (error) {
    showStatus(getErrorMessage(error), 'error')
  } finally {
    elements.validateButton.disabled = false
  }
}

// Возвращает состояние на один шаг назад.
const undo = () => {
  if (session?.undo()) renderSession()
}

// Повторно применяет отменённое изменение.
const redo = () => {
  if (session?.redo()) renderSession()
}

// Отменяет все действия, выполненные после открытия или сохранения уровня.
const resetAllChanges = () => {
  if (!session?.reset()) return
  renderSession()
  showStatus('Все изменения уровня отменены')
}

// Масштабирует поле колёсиком относительно положения курсора.
const handleBoardWheel = (event: WheelEvent) => {
  event.preventDefault()
  board.zoomAt(event.deltaY, {x: event.offsetX, y: event.offsetY})
}

// Создаёт PixiJS-доску и отключает системное меню правой кнопки мыши.
const createBoard = async () => {
  const spriteSheet: any = await Assets.load(SOKOBAN_TILE_CATALOG.atlas)
  const app = new Application()
  await app.init({
    resizeTo: elements.canvasHost,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    eventFeatures: {move: true, globalMove: true, click: true, wheel: false},
  })
  app.stage.label = 'sokoban-level-editor-stage'
  app.canvas.addEventListener('contextmenu', (event) => event.preventDefault())
  app.canvas.addEventListener('wheel', handleBoardWheel, {passive: false})
  elements.canvasHost.append(app.canvas)
  board = new EditorBoard(spriteSheet.textures, SOKOBAN_TILE_CATALOG.defaults, handlePaint)
  app.stage.addChild(board)
  new ResizeObserver(() => board.layout(elements.canvasHost.clientWidth, elements.canvasHost.clientHeight)).observe(elements.canvasHost)
}

// Проверяет, набирает ли пользователь текст в элементе формы.
const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target?.isContentEditable
}

// Обрабатывает сочетания отмены, повтора и сохранения.
const handleControlShortcut = (event: KeyboardEvent) => {
  if (!event.ctrlKey && !event.metaKey) return false
  const key = event.code.startsWith('Key') ? event.code.slice(3).toLowerCase() : event.key.toLowerCase()
  if (key === 's') save()
  else if (key === 'z' && event.shiftKey) redo()
  else if (key === 'z') undo()
  else if (key === 'y') redo()
  else return false
  return true
}

// Переключает палитры цифрами и передаёт служебные сочетания.
const handleKeyboard = (event: KeyboardEvent) => {
  if (elements.fillLocationDialog.open || libraryPanel.isOpen || isSaving) {
    if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') event.preventDefault()
    return
  }
  if (isEditableTarget(event.target)) return
  if (handleControlShortcut(event)) return event.preventDefault()
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (['1', '2', '3', '4', '5'].includes(event.key)) {
    selectSidebarPanel('manual')
    palette.selectModeByShortcut(event.key)
  }
}

// Подключает переключатели ручного режима и автогенерации.
const bindSidebarTabs = () => {
  elements.manualToolsTab.addEventListener('click', () => selectSidebarPanel('manual'))
  elements.generatorTab.addEventListener('click', () => selectSidebarPanel('generator'))
}

// Подключает кнопки интерфейса и защиту несохранённой сессии.
const bindActions = () => {
  bindLocationFill()
  elements.fillButton.addEventListener('click', fillSelectedRole)
  elements.saveButton.addEventListener('click', save)
  elements.saveAsButton.addEventListener('click', () => {
    if (session && !isSaving && !isGenerating && getValidation().isValid) void libraryPanel.openSaveAs()
  })
  elements.launchButton.addEventListener('click', launchDraft)
  elements.validateButton.addEventListener('click', checkSolvability)
  elements.resetButton.addEventListener('click', resetAllChanges)
  elements.undoButton.addEventListener('click', undo)
  elements.redoButton.addEventListener('click', redo)
  window.addEventListener('keydown', handleKeyboard)
  window.addEventListener('beforeunload', (event) => {
    if (!session?.isDirty) return
    event.preventDefault()
  })
}

// Выбирает доступные локации редактора в порядке активного списка игры.
const getActiveEditorLocations = (data: EditorData) => {
  return levels.locations.flatMap(({id}) => {
    const location = data.locations.find((location) => location.id === id)
    return location ? [location] : []
  })
}

// Создаёт панели редактора и навигацию по игровым уровням и библиотеке.
const createEditorPanels = (libraryData: LibraryData) => {
  palette = new EditorPalette(
    elements.utilityPalette,
    elements.modeTabs,
    elements.palette,
    {...SOKOBAN_TILE_CATALOG, decorGroups: editorData.decorGroups},
    selectBrush,
  )
  generatorPanel = new LevelGeneratorPanel(getElement<HTMLElement>('#generator-controls'), generateLevel)
  libraryPanel = new LevelLibraryPanel(selectLibraryLevel, saveAs, (error) => showStatus(getErrorMessage(error), 'error'))
  libraryPanel.setData(libraryData)
  navigation = new LevelNavigation(
    elements.locationSelect,
    elements.levelSelect,
    getActiveEditorLocations(editorData),
    updateSelectedLevel,
    canChangeLevel,
  )
  palette.selectDefault()
}

// Восстанавливает открытый файл по адресу редактора.
const restoreRequestedLevel = (libraryData: LibraryData) => {
  const params = new URLSearchParams(location.search)
  const libraryLevel = libraryData.levels.find((level) => level.libraryPath === params.get('library'))
  if (libraryLevel) {
    selectLibraryLevel(libraryLevel)
    selectSidebarPanel('generator')
  } else navigation.selectLevel(params.get('level'))
}

// Загружает данные и создаёт компоненты редактора в правильном порядке.
const init = async () => {
  try {
    const [data, libraryData] = await Promise.all([loadEditorData(), loadEditorLibrary()])
    editorData = data
    await createBoard()
    createEditorPanels(libraryData)
    restoreRequestedLevel(libraryData)
    bindSidebarTabs()
    bindActions()
  } catch (error) {
    console.error('[SokobanLevelEditor]: initialization failed', error)
    showStatus(getErrorMessage(error), 'error')
  }
}

await init()
