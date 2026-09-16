import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container, Graphics, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.js'
import DateUtils from '@/game/utils/DateUtils.js'
import {fitTextWidth} from '@/game/utils/fitTextWidth.js'

// Показывает время прохождения и цветной процент условного сравнения.

const WIDTH = 520 // Предельная ширина заголовка результатов
const YELLOW = 0xffde59 // Цвет сравнения от 40 до 79 процентов
const GREEN = 0xaaf06b // Цвет сравнения от 80 процентов
const TEXT_COLOR = 0xfff4d1 // Основной цвет текста результатов
const RECORD_Y = 145 // Позиция рекорда времени под сравнением

export default class CompleteLevelBenchmarkView extends Container {
  #title!: Text
  #time!: Text
  #comparison!: Container
  #prefix!: Text
  #percent!: Text
  #suffix!: Text
  #timeRecord!: Container
  #recordText!: Text
  #recordBadge!: Text
  #recordStrike!: Graphics
  #timeline: gsap.core.Timeline | null = null
  #isTimeImproved = false

  // Создаёт заголовок и строку сравнения.
  constructor() {
    super({label: 'complete-level-benchmark'})
    this.#init()
  }

  // Обновляет время и скрывает сравнение при недостаточном проценте.
  setData(
    level: number,
    seconds: number | null,
    percent: number | null,
    bestSeconds: number | null,
    previousSeconds: number | null,
  ) {
    this.#timeline?.kill()
    this.#title.text = i18next.t('sokoban.completedLevel', {level})
    this.#time.text = DateUtils.formatDuration(seconds)
    this.#time.style.fill = TEXT_COLOR
    this.#time.scale.set(1)
    fitTextWidth(this.#title, WIDTH)
    fitTextWidth(this.#time, WIDTH)
    this.#setTimeRecord(bestSeconds, previousSeconds)
    this.#comparison.visible = percent !== null && percent >= 40
    if (!this.#comparison.visible) return
    const [prefix, suffix] = i18next.t('sokoban.fasterThan', {percent: '|'}).split('|')
    this.#prefix.text = prefix
    this.#percent.text = `${percent}%`
    this.#percent.style.fill = percent! > 79 ? GREEN : YELLOW
    this.#suffix.text = suffix
    this.#layoutComparison()
  }

  // Зачёркивает прошлое время и выделяет новый рекорд.
  animateTimeRecord() {
    if (!this.#isTimeImproved) return

    this.#timeline = gsap.timeline({delay: 0.45})
    this.#timeline.to(this.#recordStrike.scale, {x: 1, duration: 0.35})
    this.#timeline.to([this.#recordText, this.#recordStrike], {alpha: 0, y: '-=12', duration: 0.35}, '+=0.4')
    this.#timeline.call(() => {
      this.#time.style.fill = GREEN
    })
    this.#timeline.fromTo(
      this.#time.scale,
      {x: 1, y: 1},
      {x: 1.08, y: 1.08, duration: 0.25, ease: 'back.out(2)', repeat: 1, yoyo: true},
    )
    this.#timeline.fromTo(
      this.#recordBadge,
      {alpha: 0, y: 42},
      {alpha: 1, y: 30, duration: 0.4, ease: 'back.out(1.8)'},
      '<',
    )
  }

  // Останавливает анимацию перед удалением представления.
  destroy(options?: Parameters<Container['destroy']>[0]) {
    this.#timeline?.kill()
    super.destroy(options)
  }

  // Создаёт тексты и общий контейнер сравнения.
  #init() {
    this.#title = this.#text('title', 30)
    this.#time = this.#text('time', 58)
    this.#time.y = 57
    this.#comparison = new Container({label: 'complete-benchmark-comparison', y: 112})
    this.#prefix = this.#text('prefix', 24)
    this.#percent = this.#text('percent', 24)
    this.#suffix = this.#text('suffix', 24)
    this.#comparison.addChild(this.#prefix, this.#percent, this.#suffix)
    this.#createTimeRecord()
    this.addChild(this.#title, this.#time, this.#comparison, this.#timeRecord)
  }

  // Создаёт строку с общим светлым стилем.
  #text(suffix: string, fontSize: number) {
    const text = new Text({
      label: `complete-benchmark-${suffix}`,
      text: '',
      style: {...primaryFontStyle, fill: TEXT_COLOR, fontSize},
    })
    text.anchor.set(0.5)
    return text
  }

  // Создаёт строку прошлого рекорда и сообщение об улучшении времени.
  #createTimeRecord() {
    this.#timeRecord = new Container({label: 'complete-time-record', y: RECORD_Y})
    this.#recordText = this.#text('time-record-value', 19)
    this.#recordBadge = this.#text('new-time-record', 20)
    this.#recordBadge.text = i18next.t('sokoban.newTimeRecord')
    this.#recordBadge.style.fill = GREEN
    this.#recordBadge.y = 30
    this.#recordStrike = new Graphics({label: 'complete-time-record-strike'})
    this.#timeRecord.addChild(this.#recordText, this.#recordStrike, this.#recordBadge)
  }

  // Подготавливает прошлое время и определяет факт его улучшения.
  #setTimeRecord(bestSeconds: number | null, previousSeconds: number | null) {
    const hasPrevious = previousSeconds !== null
    this.#isTimeImproved = hasPrevious && bestSeconds !== null && bestSeconds < previousSeconds
    this.#timeRecord.visible = hasPrevious
    if (!hasPrevious) return

    const shownSeconds = this.#isTimeImproved ? previousSeconds : bestSeconds
    this.#recordText.text = i18next.t('sokoban.timeRecord', {time: DateUtils.formatDuration(shownSeconds)})
    fitTextWidth(this.#recordText, WIDTH)
    this.#recordText.alpha = 1
    this.#recordText.y = 0
    this.#recordBadge.alpha = 0
    this.#prepareRecordStrike()
  }

  // Подгоняет линию зачёркивания под ширину прежнего времени.
  #prepareRecordStrike() {
    const width = this.#recordText.width + 12
    this.#recordStrike.clear().moveTo(0, 0).lineTo(width, 0).stroke({color: 0xffb878, width: 3, cap: 'round'})
    this.#recordStrike.position.set(-width / 2, 0)
    this.#recordStrike.scale.x = 0
    this.#recordStrike.alpha = 1
  }

  // Выравнивает фрагменты строки и вписывает её целиком в доступную ширину.
  #layoutComparison() {
    const texts = [this.#prefix, this.#percent, this.#suffix]
    const width = texts.reduce((sum, text) => sum + text.width, 0)
    let x = -width / 2
    for (const text of texts) {
      text.x = x + text.width / 2
      x += text.width
    }
    this.#comparison.scale.set(Math.min(1, WIDTH / Math.max(width, 1)))
  }
}
