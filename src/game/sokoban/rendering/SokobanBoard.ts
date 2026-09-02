import {gsap} from 'gsap'
import type {DestroyOptions, Sprite} from 'pixi.js'
import {Container, Graphics, Rectangle} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import Locator from '../../engine/Locator.ts'
import {WORLD} from '../../gameConfig/constants.js'
import type {LevelAppearance} from '../../gameConfig/levels/levelTypes.js'
import type {SokobanDirectionName} from '../config/config.js'
import {ROTATED_DIRECTIONS, SOKOBAN_TEXTURES} from '../config/config.js'
import {SOKOBAN_SETTINGS} from '../config/settings.js'
import type {PushedBox, SokobanMoveResult, SokobanPosition} from '../gameplay/SokobanLevel.js'
import SokobanLevel from '../gameplay/SokobanLevel.js'
import {applyTileVisualScale} from './applyTileVisualScale.js'
import SokobanBoxView from './SokobanBoxView.js'

/**
 * Отображает карту, игрока, ящики и анимации игровой доски Sokoban.
 */

const BOARD_Z_INDEX = {
  ground: 0, // Глубина пола и целей
  boxes: 1, // Базовая глубина контейнера ящиков
  firstDepthRow: 2, // Глубина первого ряда стен
  playerRowOffset: 1, // Смещение игрока поверх стены текущего ряда
  deadlockHighlight: SOKOBAN_SETTINGS.maxBoardRows * 2 + 2, // Глубина подсветки тупика поверх всей доски
}

type TileTextureType = Exclude<keyof typeof SOKOBAN_TEXTURES, 'player'>
type MovementOptions = {isContinuous?: boolean}

export default class SokobanBoard extends Container {
  #level: SokobanLevel
  #appearance: LevelAppearance
  #tileSize = SOKOBAN_SETTINGS.tileSize
  #boardWidth: number
  #boardHeight: number
  #boxesContainer!: Container
  #boxViews = new Map<string, SokobanBoxView>()
  #player!: Sprite
  #movementTimeline: gsap.core.Timeline | null = null
  #deadlockHighlight!: Graphics
  #deadlockTimeline: gsap.core.Timeline | null = null
  #isRotated = false

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(level: SokobanLevel, appearance: LevelAppearance = {}) {
    super({label: 'sokoban-board', sortableChildren: true})

    this.#level = level
    this.#appearance = appearance
    this.#boardWidth = level.width * this.#tileSize
    this.#boardHeight = level.height * this.#tileSize
    this.boundsArea = new Rectangle(0, 0, this.#boardWidth, this.#boardHeight)
    this.#init()
  }

  // Синхронизирует положение игрока и ящиков с моделью.
  update() {
    this.#killMovementTimeline()
    this.#hideDeadlockHighlight()
    this.#updateBoxes()
    this.#updatePlayer()
  }

  // Показывает подсветку клетки с застрявшим ящиком.
  showDeadlock(position: SokobanPosition) {
    this.#hideDeadlockHighlight()
    this.#deadlockHighlight.position.set(position.x * this.#tileSize, position.y * this.#tileSize)
    this.#deadlockHighlight.visible = true
    this.#deadlockTimeline = this.#createDeadlockTimeline()
  }

  // Анимирует перемещение игрока и при необходимости ящика.
  animateMove(moveResult: SokobanMoveResult, {isContinuous = false}: MovementOptions = {}) {
    return new Promise<void>((resolve) => {
      this.#updatePlayerDepth()
      this.#movementTimeline = this.#createMovementTimeline(moveResult, isContinuous, resolve)
    })
  }

  // Пересчитывает размеры и расположение представления.
  resize() {
    const shouldRotate = this.#shouldRotate()
    const {width, height} = this.#getDisplayedSize(shouldRotate)
    const boardScale = this.#getBoardScale(width, height)

    this.#isRotated = shouldRotate
    this.rotation = shouldRotate ? Math.PI / 2 : 0
    this.scale.set(boardScale)
    this.position.set(WORLD.HALF_W, this.#getBoardCenterY())
  }

  // Преобразует экранное направление в направление карты.
  getLevelDirection(direction: SokobanDirectionName): SokobanDirectionName {
    return this.#isRotated ? ROTATED_DIRECTIONS[direction] : direction
  }

  // Возвращает данные раскладки доски для внешнего интерфейса.
  getLayout(parent: Container) {
    const bounds = this.getBounds()
    const topLeft = parent.toLocal({x: bounds.x, y: bounds.y})
    const bottomRight = parent.toLocal({
      x: bounds.x + bounds.width,
      y: bounds.y + bounds.height,
    })
    const tileStart = parent.toLocal(this.toGlobal({x: 0, y: 0}))
    const tileEnd = parent.toLocal(this.toGlobal({x: this.#tileSize, y: 0}))

    return {
      boardWidth: Math.abs(bottomRight.x - topLeft.x),
      tileSize: Math.hypot(tileEnd.x - tileStart.x, tileEnd.y - tileStart.y),
    }
  }

  // Освобождает обработчики, анимации и ресурсы экземпляра.
  destroy(options?: DestroyOptions) {
    this.#killMovementTimeline()
    this.#hideDeadlockHighlight()
    super.destroy(options)
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init() {
    const {groundTiles, wallRows} = this.#createTileLayers()
    this.#boxesContainer = new Container({label: 'sokoban-boxes'})
    this.#player = this.#createPlayer()
    this.#deadlockHighlight = this.#createDeadlockHighlight()
    groundTiles.zIndex = BOARD_Z_INDEX.ground
    this.#boxesContainer.zIndex = BOARD_Z_INDEX.boxes
    this.#deadlockHighlight.zIndex = BOARD_Z_INDEX.deadlockHighlight

    this.#createBoxes()
    this.addChild(groundTiles, this.#boxesContainer, ...wallRows, this.#player, this.#deadlockHighlight)
    this.pivot.set(this.#boardWidth / 2, this.#boardHeight / 2)
    this.update()
    this.resize()
  }

  // Проверяет, требуется ли визуально повернуть высокую доску.
  #shouldRotate() {
    return SOKOBAN_SETTINGS.rotateTallBoardInLandscape && this.#level.height > this.#level.width && WORLD.isLandscape
  }

  // Возвращает отображаемые размеры с учётом поворота доски.
  #getDisplayedSize(shouldRotate: boolean) {
    return {
      width: shouldRotate ? this.#boardHeight : this.#boardWidth,
      height: shouldRotate ? this.#boardWidth : this.#boardHeight,
    }
  }

  // Вычисляет масштаб доски по доступному экранному пространству.
  #getBoardScale(displayedWidth: number, displayedHeight: number) {
    const {scaleFactor} = Locator.gameResize.resizeData
    const visibleWidth = window.innerWidth / scaleFactor
    const horizontalPadding = this.#getHorizontalPadding(visibleWidth)
    const availableWidth = visibleWidth - horizontalPadding * 2
    const availableHeight = WORLD.HEIGHT - SOKOBAN_SETTINGS.boardTopPadding - SOKOBAN_SETTINGS.boardBottomPadding

    return Math.min(availableWidth / displayedWidth, availableHeight / displayedHeight)
  }

  // Возвращает вертикальный центр доступной области доски.
  #getBoardCenterY() {
    const availableHeight = WORLD.HEIGHT - SOKOBAN_SETTINGS.boardTopPadding - SOKOBAN_SETTINGS.boardBottomPadding

    return SOKOBAN_SETTINGS.boardTopPadding + availableHeight / 2
  }

  // Вычисляет адаптивный горизонтальный отступ доски.
  #getHorizontalPadding(visibleWidth: number) {
    const preferredPadding = Math.max(
      SOKOBAN_SETTINGS.minHorizontalPadding,
      Math.min(SOKOBAN_SETTINGS.maxHorizontalPadding, visibleWidth * SOKOBAN_SETTINGS.horizontalPaddingRatio),
    )

    return Math.min(preferredPadding, visibleWidth * SOKOBAN_SETTINGS.maxHorizontalPaddingRatio)
  }

  // Создаёт слои пола, стен и ящиков игровой доски.
  #createTileLayers() {
    const groundTiles = new Container({label: 'sokoban-ground-tiles'})
    const wallRows = this.#createWallRows()

    for (let y = 0; y < this.#level.height; y++) {
      for (let x = 0; x < this.#level.width; x++) {
        this.#addTileViews(groundTiles, wallRows[y], {x, y})
      }
    }

    return {groundTiles, wallRows}
  }

  // Создаёт контейнеры глубины для каждого ряда стен.
  #createWallRows() {
    return Array.from({length: this.#level.height}, (_, rowIndex) => {
      const wallRow = new Container({label: `sokoban-wall-row-${rowIndex}`})
      wallRow.zIndex = this.#getWallRowDepth(rowIndex)
      return wallRow
    })
  }

  // Распределяет визуалы клетки между слоями пола и стен.
  #addTileViews(groundTiles: Container, wallTiles: Container, position: SokobanPosition) {
    if (this.#level.isVoid(position)) return

    if (this.#level.isWall(position)) {
      wallTiles.addChild(this.#createTileSprite(this.#getTextureName('wall', position), position, 'wall'))
      return
    }

    groundTiles.addChild(this.#createTileSprite(this.#getTextureName('floor', position), position, 'floor'))
    if (this.#level.isTarget(position)) {
      groundTiles.addChild(this.#createTileSprite(this.#getTextureName('target', position), position, 'target'))
    }
  }

  // Создаёт и позиционирует спрайт тайла.
  #createTileSprite(textureName: string, position: SokobanPosition, type: TileTextureType) {
    const tile = GameUtils.createSprite(textureName, {
      label: `sokoban-${type}-${position.x}-${position.y}`,
      anchorY: 1,
    })

    tile.position.copyFrom(this.#getTileVisualPosition(position))
    applyTileVisualScale(tile, this.#tileSize)
    return tile
  }

  // Создаёт представления всех ящиков текущего уровня.
  #createBoxes() {
    this.#level.boxes.forEach((box) => {
      const textureName = this.#getTextureName('box', box)
      const boxView = new SokobanBoxView(box.id, this.#tileSize, textureName)
      this.#boxViews.set(box.id, boxView)
      this.#boxesContainer.addChild(boxView)
    })
  }

  // Возвращает назначенную клетке текстуру или значение по умолчанию.
  #getTextureName(type: TileTextureType, position: SokobanPosition) {
    const positionKey = `${position.x}:${position.y}`
    return this.#appearance[type]?.[positionKey] ?? SOKOBAN_TEXTURES[type]
  }

  // Создаёт и размещает спрайт игрока.
  #createPlayer() {
    const player = GameUtils.createSprite(SOKOBAN_TEXTURES.player, {
      label: 'sokoban-player',
      anchorY: 1,
    })

    applyTileVisualScale(player, this.#tileSize)
    return player
  }

  // Создаёт подсветку клетки с застрявшим ящиком.
  #createDeadlockHighlight() {
    const inset = this.#tileSize * 0.06
    const size = this.#tileSize - inset * 2
    const cornerRadius = this.#tileSize * 0.12

    return new Graphics({label: 'sokoban-deadlock-highlight', visible: false})
      .roundRect(inset, inset, size, size, cornerRadius)
      .fill({color: 0xff2f3d, alpha: 0.34})
      .stroke({color: 0xff6b75, width: this.#tileSize * 0.05})
  }

  // Создаёт таймлайн одного игрового перемещения.
  #createMovementTimeline(moveResult: SokobanMoveResult, isContinuous: boolean, resolve: () => void) {
    const timeline = gsap.timeline({
      onComplete: () => this.#finishMovement(resolve),
    })
    const playerPosition = this.#getPlayerPixelPosition()

    timeline.to(this.#player.position, this.#getMovementVars(playerPosition, isContinuous))
    this.#addBoxMovement(timeline, moveResult.pushedBox, isContinuous)
    return timeline
  }

  // Добавляет перемещение толкнутого ящика в общий таймлайн хода.
  #addBoxMovement(timeline: gsap.core.Timeline, pushedBox: PushedBox | null | undefined, isContinuous: boolean) {
    if (!pushedBox) return

    const boxView = this.#boxViews.get(pushedBox.id)
    if (!boxView) return

    timeline.to(boxView.position, this.#getMovementVars(this.#getBoxPixelPosition(pushedBox.to), isContinuous), '<')
  }

  // Создаёт параметры анимации перемещения к клетке.
  #getMovementVars(position: SokobanPosition, isContinuous: boolean) {
    return {
      ...position,
      duration: SOKOBAN_SETTINGS.moveDuration,
      ease: isContinuous ? SOKOBAN_SETTINGS.continuousMoveEase : SOKOBAN_SETTINGS.moveEase,
    }
  }

  // Возвращает экранную позицию игрока.
  #getPlayerPixelPosition() {
    return this.#getTileVisualPosition(this.#level.playerPosition)
  }

  // Возвращает экранную позицию ящика.
  #getBoxPixelPosition(position: SokobanPosition) {
    return {
      x: position.x * this.#tileSize,
      y: position.y * this.#tileSize,
    }
  }

  // Возвращает позицию визуала с учётом якоря тайла.
  #getTileVisualPosition(position: SokobanPosition) {
    return {
      x: (position.x + 0.5) * this.#tileSize,
      y: (position.y + 1) * this.#tileSize,
    }
  }

  // Завершает таймлайн движения и сообщает об окончании анимации.
  #finishMovement(resolve: () => void) {
    this.#movementTimeline = null
    this.#updateBoxTargetStates()
    resolve()
  }

  // Создаёт анимацию предупреждения о тупике.
  #createDeadlockTimeline() {
    return gsap
      .timeline({
        onComplete: () => this.#hideDeadlockHighlight(),
      })
      .fromTo(this.#deadlockHighlight, {alpha: 0}, {alpha: 1, duration: 0.14})
      .to(this.#deadlockHighlight, {
        alpha: 0.28,
        duration: 0.22,
        repeat: 5,
        yoyo: true,
      })
      .to(this.#deadlockHighlight, {alpha: 0, duration: 0.3})
  }

  // Останавливает незавершённую анимацию перемещения.
  #killMovementTimeline() {
    this.#movementTimeline?.kill()
    this.#movementTimeline = null
  }

  // Скрывает подсветку тупиковой клетки.
  #hideDeadlockHighlight() {
    this.#deadlockTimeline?.kill()
    this.#deadlockTimeline = null
    if (!this.#deadlockHighlight) return

    this.#deadlockHighlight.alpha = 0
    this.#deadlockHighlight.visible = false
  }

  // Обновляет позиции всех ящиков по данным модели.
  #updateBoxes() {
    this.#level.boxes.forEach((box) => {
      const boxView = this.#boxViews.get(box.id)
      boxView!.position.set(box.x * this.#tileSize, box.y * this.#tileSize)
    })
    this.#updateBoxTargetStates()
  }

  // Обновляет позицию игрока по данным модели.
  #updatePlayer() {
    const {x, y} = this.#getPlayerPixelPosition()
    this.#player.position.set(x, y)
    this.#updatePlayerDepth()
  }

  // zIndex обновляется на каждом ходу, чтобы игрок корректно проходил между рядами стен.
  // Устанавливает глубину игрока по текущему ряду.
  #updatePlayerDepth() {
    this.#player.zIndex = this.#getWallRowDepth(this.#level.playerPosition.y) + BOARD_Z_INDEX.playerRowOffset
  }

  // Возвращает глубину визуального ряда стен.
  #getWallRowDepth(rowIndex: number) {
    // Шаг в два слоя оставляет место игроку между соседними рядами кустов.
    return BOARD_Z_INDEX.firstDepthRow + rowIndex * 2
  }

  // Обновляет оформление ящиков, стоящих на целях.
  #updateBoxTargetStates() {
    this.#boxViews.forEach((boxView) => {
      const position = {
        x: Math.round(boxView.x / this.#tileSize),
        y: Math.round(boxView.y / this.#tileSize),
      }
      boxView.setOnTarget(this.#level.isTarget(position))
    })
  }
}
