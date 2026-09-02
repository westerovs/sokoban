import {Container, Text} from 'pixi.js'
import {FONT_COLORS, primaryFontStyle} from '@/game/styles.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {CARD_SIZE} from './StoreCard.js'
import type StoreView from './StoreView.js'

// Отображает текущий запас трёх типов подсказок над магазином.

export default class StoreTopRow extends Container {
  #storeView: StoreView
  #counters: Container[] = []

  // Сохраняет представление магазина и создаёт счётчики.
  constructor(storeView: StoreView) {
    super({label: 'store-top-row'})

    this.#storeView = storeView
    this.#init()
  }

  // Возвращает созданные счётчики.
  get counters() {
    return this.#counters
  }

  // Запускает создание строки счётчиков.
  #init = () => {
    this.#create()
  }

  // Создаёт и размещает три счётчика подсказок.
  #create = () => {
    const offsetX = this.#storeView.rect.width / 2 - CARD_SIZE.width / 2 - this.#storeView.padding

    const counterMagnifier = this.#storeCounter({label: 'counterMagnifier', textureKey: 'store-loupe-big'})
    counterMagnifier.position.set(-offsetX, 0)

    const counterDarts = this.#storeCounter({label: 'counterDarts', textureKey: 'store-darts-big'})
    counterDarts.position.set(0, 0)

    const counterCompass = this.#storeCounter({label: 'counterCompass', textureKey: 'store-compass-big'})
    counterCompass.position.set(offsetX, 0)

    this.addChild(counterMagnifier, counterDarts, counterCompass)
  }

  // Создаёт один счётчик подсказок.
  #storeCounter = ({label, textureKey}: {label: string; textureKey: string}) => {
    const container = new Container({label})

    const cover = GameUtils.createSprite('stat-badge')
    const icon = GameUtils.createSprite(textureKey)
    icon.x = cover.width / 2 - 22
    icon.scale.set(0.7)

    const textCounter = new Text({
      label: 'textCounter',
      text: '1234',
      style: {...primaryFontStyle, fontSize: 25, fill: FONT_COLORS.secondFont},
    })
    textCounter.x = -(cover.width / 2) + 20
    textCounter.anchor.set(0, 0.5)
    container.addChild(cover, icon, textCounter)
    this.#counters.push(container)

    return container
  }
}
