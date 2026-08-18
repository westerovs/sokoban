import {Container} from 'pixi.js'
import i18next from 'i18next'
import {WORLD} from '../../gameConfig/constants.js'
import GameUtils, {viewResize} from '../../utils/gameUtils/GameUtils.js'


export default class PreloadView extends Container {
  constructor() {
    super()

    this.refs = {}
    this.sortableChildren = true

    this.#init()
  }

  resize() {
    return viewResize(this.refs)
  }

  #init = () => {
    this.#createPreloadText()
  }

  #createPreloadText() {
    const preloadText = GameUtils.createText(`${i18next.t('textLoading')}...`, {
      style: {
        fontSize: 40,
        fill: 0xFFFFFF,
        fontFamily: 'BloggerSans',
        align: 'center',
      }
    })
    preloadText.position.set(WORLD.HALF_W, WORLD.HALF_H)

    this.refs.preloadText = preloadText
    this.addChild(preloadText)
  }
}
