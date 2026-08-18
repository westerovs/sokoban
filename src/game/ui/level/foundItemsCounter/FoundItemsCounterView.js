import {Container, Graphics} from 'pixi.js'
import {foundItemsCounterStyles, primaryFontStyle} from '@/game/styles.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'


export default class FoundItemsCounterView extends Container {
  constructor() {
    super()

    this.label = 'foundItemsCounterView'
    this.position.set(60, -40)
    this.eventMode = 'none'

    this.#init()
  }

  #init = () => {
    this.#createBackground()
    this.#createCounterText()
  }

  #createBackground() {
    const background = new Graphics()
    background.roundRect(0, 0, 124, 80, 30).fill(foundItemsCounterStyles.body)
    background.alpha = 0.75
    background.pivot.set(background.width / 2, background.height / 2)
    background.y = -20

    this.addChild(background)
  }

  #createCounterText() {
    const counterText = GameUtils.createText('0/10', {
      name: 'counterText',
      style: {
        ...primaryFontStyle,
        fill: foundItemsCounterStyles.textColor,
        fontSize: foundItemsCounterStyles.fontSize,
        fontFamily: 'secondaryFont',
      }
    })
    counterText.y = -20

    this.addChild(counterText)
  }
}
