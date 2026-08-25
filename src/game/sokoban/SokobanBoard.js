import {Container, Graphics} from 'pixi.js'
import Locator from '../engine/Locator.ts'
import {WORLD} from '../gameConfig/constants.js'
import {ROTATED_DIRECTIONS, SOKOBAN_COLORS} from './config.js'
import {SOKOBAN_SETTINGS} from './settings.js'
import SokobanBoxView from './SokobanBoxView.js'

export default class SokobanBoard extends Container {
  #level
  #tileSize = SOKOBAN_SETTINGS.tileSize
  #boardWidth
  #boardHeight
  #boxesContainer
  #boxViews = []
  #player
  #isRotated = false

  constructor(level) {
    super({label: 'sokoban-board'})

    this.#level = level
    this.#boardWidth = level.width * this.#tileSize
    this.#boardHeight = level.height * this.#tileSize
    this.#init()
  }

  update() {
    this.#updateBoxes()
    this.#updatePlayer()
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

  #init() {
    const staticTiles = this.#createStaticTiles()
    this.#boxesContainer = new Container({label: 'sokoban-boxes'})
    this.#player = this.#createPlayer()

    this.#createBoxes()
    this.addChild(staticTiles, this.#boxesContainer, this.#player)
    this.pivot.set(this.#boardWidth / 2, this.#boardHeight / 2)
    this.update()
    this.resize()
  }

  #shouldRotate() {
    return SOKOBAN_SETTINGS.rotateTallBoardInLandscape
      && this.#level.height > this.#level.width
      && WORLD.isLandscape
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
    const availableHeight = WORLD.HEIGHT
      - SOKOBAN_SETTINGS.boardTopPadding
      - SOKOBAN_SETTINGS.boardBottomPadding

    return Math.max(Math.min(availableWidth / displayedWidth, availableHeight / displayedHeight), 0.1)
  }

  #getBoardCenterY() {
    const availableHeight = WORLD.HEIGHT
      - SOKOBAN_SETTINGS.boardTopPadding
      - SOKOBAN_SETTINGS.boardBottomPadding

    return SOKOBAN_SETTINGS.boardTopPadding + availableHeight / 2
  }

  #getHorizontalPadding(visibleWidth) {
    const preferredPadding = Math.max(
      SOKOBAN_SETTINGS.minHorizontalPadding,
      Math.min(SOKOBAN_SETTINGS.maxHorizontalPadding, visibleWidth * SOKOBAN_SETTINGS.horizontalPaddingRatio),
    )

    return Math.min(preferredPadding, visibleWidth * SOKOBAN_SETTINGS.maxHorizontalPaddingRatio)
  }

  #createStaticTiles() {
    const tiles = new Graphics({label: 'sokoban-static-tiles'})

    for (let y = 0; y < this.#level.height; y++) {
      for (let x = 0; x < this.#level.width; x++) {
        this.#drawTile(tiles, {x, y})
      }
    }

    return tiles
  }

  #drawTile(tiles, position) {
    if (this.#level.isWall(position)) {
      this.#drawWall(tiles, position)
      return
    }

    this.#drawFloor(tiles, position)
    if (this.#level.isTarget(position)) this.#drawTarget(tiles, position)
  }

  #drawFloor(tiles, position) {
    const x = position.x * this.#tileSize
    const y = position.y * this.#tileSize

    tiles
      .rect(x, y, this.#tileSize, this.#tileSize)
      .fill(SOKOBAN_COLORS.floor)
      .stroke({color: SOKOBAN_COLORS.floorBorder, width: 2})
  }

  #drawWall(tiles, position) {
    const x = position.x * this.#tileSize
    const y = position.y * this.#tileSize
    const inset = this.#tileSize * 0.06

    tiles.rect(x, y, this.#tileSize, this.#tileSize).fill(SOKOBAN_COLORS.wall)
    tiles
      .roundRect(x + inset, y + inset, this.#tileSize - inset * 2, this.#tileSize - inset * 2, inset)
      .fill(SOKOBAN_COLORS.wallInset)
      .stroke({color: SOKOBAN_COLORS.wallBorder, width: 3})
  }

  #drawTarget(tiles, position) {
    const centerX = (position.x + 0.5) * this.#tileSize
    const centerY = (position.y + 0.5) * this.#tileSize

    tiles
      .circle(centerX, centerY, this.#tileSize * 0.26)
      .fill({color: SOKOBAN_COLORS.target, alpha: 0.9})
      .stroke({color: SOKOBAN_COLORS.targetCenter, width: this.#tileSize * 0.06})
    tiles.circle(centerX, centerY, this.#tileSize * 0.08).fill(SOKOBAN_COLORS.targetCenter)
  }

  #createBoxes() {
    this.#level.boxes.forEach((position, index) => {
      const boxView = new SokobanBoxView(index, this.#tileSize)
      this.#boxViews.push(boxView)
      this.#boxesContainer.addChild(boxView)
    })
  }

  #createPlayer() {
    const player = new Graphics({label: 'sokoban-player'})
    const radius = this.#tileSize * 0.34

    player
      .circle(0, 0, radius)
      .fill(SOKOBAN_COLORS.player)
      .stroke({color: SOKOBAN_COLORS.playerBorder, width: this.#tileSize * 0.06})
    player.circle(-this.#tileSize * 0.12, -this.#tileSize * 0.08, this.#tileSize * 0.055).fill(SOKOBAN_COLORS.playerDetail)
    player.circle(this.#tileSize * 0.12, -this.#tileSize * 0.08, this.#tileSize * 0.055).fill(SOKOBAN_COLORS.playerDetail)
    player
      .roundRect(-this.#tileSize * 0.15, this.#tileSize * 0.13, this.#tileSize * 0.3, this.#tileSize * 0.05, 3)
      .fill(SOKOBAN_COLORS.playerDetail)

    return player
  }

  #updateBoxes() {
    this.#level.boxes.forEach((position, index) => {
      const boxView = this.#boxViews[index]
      boxView.position.set(position.x * this.#tileSize, position.y * this.#tileSize)
      boxView.setOnTarget(this.#level.isTarget(position))
    })
  }

  #updatePlayer() {
    const {x, y} = this.#level.playerPosition
    this.#player.position.set((x + 0.5) * this.#tileSize, (y + 0.5) * this.#tileSize)
  }
}
