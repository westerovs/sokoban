import i18next from 'i18next'
import {Container} from 'pixi.js'
import {rewardsCatalog} from '@/game/gameConfig/rewardsCatalog.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {primaryFontStyle} from '@/game/styles.js'
import {createRect} from '@/game/utils/commonUtils.js'
import ButtonContainer from '@/game/components/buttons/ButtonContainer.js'

// в атласах стоит двойной размер
export const CARD_SIZE = {
  width: (244 / 2),
  height: (320 / 2),
  halfW: (244 / 2),
  gap: 10,
}

export const CARDS_DATA = {
  free: {
    id: rewardsCatalog.store.free.id,
    amount: `x${rewardsCatalog.store.free.amount}`,
    textureKey: 'store-loupe-big',
  },
  dartsHint: {
    id: rewardsCatalog.store.dartsHint.id,
    amount: `x${rewardsCatalog.store.dartsHint.amount}`,
    textureKey: 'store-darts-big',
  },
  compassHint: {
    id: rewardsCatalog.store.compassHint.id,
    amount: `x${rewardsCatalog.store.compassHint.amount}`,
    textureKey: 'store-compass-big',
  },
  smallPack: {
    id: rewardsCatalog.store.smallPack.id,
    amount: `x${rewardsCatalog.store.smallPack.amount}`,
    textureKey: 'store-loupe-big',
  },
  // mediumPack: {
  //   id: rewardsCatalog.store.mediumPack.id,
  //   amount: `x${rewardsCatalog.store.mediumPack.amount}`,
  //   textureKey: 'store-loupe-big',
  // },
  largePack: {
    id: rewardsCatalog.store.largePack.id,
    amount: `x${rewardsCatalog.store.largePack.amount}`,
    textureKey: 'store-loupe-big',
  },
  extraLargePack: {
    id: rewardsCatalog.store.extraLargePack.id,
    amount: `x${rewardsCatalog.store.extraLargePack.amount}`,
    textureKey: 'store-loupe-big',
  },
  coinLarge: {
    id: rewardsCatalog.store.coinLarge.id,
    amount: `x${rewardsCatalog.store.coinLarge.amount}`,
    textureKey: 'store-coinLarge',
  },
  coinXL: {
    id: rewardsCatalog.store.coinXL.id,
    amount: `x${rewardsCatalog.store.coinXL.amount}`,
    textureKey: 'store-coinXL',
  },
  noAdPack: {
    id: rewardsCatalog.store.noAdPack.id,
    amount: '',
    textureKey: 'icon-noAd'
  },
}

export default class StoreCard extends Container {
  #view
  #id
  #textureKey
  #amount
  #button
  #priceText
  
  constructor({view, id, amount, textureKey} = {}) {
    super()
    this.#view = view
    this.#id = id
    this.#textureKey = textureKey
    this.#amount = amount
    
    this.eventMode = 'static'
    this.typeName = 'card'

    this.#create()
  }
  
  get button() {
    return this.#button
  }
  
  get id() {
    return this.#id
  }
  
  set priceText(text) {
    if (this.#priceText) this.#priceText.text = text
  }
  
  #create = () => {
    this.#createCover()
    this.#createPic()
    this.#createTitleAmount()
    this.#createButton()
  }
  
  #createCover = () => {
    const cover = GameUtils.createSprite('store-card')
    this.addChild(cover)
  }
  
  #createTitleAmount = () => {
    const title = GameUtils.createText(this.#amount, {style: {
        ...primaryFontStyle, fontSize: 28
      }})
    title.y = -60
    this.addChild(title)
  }
  
  #createTextIsBuy = () => {
    //     <Text name={'isBuy'} text={`${i18next.t('purchased')}`} y={38} anchor={{x: 0.5, y: 0.5}}
    //           style={{...primaryFontStyle, fontSize: 18}} visible={false}/>
  }
  
  #createPic = () => {
    const container = new Container()
    const cardPic = GameUtils.createSprite(this.#textureKey)
    cardPic.y = 10
    cardPic.scale.set(0.9)
    
    const cover = createRect({
      w: CARD_SIZE.width - (CARD_SIZE.gap * 2),
      h: cardPic.height + (CARD_SIZE.gap * 4),
      color: 0xCCCCCC,
      center: true,
    })
    // container.addChild(cover)
    
    const posX = (CARD_SIZE.height - cover.height) / 2
    container.y = -posX + CARD_SIZE.gap
    
    container.addChild( cardPic)
    this.addChild(container)
  }
  
  #createButton = () => {
    const button = new ButtonContainer({
      props: {name: 'btnBuyLoupe', x: 0, y: 0},
      initScale: 0.35,
      spriteKeys: ['btn-secondary']
    })
    button.addCenterText({
      text: `${i18next.t('textLoading')}...`,
      style: {...primaryFontStyle}
    })
    this.#priceText = button.innerText
    
    button.productID = this.#id
    button.label = 'btnPrice'
    button.y = 54
    
    this.#button = button
    this.addChild(button)
    
    this.#createIconPlayForBtnFree()
  }
  
  #createIconPlayForBtnFree = () => {
    if (this.#id !== CARDS_DATA.free.id) return
    
    const iconPlay = GameUtils.createSprite('icon-play')
    iconPlay.x = this.#button.width - iconPlay.width / 2
    this.#button.addChild(iconPlay)
    
    this.#priceText.x -= iconPlay.width / 2
  }
}
