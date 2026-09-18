import i18next from 'i18next'
import {Container, Graphics, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import {fitTextWidth} from '@/game/utils/fitTextWidth.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import type {LocationSelectionState} from '../../menuTypes.ts'

const COMPLETED_CHECK_RADIUS = 15 // Радиус кружка завершённой локации
const COMPLETED_CHECK_GAP = 8 // Расстояние между текстом и кружком с галочкой
const COMPLETED_CHECK_STROKE_WIDTH = 3 // Толщина светлой обводки кружка
const STATUS_MAX_WIDTH = 180 // Максимальная ширина подписи на нижней дощечке

export default class LocationCardProgress extends Container {
  #completedCheck!: Graphics
  #text!: Text

  constructor(label: string) {
    super({label, eventMode: 'none'})

    this.#init()
  }

  setState = (state: LocationSelectionState) => {
    const isCompleted = state.isUnlocked && state.isCompleted
    this.#completedCheck.clear()
    this.#completedCheck.visible = isCompleted
    this.#text.text = this.#getStatusText(state)
    fitTextWidth(this.#text, STATUS_MAX_WIDTH)
    this.#layoutContent(isCompleted)

    if (isCompleted) this.#drawCompletedCheck()
  }

  #getStatusText = (state: LocationSelectionState) => {
    if (state.isUnlocked && state.isCompleted) return i18next.t('locationSelect.completed')
    if (state.isUnlocked) return `${state.completedCount} / ${state.totalCount}`

    const location = state.lockedAfterTitleKey ? i18next.t(state.lockedAfterTitleKey) : ''
    return i18next.t('locationSelect.lockedAfter', {location})
  }

  #init = () => {
    this.#completedCheck = new Graphics({label: `${this.label}-completed-check`})
    this.#text = GameUtils.createText('', {
      name: `${this.label}-text`,
      style: {
        ...primaryFontStyle,
        align: 'center',
        fill: 0xffefb0,
        fontSize: 24,
        stroke: {color: 0x102217, width: 5, join: 'round'},
      },
    })
    this.addChild(this.#completedCheck, this.#text)
  }

  // Центрирует одиночные цифры или связку текста с галочкой.
  #layoutContent = (isCompleted: boolean) => {
    if (!isCompleted) {
      this.#text.position.set(0)
      return
    }

    const contentWidth = this.#text.width + COMPLETED_CHECK_GAP + COMPLETED_CHECK_RADIUS * 2
    const contentLeft = -contentWidth / 2
    this.#text.position.set(contentLeft + this.#text.width / 2, 0)
    this.#completedCheck.position.set(contentLeft + this.#text.width + COMPLETED_CHECK_GAP + COMPLETED_CHECK_RADIUS, 0)
  }

  // Рисует галочку завершённой локации справа от подписи.
  #drawCompletedCheck = () => {
    this.#completedCheck
      .circle(0, 0, COMPLETED_CHECK_RADIUS)
      .fill({color: 0x71972c})
      .stroke({color: 0xffffff, width: COMPLETED_CHECK_STROKE_WIDTH})
    this.#completedCheck
      .moveTo(-COMPLETED_CHECK_RADIUS * 0.5, 0)
      .lineTo(-COMPLETED_CHECK_RADIUS * 0.12, COMPLETED_CHECK_RADIUS * 0.36)
      .lineTo(COMPLETED_CHECK_RADIUS * 0.5, -COMPLETED_CHECK_RADIUS * 0.4)
      .stroke({color: 0xffffff, width: 5, join: 'round', cap: 'round'})
  }
}
