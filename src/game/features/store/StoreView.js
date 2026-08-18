import {Container} from 'pixi.js'
import i18next from 'i18next'
import BaseModal from '@/game/ui/common/modal/BaseModal.js'
import {ROW_SIZE} from '@/game/features/scoreboard/ScoreRow.js'
import Locator from '../../engine/Locator.ts'
import {GAME_EVENTS} from '../../gameConfig/gameEvents.js'
import StoreCard, {CARD_SIZE, CARDS_DATA} from './StoreCard.js'
import StoreTopRow from './StoreTopRow.js'


export default class StoreView extends BaseModal {
  #cardsContainer
  #cards = []
  
  constructor(props = {}) {
    super({h: 648, w: 420, isNeedHeader: true, ...props})
    
    this.label = 'storeView'
    this._initScale = 1.3
    
    this.#setHeaderText()
  }
  
  get cardsContainer() {
    return this.#cardsContainer
  }
  
  get startPositionYFirstRow() {
    const halfHeaderHeight = this.header.height / 2
    const halfViewHeight = this.rect.height / 2
    
    return (halfViewHeight + halfHeaderHeight) - ROW_SIZE.rowHeight
  }
  
  get cards() {
    return this.#cards
  }

  async hide() {
    await super.hide()
    Locator.game.emit(GAME_EVENTS.STORE.hide)
  }
  
  updateAdaptive = () => {
    const {x, y} = Locator.uiLayer.uiData.center
    this.position.set(x, y)
  }
  
  createContent() {
    this.#createCardsContainer()
    this.#createStoreTopRow()
    this.#createCards()
  }
  
  #setHeaderText = () => {
    if (!this.headerText) return
    this.headerText.text = `${i18next.t('btnStore')}`
  }
  
  #createStoreTopRow = () => {
    const storeTopRow = new StoreTopRow(this)
    const startPositionY = this.startPositionYFirstRow
    storeTopRow.y = -(startPositionY - this.header.height + 6)
    
    this.addChild(storeTopRow)
  }
  
  #createCardsContainer = () => {
    this.#cardsContainer = new Container()
    const startPositionY = this.startPositionYFirstRow
    
    const posX = (CARD_SIZE.width + CARD_SIZE.gap)
    this.#cardsContainer.x = -posX
    this.#cardsContainer.y = -(startPositionY / 2) + 30
    this.addChild(this.#cardsContainer)
  }

  #createCards = () => {
    const cardsData = Object.values(CARDS_DATA)
    const maxColumns = 3
    
    for (let i = 0; i < cardsData.length; i++) {
      const card = new StoreCard({view: this.view, ...cardsData[i]})
      this.#cardsContainer.addChild(card)
      this.#cards.push(card)
      
      const currentRowIndex = Math.floor(i / maxColumns)
      const posX = (CARD_SIZE.width + CARD_SIZE.gap) *(i % maxColumns)
      const posY = currentRowIndex * (CARD_SIZE.height + CARD_SIZE.gap)
      card.position.set(posX, posY)
    }
  }
  
  storeCoins = () => {
    // <Container name={'counterCoins'} x={frameSize.halfW + cardSize.width + (gap - 2)} y={110}>
    //   <Sprite x={35} texture={'store-icon-small'} anchor={{x: 0, y: 0.5}}/>
    //   <Text x={30} name={'textCounter'} anchor={{x: 1, y: 0.5}} style={{...primaryFontStyle, fontSize: 25, fill: 0xFFF5CD}}/>
    // </Container>
  }
}
