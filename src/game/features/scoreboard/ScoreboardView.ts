import i18next from 'i18next'
import {Container, Graphics} from 'pixi.js'
import type {Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {FONT_COLORS, primaryFontStyle} from '@/game/styles.js'
import BaseModal from '@/game/ui/common/modal/BaseModal.js'
import type {BaseModalOptions} from '@/game/ui/common/modal/BaseModal.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {ROW_SIZE} from './ScoreRow.js'

const getViewHeight = () => {
  const maxRows = 8
  const offsetY = 10
  const header = 80
  const padding = ROW_SIZE.offsetBetweenRows

  return maxRows * (ROW_SIZE.rowHeight + offsetY) + header + padding
}

// Создаёт модальное представление таблицы лидеров.

export default class ScoreboardView extends BaseModal {
  #loadingText!: Text
  #list!: Container
  #gapLine!: Graphics
  #userPlayerTextFill = 0x00ffa9
  #userPlayerRowFill = 0x20b2aa

  // Создаёт окно и его статические элементы.
  constructor(props: BaseModalOptions = {}) {
    super({h: getViewHeight(), w: 600, isNeedHeader: true, ...props})

    this.label = 'scoreboardView'
    this.#create()
  }

  // Возвращает контейнер строк игроков.
  get list() {
    return this.#list
  }

  // Возвращает текст состояния загрузки.
  get loadingText() {
    return this.#loadingText
  }

  // Вычисляет вертикальную позицию первой строки.
  get startPositionYFirstRow() {
    const halfHeaderHeight = this.header!.height / 2
    const halfViewHeight = this.rect.height / 2

    return halfViewHeight + halfHeaderHeight - ROW_SIZE.rowHeight
  }

  // Возвращает разделитель списка.
  get gapLine() {
    return this.#gapLine
  }

  // Возвращает цвет текста текущего игрока.
  get userPlayerTextFill() {
    return this.#userPlayerTextFill
  }

  // Возвращает цвет строки текущего игрока.
  get userPlayerRowFill() {
    return this.#userPlayerRowFill
  }

  // Центрирует окно в UI-слое.
  updateAdaptive = () => {
    const {x, y} = Locator.uiLayer.uiData.center
    this.position.set(x, y)
  }

  // Создаёт содержимое таблицы лидеров.
  #create = () => {
    this.#setHeaderText()
    this.#createLoadingText()
    this.#createPlayerList()
    this.#createGap()

    // Locator.uiLayer.createFade(3)
  }

  // Устанавливает локализованный заголовок.
  #setHeaderText = () => {
    if (!this.headerText) return
    this.headerText.text = `${i18next.t('btnLeaders')}`
  }

  // Создаёт индикатор загрузки данных.
  #createLoadingText = () => {
    this.#loadingText = GameUtils.createText(`${i18next.t('textLoading')}...`, {
      style: {...primaryFontStyle, fontSize: 30},
    })
    this.#loadingText.visible = false

    this.addChild(this.#loadingText)
  }

  // Создаёт контейнер строк игроков.
  #createPlayerList = () => {
    this.#list = new Container({label: 'scoreboard-list'})
    this.#list.y = this.header!.height + this.padding / 2
    this.addChild(this.#list)
  }

  // Создаёт зигзагообразный разделитель списка.
  #createGap = () => {
    const settings = {
      segmentCount: 11, // количество отрезков
      segmentWidth: 35, // расстояние по X между точками
      height: 20, // высота зигзага
      color: FONT_COLORS.accentFont,
      lineWidth: 6,
    }

    const gapLine = new Graphics({label: 'scoreboard-gap'})
    gapLine.visible = false
    this.#gapLine = gapLine

    for (let i = 0; i <= settings.segmentCount; i++) {
      const x = i * settings.segmentWidth
      const y = i % 2 === 0 ? 0 : settings.height

      if (i === 0) gapLine.moveTo(x, y)
      else gapLine.lineTo(x, y)
    }

    gapLine.stroke({
      width: settings.lineWidth,
      color: settings.color,
    })

    gapLine.position.x = -(gapLine.width / 2)

    this.addChild(gapLine)
  }
}
