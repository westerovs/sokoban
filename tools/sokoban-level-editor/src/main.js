import {Application, Assets} from 'pixi.js'
import {SOKOBAN_TILE_CATALOG} from '@/game/generatedAssets/sokobanTileCatalog.js'
import {getLevelAppearance} from './appearanceState.js'
import {checkLevelSolvability, copyLevelData, loadEditorData, saveEditorLevel, storeLevelDraft} from './editorApi.js'
import EditorBoard from './EditorBoard.js'
import EditorPalette from './EditorPalette.js'
import EditorSession from './EditorSession.js'
import {applyEditorBrush} from './levelEditing.js'
import LevelNavigation from './LevelNavigation.js'
import {validateLevelMap} from './levelValidation.js'
import ValidationPanel from './ValidationPanel.js'

/**
 * Инициализирует полноэкранный редактор и связывает его компоненты.
 */

const MODE_LABELS = Object.freeze({
  structure: 'Геометрия', // Название режима изменения клеток
  objects: 'Объекты', // Название режима размещения игровых объектов
  appearance: 'Оформление', // Название режима визуальных переопределений
})

const elements = {
  brushLabel: document.querySelector('#brush-label'),
  canvasHost: document.querySelector('#canvas-host'),
  copyButton: document.querySelector('#copy-button'),
  emptyState: document.querySelector('#empty-state'),
  launchButton: document.querySelector('#launch-button'),
  levelSelect: document.querySelector('#level-select'),
  locationSelect: document.querySelector('#location-select'),
  modeTabs: document.querySelector('#mode-tabs'),
  palette: document.querySelector('#palette'),
  redoButton: document.querySelector('#redo-button'),
  saveButton: document.querySelector('#save-button'),
  status: document.querySelector('#status'),
  undoButton: document.querySelector('#undo-button'),
  validateButton: document.querySelector('#validate-button'),
  validationSummary: document.querySelector('#validation-summary'),
}

let board
let brush
let editorData
let isLaunchingDraft = false
let selectedLevel = null
let session = null
let statusTimer = null
let validationPanel

// Изменяет видимость через операцию `showStatus`.
const showStatus = (message, kind = 'info') => {
  clearTimeout(statusTimer)
  elements.status.textContent = message
  elements.status.dataset.kind = kind
  elements.status.dataset.visible = 'true'
  statusTimer = setTimeout(() => (elements.status.dataset.visible = 'false'), 4000)
}

// Возвращает данные, за которые отвечает операция `getSelectedAppearance`.
const getSelectedAppearance = () => {
  return session ? getLevelAppearance(session.state.appearance, session.state.levelId) : {}
}

// Выполняет отдельную операцию `renderSession`.
const renderSession = () => {
  if (!session || !selectedLevel) return board.setState(null, {})
  const validation = validateLevelMap(session.state.map)
  const level = {...selectedLevel, map: session.state.map}
  board.setState(level, getSelectedAppearance(), validation.invalidPositions)
  board.layout(elements.canvasHost.clientWidth, elements.canvasHost.clientHeight)
  validationPanel.update(validation)
  elements.undoButton.disabled = !session.canUndo
  elements.redoButton.disabled = !session.canRedo
  elements.saveButton.dataset.dirty = String(session.isDirty)
}

// Обновляет состояние через операцию `updateSelectedLevel`.
const updateSelectedLevel = (level) => {
  selectedLevel = level
  elements.emptyState.hidden = Boolean(level)
  if (!level) {
    session = null
    renderSession()
    return
  }
  session = new EditorSession(level, editorData.appearance)
  history.replaceState(null, '', `?level=${encodeURIComponent(level.id)}`)
  renderSession()
}

// Проверяет условие, описанное операцией `canChangeLevel`.
const canChangeLevel = () => {
  if (!session?.isDirty) return true
  return window.confirm('Отменить несохранённые изменения и открыть другой уровень?')
}

// Обрабатывает событие, за которое отвечает операция `handlePaint`.
const handlePaint = ({brush: activeBrush, position}) => {
  const result = applyEditorBrush(session.state, activeBrush, position, SOKOBAN_TILE_CATALOG.defaults)
  if (result.error) return showStatus(result.error, 'error')
  if (session.apply(result.state)) renderSession()
}

// Выполняет отдельную операцию `selectBrush`.
const selectBrush = (nextBrush) => {
  brush = nextBrush
  board.setBrush(brush)
  elements.brushLabel.textContent = `${MODE_LABELS[brush.mode]} · ${brush.label}`
}

// Возвращает данные, за которые отвечает операция `getValidation`.
const getValidation = () => {
  const validation = validateLevelMap(session.state.map)
  validationPanel.update(validation)
  if (!validation.isValid) showStatus('Исправьте ошибки структуры перед этим действием', 'error')
  return validation
}

// Возвращает данные, за которые отвечает операция `findLevel`.
const findLevel = (data, levelId) => {
  return data.locations.flatMap((location) => location.levels).find((level) => level.id === levelId)
}

// Обновляет состояние через операцию `applySavedData`.
const applySavedData = (data) => {
  const savedLevel = findLevel(data, selectedLevel.id)
  selectedLevel.map = [...savedLevel.map]
  selectedLevel.isVerified = savedLevel.isVerified
  editorData = data
  session = new EditorSession(selectedLevel, editorData.appearance)
  renderSession()
}

// Сохраняет текущий уровень в его исходные файлы.
const save = async () => {
  if (!session || !getValidation().isValid) return false
  elements.saveButton.disabled = true
  try {
    const data = await saveEditorLevel(selectedLevel.id, session.state.map, getSelectedAppearance())
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

// Выполняет отдельную операцию `launchDraft`.
const launchDraft = () => {
  if (!session || !getValidation().isValid) return
  storeLevelDraft(selectedLevel.id, session.state.map, getSelectedAppearance())
  const gameUrl = new URL('/', window.location.origin)
  gameUrl.searchParams.set('sokobanLevel', selectedLevel.id)
  gameUrl.searchParams.set('sokobanDraft', '1')
  isLaunchingDraft = true
  window.location.assign(gameUrl)
}

// Копирует текущий уровень в буфер обмена.
const copy = async () => {
  if (!session) return
  try {
    await copyLevelData(selectedLevel.id, session.state.map, getSelectedAppearance())
    showStatus('Карта и оформление уровня скопированы')
  } catch (error) {
    showStatus(error.message, 'error')
  }
}

// Возвращает данные, за которые отвечает операция `getSolvabilityMessage`.
const getSolvabilityMessage = (result) => {
  if (result.status === 'solved') return `Решение найдено: минимум ${result.pushes} толчков, проверено состояний: ${result.explored}`
  if (result.status === 'unsolved') return `Решений не найдено, проверено состояний: ${result.explored}`
  return `Проверка достигла лимита, исследовано состояний: ${result.explored}`
}

// Выполняет отдельную операцию `checkSolvability`.
const checkSolvability = async () => {
  if (!session || !getValidation().isValid) return
  if (!session.isMapDirty && selectedLevel.isVerified) return showStatus('Эта карта уже подтверждена решателем')
  elements.validateButton.disabled = true
  showStatus('Проверяем решаемость…')
  try {
    const result = await checkLevelSolvability(session.state.map)
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

// Создаёт данные или представление для операции `createBoard`.
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
  elements.canvasHost.append(app.canvas)
  board = new EditorBoard(spriteSheet.textures, SOKOBAN_TILE_CATALOG.defaults, handlePaint)
  app.stage.addChild(board)
  new ResizeObserver(() => board.layout(elements.canvasHost.clientWidth, elements.canvasHost.clientHeight)).observe(elements.canvasHost)
}

// Обрабатывает событие, за которое отвечает операция `handleKeyboard`.
const handleKeyboard = (event) => {
  if (!event.ctrlKey) return
  const key = event.key.toLowerCase()
  if (key === 's') save()
  else if (key === 'z' && event.shiftKey) redo()
  else if (key === 'z') undo()
  else if (key === 'y') redo()
  else return
  event.preventDefault()
}

// Выполняет отдельную операцию `bindActions`.
const bindActions = () => {
  elements.saveButton.addEventListener('click', save)
  elements.copyButton.addEventListener('click', copy)
  elements.launchButton.addEventListener('click', launchDraft)
  elements.validateButton.addEventListener('click', checkSolvability)
  elements.undoButton.addEventListener('click', undo)
  elements.redoButton.addEventListener('click', redo)
  window.addEventListener('keydown', handleKeyboard)
  window.addEventListener('beforeunload', (event) => {
    if (!session?.isDirty || isLaunchingDraft) return
    event.preventDefault()
  })
}

// Инициализирует внутреннее состояние и зависимости.
const init = async () => {
  try {
    editorData = await loadEditorData()
    validationPanel = new ValidationPanel(elements.validationSummary)
    await createBoard()
    const palette = new EditorPalette(elements.modeTabs, elements.palette, SOKOBAN_TILE_CATALOG, selectBrush)
    const navigation = new LevelNavigation(elements.locationSelect, elements.levelSelect, editorData.locations, updateSelectedLevel, canChangeLevel)
    palette.selectDefault()
    navigation.selectLevel(new URLSearchParams(location.search).get('level'))
    bindActions()
  } catch (error) {
    console.error('[SokobanLevelEditor]: initialization failed', error)
    showStatus(error.message, 'error')
  }
}

await init()
