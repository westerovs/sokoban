import {gsap} from 'gsap'
import {Container} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import Locator from '../engine/Locator.ts'
import {WORLD} from '../gameConfig/constants.js'
import {ROTATED_DIRECTIONS, SOKOBAN_TEXTURES} from './config.js'
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
  #movementTimeline = null
  #isRotated = false

  constructor(level) {
    super({label: 'sokoban-board', sortableChildren: true})

    this.#level = level
    this.#boardWidth = level.width * this.#tileSize
    this.#boardHeight = level.height * this.#tileSize
    this.#init()
  }

  update() {
    this.#killMovementTimeline()
    this.#updateBoxes()
    this.#updatePlayer()
  }

  animateMove(moveResult) {
    return new Promise((resolve) => {
      this.#movementTimeline = this.#createMovementTimeline(moveResult, resolve)
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
    super.destroy(options)
  }

  #init() {
    const staticTiles = this.#createStaticTiles()
    this.#boxesContainer = new Container({label: 'sokoban-boxes'})
    this.#player = this.#createPlayer()
    staticTiles.zIndex = 0
    this.#boxesContainer.zIndex = 1
    this.#player.zIndex = 2

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
    const tiles = new Container({label: 'sokoban-static-tiles'})

    for (let y = 0; y < this.#level.height; y++) {
      for (let x = 0; x < this.#level.width; x++) {
        this.#addTileViews(tiles, {x, y})
      }
    }

    return tiles
  }

  #addTileViews(tiles, position) {
    if (this.#level.isVoid(position)) return

    if (this.#level.isWall(position)) {
      tiles.addChild(this.#createTileSprite(SOKOBAN_TEXTURES.wall, position, 'wall'))
      return
    }

    tiles.addChild(this.#createTileSprite(SOKOBAN_TEXTURES.floor, position, 'floor'))
    if (this.#level.isTarget(position)) {
      tiles.addChild(this.#createTileSprite(SOKOBAN_TEXTURES.target, position, 'target'))
    }
  }

  #createTileSprite(textureName, position, type) {
    const tile = GameUtils.createSprite(textureName, {
      label: `sokoban-${type}-${position.x}-${position.y}`,
      anchorX: 0,
      anchorY: 0,
    })

    tile.position.set(position.x * this.#tileSize, position.y * this.#tileSize)
    tile.setSize(this.#tileSize, this.#tileSize)
    return tile
  }

  #createBoxes() {
    this.#level.boxes.forEach((position, index) => {
      const boxView = new SokobanBoxView(index, this.#tileSize)
      this.#boxViews.push(boxView)
      this.#boxesContainer.addChild(boxView)
    })
  }

  #createPlayer() {
    const player = GameUtils.createSprite(SOKOBAN_TEXTURES.player, {
      label: 'sokoban-player',
    })

    player.setSize(this.#tileSize, this.#tileSize)
    return player
  }

  #createMovementTimeline(moveResult, resolve) {
    const timeline = gsap.timeline({
      onComplete: () => this.#finishMovement(resolve),
    })
    const playerPosition = this.#getPlayerPixelPosition()

    timeline.to(this.#player.position, this.#getMovementVars(playerPosition))
    this.#addBoxMovement(timeline, moveResult.pushedBox)
    return timeline
  }

  #addBoxMovement(timeline, pushedBox) {
    if (!pushedBox) return

    const boxView = this.#findBoxView(pushedBox.from)
    if (!boxView) return

    timeline.to(boxView.position, this.#getMovementVars(this.#getBoxPixelPosition(pushedBox.to)), '<')
  }

  #getMovementVars(position) {
    return {
      ...position,
      duration: SOKOBAN_SETTINGS.moveDuration,
      ease: SOKOBAN_SETTINGS.moveEase,
    }
  }

  #getPlayerPixelPosition() {
    const {x, y} = this.#level.playerPosition
    return {
      x: (x + 0.5) * this.#tileSize,
      y: (y + 0.5) * this.#tileSize,
    }
  }

  #getBoxPixelPosition(position) {
    return {
      x: position.x * this.#tileSize,
      y: position.y * this.#tileSize,
    }
  }

  #findBoxView(position) {
    const pixelPosition = this.#getBoxPixelPosition(position)
    return this.#boxViews.find((boxView) => (
      boxView.x === pixelPosition.x && boxView.y === pixelPosition.y
    ))
  }

  #finishMovement(resolve) {
    this.#movementTimeline = null
    this.#updateBoxTargetStates()
    resolve()
  }

  #killMovementTimeline() {
    this.#movementTimeline?.kill()
    this.#movementTimeline = null
  }

  #updateBoxes() {
    this.#level.boxes.forEach((position, index) => {
      const boxView = this.#boxViews[index]
      boxView.position.set(position.x * this.#tileSize, position.y * this.#tileSize)
    })
    this.#updateBoxTargetStates()
  }

  #updatePlayer() {
    const {x, y} = this.#getPlayerPixelPosition()
    this.#player.position.set(x, y)
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
