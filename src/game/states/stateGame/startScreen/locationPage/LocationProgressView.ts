import i18next from 'i18next'
import {Container, Graphics, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import type {LocationSelectionState} from '../menuTypes.ts'

// Отображает прогресс прохождения локации и состояние её завершения.

const PROGRESS_WIDTH = 190
const PROGRESS_HEIGHT = 35
const PROGRESS_PADDING = 3 // Внутренний отступ полосы прогресса
const PROGRESS_STROKE_WIDTH = 4 // Толщина обводки плашки

export default class LocationProgressView extends Container {
  #background!: Graphics
  #completedCheck!: Graphics
  #text!: Text

  constructor(label: string) {
    super({label, eventMode: 'none', visible: false})

    this.#init()
  }

  // Обновляет вид прогресса по состоянию локации.
  setState = (state: LocationSelectionState) => {
    this.visible = state.isUnlocked
    if (!state.isUnlocked) return

    this.#background.clear()
    this.#completedCheck.clear()
    this.#completedCheck.visible = state.isCompleted
    this.#text.text = state.isCompleted
      ? i18next.t('locationSelect.completed')
      : `${state.completedCount} / ${state.totalCount}`
    this.#drawBackground(state.isCompleted)

    if (state.isCompleted) {
      this.#drawCompletedCheck()
      return
    }

    const progress = state.totalCount > 0 ? state.completedCount / state.totalCount : 0
    this.#drawProgress(progress)
  }

  #init = () => {
    this.#background = new Graphics({label: `${this.label}-background`})
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
    this.addChild(this.#background, this.#completedCheck, this.#text)
  }

  // Рисует основу плашки прогресса.
  #drawBackground = (isCompleted: boolean) => {
    this.#background
      .roundRect(-PROGRESS_WIDTH / 2, -PROGRESS_HEIGHT / 2, PROGRESS_WIDTH, PROGRESS_HEIGHT, PROGRESS_HEIGHT / 2)
      .fill({color: isCompleted ? 0x588f2d : 0x253927, alpha: 0.96})
      .stroke({color: 0xb7ce5a, width: PROGRESS_STROKE_WIDTH})
  }

  // Рисует заполнение только при положительном прогрессе.
  #drawProgress = (progress: number) => {
    const availableWidth = PROGRESS_WIDTH - PROGRESS_PADDING * 2
    const innerHeight = PROGRESS_HEIGHT - PROGRESS_PADDING * 2
    const normalizedProgress = Math.min(Math.max(progress, 0), 1)
    if (normalizedProgress === 0) return

    const filledWidth = Math.max(innerHeight, availableWidth * normalizedProgress)

    this.#background
      .roundRect(
        -PROGRESS_WIDTH / 2 + PROGRESS_PADDING,
        -innerHeight / 2,
        filledWidth,
        innerHeight,
        Math.min(filledWidth, innerHeight) / 2,
      )
      .fill({color: 0x78c92e})
  }

  // Рисует галочку завершённой локации справа от подписи.
  #drawCompletedCheck = () => {
    const radius = PROGRESS_HEIGHT / 2
    this.#completedCheck.position.set(PROGRESS_WIDTH / 2 - radius, 0)
    this.#completedCheck
      .circle(0, 0, radius)
      .fill({color: 0x71972c})
      .stroke({color: 0xe9d084, width: PROGRESS_STROKE_WIDTH})
    this.#completedCheck
      .moveTo(-radius * 0.5, 0)
      .lineTo(-radius * 0.12, radius * 0.36)
      .lineTo(radius * 0.5, -radius * 0.4)
      .stroke({color: 0xffffff, width: 5, join: 'round', cap: 'round'})
  }
}
