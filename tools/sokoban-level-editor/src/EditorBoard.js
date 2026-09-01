import {Container, Graphics, Rectangle, Sprite} from 'pixi.js'
import {SOKOBAN_TEXTURES} from '@/game/sokoban/config/config.js'
import {applyTileVisualScale} from '@/game/sokoban/rendering/applyTileVisualScale.js'

/**
 * Отображает редактируемую карту настоящими PixiJS-тайлами и принимает рисование.
 */

const TILE_SIZE = 100 // Логический размер клетки редактора
const BOARD_PADDING = 44 // Минимальный отступ карты от краёв рабочей области

export default class EditorBoard extends Container {
  #appearance = {}
  #brush = null
  #defaults
  #invalidPositions = []
  #isPainting = false
  #lastPaintedPosition = null
  #level = null
  #onPaint
  #textures

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

    const boardWidth = this.#level.map[0].length * TILE_SIZE
    const boardHeight = this.#level.map.length * TILE_SIZE
    const scale = Math.min((width - BOARD_PADDING * 2) / boardWidth, (height - BOARD_PADDING * 2) / boardHeight, 1.35)
    this.scale.set(Math.max(scale, 0.1))
    this.position.set((width - boardWidth * this.scale.x) / 2, (height - boardHeight * this.scale.y) / 2)
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
    if ('.-*'.includes(symbol)) scene.addChild(this.#createRoleSprite('target', position, SOKOBAN_TEXTURES.target))
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
    if (event.button !== 0 || !this.#brush) return
    this.#isPainting = true
    this.#lastPaintedPosition = null
    this.#paintAt(event)
  }

  // Выполняет отдельную операцию `continuePainting`.
  #continuePainting = (event) => {
    if (!this.#isPainting) return
    this.#paintAt(event)
  }

  // Выполняет отдельную операцию `stopPainting`.
  #stopPainting = () => {
    this.#isPainting = false
    this.#lastPaintedPosition = null
  }

  // Выполняет отдельную операцию `paintAt`.
  #paintAt(event) {
    const position = this.#getCellPosition(event)
    const positionKey = position ? `${position.x}:${position.y}` : null
    if (!position || positionKey === this.#lastPaintedPosition) return

    this.#lastPaintedPosition = positionKey
    this.#onPaint({brush: this.#brush, position, positionKey})
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
