import {Container, Graphics} from 'pixi.js'
import type {LevelDefinition} from '../../../../gameConfig/levels/levelTypes.js'

// Рисует компактный векторный предпросмотр карты выбранного уровня.

const COLORS = Object.freeze({
  background: 0x14251a, // Цвет фона панели
  border: 0xb6964f, // Цвет рамки панели
  box: 0xb96f25, // Цвет ящика
  boxBorder: 0xf0b45c, // Цвет рамки ящика
  ground: 0x756a43, // Цвет пола
  groundBorder: 0x4d482f, // Цвет границы клетки пола
  player: 0x93ae4a, // Цвет игрока
  target: 0x99bd3f, // Цвет цели
  wall: 0x777667, // Цвет стены
  wallBorder: 0xb4ad91, // Цвет рамки стены
})

type BoardLayout = {
  cell: number
  offsetX: number
  offsetY: number
}

export default class LevelPreview extends Container {
  #board: Graphics
  #height = 540 // Текущая высота предпросмотра
  #level: LevelDefinition | null = null
  #panel: Graphics
  #width = 660 // Текущая ширина предпросмотра

  // Создаёт панель и графический слой карты.
  constructor() {
    super({label: 'level-preview'})

    this.#panel = new Graphics({label: 'level-preview-panel'})
    this.#board = new Graphics({label: 'level-preview-board'})
    this.addChild(this.#panel, this.#board)
  }

  // Устанавливает данные отображаемого уровня.
  setLevel = (level: LevelDefinition) => {
    this.#level = level
    this.#draw()
  }

  // Изменяет размер области предпросмотра.
  resize = (width: number, height: number) => {
    this.#width = width
    this.#height = height
    this.#draw()
  }

  // Перерисовывает панель и все клетки карты.
  #draw = () => {
    this.#drawPanel()
    this.#board.clear()
    if (!this.#level?.map) return

    const layout = this.#getBoardLayout(this.#level.map)
    this.#level.map.forEach((row, y) => {
      Array.from(row).forEach((symbol, x) => this.#drawCell(symbol, x, y, layout))
    })
  }

  // Рисует подложку предпросмотра.
  #drawPanel = () => {
    this.#panel.clear().roundRect(-this.#width / 2, -this.#height / 2, this.#width, this.#height, 28)
    this.#panel.fill({color: COLORS.background, alpha: 0.9}).stroke({color: COLORS.border, width: 5})
  }

  // Рассчитывает размер клетки и смещение карты.
  #getBoardLayout = (map: string[]): BoardLayout => {
    const columns = Math.max(...map.map((row) => row.length))
    const cell = Math.min((this.#width - 44) / columns, (this.#height - 44) / map.length)
    return {cell, offsetX: (-columns * cell) / 2, offsetY: (-map.length * cell) / 2}
  }

  // Рисует содержимое одной клетки карты.
  #drawCell = (symbol: string, x: number, y: number, {cell, offsetX, offsetY}: BoardLayout) => {
    if (symbol === '_') return

    const left = offsetX + x * cell
    const top = offsetY + y * cell
    this.#drawGround(left, top, cell)
    if (symbol === '#') return this.#drawWall(left, top, cell)
    if ('.-*'.includes(symbol)) this.#drawTarget(left, top, cell)
    if ('$-'.includes(symbol)) this.#drawBox(left, top, cell)
    if ('@*'.includes(symbol)) this.#drawPlayer(left, top, cell)
  }

  // Рисует клетку пола.
  #drawGround = (x: number, y: number, size: number) => {
    this.#board.rect(x, y, size, size).fill({color: COLORS.ground}).stroke({color: COLORS.groundBorder, width: 1})
  }

  // Рисует стену.
  #drawWall = (x: number, y: number, size: number) => {
    const padding = Math.max(size * 0.05, 1)
    this.#board.roundRect(x + padding, y + padding, size - padding * 2, size - padding * 2, size * 0.12)
    this.#board.fill({color: COLORS.wall}).stroke({color: COLORS.wallBorder, width: Math.max(size * 0.06, 1)})
  }

  // Рисует цель.
  #drawTarget = (x: number, y: number, size: number) => {
    this.#board.circle(x + size / 2, y + size / 2, size * 0.28).fill({color: COLORS.target, alpha: 0.85})
  }

  // Рисует ящик.
  #drawBox = (x: number, y: number, size: number) => {
    const padding = size * 0.14
    this.#board.roundRect(x + padding, y + padding, size - padding * 2, size - padding * 2, size * 0.08)
    this.#board.fill({color: COLORS.box}).stroke({color: COLORS.boxBorder, width: Math.max(size * 0.06, 1)})
    this.#board.moveTo(x + padding, y + padding).lineTo(x + size - padding, y + size - padding)
    this.#board.moveTo(x + size - padding, y + padding).lineTo(x + padding, y + size - padding)
    this.#board.stroke({color: COLORS.boxBorder, width: Math.max(size * 0.04, 1)})
  }

  // Рисует игрока.
  #drawPlayer = (x: number, y: number, size: number) => {
    this.#board.circle(x + size / 2, y + size / 2, size * 0.3)
    this.#board.fill({color: COLORS.player}).stroke({color: 0xd9e898, width: Math.max(size * 0.05, 1)})
  }
}
