import {Container, Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {WORLD} from '@/game/gameConfig/constants.js'
import PromoCard from './PromoCard.js'

const PREVIEW_CARD_CONFIGS = [
  {promoKey: 'STARTED_PACK', x: -470},
  {promoKey: 'MEGA_HINTS_PACK', x: 0},
  {promoKey: 'REMOVE_AD_PACK', x: 470},
]

export default class PromoCardsTestRenderer {
  render = (promoData) => {
    const preview = this.#createPreview()
    const cards = this.#createCards(promoData)

    preview.addChild(...cards)
    Locator.game.view.addChild(preview)
  }

  #createPreview = () => {
    return new Container({
      label: 'promoCardsPreview',
      x: WORLD.HALF_W,
      y: WORLD.HALF_H,
    })
  }

  #createCards = (promoData) => {
    return PREVIEW_CARD_CONFIGS.map(({promoKey, x}) => {
      return this.#createCard(promoData[promoKey], x)
    })
  }

  #createCard = (promoData, x) => {
    const card = new PromoCard({promoData})
    card.label = `${promoData.texture}PreviewCard`
    card.position.x = x
    card.visible = true
    card.eventMode = 'none'
    card.addChild(this.#createLabel(promoData))

    return card
  }

  #createLabel = (promoData) => {
    const label = new Text({
      label: `${promoData.texture}PreviewLabel`,
      text: promoData.texture,
      style: {fill: 0xFF0000},
    })
    label.anchor.set(0.5)
    label.y = -230

    return label
  }
}
