import i18next from 'i18next'
import {Container, Graphics, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.js'

// Показывает результаты прохождения Sokoban на финальном экране.

type CompleteLevelStats = {
  actualPushes: number | null
  personalBestPushes: number | null
  benchmarkPushes: number | null
}

const PANEL_WIDTH = 520 // Ширина панели результатов
const PANEL_HEIGHT = 190 // Высота панели результатов
const ROW_GAP = 52 // Расстояние между строками результатов

export default class CompleteLevelStatsView extends Container {
  #actualPushesText!: Text
  #personalBestText!: Text
  #benchmarkPushesText!: Text

  // Создаёт панель результатов прохождения.
  constructor() {
    super({label: 'complete-level-stats'})

    this.#init()
  }

  // Обновляет фактический результат, личный рекорд и эталон.
  setData({actualPushes, personalBestPushes, benchmarkPushes}: CompleteLevelStats) {
    this.#actualPushesText.text = i18next.t('sokoban.pushes', {pushes: this.#formatValue(actualPushes)})
    this.#personalBestText.text = i18next.t('sokoban.personalBestPushes', {pushes: this.#formatValue(personalBestPushes)})
    this.#benchmarkPushesText.text = i18next.t('sokoban.benchmarkPushes', {pushes: this.#formatValue(benchmarkPushes)})
  }

  // Создаёт фон и три строки результатов.
  #init() {
    const background = new Graphics({label: 'complete-level-stats-background'})
    background
      .roundRect(-PANEL_WIDTH / 2, -PANEL_HEIGHT / 2, PANEL_WIDTH, PANEL_HEIGHT, 28)
      .fill({color: 0x132319, alpha: 0.92})
      .stroke({color: 0xa98c48, width: 5})

    this.#actualPushesText = this.#createRow('complete-level-actual-pushes', -ROW_GAP)
    this.#personalBestText = this.#createRow('complete-level-personal-best', 0)
    this.#benchmarkPushesText = this.#createRow('complete-level-benchmark-pushes', ROW_GAP)
    this.addChild(background, this.#actualPushesText, this.#personalBestText, this.#benchmarkPushesText)
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
    return Number.isInteger(value) ? String(value) : '—'
  }
}

export type {
  // Данные результатов для финального экрана
  CompleteLevelStats,
}
