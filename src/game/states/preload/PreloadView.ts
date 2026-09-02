import i18next from 'i18next'
import {Container, Text} from 'pixi.js'
import {WORLD} from '../../gameConfig/constants.js'
import GameUtils from '../../utils/gameUtils/GameUtils.js'

// Отображает текст прогресса во время загрузки игровых ресурсов.

export default class PreloadView extends Container {
  refs: {preloadText: Text}

  // Создаёт контейнер загрузки и его текстовый элемент.
  constructor() {
    super({label: 'preload-view', sortableChildren: true})

    this.refs = {preloadText: null as unknown as Text}

    this.#init()
  }

  // Создаёт содержимое экрана загрузки.
  #init = () => {
    this.#createPreloadText()
  }

  // Создаёт и размещает текст прогресса.
  #createPreloadText() {
    const preloadText = GameUtils.createText(`${i18next.t('textLoading')}...`, {
      style: {
        fontSize: 40,
        fill: 0xffffff,
        fontFamily: 'BloggerSans',
        align: 'center',
      },
    })
    preloadText.position.set(WORLD.HALF_W, WORLD.HALF_H)

    this.refs.preloadText = preloadText
    this.addChild(preloadText)
  }
}
