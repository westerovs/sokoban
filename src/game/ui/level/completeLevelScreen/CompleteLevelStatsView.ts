import i18next from 'i18next'
import {Container, Graphics, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.js'

// Показывает результаты прохождения Sokoban на финальном экране.

type CompleteLevelStats = {
  actualPushes: number | null
  personalBestPushes: number | null
}

const PANEL_WIDTH = 520 // Ширина панели результатов
const PANEL_HEIGHT = 140 // Высота панели результатов
const ROW_GAP = 52 // Расстояние между строками результатов

export default class CompleteLevelStatsView extends Container {
  #actualPushesText!: Text
  #personalBestText!: Text

  // Создаёт панель результатов прохождения.
  constructor() {
    super({label: 'complete-level-stats'})

    this.#init()
  }

  // Обновляет фактический результат и личный рекорд.
  setData({actualPushes, personalBestPushes}: CompleteLevelStats) {
    this.#actualPushesText.text = i18next.t('sokoban.pushes', {pushes: this.#formatValue(actualPushes)})
    this.#personalBestText.text = i18next.t('sokoban.personalBestPushes', {pushes: this.#formatValue(personalBestPushes)})
  }

  // Создаёт фон и две строки результатов.
  #init() {
    const background = new Graphics({label: 'complete-level-stats-background'})
    background
      .roundRect(-PANEL_WIDTH / 2, -PANEL_HEIGHT / 2, PANEL_WIDTH, PANEL_HEIGHT, 28)
      .fill({color: 0x132319, alpha: 0.92})
      .stroke({color: 0xa98c48, width: 5})

    this.#actualPushesText = this.#createRow('complete-level-actual-pushes', -ROW_GAP / 2)
    this.#personalBestText = this.#createRow('complete-level-personal-best', ROW_GAP / 2)
    this.addChild(background, this.#actualPushesText, this.#personalBestText)
  }

  // Создаёт одну текстовую строку результатов.
  #createRow(label: string, y: number) {
    const text = new Text({
      label,
      text: '',
      style: {...primaryFontStyle, fill: 0xffe6a1, fontSize: 30},
    })
    text.anchor.set(0.5)
    text.y = y
    return text
  }

  // Преобразует неизвестное значение в отображаемый прочерк.
  #formatValue(value: number | null) {
    return Number.isInteger(value) ? String(value) : '-'
  }
}

export type {
  // Данные результатов для финального экрана
  CompleteLevelStats,
}
