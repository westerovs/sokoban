import i18next from 'i18next'
import {Container} from 'pixi.js'
import ButtonContainer from '../../../components/buttons/ButtonContainer'
import Locator from '../../../engine/Locator.ts'
import {FONT_COLORS, primaryFontStyle} from '../../../styles.js'

export default class GameMenuView extends Container {
  #buttons = []
  #textStyle = {
    ...primaryFontStyle,
    fontSize: 36,
    align: 'center',
    fill: FONT_COLORS.secondFont,
  }

  constructor() {
    super()

    this.label = 'GameMenuView'
    this.#init()
  }

  get buttons() {
    return this.#buttons
  }

  updateAdaptive = () => {
    const {x, y} = Locator.uiLayer.uiData.center
    this.position.set(x, y)
  }

  #init = () => {
    this.#createBtnStart()
    this.#createBtnStore()
    this.#createBtnLeaders()

    Locator.uiLayer.stateUiLayer.addChild(this)
    this.updateAdaptive()
  }

  #createBtnStart = () => {
    const button = new ButtonContainer({
      props: {name: 'btnStart', x: 0, y: 420},
      spriteKeys: ['btn-primary'],
    })
    button.addCenterText({
      text: `${i18next.t('btnStart')}`,
      style: {...this.#textStyle, fontSize: 46},
    })

    this.#buttons.push(button)
    this.addChild(button)
  }

  #createBtnStore = () => {
    const button = new ButtonContainer({
      props: {name: 'btnStore', x: 0, y: 0},
      spriteKeys: ['btn-ui-3', 'icon-cup'],
    })

    button.alignRight = () => {
      Locator.uiLayer.alignRight(button, {x: -70, y: 60})
    }
    button.alignRight()
    this.#buttons.push(button)
    Locator.uiLayer.stateUiLayer.addChild(button)
  }

  #createBtnLeaders = () => {
    const button = new ButtonContainer({
      props: {name: 'btnLeaders', x: 0, y: 0},
      spriteKeys: ['btn-ui-3', 'icon-store'],
    })

    button.alignRight = () => {
      Locator.uiLayer.alignRight(button, {
        x: -140,
        y: 60,
      })
    }

    button.alignRight()
    this.#buttons.push(button)
    Locator.uiLayer.stateUiLayer.addChild(button)
  }
}
