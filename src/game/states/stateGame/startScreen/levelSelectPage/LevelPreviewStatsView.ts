import i18next from 'i18next'
import {Container, Graphics, Text} from 'pixi.js'
import type {SokobanRecords} from '@/game/engine/storage/defaultData.js'
import {primaryFontStyle} from '@/game/styles.js'
import DateUtils from '@/game/utils/DateUtils.js'
import {fitTextWidth} from '@/game/utils/fitTextWidth.js'

// Показывает три независимых личных рекорда над кнопками выбора уровня.

const COLUMN_WIDTH = 200 // Ширина одной колонки статистики
const TEXT_WIDTH = 182 // Доступная ширина подписи с учётом внутренних отступов

export default class LevelPreviewStatsView extends Container {
  #steps!: Text
  #pushes!: Text
  #time!: Text

  // Создаёт колонки шагов, сдвигов и времени.
  constructor() {
    super({label: 'level-preview-records'})
    this.#init()
  }

  // Показывает рекорды либо прочерки для ещё не пройденного уровня.
  setData(records: SokobanRecords) {
    this.#steps.text = `${i18next.t('sokoban.stepsLabel')}: ${records.steps ?? '—'}`
    this.#pushes.text = `${i18next.t('sokoban.pushesLabel')}: ${records.pushes ?? '—'}`
    this.#time.text = `${i18next.t('sokoban.timeLabel')}: ${DateUtils.formatDuration(records.seconds)}`
    for (const text of [this.#steps, this.#pushes, this.#time]) fitTextWidth(text, TEXT_WIDTH)
  }

  // Рисует разделители и создаёт строки статистики.
  #init() {
    const lines = new Graphics({label: 'level-preview-record-dividers'})
    lines
      .moveTo(-300, 32)
      .lineTo(300, 32)
      .moveTo(-100, -38)
      .lineTo(-100, 32)
      .moveTo(100, -38)
      .lineTo(100, 32)
      .stroke({color: 0xa98c48, width: 2, alpha: 0.8})
    this.#steps = this.#createText('steps', -COLUMN_WIDTH)
    this.#pushes = this.#createText('pushes', 0)
    this.#time = this.#createText('time', COLUMN_WIDTH)
    this.addChild(lines, this.#steps, this.#pushes, this.#time)
  }

  // Создаёт центрированную подпись внутри одной колонки.
  #createText(metric: string, x: number) {
    const text = new Text({
      label: `level-preview-record-${metric}`,
      text: '—',
      style: {...primaryFontStyle, fill: 0xffe6a1, fontSize: 25},
    })
    text.anchor.set(0.5)
    text.x = x
    return text
  }
}
