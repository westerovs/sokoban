import {Container, Graphics} from 'pixi.js'

const COLORS = Object.freeze({
  background: 0x14251a,
  border: 0xb6964f,
  box: 0xb96f25,
  boxBorder: 0xf0b45c,
  floor: 0x756a43,
  floorBorder: 0x4d482f,
  player: 0x93ae4a,
  target: 0x99bd3f,
  wall: 0x777667,
  wallBorder: 0xb4ad91,
})

export default class LevelPreview extends Container {
  #board
  #height = 540
  #level
  #panel
  #width = 660

  constructor() {
    super({label: 'level-preview'})

    this.#panel = new Graphics({label: 'level-preview-panel'})
    this.#board = new Graphics({label: 'level-preview-board'})
    this.addChild(this.#panel, this.#board)
  }

  setLevel = (level) => {
    this.#level = level
    this.#draw()
  }

  resize = (width, height) => {
    this.#width = width
    this.#height = height
    this.#draw()
  }

  #draw = () => {
    this.#drawPanel()
    this.#board.clear()
    if (!this.#level?.map) return

    const layout = this.#getBoardLayout(this.#level.map)
    this.#level.map.forEach((row, y) => {
      Array.from(row).forEach((symbol, x) => this.#drawCell(symbol, x, y, layout))
    })
  }

  #drawPanel = () => {
    this.#panel.clear().roundRect(-this.#width / 2, -this.#height / 2, this.#width, this.#height, 28)
    this.#panel.fill({color: COLORS.background, alpha: 0.9}).stroke({color: COLORS.border, width: 5})
  }

  #getBoardLayout = (map) => {
    const columns = Math.max(...map.map((row) => row.length))
    const cell = Math.min((this.#width - 44) / columns, (this.#height - 44) / map.length)
    return {cell, offsetX: (-columns * cell) / 2, offsetY: (-map.length * cell) / 2}
  }

  #drawCell = (symbol, x, y, {cell, offsetX, offsetY}) => {
    if (symbol === '_') return

    const left = offsetX + x * cell
    const top = offsetY + y * cell
    this.#drawFloor(left, top, cell)
    if (symbol === '#') return this.#drawWall(left, top, cell)
    if ('.-*'.includes(symbol)) this.#drawTarget(left, top, cell)
    if ('$-'.includes(symbol)) this.#drawBox(left, top, cell)
    if ('@*'.includes(symbol)) this.#drawPlayer(left, top, cell)
  }

  #drawFloor = (x, y, size) => {
    this.#board.rect(x, y, size, size).fill({color: COLORS.floor}).stroke({color: COLORS.floorBorder, width: 1})
  }

  #drawWall = (x, y, size) => {
    const padding = Math.max(size * 0.05, 1)
    this.#board.roundRect(x + padding, y + padding, size - padding * 2, size - padding * 2, size * 0.12)
    this.#board.fill({color: COLORS.wall}).stroke({color: COLORS.wallBorder, width: Math.max(size * 0.06, 1)})
  }

  #drawTarget = (x, y, size) => {
    this.#board.circle(x + size / 2, y + size / 2, size * 0.28).fill({color: COLORS.target, alpha: 0.85})
  }

  #drawBox = (x, y, size) => {
    const padding = size * 0.14
    this.#board.roundRect(x + padding, y + padding, size - padding * 2, size - padding * 2, size * 0.08)
    this.#board.fill({color: COLORS.box}).stroke({color: COLORS.boxBorder, width: Math.max(size * 0.06, 1)})
    this.#board.moveTo(x + padding, y + padding).lineTo(x + size - padding, y + size - padding)
    this.#board.moveTo(x + size - padding, y + padding).lineTo(x + padding, y + size - padding)
    this.#board.stroke({color: COLORS.boxBorder, width: Math.max(size * 0.04, 1)})
  }

  #drawPlayer = (x, y, size) => {
    this.#board.circle(x + size / 2, y + size / 2, size * 0.3)
    this.#board.fill({color: COLORS.player}).stroke({color: 0xd9e898, width: Math.max(size * 0.05, 1)})
  }
}
