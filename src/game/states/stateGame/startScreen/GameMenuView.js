import {Container} from 'pixi.js'
import Locator from '../../../engine/Locator.ts'
import ButtonContainer from '../../../components/buttons/ButtonContainer'
import i18next from 'i18next'
import {FONT_COLORS, primaryFontStyle} from '../../../styles.js'

export default class GameMenuView extends Container {
  #game = Locator.game
  #offsetY = 10
  #textStyle = {
    ...primaryFontStyle,
    fontSize: 36,
    align: 'center',
    fill: FONT_COLORS.secondFont
  }
  
  constructor() {
    super()

    this.label = 'GameMenuView'
    this.#init()
  }
  
  updateAdaptive = () => {
    const {x, y} = Locator.uiLayer.uiData.center
    this.position.set(x, y)
  }
  
  #init = () => {
    this.#createBtnStart()
    this.#createBtnStore(1)
    this.#createBtnLeaders(2)
    
    Locator.uiLayer.stateUiLayer.addChild(this)
    this.updateAdaptive()
  }

  #createBtnStart = () => {
    const button = new ButtonContainer({
      props: {name: 'btnStart', x: 0, y: 0},
      spriteKeys: ['btn-primary']
    })
    button.addCenterText({
      text: `${i18next.t('btnStart')}`,
      style: {...this.#textStyle, fontSize: 46}
    })

    this.addChild(button)
  }
  
  #createBtnStore = (offsetOrder) => {
    const button = new ButtonContainer({
      props: {name: 'btnStore', x: 0, y: 0},
      spriteKeys: ['btn-secondary']
    })
    button.addCenterText({
      text: `${i18next.t('btnStore')}`,
      style: this.#textStyle
    })
    button.y = (button.height + this.#offsetY) * offsetOrder
    
    this.addChild(button)
  }
  
  #createBtnLeaders = (offsetOrder) => {
    const button = new ButtonContainer({
      props: {name: 'btnLeaders', x: 0, y: 0},
      spriteKeys: ['btn-secondary']
    })
    button.addCenterText({
      text: `${i18next.t('btnLeaders')}`,
      style: this.#textStyle
    })
    button.y = (button.height + this.#offsetY) * offsetOrder
    
    this.addChild(button)
  }
}
