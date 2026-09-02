import {Application, Assets} from 'pixi.js'
import {SOKOBAN_TILE_CATALOG} from '@/game/generatedAssets/sokobanTileCatalog.js'
import {SOKOBAN_SETTINGS} from '@/game/sokoban/config/settings.js'
import {getLevelAppearance} from './appearanceState.js'
import {checkLevelSolvability, generateEditorLevel, loadEditorData, saveEditorLevel, storeLevelDraft} from './editorApi.js'
import EditorBoard from './EditorBoard.js'
import {expandEditorState} from './editorGrid.js'
import EditorPalette from './EditorPalette.js'
import EditorSession from './EditorSession.js'
import {applyEditorBrush} from './levelEditing.js'
import LevelGeneratorPanel from './LevelGeneratorPanel.js'
import LevelNavigation from './LevelNavigation.js'
import {validateLevelMap} from './levelValidation.js'
import ValidationPanel from './ValidationPanel.js'

/**
 * Инициализирует полноэкранный редактор и связывает прямые кисти с данными уровня.
 */

const elements = {
  brushLabel: document.querySelector('#brush-label'),
  canvasHost: document.querySelector('#canvas-host'),
  emptyState: document.querySelector('#empty-state'),
  generatorPanel: document.querySelector('#generator-panel'),
  generatorTab: document.querySelector('#generator-tab'),
  launchButton: document.querySelector('#launch-button'),
  levelSelect: document.querySelector('#level-select'),
  locationSelect: document.querySelector('#location-select'),
  manualToolsPanel: document.querySelector('#manual-tools-panel'),
  manualToolsTab: document.querySelector('#manual-tools-tab'),
  modeTabs: document.querySelector('#mode-tabs'),
  palette: document.querySelector('#palette'),
  redoButton: document.querySelector('#redo-button'),
  resetButton: document.querySelector('#reset-button'),
  saveButton: document.querySelector('#save-button'),
  status: document.querySelector('#status'),
  undoButton: document.querySelector('#undo-button'),
  utilityPalette: document.querySelector('#utility-palette'),
  validateButton: document.querySelector('#validate-button'),
  validationSummary: document.querySelector('#validation-summary'),
}

let board
let editorData
let generatorPanel
let palette
let selectedLevel = null
let selectedBrushLabel = 'Выберите кисть'
let session = null
let statusTimer = null
let validationPanel

// Показывает крупное временное уведомление в верхней части редактора.
const showStatus = (message, kind = 'info') => {
  clearTimeout(statusTimer)
  elements.status.textContent = message
  elements.status.dataset.kind = kind
  elements.status.dataset.visible = 'true'
  statusTimer = setTimeout(() => (elements.status.dataset.visible = 'false'), 4000)
}

// Возвращает компактное состояние текущего уровня для внешних действий.
const getExportState = () => {
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
const updateSelectedLevel = (level) => {
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
const handlePaint = ({brush, position}) => {
  const result = applyEditorBrush(session.state, brush, position, SOKOBAN_TILE_CATALOG.defaults)
  if (session.apply(result.state)) renderSession()
}

// Передаёт выбранную кисть доске и обновляет подпись интерфейса.
const selectBrush = (brush) => {
  board.setBrush(brush)
  selectedBrushLabel = brush.label
  if (!elements.manualToolsPanel.hidden) elements.brushLabel.textContent = selectedBrushLabel
}

// Оставляет оформление стен и пола при перестановке игровых объектов.
const getStructuralAppearance = (appearance) => {
  return Object.fromEntries(['wall', 'floor'].filter((role) => appearance[role]).map((role) => [role, structuredClone(appearance[role])]))
}

// Создаёт полное состояние редактора из компактного результата генератора.
const createGeneratedState = (result, preserveTopology) => {
  const appearance = preserveTopology ? getStructuralAppearance(getExportState().appearance) : {}
  const level = {id: selectedLevel.id, map: result.map}
  return expandEditorState(level, appearance, SOKOBAN_SETTINGS.maxBoardColumns, SOKOBAN_SETTINGS.maxBoardRows)
}

// Применяет всю сгенерированную головоломку одним шагом истории.
const applyGenerationResult = (result, preserveTopology) => {
  const nextState = createGeneratedState(result, preserveTopology)
  if (!session.apply(nextState)) return false
  renderSession()
  return true
}

// Возвращает краткое описание результата автогенерации.
const getGenerationMessage = (stats) => {
  const solution = stats.minimumPushes
    ? `минимум ${stats.minimumPushes} толчков`
    : `решение гарантировано за ${stats.solutionPushes} толчков`
  return `Создан уровень ${stats.width}×${stats.height}, ящиков: ${stats.boxCount}, ${solution}`
}

// Запрашивает генерацию и применяет результат к текущему открытому уровню.
const generateLevel = async (options) => {
  if (!session) return null
  const {preserveTopology, ...request} = options
  if (preserveTopology) request.topology = getExportState().map
  showStatus(preserveTopology ? 'Переставляем объекты, стены останутся прежними…' : 'Создаём структуру и ищем сложную задачу…')
  try {
    const result = await generateEditorLevel(request)
    applyGenerationResult(result, preserveTopology)
    showStatus(getGenerationMessage(result.stats))
    return result.stats
  } catch (error) {
    showStatus(error.message, 'error')
    return null
  }
}

// Переключает ручные инструменты и вкладку автогенерации.
const selectSidebarPanel = (mode) => {
  const isGenerator = mode === 'generator'
  elements.manualToolsPanel.hidden = isGenerator
  elements.generatorPanel.hidden = !isGenerator
  elements.manualToolsTab.ariaSelected = String(!isGenerator)
  elements.generatorTab.ariaSelected = String(isGenerator)
  elements.brushLabel.textContent = isGenerator ? 'Автогенерация' : selectedBrushLabel
}

// Проверяет текущую карту и показывает ошибки перед внешним действием.
const getValidation = () => {
  const validation = validateLevelMap(session.state.map)
  validationPanel.update(validation)
  if (!validation.isValid) showStatus('Исправьте ошибки структуры перед этим действием', 'error')
  return validation
}

// Находит уровень по идентификатору в данных редактора.
const findLevel = (data, levelId) => {
  return data.locations.flatMap((location) => location.levels).find((level) => level.id === levelId)
}

// Обновляет открытую сессию данными, перечитанными после сохранения.
const applySavedData = (data) => {
  const savedLevel = findLevel(data, selectedLevel.id)
  selectedLevel.map = [...savedLevel.map]
  selectedLevel.isVerified = savedLevel.isVerified
  editorData = data
  const appearance = getLevelAppearance(editorData.appearance, selectedLevel.id)
  session = new EditorSession(selectedLevel, appearance)
  renderSession()
}

// Сохраняет компактную карту и оформление в исходные файлы локации.
const save = async () => {
  if (!session || !getValidation().isValid) return false
  elements.saveButton.disabled = true
  try {
    const state = getExportState()
    const data = await saveEditorLevel(selectedLevel.id, state.map, state.appearance)
    applySavedData(data)
    showStatus('Уровень сохранён, файл локации и оформление обновлены')
    return true
  } catch (error) {
    showStatus(error.message, 'error')
    return false
  } finally {
    elements.saveButton.disabled = false
  }
}

// Открывает несохранённый черновик уровня в новой вкладке игры.
const launchDraft = () => {
  if (!session || !getValidation().isValid) return
  const state = getExportState()
  const draftToken = storeLevelDraft(selectedLevel.id, state.map, state.appearance)
  const gameUrl = new URL('/', window.location.origin)
  gameUrl.searchParams.set('sokobanLevel', selectedLevel.id)
  gameUrl.searchParams.set('sokobanDraft', draftToken)
  window.open(gameUrl, '_blank', 'noopener')
  showStatus('Черновик открыт в новой вкладке')
}

// Возвращает понятное описание результата решателя.
const getSolvabilityMessage = (result) => {
  if (result.status === 'solved') return `Решение найдено: минимум ${result.pushes} толчков, проверено состояний: ${result.explored}`
  if (result.status === 'unsolved') return `Решений не найдено, проверено состояний: ${result.explored}`
  return `Проверка достигла лимита, исследовано состояний: ${result.explored}`
}

// Запускает серверный решатель для изменённой структуры уровня.
const checkSolvability = async () => {
  if (!session || !getValidation().isValid) return
  if (!session.isMapDirty && selectedLevel.isVerified) return showStatus('Эта карта уже подтверждена решателем')
  elements.validateButton.disabled = true
  showStatus('Проверяем решаемость…')
  try {
    const result = await checkLevelSolvability(getExportState().map)
    showStatus(getSolvabilityMessage(result), result.status === 'solved' ? 'info' : 'error')
  } catch (error) {
    showStatus(error.message, 'error')
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
const handleBoardWheel = (event) => {
  event.preventDefault()
  board.zoomAt(event.deltaY, {x: event.offsetX, y: event.offsetY})
}

// Создаёт PixiJS-доску и отключает системное меню правой кнопки мыши.
const createBoard = async () => {
  const spriteSheet = await Assets.load(SOKOBAN_TILE_CATALOG.atlas)
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
const isEditableTarget = (target) => {
  const tagName = target?.tagName
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target?.isContentEditable
}

// Обрабатывает сочетания отмены, повтора и сохранения.
const handleControlShortcut = (event) => {
  if (!event.ctrlKey && !event.metaKey) return false
  const key = event.key.toLowerCase()
  if (key === 's') save()
  else if (key === 'z' && event.shiftKey) redo()
  else if (key === 'z') undo()
  else if (key === 'y') redo()
  else return false
  return true
}

// Переключает палитры цифрами и передаёт служебные сочетания.
const handleKeyboard = (event) => {
  if (isEditableTarget(event.target)) return
  if (handleControlShortcut(event)) return event.preventDefault()
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (['1', '2', '3', '4'].includes(event.key)) {
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
    showStatus(error.message, 'error')
  }
}

await init()
