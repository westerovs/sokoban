import {Container, Graphics, Rectangle, Sprite} from 'pixi.js'
import {SOKOBAN_TEXTURES} from '@/game/sokoban/config/config.js'
import {applyTileVisualScale} from '@/game/sokoban/rendering/applyTileVisualScale.js'

/**
 * Отображает редактируемую карту настоящими PixiJS-тайлами и принимает рисование.
 */

const TILE_SIZE = 100 // Логический размер клетки редактора
const BOARD_PADDING = 44 // Минимальный отступ карты от краёв рабочей области
const MIN_ZOOM = 1 // Минимальный масштаб относительно полного поля
const MAX_ZOOM = 4 // Максимальное увеличение рабочего поля
const ZOOM_SENSITIVITY = 0.0014 // Скорость изменения масштаба колёсиком мыши

export default class EditorBoard extends Container {
  #appearance = {}
  #brush = null
  #defaults
  #invalidPositions = []
  #paintingBrush = null
  #lastPaintedPosition = null
  #level = null
  #onPaint
  #textures
  #viewportHeight = 0
  #viewportWidth = 0
  #zoom = MIN_ZOOM

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(textures, defaults, onPaint) {
    super({label: 'sokoban-level-editor-board', sortableChildren: true})

    this.#textures = textures
    this.#defaults = defaults
    this.#onPaint = onPaint
    this.#init()
  }

  // Обновляет состояние через операцию `setState`.
  setState(level, appearance, invalidPositions = []) {
    if (level?.id !== this.#level?.id) {
      this.#zoom = MIN_ZOOM
      this.#viewportWidth = 0
      this.#viewportHeight = 0
    }
    this.#level = level
    this.#appearance = appearance
    this.#invalidPositions = invalidPositions
    this.#render()
  }

  // Обновляет состояние через операцию `setBrush`.
  setBrush(brush) {
    this.#brush = brush
  }

  // Рассчитывает и применяет расположение представления.
  layout(width, height) {
    if (!this.#level) return
    if (width === this.#viewportWidth && height === this.#viewportHeight) return
    this.#viewportWidth = width
    this.#viewportHeight = height
    this.#centerBoard()
  }

  // Изменяет масштаб относительно точки под курсором мыши.
  zoomAt(deltaY, point) {
    if (!this.#level) return
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.#zoom * Math.exp(-deltaY * ZOOM_SENSITIVITY)))
    if (nextZoom === this.#zoom) return
    if (nextZoom === MIN_ZOOM) {
      this.#zoom = nextZoom
      this.#centerBoard()
      return
    }
    this.#applyZoomAtPoint(nextZoom, point)
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init() {
    this.eventMode = 'static'
    this.interactiveChildren = false
    this.cursor = 'crosshair'
    this.on('pointerdown', this.#startPainting)
    this.on('globalpointermove', this.#continuePainting)
    this.on('pointerup', this.#stopPainting)
    this.on('pointerupoutside', this.#stopPainting)
    this.on('pointercancel', this.#stopPainting)
  }

  // Возвращает масштаб, при котором всё поле помещается в рабочую область.
  #getFitScale() {
    const boardWidth = this.#level.map[0].length * TILE_SIZE
    const boardHeight = this.#level.map.length * TILE_SIZE
    const widthScale = (this.#viewportWidth - BOARD_PADDING * 2) / boardWidth
    const heightScale = (this.#viewportHeight - BOARD_PADDING * 2) / boardHeight
    return Math.max(Math.min(widthScale, heightScale, 1.35), 0.1)
  }

  // Центрирует поле с учётом текущего увеличения.
  #centerBoard() {
    const boardWidth = this.#level.map[0].length * TILE_SIZE
    const boardHeight = this.#level.map.length * TILE_SIZE
    const scale = this.#getFitScale() * this.#zoom
    this.scale.set(scale)
    this.position.set((this.#viewportWidth - boardWidth * scale) / 2, (this.#viewportHeight - boardHeight * scale) / 2)
  }

  // Сохраняет выбранную точку поля под курсором во время увеличения.
  #applyZoomAtPoint(nextZoom, point) {
    const localX = (point.x - this.x) / this.scale.x
    const localY = (point.y - this.y) / this.scale.y
    const scale = this.#getFitScale() * nextZoom
    this.#zoom = nextZoom
    this.scale.set(scale)
    this.position.set(point.x - localX * scale, point.y - localY * scale)
  }

  // Выполняет отдельную операцию `render`.
  #render() {
    this.removeChildren().forEach((child) => child.destroy({children: true}))
    if (!this.#level) return

    const scene = new Container({label: 'sokoban-level-editor-scene', sortableChildren: true})
    scene.addChild(this.#createBackground())
    this.#level.map.forEach((row, y) => {
      Array.from(row).forEach((symbol, x) => this.#addCell(scene, symbol, {x, y}))
    })
    scene.addChild(this.#createGrid())
    scene.addChild(this.#createIssueOverlay())
    this.addChild(scene)
    this.hitArea = new Rectangle(0, 0, this.#level.map[0].length * TILE_SIZE, this.#level.map.length * TILE_SIZE)
  }

  // Создаёт данные или представление для операции `createBackground`.
  #createBackground() {
    const width = this.#level.map[0].length * TILE_SIZE
    const height = this.#level.map.length * TILE_SIZE
    return new Graphics({label: 'sokoban-level-editor-background'}).rect(0, 0, width, height).fill({color: 0x101913, alpha: 0.94})
  }

  // Добавляет данные или представление через операцию `addCell`.
  #addCell(scene, symbol, position) {
    if (symbol === '_') return scene.addChild(this.#createVoidCell(position))
    if (symbol === '#') return scene.addChild(this.#createRoleSprite('wall', position, this.#getTextureName('wall', position)))

    scene.addChild(this.#createRoleSprite('floor', position, this.#getTextureName('floor', position)))
    if ('.-*'.includes(symbol)) scene.addChild(this.#createRoleSprite('target', position, this.#getTextureName('target', position)))
    if ('$-'.includes(symbol)) scene.addChild(this.#createRoleSprite('box', position, this.#getTextureName('box', position)))
    if ('@*'.includes(symbol)) scene.addChild(this.#createRoleSprite('player', position, SOKOBAN_TEXTURES.player))
  }

  // Создаёт данные или представление для операции `createVoidCell`.
  #createVoidCell(position) {
    return new Graphics({label: `editor-void-${position.x}-${position.y}`})
      .rect(position.x * TILE_SIZE, position.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      .fill({color: 0x07100b, alpha: 0.62})
  }

  // Создаёт данные или представление для операции `createRoleSprite`.
  #createRoleSprite(role, position, textureName) {
    const texture = this.#textures[textureName]
    if (!texture) throw new Error(`[EditorBoard]: texture ${textureName} is missing`)

    const sprite = new Sprite({label: `editor-${role}-${position.x}-${position.y}`, texture})
    sprite.anchor.set(0.5, 1)
    sprite.position.set((position.x + 0.5) * TILE_SIZE, (position.y + 1) * TILE_SIZE)
    sprite.zIndex = this.#getRoleDepth(role, position.y)
    applyTileVisualScale(sprite, TILE_SIZE)
    return sprite
  }

  // Возвращает данные, за которые отвечает операция `getRoleDepth`.
  #getRoleDepth(role, row) {
    if (role === 'floor' || role === 'target') return 0
    if (role === 'box') return 1
    if (role === 'wall') return 2 + row * 2
    return 3 + row * 2
  }

  // Создаёт данные или представление для операции `createGrid`.
  #createGrid() {
    const grid = new Graphics({label: 'sokoban-level-editor-grid', zIndex: 1000})
    this.#level.map.forEach((row, y) => {
      Array.from(row).forEach((_, x) => {
        grid.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE).stroke({color: 0xd7ead9, alpha: 0.2, width: 1})
      })
    })
    return grid
  }

  // Создаёт данные или представление для операции `createIssueOverlay`.
  #createIssueOverlay() {
    const overlay = new Graphics({label: 'sokoban-level-editor-issues', zIndex: 1001})
    this.#invalidPositions.forEach(({x, y}) => {
      overlay.rect(x * TILE_SIZE + 3, y * TILE_SIZE + 3, TILE_SIZE - 6, TILE_SIZE - 6).stroke({color: 0xff665e, alpha: 0.9, width: 5})
    })
    return overlay
  }

  // Возвращает данные, за которые отвечает операция `getTextureName`.
  #getTextureName(role, position) {
    return this.#appearance[role]?.[`${position.x}:${position.y}`] ?? this.#defaults[role]
  }

  // Выполняет отдельную операцию `startPainting`.
  #startPainting = (event) => {
    if (![0, 2].includes(event.button) || !this.#brush) return
    this.#paintingBrush = event.button === 2 ? {mode: 'void', label: 'Пустота'} : this.#brush
    this.#lastPaintedPosition = null
    this.#paintAt(event)
  }

  // Выполняет отдельную операцию `continuePainting`.
  #continuePainting = (event) => {
    if (!this.#paintingBrush) return
    if (event.buttons === 0) return this.#stopPainting()
    this.#paintAt(event)
  }

  // Выполняет отдельную операцию `stopPainting`.
  #stopPainting = () => {
    this.#paintingBrush = null
    this.#lastPaintedPosition = null
  }

  // Выполняет отдельную операцию `paintAt`.
  #paintAt(event) {
    const position = this.#getCellPosition(event)
    const positionKey = position ? `${position.x}:${position.y}` : null
    if (!position || positionKey === this.#lastPaintedPosition) return

    this.#lastPaintedPosition = positionKey
    this.#onPaint({brush: this.#paintingBrush, position, positionKey})
  }

  // Возвращает данные, за которые отвечает операция `getCellPosition`.
  #getCellPosition(event) {
    const point = this.toLocal(event.global)
    const position = {x: Math.floor(point.x / TILE_SIZE), y: Math.floor(point.y / TILE_SIZE)}
    if (position.x < 0 || position.y < 0) return null
    if (position.y >= this.#level.map.length || position.x >= this.#level.map[0].length) return null
    return position
  }
}
