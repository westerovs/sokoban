import {Container, Graphics} from 'pixi.js'
import type {SokobanRecords, SokobanResult} from '@/game/engine/storage/defaultData.js'
import CompleteLevelBenchmarkView from './CompleteLevelBenchmarkView.js'
import CompleteLevelRecordView from './CompleteLevelRecordView.js'

// Показывает результаты прохождения Sokoban на финальном экране.

type CompleteLevelStats = {
  levelNumber: number
  run: SokobanResult | null
  records: {previous: SokobanRecords; best: SokobanRecords} | null
  percent: number | null
}

const CARD_OFFSET = 130 // Смещение колонок от центра общей панели
const PANEL_Y = 30 // Центр общей панели по вертикали

export default class CompleteLevelStatsView extends Container {
  #benchmark!: CompleteLevelBenchmarkView
  #steps!: CompleteLevelRecordView
  #pushes!: CompleteLevelRecordView
  #panel!: Graphics

  // Создаёт панель результатов прохождения.
  constructor() {
    super({label: 'complete-level-stats'})

    this.#init()
  }

  // Обновляет фактический результат и личный рекорд.
  setData({levelNumber, run, records, percent}: CompleteLevelStats) {
    this.#benchmark.setData(
      levelNumber,
      run?.seconds ?? null,
      percent,
      records?.best.seconds ?? null,
      records?.previous.seconds ?? null,
    )
    this.#steps.setData(run?.steps ?? null, records?.best.steps ?? null, records?.previous.steps ?? null)
    this.#pushes.setData(run?.pushes ?? null, records?.best.pushes ?? null, records?.previous.pushes ?? null)
    this.#drawPanel(records)
  }

  // Запускает обновление рекордов после появления экрана.
  animateRecords() {
    this.#benchmark.animateTimeRecord()
    this.#steps.animateRecord()
    this.#pushes.animateRecord()
  }

  // Создаёт фон и две строки результатов.
  #init() {
    this.#panel = new Graphics({label: 'complete-level-records-panel'})
    this.#benchmark = new CompleteLevelBenchmarkView()
    this.#benchmark.y = -250
    this.#steps = new CompleteLevelRecordView('steps')
    this.#pushes = new CompleteLevelRecordView('pushes')
    this.#steps.position.set(-CARD_OFFSET, PANEL_Y)
    this.#pushes.position.set(CARD_OFFSET, PANEL_Y)
    this.addChild(this.#panel, this.#benchmark, this.#steps, this.#pushes)
  }

  // Подбирает высоту общей панели по наличию прежних и улучшенных рекордов.
  #drawPanel(records: CompleteLevelStats['records']) {
    const metrics = ['steps', 'pushes'] as const
    const hasPrevious = metrics.some((key) => (records?.previous[key] ?? 0) > 0)
    const improved = metrics.some((key) => {
      const previous = records?.previous[key]
      const best = records?.best[key]
      return previous != null && previous > 0 && best != null && best < previous
    })
    const height = improved ? 180 : hasPrevious ? 148 : 120
    this.#panel
      .clear()
      .roundRect(-260, PANEL_Y - 80, 520, height, 24)
      .fill({color: 0x172b20, alpha: 0.97})
      .stroke({color: 0xa98c48, width: 3})
    this.#panel
      .moveTo(0, PANEL_Y - 60)
      .lineTo(0, PANEL_Y - 100 + height)
      .stroke({color: 0xa98c48, width: 2, alpha: 0.4})
  }
}

export type {
  // Данные результатов для финального экрана
  CompleteLevelStats,
}
