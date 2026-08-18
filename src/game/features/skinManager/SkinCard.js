import {Container, Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import GameUtils, {eventToggle} from '@/game/utils/gameUtils/GameUtils.js'
import {applyInteractive} from '@/game/components/buttons/buttons.js'
import {SKIN_EVENTS} from '@/game/features/skinManager/SkinManager.js'
import {primaryFontStyle} from '@/game/styles.js'
import InitialLoad from '@/game/states/preload/levelPreload/states/InitialLoad.js'
import ButtonContainer from '@/game/components/buttons/ButtonContainer.js'

export default class SkinCard extends Container {
  #game = Locator.game
  #button
  #textPrice
  #checkMark
  #cardPrice
  isActive = false
  
  static cardWidth = (244 / 2)
  static cardHeight = (320 / 2)
  
  constructor(name) {
    super()
    this.label = name
    this.sortableChildren = true
    
    applyInteractive(this)
    this.#init()
  }
  
  get button() {
    return this.#button
  }
  
  get checkMark() {
    return this.#checkMark
  }

  get cardPrice() {
    return this.#cardPrice
  }
  
  set textPrice(value) {
    this.#textPrice.text = value
    this.#cardPrice = value
  }
  
  destroy(_options) {
    super.destroy({..._options, children: true,})
    this.setEvents(false)
  }
  
  createButton = () => {
    if (this.#button) return
    
    const container = new ButtonContainer()
    container.y = 50
    container.zIndex = 1
    
    const spriteButton = GameUtils.createSprite('btn-primary', {scale: 0.35})
    const coin = GameUtils.createSprite('coin', {scale: 0.4})
    coin.x = 30
    
    const textPrice = new Text({
      text: '100',
      style: {...primaryFontStyle, fontSize: 25},
    })
    this.#textPrice = textPrice
    textPrice.x = -13
    textPrice.anchor.set(0.5)
    textPrice.label = 'textPrice'
    
    container.addChild(spriteButton, textPrice, coin)
    this.addChild(container)
    
    this.#button = container
  }
  
  createCheckMark = async () => {
    if (this.#checkMark) return
    
    await InitialLoad.skinsSpriteSheetPromise()
    
    const checkMark = GameUtils.createSprite('check-mark', {name: 'checkMark'})
    checkMark.position.set(44, 64)
    
    this.#checkMark = checkMark
    this.addChild(checkMark)
  }
  
  #init = () => {
    this.#createCoverAndSkinImage()
  }
  
  #createCoverAndSkinImage = async () => {
    const cover = GameUtils.createSprite('store-card',)
    this.addChild(cover)
    
    await InitialLoad.skinsSpriteSheetPromise()
    
    const skin = GameUtils.createSprite(`character_${this.label}`, {label: this.label})
    skin.scale.set(2)
    skin.y = (SkinCard.cardHeight / 2) - (skin.height / 2)
    
    this.addChild(skin)
  }
  
  setEvents = (bool) => {
    const toggle = eventToggle(bool)
  
    this[toggle.gameOnOff]('pointerup', this.#onCardClickHandler)
    if (this.#button) this.#button[toggle.gameOnOff]('pointerup', this.#onBtnClickHandler)
  }
  
  #onCardClickHandler = () => {
    this.#game.emit(SKIN_EVENTS.SELECT, this)
  }
  
  #onBtnClickHandler = () => {
    this.#game.emit(SKIN_EVENTS.BTN_BUY, this)
  }
}
