import i18next from 'i18next'
import {Container, Graphics} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {FONT_COLORS, primaryFontStyle} from '@/game/styles.js'
import BaseModal from '@/game/ui/common/modal/BaseModal.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {ROW_SIZE} from './ScoreRow.js'

const getViewHeight = () => {
  const maxRows = 8
  const offsetY = 10
  const header = 80
  const padding = ROW_SIZE.offsetBetweenRows

  return maxRows * (ROW_SIZE.rowHeight + offsetY) + header + padding
}

export default class ScoreboardView extends BaseModal {
  #loadingText
  #list
  #gapLine
  #userPlayerTextFill = 0x00ffa9
  #userPlayerRowFill = 0x20b2aa

  constructor(props = {}) {
    super({h: getViewHeight(), w: 600, isNeedHeader: true, ...props})

    this.label = 'scoreboardView'
    this.#create()
  }

  get list() {
    return this.#list
  }

  get loadingText() {
    return this.#loadingText
  }

  get startPositionYFirstRow() {
    const halfHeaderHeight = this.header.height / 2
    const halfViewHeight = this.rect.height / 2

    return halfViewHeight + halfHeaderHeight - ROW_SIZE.rowHeight
  }

  get gapLine() {
    return this.#gapLine
  }

  get userPlayerTextFill() {
    return this.#userPlayerTextFill
  }

  get userPlayerRowFill() {
    return this.#userPlayerRowFill
  }

  updateAdaptive = () => {
    const {x, y} = Locator.uiLayer.uiData.center
    this.position.set(x, y)
  }

  #create = () => {
    this.#setHeaderText()
    this.#createLoadingText()
    this.#createPlayerList()
    this.#createGap()

    // Locator.uiLayer.createFade(3)
  }

  #setHeaderText = () => {
    if (!this.headerText) return
    this.headerText.text = `${i18next.t('btnLeaders')}`
  }

  #createLoadingText = () => {
    this.#loadingText = GameUtils.createText(`${i18next.t('textLoading')}...`, {
      style: {...primaryFontStyle, fontSize: 30},
    })
    this.#loadingText.visible = false

    this.addChild(this.#loadingText)
  }

  #createPlayerList = () => {
    this.#list = new Container()
    this.#list.y = this.header.height + this.padding / 2
    this.addChild(this.#list)
  }

  #createGap = () => {
    const settings = {
      segmentCount: 11, // количество отрезков
      segmentWidth: 35, // расстояние по X между точками
      height: 20, // высота зигзага
      color: FONT_COLORS.accentFont,
      lineWidth: 6,
    }

    const gapLine = new Graphics()
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
