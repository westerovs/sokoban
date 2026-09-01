import {Application, Assets} from 'pixi.js'
import {SOKOBAN_TILE_CATALOG} from '@/game/generatedAssets/sokobanTileCatalog.js'
import {getLevelAppearance, setTileAppearance} from './appearanceState.js'
import {copyLevelAppearance, loadEditorData, saveEditorAppearance} from './editorApi.js'
import EditorBoard from './EditorBoard.js'
import EditorPalette from './EditorPalette.js'
import LevelNavigation from './LevelNavigation.js'

const elements = {
  brushLabel: document.querySelector('#brush-label'),
  canvasHost: document.querySelector('#canvas-host'),
  copyButton: document.querySelector('#copy-button'),
  emptyState: document.querySelector('#empty-state'),
  launchButton: document.querySelector('#launch-button'),
  levelSelect: document.querySelector('#level-select'),
  locationSelect: document.querySelector('#location-select'),
  palette: document.querySelector('#palette'),
  saveButton: document.querySelector('#save-button'),
  status: document.querySelector('#status'),
}

let appearance
let board
let brush
let isDirty = false
let selectedLevel = null
let statusTimer = null

const showStatus = (message, kind = 'info') => {
  clearTimeout(statusTimer)
  elements.status.textContent = message
  elements.status.dataset.kind = kind
  elements.status.dataset.visible = 'true'
  statusTimer = setTimeout(() => (elements.status.dataset.visible = 'false'), 3200)
}

const updateSelectedLevel = (level) => {
  selectedLevel = level
  elements.emptyState.hidden = Boolean(level)
  if (!level) return board.setLevel(null, {})

  board.setLevel(level, getLevelAppearance(appearance, level.id))
  board.layout(elements.canvasHost.clientWidth, elements.canvasHost.clientHeight)
  history.replaceState(null, '', `?level=${encodeURIComponent(level.id)}`)
}

const handlePaint = ({brush: activeBrush, isValid, positionKey}) => {
  if (!isValid) return showStatus('Эту кисть нельзя применить к выбранной клетке', 'error')

  appearance = setTileAppearance(appearance, selectedLevel.id, activeBrush, positionKey, SOKOBAN_TILE_CATALOG.defaults)
  board.setAppearance(getLevelAppearance(appearance, selectedLevel.id))
  isDirty = true
}

const selectBrush = (nextBrush) => {
  brush = nextBrush
  board.setBrush(brush)
  elements.brushLabel.textContent = `${brush.role} · ${brush.texture}`
}

const save = async () => {
  elements.saveButton.disabled = true
  try {
    const data = await saveEditorAppearance(appearance)
    appearance = data.appearance
    isDirty = false
    showStatus('Оформление сохранено, игровые файлы локаций обновлены')
    return true
  } catch (error) {
    showStatus(error.message, 'error')
    return false
  } finally {
    elements.saveButton.disabled = false
  }
}

const launchLevel = async () => {
  if (!selectedLevel) return

  const isReady = !isDirty || (await save())
  if (!isReady) return

  const gameUrl = new URL('/', window.location.origin)
  gameUrl.searchParams.set('sokobanLevel', selectedLevel.id)
  window.location.assign(gameUrl)
}

const copy = async () => {
  if (!selectedLevel) return
  try {
    await copyLevelAppearance(selectedLevel.id, appearance)
    showStatus('JSON выбранного уровня скопирован')
  } catch (error) {
    showStatus(error.message, 'error')
  }
}

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

const bindActions = () => {
  elements.saveButton.addEventListener('click', save)
  elements.copyButton.addEventListener('click', copy)
  elements.launchButton.addEventListener('click', launchLevel)
  window.addEventListener('beforeunload', (event) => {
    if (!isDirty) return
    event.preventDefault()
  })
  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === 's') {
      event.preventDefault()
      save()
    }
  })
}

const init = async () => {
  try {
    const data = await loadEditorData()
    appearance = data.appearance
    await createBoard()
    const palette = new EditorPalette(elements.palette, SOKOBAN_TILE_CATALOG, selectBrush)
    const navigation = new LevelNavigation(elements.locationSelect, elements.levelSelect, data.locations, updateSelectedLevel)
    palette.selectDefault()
    navigation.selectLevel(new URLSearchParams(location.search).get('level'))
    bindActions()
  } catch (error) {
    console.error('[SokobanLevelEditor]: initialization failed', error)
    showStatus(error.message, 'error')
  }
}

await init()
