import {Container, Graphics, Rectangle, Sprite, type Texture} from 'pixi.js'
import {SOKOBAN_TEXTURES} from '@/game/sokoban/config/config.js'
import {applyTileVisualScale} from '@/game/sokoban/rendering/applyTileVisualScale.js'
import {getBoardTileVisualTransform} from '@/game/sokoban/rendering/getBoardTileVisualTransform.js'
import {getContentBounds} from './editorGrid.js'
import type {Bounds, EditorBrush, EditorLevel, LevelAppearance, Position} from './editorTypes.js'

/**
 * Отображает редактируемую карту настоящими PixiJS-тайлами и принимает рисование.
 */

const TILE_SIZE = 100 // Логический размер клетки редактора
const BOARD_PADDING = 44 // Минимальный отступ карты от краёв рабочей области
const INITIAL_VERTICAL_PADDING = 1 // Число видимых клеток над и под содержимым при открытии
const MIN_ZOOM = 1 // Минимальный масштаб относительно полного поля
const MAX_ZOOM = 4 // Максимальное увеличение рабочего поля
const ZOOM_SENSITIVITY = 0.0014 // Скорость изменения масштаба колёсиком мыши
const SELECTION_DASH = 8 // Длина штриха рамки выбранного декора в пикселях
const SELECTION_GAP = 5 // Промежуток между штрихами рамки в пикселях

export default class EditorBoard extends Container {
  #appearance: LevelAppearance = {}
  #brush: EditorBrush | null = null
  #defaults: Record<string, string>
  #invalidPositions: Position[] = []
  #isRotated = false
  #paintingBrush: EditorBrush | null = null
  #lastPaintedPosition: string | null = null
  #level: EditorLevel | null = null
  #needsInitialFocus = true
  #onPaint: (payload: {brush: EditorBrush; position: Position; positionKey: string}) => void
  #textures: Record<string, Texture>
  #viewportHeight = 0
  #viewportWidth = 0
  #zoom = MIN_ZOOM
  #selectedDecor: Position | null = null
  #decorSprites = new Map<Sprite, Position>()

  // Подсвечивает исходную клетку выбранного декора.
  selectDecor(position: Position | null) {
    if (position?.x === this.#selectedDecor?.x && position?.y === this.#selectedDecor?.y) return
    this.#selectedDecor = position
    this.#render()
  }

  // Переключает визуальный поворот доски на 90 градусов без изменения данных уровня.
  toggleRotation() {
    this.#stopPainting()
    this.#isRotated = !this.#isRotated
    this.rotation = this.#isRotated ? Math.PI / 2 : 0
    this.#render()
    this.#centerBoard()
    return this.#isRotated
  }

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(
    textures: Record<string, Texture>,
    defaults: Record<string, string>,
    onPaint: (payload: {brush: EditorBrush; position: Position; positionKey: string}) => void,
  ) {
    super({label: 'sokoban-level-editor-board', sortableChildren: true})

    this.#textures = textures
    this.#defaults = defaults
    this.#onPaint = onPaint
    this.#init()
  }

  // Обновляет состояние через операцию `setState`.
  setState(level: EditorLevel | null, appearance: LevelAppearance, invalidPositions: Position[] = []) {
    if (level?.id !== this.#level?.id) {
      this.#zoom = MIN_ZOOM
      this.#needsInitialFocus = true
      this.#viewportWidth = 0
      this.#viewportHeight = 0
    }
    this.#level = level
    this.#appearance = appearance
    this.#invalidPositions = invalidPositions
    this.#render()
  }

  // Обновляет состояние через операцию `setBrush`.
  setBrush(brush: EditorBrush) {
    this.#stopPainting()
    this.#brush = brush
    this.cursor = 'crosshair'
    this.#render()
  }

  // Рассчитывает и применяет расположение представления.
  layout(width: number, height: number) {
    if (!this.#level) return
    if (width === this.#viewportWidth && height === this.#viewportHeight) return
    this.#viewportWidth = width
    this.#viewportHeight = height
    if (this.#needsInitialFocus) {
      this.#needsInitialFocus = false
      this.#focusInitialContent()
      return
    }
    this.#centerBoard()
  }

  // Изменяет масштаб относительно точки под курсором мыши.
  zoomAt(deltaY: number, point: Position) {
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

  // Возвращает размеры прямоугольника после применения текущего поворота.
  #getDisplayedSize(width: number, height: number) {
    return this.#isRotated ? {width: height, height: width} : {width, height}
  }

  // Возвращает масштаб, при котором всё поле помещается в рабочую область.
  #getFitScale() {
    const level = this.#level
    if (!level) return 1
    const boardWidth = level.map[0].length * TILE_SIZE
    const boardHeight = level.map.length * TILE_SIZE
    const displayedSize = this.#getDisplayedSize(boardWidth, boardHeight)
    const widthScale = (this.#viewportWidth - BOARD_PADDING * 2) / displayedSize.width
    const heightScale = (this.#viewportHeight - BOARD_PADDING * 2) / displayedSize.height
    return Math.max(Math.min(widthScale, heightScale, 1.35), 0.1)
  }

  // Центрирует поле с учётом текущего увеличения.
  #centerBoard() {
    const level = this.#level
    if (!level) return
    const boardWidth = level.map[0].length * TILE_SIZE
    const boardHeight = level.map.length * TILE_SIZE
    const scale = this.#getFitScale() * this.#zoom
    this.scale.set(scale)
    this.pivot.set(boardWidth / 2, boardHeight / 2)
    this.position.set(this.#viewportWidth / 2, this.#viewportHeight / 2)
  }

  // Вписывает непустую часть уровня с вертикальным запасом в одну клетку.
  #focusInitialContent() {
    const bounds = this.#getInitialViewBounds()
    if (!bounds) return this.#centerBoard()

    const fitScale = this.#getFitScale()
    const contentWidth = (bounds.maxX - bounds.minX + 1) * TILE_SIZE
    const contentHeight = (bounds.maxY - bounds.minY + 1) * TILE_SIZE
    const displayedSize = this.#getDisplayedSize(contentWidth, contentHeight)
    const contentScale = Math.min(
      (this.#viewportWidth - BOARD_PADDING * 2) / displayedSize.width,
      this.#viewportHeight / displayedSize.height,
    )
    this.#zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, contentScale / fitScale))
    this.#applyViewBounds(bounds, fitScale * this.#zoom)
  }

  // Возвращает границы содержимого с дополнительными рядами сверху и снизу.
  #getInitialViewBounds(): Bounds | null {
    const level = this.#level
    if (!level) return null
    const bounds = getContentBounds(level.map)
    if (!bounds) return null

    return {
      ...bounds,
      minY: Math.max(0, bounds.minY - INITIAL_VERTICAL_PADDING),
      maxY: Math.min(level.map.length - 1, bounds.maxY + INITIAL_VERTICAL_PADDING),
    }
  }

  // Центрирует выбранные границы рабочего поля при заданном масштабе.
  #applyViewBounds(bounds: Bounds, scale: number) {
    const centerX = ((bounds.minX + bounds.maxX + 1) * TILE_SIZE) / 2
    const centerY = ((bounds.minY + bounds.maxY + 1) * TILE_SIZE) / 2
    this.scale.set(scale)
    this.pivot.set(centerX, centerY)
    this.position.set(this.#viewportWidth / 2, this.#viewportHeight / 2)
  }

  // Сохраняет выбранную точку поля под курсором во время увеличения.
  #applyZoomAtPoint(nextZoom: number, point: Position) {
    const localPoint = this.toLocal(point)
    const scale = this.#getFitScale() * nextZoom
    this.#zoom = nextZoom
    this.scale.set(scale)
    const transformedPoint = this.toGlobal(localPoint)
    this.position.set(this.x + point.x - transformedPoint.x, this.y + point.y - transformedPoint.y)
  }

  // Выполняет отдельную операцию `render`.
  #render() {
    this.#decorSprites.clear()
    this.removeChildren().forEach((child) => child.destroy({children: true}))
    if (!this.#level) return

    const scene = new Container({label: 'sokoban-level-editor-scene', sortableChildren: true})
    scene.addChild(this.#createBackground())
    const level = this.#level
    level.map.forEach((row, y) => {
      Array.from(row).forEach((symbol, x) => this.#addCell(scene, symbol, {x, y}))
    })
    scene.addChild(this.#createGrid())
    scene.addChild(this.#createIssueOverlay())
    scene.addChild(this.#createDecorOverlay(scene))
    this.addChild(scene)
    this.hitArea = new Rectangle(0, 0, level.map[0].length * TILE_SIZE, level.map.length * TILE_SIZE)
  }

  // Создаёт данные или представление для операции `createBackground`.
  #createBackground() {
    const level = this.#level
    if (!level) throw new Error('[EditorBoard]: level is missing')
    const width = level.map[0].length * TILE_SIZE
    const height = level.map.length * TILE_SIZE
    return new Graphics({label: 'sokoban-level-editor-background'}).rect(0, 0, width, height).fill({color: 0x101913, alpha: 0.94})
  }

  // Добавляет данные или представление через операцию `addCell`.
  #addCell(scene: Container, symbol: string, position: Position) {
    if (symbol === '_') return scene.addChild(this.#createVoidCell(position))
    if (symbol === '#') {
      const decorTexture = this.#getDecorTextureName(position)
      if (this.#appearance.ground?.[`${position.x}:${position.y}`]) {
        scene.addChild(this.#createRoleSprite('ground', position, this.#getTextureName('ground', position)))
      }
      if (!decorTexture) return scene.addChild(this.#createRoleSprite('wall', position, this.#getTextureName('wall', position)))

      return scene.addChild(this.#createRoleSprite('decor', position, decorTexture))
    }

    scene.addChild(this.#createRoleSprite('ground', position, this.#getTextureName('ground', position)))
    if ('.-*'.includes(symbol)) scene.addChild(this.#createRoleSprite('target', position, this.#getTextureName('target', position)))
    if ('$-'.includes(symbol)) scene.addChild(this.#createRoleSprite('box', position, this.#getTextureName('box', position)))
    if ('@*'.includes(symbol)) scene.addChild(this.#createRoleSprite('player', position, SOKOBAN_TEXTURES.player))
  }

  // Создаёт данные или представление для операции `createVoidCell`.
  #createVoidCell(position: Position) {
    return new Graphics({label: `editor-void-${position.x}-${position.y}`})
      .rect(position.x * TILE_SIZE, position.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      .fill({color: 0x07100b, alpha: 0.62})
  }

  // Создаёт данные или представление для операции `createRoleSprite`.
  #createRoleSprite(role: string, position: Position, textureName: string) {
    const texture = this.#textures[textureName]
    if (!texture) throw new Error(`[EditorBoard]: texture ${textureName} is missing`)

    const sprite = new Sprite({label: `editor-${role}-${position.x}-${position.y}`, texture})
    const anchorY = role === 'wall' || role === 'box' ? 0.5 : 1
    sprite.anchor.set(0.5, anchorY)
    const offset = role === 'decor' ? this.#appearance.decorOffsets?.[`${position.x}:${position.y}`] : undefined
    const transform = getBoardTileVisualTransform({position, anchorY, tileSize: TILE_SIZE, rotation: this.rotation, offset})
    sprite.position.copyFrom(transform.position)
    sprite.rotation = transform.rotation
    sprite.zIndex = this.#getRoleDepth(role, position.y)
    applyTileVisualScale(sprite, TILE_SIZE)
    if (role === 'decor') this.#decorSprites.set(sprite, position)
    return sprite
  }

  // Возвращает данные, за которые отвечает операция `getRoleDepth`.
  #getRoleDepth(role: string, row: number) {
    if (role === 'ground' || role === 'target') return 0
    if (role === 'box') return 1
    if (role === 'wall' || role === 'decor') return 2 + row * 2
    return 3 + row * 2
  }

  // Создаёт данные или представление для операции `createGrid`.
  #createGrid() {
    const grid = new Graphics({label: 'sokoban-level-editor-grid', zIndex: 1000})
    const level = this.#level
    if (!level) return grid
    level.map.forEach((row, y) => {
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

  // Обводит весь декор в режиме выбора либо один выбранный объект с прозрачностью 50%.
  #createDecorOverlay(scene: Container) {
    const overlay = new Graphics({label: 'editor-decor-selection', zIndex: 1002})
    if (this.#brush?.mode !== 'select-decor') return overlay
    const selected = this.#selectedDecor
    const selectedLabel = selected ? `editor-decor-${selected.x}-${selected.y}` : null
    for (const child of scene.children) {
      if (!(child instanceof Sprite) || !child.label.startsWith('editor-decor-')) continue
      if (selectedLabel && child.label !== selectedLabel) continue
      if (selected) {
        this.#drawSelectedDecorFrame(overlay, child)
        continue
      }
      this.#drawDecorFrame(overlay, child)
    }
    return overlay
  }

  // Обводит повернутые границы доступного для выбора декора.
  #drawDecorFrame(overlay: Graphics, sprite: Sprite) {
    const corners = this.#getSpriteCorners(sprite)
    overlay.moveTo(corners[0].x, corners[0].y)
    corners.slice(1).forEach(({x, y}) => overlay.lineTo(x, y))
    overlay.closePath().stroke({color: 0xbedf70, width: 3, join: 'round'})
  }

  // Обводит выбранный объект красной пунктирной рамкой с прозрачностью 50%.
  #drawSelectedDecorFrame(overlay: Graphics, sprite: Sprite) {
    const corners = this.#getSpriteCorners(sprite)
    corners.forEach((corner, index) => this.#drawDashedLine(overlay, corner, corners[(index + 1) % corners.length]))
    overlay.stroke({color: 0xff0000, width: 3, alpha: 0.5})
  }

  // Возвращает углы визуала в координатах сцены с учётом его поворота.
  #getSpriteCorners(sprite: Sprite) {
    const left = -sprite.width * sprite.anchor.x
    const top = -sprite.height * sprite.anchor.y
    const offsets = [
      {x: left, y: top},
      {x: left + sprite.width, y: top},
      {x: left + sprite.width, y: top + sprite.height},
      {x: left, y: top + sprite.height},
    ]
    const cos = Math.cos(sprite.rotation)
    const sin = Math.sin(sprite.rotation)
    return offsets.map(({x, y}) => ({x: sprite.x + x * cos - y * sin, y: sprite.y + x * sin + y * cos}))
  }

  // Добавляет отдельные штрихи вдоль стороны рамки.
  #drawDashedLine(overlay: Graphics, start: Position, end: Position) {
    const length = Math.hypot(end.x - start.x, end.y - start.y)
    if (!length) return
    const dx = (end.x - start.x) / length
    const dy = (end.y - start.y) / length
    for (let offset = 0; offset < length; offset += SELECTION_DASH + SELECTION_GAP) {
      const finish = Math.min(offset + SELECTION_DASH, length)
      overlay.moveTo(start.x + dx * offset, start.y + dy * offset)
      overlay.lineTo(start.x + dx * finish, start.y + dy * finish)
    }
  }

  // Возвращает данные, за которые отвечает операция `getTextureName`.
  #getTextureName(role: string, position: Position) {
    return this.#appearance[role as Exclude<keyof LevelAppearance, 'decorOffsets'>]?.[`${position.x}:${position.y}`] ?? this.#defaults[role]
  }

  // Возвращает текстуру декоративной стены только для явно оформленной клетки.
  #getDecorTextureName(position: Position) {
    return this.#appearance.decor?.[`${position.x}:${position.y}`] ?? null
  }

  // Выполняет отдельную операцию `startPainting`.
  #startPainting = (event: any) => {
    if (![0, 2].includes(event.button) || !this.#brush) return
    if (this.#brush.mode === 'select-decor') {
      const position = this.#getDecorPosition(event) ?? this.#getCellPosition(event)
      if (position) this.#onPaint({brush: this.#brush, position, positionKey: `${position.x}:${position.y}`})
      return
    }
    this.#paintingBrush = event.button === 2 ? {mode: 'void', label: 'Пустота'} : this.#brush
    this.#lastPaintedPosition = null
    this.#paintAt(event)
  }

  // Находит верхний декор по видимым границам с учётом его индивидуального смещения.
  #getDecorPosition(event: any) {
    const sprites = [...this.#decorSprites.entries()].sort(([first], [second]) => second.zIndex - first.zIndex)
    return sprites.find(([sprite]) => {
      const point = sprite.toLocal(event.global)
      const bounds = sprite.getLocalBounds()
      return point.x >= bounds.x && point.x <= bounds.x + bounds.width && point.y >= bounds.y && point.y <= bounds.y + bounds.height
    })?.[1]
  }

  // Выполняет отдельную операцию `continuePainting`.
  #continuePainting = (event: any) => {
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
  #paintAt(event: any) {
    const position = this.#getCellPosition(event)
    const positionKey = position ? `${position.x}:${position.y}` : null
    if (!position || positionKey === this.#lastPaintedPosition) return

    this.#lastPaintedPosition = positionKey
    this.#onPaint({brush: this.#paintingBrush as EditorBrush, position, positionKey: positionKey as string})
  }

  // Возвращает данные, за которые отвечает операция `getCellPosition`.
  #getCellPosition(event: any) {
    const level = this.#level
    if (!level) return null
    const point = this.toLocal(event.global)
    const position = {x: Math.floor(point.x / TILE_SIZE), y: Math.floor(point.y / TILE_SIZE)}
    if (position.x < 0 || position.y < 0) return null
    if (position.y >= level.map.length || position.x >= level.map[0].length) return null
    return position
  }
}
