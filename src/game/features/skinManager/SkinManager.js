import {gsap} from 'gsap'
import {Cache} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {eventToggle} from '@/game/utils/gameUtils/GameUtils.js'
import ButtonAnimator from '@/game/utils/animations/ButtonAnimator.js'
import SkinStoreView from './SkinStoreView.js'
import SpineUtils from '@/game/utils/SpineUtils.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {Logger} from '@/game/utils/Logger.js'
import {GAME_NAME} from '@/game/generatedAssets/buildMeta.js'
import {GAME_NAMES} from '@/game/gameConfig/constants.js'

 const SKIN_EVENTS = {
  SELECT: 'skin:select',
  BTN_BUY: 'skin:btnBuy',
}

const getNewYearSkinNames = () => {
  if (GAME_NAME === GAME_NAMES.detective) {
    return ['christmas', 'santa']
  }
  
  else return []
}
const NEW_YEAR_SKIN_NAMES = getNewYearSkinNames()

const getSkinNames = () => {
  if (GAME_NAME === GAME_NAMES.detective) {
    return ['standard', 'sherlock', 'winter', ...NEW_YEAR_SKIN_NAMES,]
  }
  
  if (GAME_NAME === GAME_NAMES.detectiveGirl) {
    return ['standard', 'business', 'casual', 'gala']
  }
  if (GAME_NAME === GAME_NAMES.adventure) {
    return ['standard', 'greek', 'knight', 'samurai', 'viking']
  }
  
  else return ['standard', 'sherlock', 'winter', ...NEW_YEAR_SKIN_NAMES,]
}
const SKIN_NAMES = getSkinNames()

/*
 * - Первоначально текущий скин задаётся при создании вьюхи, в методе SkinContainerView
 *   Там берется значение из currentSkin
 * */

export default class SkinManager {
  #game = Locator.game
  #refs = this.#game.refs
  #completeLevelView
  #skinContainerView
  #characterSpine
  #btnSkin
  #isVisible = false
  #skinStoreView
  #activeCard
  
  constructor() {
    this.#init()
  }
  
  get skinContainerView() {
    return this.#skinContainerView
  }
  
  #init = async () => {
    if (!SKIN_NAMES) {
      return
    }
    
    this.#initVariables()
    this.#setEvents(true)

    await this.#showBtnSkin()
    this.#skinStoreView = new SkinStoreView(this)
    
    // fast test
    // setTimeout(() => this.#toggleVisibleCompleteLevelUI(), 100)
  }
  
  // вешает на активную карточку статус active
  #disableActiveCard = () => {
    this.#skinStoreView.cards.forEach(card => card.isActive = false)
  }
  
  #showBtnSkin = async () => {
    this.#btnSkin.visible = true
    await gsap.from(this.#btnSkin.scale, {x: 0, y: 0, delay: 1, duration: 0.5, ease: 'back.out(3)'})
  }
  
  #destroy = () => {
    Logger.warn('SkinManager destroy')
    this.#setEvents(false)
    
    if (this.#skinStoreView) {
      this.#skinStoreView.destroy()
      this.#skinStoreView = null
    }
  }
  
  #initVariables = () => {
    this.#completeLevelView = this.#refs.completeLevelView
    this.#skinContainerView = this.#refs.skinContainerView
    this.#characterSpine = this.#refs.characterSpine
    this.#btnSkin = this.#skinContainerView.getChildByLabel('btnSkin')
    
    ButtonAnimator.initOverHandler([this.#btnSkin])
  }
  
  #setEvents = (bool) => {
    const toggle = eventToggle(bool)
    
    this.#btnSkin[toggle.gameOnOff]('pointerup', this.#toggleVisibleCompleteLevelUI)
    this.#game[toggle.gameOnOff](SKIN_EVENTS.SELECT, this.#checkoutSkin)
    this.#game[toggle.gameOnOff](GAME_EVENTS.completeLevel, this.#destroy)
  }
  
  #toggleVisibleCompleteLevelUI = () => {
    if (!this.#skinStoreView) return
    this.#isVisible = !this.#isVisible
    
    ButtonAnimator.click(this.#btnSkin)
    Locator.soundManager.play('sfx_btnClick')
    
    const speechBubble = this.#skinContainerView.getChildByLabel('speechBubble')
    const iconSkin = this.#skinContainerView.getChildByLabel('iconSkin', true)
    const textureKey = this.#isVisible ? 'icon-skin-back' : 'icon-skin'
    iconSkin.texture = Cache.get(textureKey)
    
    gsap.timeline()
      .set([this.#completeLevelView, speechBubble], {visible: !this.#isVisible})
      .set([this.#skinStoreView], {visible: this.#isVisible})
    
    if (this.#isVisible) this.#skinStoreView.syncSelectionToCurrentSkin()
    if (!this.#isVisible) this.#returnToPackshot()
  }
  
  #returnToPackshot = () => {
    const {currentSkin} = Locator.storage.playerData
    SpineUtils.checkoutSkin(this.#characterSpine, currentSkin)
    this.#disableActiveCard()
    this.#activeCard = null
  }
  
  #checkoutSkin = (card) => {
    if (card.isActive) return
    this.#activeCard = card
    Logger.log(`checkoutSkin`, card.isActive)
    
    this.#skinStoreView.cards.forEach(card => card.isActive = false)
    card.isActive = true
    
    const spine = this.#characterSpine
    SpineUtils.checkoutSkin(spine, card.label)
    Locator.soundManager.play('sfx_changeSkin')
    
    this.#saveCurrentSkin(card)
  }
  
  #saveCurrentSkin = (card) => {
    const {skins, currentSkin} = Locator.storage.playerData
    const isPurchased = card.label === 'standard' || skins.includes(card.label)
    
    if (isPurchased && currentSkin !== card.label) {
      Locator.storage.playerData.currentSkin = card.label
      Locator.storage.save()
    }
  }
}

export {
  SKIN_EVENTS,
  NEW_YEAR_SKIN_NAMES,
  SKIN_NAMES,
}
