import {gsap} from 'gsap'
import {Container, Graphics, Rectangle} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import Locator from '../engine/Locator.ts'
import {WORLD} from '../gameConfig/constants.js'
import {applyTileVisualScale} from './applyTileVisualScale.js'
import {ROTATED_DIRECTIONS, SOKOBAN_TEXTURES} from './config.js'
import {SOKOBAN_SETTINGS} from './settings.js'
import SokobanBoxView from './SokobanBoxView.js'

const BOARD_Z_INDEX = {
  ground: 0,
  boxes: 1,
  firstDepthRow: 2,
  playerRowOffset: 1,
  deadlockHighlight: SOKOBAN_SETTINGS.maxBoardRows * 2 + 2,
}

export default class SokobanBoard extends Container {
  #level
  #appearance
  #tileSize = SOKOBAN_SETTINGS.tileSize
  #boardWidth
  #boardHeight
  #boxesContainer
  #boxViews = new Map()
  #player
  #movementTimeline = null
  #deadlockHighlight
  #deadlockTimeline = null
  #isRotated = false

  constructor(level, appearance = {}) {
    super({label: 'sokoban-board', sortableChildren: true})

    this.#level = level
    this.#appearance = appearance
    this.#boardWidth = level.width * this.#tileSize
    this.#boardHeight = level.height * this.#tileSize
    this.boundsArea = new Rectangle(0, 0, this.#boardWidth, this.#boardHeight)
    this.#init()
  }

  update() {
    this.#killMovementTimeline()
    this.#hideDeadlockHighlight()
    this.#updateBoxes()
    this.#updatePlayer()
  }

  showDeadlock(position) {
    this.#hideDeadlockHighlight()
    this.#deadlockHighlight.position.set(position.x * this.#tileSize, position.y * this.#tileSize)
    this.#deadlockHighlight.visible = true
    this.#deadlockTimeline = this.#createDeadlockTimeline()
  }

  animateMove(moveResult, {isContinuous = false} = {}) {
    return new Promise((resolve) => {
      this.#updatePlayerDepth()
      this.#movementTimeline = this.#createMovementTimeline(moveResult, isContinuous, resolve)
    })
  }

  resize() {
    const shouldRotate = this.#shouldRotate()
    const {width, height} = this.#getDisplayedSize(shouldRotate)
    const boardScale = this.#getBoardScale(width, height)

    this.#isRotated = shouldRotate
    this.rotation = shouldRotate ? Math.PI / 2 : 0
    this.scale.set(boardScale)
    this.position.set(WORLD.HALF_W, this.#getBoardCenterY())
  }

  getLevelDirection(direction) {
    return this.#isRotated ? ROTATED_DIRECTIONS[direction] : direction
  }

  getLayout(parent) {
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

  destroy(options) {
    this.#killMovementTimeline()
    this.#hideDeadlockHighlight()
    super.destroy(options)
  }

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

  #shouldRotate() {
    return SOKOBAN_SETTINGS.rotateTallBoardInLandscape && this.#level.height > this.#level.width && WORLD.isLandscape
  }

  #getDisplayedSize(shouldRotate) {
    return {
      width: shouldRotate ? this.#boardHeight : this.#boardWidth,
      height: shouldRotate ? this.#boardWidth : this.#boardHeight,
    }
  }

  #getBoardScale(displayedWidth, displayedHeight) {
    const {scaleFactor} = Locator.gameResize.resizeData
    const visibleWidth = window.innerWidth / scaleFactor
    const horizontalPadding = this.#getHorizontalPadding(visibleWidth)
    const availableWidth = visibleWidth - horizontalPadding * 2
    const availableHeight = WORLD.HEIGHT - SOKOBAN_SETTINGS.boardTopPadding - SOKOBAN_SETTINGS.boardBottomPadding

    return Math.min(availableWidth / displayedWidth, availableHeight / displayedHeight)
  }

  #getBoardCenterY() {
    const availableHeight = WORLD.HEIGHT - SOKOBAN_SETTINGS.boardTopPadding - SOKOBAN_SETTINGS.boardBottomPadding

    return SOKOBAN_SETTINGS.boardTopPadding + availableHeight / 2
  }

  #getHorizontalPadding(visibleWidth) {
    const preferredPadding = Math.max(
      SOKOBAN_SETTINGS.minHorizontalPadding,
      Math.min(SOKOBAN_SETTINGS.maxHorizontalPadding, visibleWidth * SOKOBAN_SETTINGS.horizontalPaddingRatio),
    )

    return Math.min(preferredPadding, visibleWidth * SOKOBAN_SETTINGS.maxHorizontalPaddingRatio)
  }

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

  #createWallRows() {
    return Array.from({length: this.#level.height}, (_, rowIndex) => {
      const wallRow = new Container({label: `sokoban-wall-row-${rowIndex}`})
      wallRow.zIndex = this.#getWallRowDepth(rowIndex)
      return wallRow
    })
  }

  #addTileViews(groundTiles, wallTiles, position) {
    if (this.#level.isVoid(position)) return

    if (this.#level.isWall(position)) {
      wallTiles.addChild(this.#createTileSprite(this.#getTextureName('wall', position), position, 'wall'))
      return
    }

    groundTiles.addChild(this.#createTileSprite(this.#getTextureName('floor', position), position, 'floor'))
    if (this.#level.isTarget(position)) {
      groundTiles.addChild(this.#createTileSprite(SOKOBAN_TEXTURES.target, position, 'target'))
    }
  }

  #createTileSprite(textureName, position, type) {
    const tile = GameUtils.createSprite(textureName, {
      label: `sokoban-${type}-${position.x}-${position.y}`,
      anchorY: 1,
    })

    tile.position.copyFrom(this.#getTileVisualPosition(position))
    applyTileVisualScale(tile, this.#tileSize)
    return tile
  }

  #createBoxes() {
    this.#level.boxes.forEach((box) => {
      const textureName = this.#getTextureName('box', box)
      const boxView = new SokobanBoxView(box.id, this.#tileSize, textureName)
      this.#boxViews.set(box.id, boxView)
      this.#boxesContainer.addChild(boxView)
    })
  }

  #getTextureName(type, position) {
    const positionKey = `${position.x}:${position.y}`
    return this.#appearance[type]?.[positionKey] ?? SOKOBAN_TEXTURES[type]
  }

  #createPlayer() {
    const player = GameUtils.createSprite(SOKOBAN_TEXTURES.player, {
      label: 'sokoban-player',
      anchorY: 1,
    })

    applyTileVisualScale(player, this.#tileSize)
    return player
  }

  #createDeadlockHighlight() {
    const inset = this.#tileSize * 0.06
    const size = this.#tileSize - inset * 2
    const cornerRadius = this.#tileSize * 0.12

    return new Graphics({label: 'sokoban-deadlock-highlight', visible: false})
      .roundRect(inset, inset, size, size, cornerRadius)
      .fill({color: 0xff2f3d, alpha: 0.34})
      .stroke({color: 0xff6b75, width: this.#tileSize * 0.05})
  }

  #createMovementTimeline(moveResult, isContinuous, resolve) {
    const timeline = gsap.timeline({
      onComplete: () => this.#finishMovement(resolve),
    })
    const playerPosition = this.#getPlayerPixelPosition()

    timeline.to(this.#player.position, this.#getMovementVars(playerPosition, isContinuous))
    this.#addBoxMovement(timeline, moveResult.pushedBox, isContinuous)
    return timeline
  }

  #addBoxMovement(timeline, pushedBox, isContinuous) {
    if (!pushedBox) return

    const boxView = this.#boxViews.get(pushedBox.id)
    if (!boxView) return

    timeline.to(boxView.position, this.#getMovementVars(this.#getBoxPixelPosition(pushedBox.to), isContinuous), '<')
  }

  #getMovementVars(position, isContinuous) {
    return {
      ...position,
      duration: SOKOBAN_SETTINGS.moveDuration,
      ease: isContinuous ? SOKOBAN_SETTINGS.continuousMoveEase : SOKOBAN_SETTINGS.moveEase,
    }
  }

  #getPlayerPixelPosition() {
    return this.#getTileVisualPosition(this.#level.playerPosition)
  }

  #getBoxPixelPosition(position) {
    return {
      x: position.x * this.#tileSize,
      y: position.y * this.#tileSize,
    }
  }

  #getTileVisualPosition(position) {
    return {
      x: (position.x + 0.5) * this.#tileSize,
      y: (position.y + 1) * this.#tileSize,
    }
  }

  #finishMovement(resolve) {
    this.#movementTimeline = null
    this.#updateBoxTargetStates()
    resolve()
  }

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

  #killMovementTimeline() {
    this.#movementTimeline?.kill()
    this.#movementTimeline = null
  }

  #hideDeadlockHighlight() {
    this.#deadlockTimeline?.kill()
    this.#deadlockTimeline = null
    if (!this.#deadlockHighlight) return

    this.#deadlockHighlight.alpha = 0
    this.#deadlockHighlight.visible = false
  }

  #updateBoxes() {
    this.#level.boxes.forEach((box) => {
      const boxView = this.#boxViews.get(box.id)
      boxView.position.set(box.x * this.#tileSize, box.y * this.#tileSize)
    })
    this.#updateBoxTargetStates()
  }

  #updatePlayer() {
    const {x, y} = this.#getPlayerPixelPosition()
    this.#player.position.set(x, y)
    this.#updatePlayerDepth()
  }

  // zIndex обновляется динамически на каждом ходу. Это нужно, что бы корректно "ходить между стен",
  // т.к чем ниже ряд стен, тем выше у них zIndex
  #updatePlayerDepth() {
    this.#player.zIndex = this.#getWallRowDepth(this.#level.playerPosition.y) + BOARD_Z_INDEX.playerRowOffset
  }

  #getWallRowDepth(rowIndex) {
    // Шаг в два слоя оставляет место игроку между соседними рядами кустов.
    return BOARD_Z_INDEX.firstDepthRow + rowIndex * 2
  }

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
