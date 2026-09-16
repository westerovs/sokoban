import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container, Graphics, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.js'
import {fitTextWidth} from '@/game/utils/fitTextWidth.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'

// Показывает результат одной метрики и анимирует замену прежнего рекорда.

const CARD_WIDTH = 248 // Ширина колонки результата
const RECORD_Y = 40 // Высота строки прежнего рекорда
const GOLD = 0xffe6a1 // Основной цвет значений
const GREEN = 0xb9f66a // Цвет улучшенного рекорда

export default class CompleteLevelRecordView extends Container {
  #value!: Text
  #best!: Text
  #previous!: Text
  #badge!: Text
  #bestLabel!: Text
  #strike!: Graphics
  #timeline: gsap.core.Timeline | null = null
  #improved = false
  #hasPrevious = false

  // Сохраняет метку метрики и создаёт её карточку.
  constructor(metric: 'steps' | 'pushes') {
    super({label: `complete-record-${metric}`})
    this.#init(metric)
  }

  // Подготавливает значения до начала показа результатов.
  setData(value: number | null, best: number | null, previous: number | null) {
    this.#timeline?.kill()
    this.#hasPrevious = previous !== null && previous > 0
    this.#improved = this.#hasPrevious && best !== null && best > 0 && best < previous!
    this.#value.text = String(value ?? '—')
    this.#best.text = String(best ?? '—')
    this.#previous.text = String(previous ?? '—')
    fitTextWidth(this.#value, CARD_WIDTH - 40)
    for (const text of [this.#best, this.#previous]) fitTextWidth(text, 80)
    this.#best.style.fill = this.#improved ? GREEN : GOLD
    this.#best.alpha = this.#improved ? 0 : 1
    this.#best.y = RECORD_Y
    this.#best.visible = this.#hasPrevious
    this.#bestLabel.visible = this.#hasPrevious
    this.#previous.alpha = this.#improved && this.#hasPrevious ? 1 : 0
    this.#previous.y = RECORD_Y
    this.#badge.alpha = 0
    this.#prepareStrike()
  }

  // Зачёркивает старое число и проявляет поверх него новый рекорд.
  animateRecord() {
    if (!this.#improved) return
    this.#timeline = gsap.timeline({delay: 0.45})
    if (this.#hasPrevious) this.#animatePrevious()
    this.#timeline.fromTo(
      this.#best,
      {alpha: 0, y: RECORD_Y + 18},
      {alpha: 1, y: RECORD_Y, duration: 0.45, ease: 'back.out(1.8)'},
    )
    this.#timeline.to(this.#badge, {alpha: 1, duration: 0.3}, '<')
  }

  // Останавливает анимацию перед удалением карточки.
  destroy(options?: Parameters<Container['destroy']>[0]) {
    this.#timeline?.kill()
    super.destroy(options)
  }

  // Создаёт иконку и подписи колонки общего результата.
  #init(metric: 'steps' | 'pushes') {
    const icon = GameUtils.createSprite(metric === 'steps' ? 'icon-steps' : 'box-default', {
      label: `${this.label}-icon`,
    })
    icon.scale.set(26 / Math.max(icon.width, icon.height))
    icon.position.set(-50, -54)
    this.addChild(icon)
    this.#createLabels(metric)
    this.#strike = new Graphics({label: `${this.label}-strike`})
    this.addChild(this.#strike, this.#best, this.#badge)
  }

  // Создаёт текстовые строки карточки.
  #createLabels(metric: 'steps' | 'pushes') {
    this.#text('title', i18next.t(`sokoban.${metric}Label`), -54, 23).x = 15
    this.#value = this.#text('value', '—', -7, 48)
    this.#bestLabel = this.#text('best-label', i18next.t('sokoban.bestLabel'), RECORD_Y, 17)
    this.#bestLabel.x = -35
    this.#previous = this.#text('previous', '', RECORD_Y, 23)
    this.#best = this.#text('best', '', RECORD_Y, 23)
    this.#previous.x = this.#best.x = 63
    this.#badge = this.#text('new-record', i18next.t('sokoban.newRecord'), 73, 17)
    this.#badge.style.fill = GREEN
  }

  // Создаёт центрированную строку с безопасной шириной.
  #text(suffix: string, value: string, y: number, fontSize: number) {
    const text = new Text({
      label: `${this.label}-${suffix}`,
      text: value,
      style: {...primaryFontStyle, fontSize, fill: GOLD},
    })
    text.anchor.set(0.5)
    text.y = y
    fitTextWidth(text, CARD_WIDTH - 30)
    this.addChild(text)
    return text
  }

  // Подготавливает линию зачёркивания по ширине прежнего числа.
  #prepareStrike() {
    const width = this.#previous.width + 12
    this.#strike.clear().moveTo(0, 0).lineTo(width, 0).stroke({color: 0xffb878, width: 3, cap: 'round'})
    this.#strike.position.set(this.#previous.x - width / 2, RECORD_Y)
    this.#strike.scale.x = 0
    this.#strike.alpha = 1
  }

  // Даёт прочитать зачёркнутый рекорд и освобождает место новому значению.
  #animatePrevious() {
    this.#timeline!.to(this.#strike.scale, {x: 1, duration: 0.35})
    this.#timeline!.to([this.#previous, this.#strike], {alpha: 0, y: '-=15', duration: 0.35}, '+=0.45')
  }
}
