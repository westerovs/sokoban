import {Container, Graphics, Text} from 'pixi.js'
import {primaryFontStyle} from '../../../../styles.js'
import type {LevelSelectionState} from '../menuTypes.js'

// Отображает кнопку выбора одного уровня и его состояние прохождения.

const WIDTH = 112 // Ширина кнопки уровня
const HEIGHT = 78 // Высота кнопки уровня

export default class LevelSelectButton extends Container {
  #background!: Graphics
  #level: LevelSelectionState
  #onSelect: (levelId: string) => void
  #status!: Graphics
  #text!: Text

  // Сохраняет уровень и обработчик выбора, затем создаёт представление.
  constructor(level: LevelSelectionState, onSelect: (levelId: string) => void) {
    super({label: `level-select-${level.id}`})

    this.#level = level
    this.#onSelect = onSelect
    this.cursor = 'pointer'
    this.#init()
  }

  // Обновляет выделение и отметку прохождения уровня.
  setState = (state: LevelSelectionState) => {
    const border = state.isSelected ? 0xe9ff5b : 0xb99b4f
    this.#background.clear().roundRect(-WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT, 16)
    this.#background.fill({color: 0x73942d}).stroke({color: border, width: state.isSelected ? 6 : 3})
    this.#drawStatus(state)
    this.#text.style.fill = 0xfff1bd
    this.eventMode = 'static'
  }

  // Создаёт графику и текст кнопки.
  #init = () => {
    this.#background = new Graphics({label: `${this.label}-background`})
    this.#status = new Graphics({label: `${this.label}-status`})
    this.#text = new Text({
      label: `${this.label}-number`,
      text: this.#level.locationLevelIndex + 1,
      style: {...primaryFontStyle, fill: 0xfff1bd, fontSize: 34},
    })
    this.#text.anchor.set(0.5)
    this.addChild(this.#background, this.#text, this.#status)
    this.on('pointertap', this.#handleSelect)
  }

  // Рисует отметку завершённого уровня.
  #drawStatus = ({isCompleted}: LevelSelectionState) => {
    this.#status.clear()
    if (!isCompleted) return

    this.#status.circle(47, 31, 15).fill({color: 0x8db53a}).stroke({color: 0xe1d18b, width: 2})
    this.#status.moveTo(40, 31).lineTo(46, 37).lineTo(55, 25).stroke({color: 0xffffff, width: 4})
  }

  // Передаёт идентификатор выбранного уровня контроллеру.
  #handleSelect = () => {
    this.#onSelect(this.#level.id)
  }
}
