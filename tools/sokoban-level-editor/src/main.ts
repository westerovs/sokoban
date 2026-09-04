import {Application, Assets} from 'pixi.js'
import {SOKOBAN_TILE_CATALOG} from '@/game/generatedAssets/sokobanTileCatalog.js'
import {SOKOBAN_SETTINGS} from '@/game/sokoban/config/settings.js'
import {getLevelAppearance} from './appearanceState.js'
import {checkLevelSolvability, generateEditorLevel, loadEditorData, saveEditorLevel, storeLevelDraft} from './editorApi.js'
import EditorBoard from './EditorBoard.js'
import {expandEditorState} from './editorGrid.js'
import EditorPalette from './EditorPalette.js'
import EditorSession from './EditorSession.js'
import type {EditorBrush, EditorData, EditorLevel, EditorState, LevelAppearance, Position, ValidationResult} from './editorTypes.js'
import {applyEditorBrush} from './levelEditing.js'
import LevelGeneratorPanel from './LevelGeneratorPanel.js'
import LevelNavigation from './LevelNavigation.js'
import {validateLevelMap} from './levelValidation.js'
import ValidationPanel from './ValidationPanel.js'

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
  brushLabel: getElement<HTMLElement>('#brush-label'),
  canvasHost: getElement<HTMLElement>('#canvas-host'),
  emptyState: getElement<HTMLElement>('#empty-state'),
  generatorPanel: getElement<HTMLElement>('#generator-panel'),
  generatorTab: getElement<HTMLButtonElement>('#generator-tab'),
  launchButton: getElement<HTMLButtonElement>('#launch-button'),
  levelSelect: getElement<HTMLSelectElement>('#level-select'),
  locationSelect: getElement<HTMLSelectElement>('#location-select'),
  manualToolsPanel: getElement<HTMLElement>('#manual-tools-panel'),
  manualToolsTab: getElement<HTMLButtonElement>('#manual-tools-tab'),
  modeTabs: getElement<HTMLElement>('#mode-tabs'),
  palette: getElement<HTMLElement>('#palette'),
  redoButton: getElement<HTMLButtonElement>('#redo-button'),
  resetButton: getElement<HTMLButtonElement>('#reset-button'),
  saveButton: getElement<HTMLButtonElement>('#save-button'),
  status: getElement<HTMLElement>('#status'),
  undoButton: getElement<HTMLButtonElement>('#undo-button'),
  utilityPalette: getElement<HTMLElement>('#utility-palette'),
  validateButton: getElement<HTMLButtonElement>('#validate-button'),
  validationSummary: getElement<HTMLElement>('#validation-summary'),
}

let board: EditorBoard
let editorData: EditorData
let generatorPanel: LevelGeneratorPanel | null = null
let palette: EditorPalette
let selectedLevel: EditorLevel | null = null
let selectedBrushLabel = 'Выберите кисть'
let session: EditorSession | null = null
let statusTimer: ReturnType<typeof setTimeout> | null = null
let validationPanel: ValidationPanel

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

// Отрисовывает карту, проверку и доступность команд истории.
const renderSession = () => {
  if (!session || !selectedLevel) return board.setState(null, {})
  const validation = validateLevelMap(session.state.map)
  const level = {...selectedLevel, map: session.state.map}
  board.setState(level, session.state.appearance, validation.invalidPositions)
  board.layout(elements.canvasHost.clientWidth, elements.canvasHost.clientHeight)
  validationPanel.update(validation)
  elements.resetButton.disabled = !session.isDirty
  elements.undoButton.disabled = !session.canUndo
  elements.redoButton.disabled = !session.canRedo
  elements.saveButton.dataset.dirty = String(session.isDirty)
  generatorPanel?.setCurrentLevel(getExportState())
}

// Открывает выбранный уровень на полном рабочем поле редактора.
const updateSelectedLevel = (level: EditorLevel | null) => {
  selectedLevel = level
  elements.emptyState.hidden = Boolean(level)
  if (!level) {
    session = null
    renderSession()
    return
  }
  const appearance = getLevelAppearance(editorData.appearance, level.id)
  session = new EditorSession(level, appearance)
  history.replaceState(null, '', `?level=${encodeURIComponent(level.id)}`)
  renderSession()
  generatorPanel?.setCurrentLevel(getExportState(), {syncDimensions: true})
}

// Разрешает смену уровня либо просит подтвердить потерю изменений.
const canChangeLevel = () => {
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
  selectedBrushLabel = brush.label
  if (!elements.manualToolsPanel.hidden) elements.brushLabel.textContent = selectedBrushLabel
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
  const level = {id: (selectedLevel as EditorLevel).id, map: result.map}
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
  if (!session) return null
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
  }
}

// Переключает ручные инструменты и вкладку автогенерации.
const selectSidebarPanel = (mode: string) => {
  const isGenerator = mode === 'generator'
  elements.manualToolsPanel.hidden = isGenerator
  elements.generatorPanel.hidden = !isGenerator
  elements.manualToolsTab.ariaSelected = String(!isGenerator)
  elements.generatorTab.ariaSelected = String(isGenerator)
  elements.brushLabel.textContent = isGenerator ? 'Автогенерация' : selectedBrushLabel
}

// Проверяет текущую карту и показывает ошибки перед внешним действием.
const getValidation = (): ValidationResult => {
  const validation = validateLevelMap((session as EditorSession).state.map)
  validationPanel.update(validation)
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
  currentLevel.isVerified = savedLevel.isVerified
  editorData = data
  const appearance = getLevelAppearance(editorData.appearance, currentLevel.id)
  session = new EditorSession(currentLevel, appearance)
  renderSession()
}

// Сохраняет компактную карту и оформление в исходные файлы локации.
const save = async () => {
  if (!session || !getValidation().isValid) return false
  elements.saveButton.disabled = true
  try {
    const state = getExportState() as EditorState
    const data = await saveEditorLevel((selectedLevel as EditorLevel).id, state.map, state.appearance)
    applySavedData(data)
    showStatus('Уровень сохранён, файл локации и оформление обновлены')
    return true
  } catch (error) {
    showStatus(getErrorMessage(error), 'error')
    return false
  } finally {
    elements.saveButton.disabled = false
  }
}

// Открывает несохранённый черновик уровня в новой вкладке игры.
const launchDraft = () => {
  if (!session || !getValidation().isValid) return
  const state = getExportState() as EditorState
  const currentLevel = selectedLevel as EditorLevel
  const draftToken = storeLevelDraft(currentLevel.id, state.map, state.appearance)
  const gameUrl = new URL('/', window.location.origin)
  gameUrl.searchParams.set('sokobanLevel', currentLevel.id)
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
  if (!session.isMapDirty && selectedLevel.isVerified) return showStatus('Эта карта уже подтверждена решателем')
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
  elements.saveButton.addEventListener('click', save)
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

// Загружает данные и создаёт компоненты редактора в правильном порядке.
const init = async () => {
  try {
    editorData = await loadEditorData()
    validationPanel = new ValidationPanel(elements.validationSummary)
    await createBoard()
    palette = new EditorPalette(elements.utilityPalette, elements.modeTabs, elements.palette, SOKOBAN_TILE_CATALOG, selectBrush)
    generatorPanel = new LevelGeneratorPanel(elements.generatorPanel, generateLevel)
    const navigation = new LevelNavigation(
      elements.locationSelect,
      elements.levelSelect,
      editorData.locations,
      updateSelectedLevel,
      canChangeLevel,
    )
    palette.selectDefault()
    navigation.selectLevel(new URLSearchParams(location.search).get('level'))
    bindSidebarTabs()
    bindActions()
  } catch (error) {
    console.error('[SokobanLevelEditor]: initialization failed', error)
    showStatus(getErrorMessage(error), 'error')
  }
}

await init()
