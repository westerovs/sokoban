import {gsap} from 'gsap'
import i18next from 'i18next'
import {GAME_STATES, LEVEL_TYPES, WORLD} from '@/game/gameConfig/constants.js'
import Locator from '@/game/engine/Locator.ts'
import ButtonAnimator from '@/game/utils/animations/ButtonAnimator.js'
import YaMetrika from '@/game/modules/metrika/YaMetrika.js'
import LevelConfig from '@/game/gameConfig/LevelConfig.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import BtnBadge from './BtnBadge.js'
import PromoManager from '@/game/features/promotionCards/PromoManager.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import SdkManager from '@/game/engine/SdkManager.js'
import {rewardsCatalog} from '@/game/gameConfig/rewardsCatalog.js'
import RateUs from '@/game/features/rateUs/RateUs.js'
import {clearTimeLine} from '@/game/utils/animations/gsapUtils.js'
import MathTools from '@/game/utils/MathTools.js'
import SkinContainerView from '@/game/ui/level/skinContainer/SkinContainerView.js'
import GrayscaleFilter from '@/game/utils/filters/GrayscaleFilter.js'
import SkinManager from '@/game/features/skinManager/SkinManager.js'
import InitialLoad from '@/game/states/preload/levelPreload/states/InitialLoad.js'
import {primaryFontStyle} from '@/game/styles.js'
import StoreView from '@/game/features/store/StoreView.js'
import Store from '@/game/features/store/Store.js'

export default class CompleteLevel {
  #game = Locator.game
  #refs = this.#game.refs
  #view
  #storage
  #soundManager
  #btnNext
  #showTimeline
  #canPlaySounds = true
  #levelType
  #skinManager
  
  constructor(levelEntity) {
    this.levelEntity = levelEntity
    this.state = levelEntity.state
  }
  
  init = async () => {
    try {
      this.#storage = Locator.storage
      this.#storage.updateUserRecord()
      
      this.#soundManager =  Locator.soundManager
      
      this.#initViewElements()
      this.#setEvents(true)
      
      this.#sendCompleteLvlMetrika()
      await this.#showPromoIfAvailable()
      await this.#setPriceTextForBtnAd()
      
      this.#createBtnBadge()
      this.#setBtnNextValue()
      this.#checkAdPassPurchased()
      await RateUs.checkAndShowRateUs(this.#storage, this.levelEntity)
      await this.#initCharacter()
      this.#initSkinManager()
      this.#setStoryText()
      
      await this.#showAndAnimate()
      SdkManager.gameplayStop()
    } catch (err) {
      console.error('CompleteLevel', err)
    }
  }
  
  #initViewElements = () => {
    this.#view = this.#refs.completeLevelView
    this.#btnNext = this.#view.getChildByLabel('btnNext', true)
    
    this.btnBuyLoupe = this.#view.getChildByLabel('btnBuyLoupe', true)
    this.btnHome = this.#view.getChildByLabel('btnHome', true)
    this.btnByeAd = this.#view.getChildByLabel('btnByeAd', true)
    this.btns = [this.#btnNext, this.btnBuyLoupe, this.btnHome, this.btnByeAd]
    
    ButtonAnimator.initOverHandler(this.btns)
  }
  
  #setEvents = (bool) => {
    const status = bool ? 'on' : 'off'
    const statusOnce = bool ? 'once' : 'off'
    
    this.#btnNext[statusOnce]('pointerdown', this.#btnNextHandler)
    this.btnHome[statusOnce]('pointerdown', this.#btnHomeHandler)
    
    this.#game[status](GAME_EVENTS.clearLevel, this.#setEvents.bind(this, false))
    this.#game[status](GAME_EVENTS.STORE.hide, this.#unHideInterface)
    this.#game[status](GAME_EVENTS.paymentManager.hasNoAdsPass, this.#checkAdPassPurchased)
    
    if (this.btnBuyLoupe) this.btnBuyLoupe[status]('pointertap', this.#btnStoreHandler)
    if (this.btnByeAd) this.btnByeAd[status]('pointertap', this.#btnByeAd)
  }
  
  #showPromoIfAvailable = async () => {
    if (!SdkManager.adapter.purchase.isAvailable()) return
    if (SdkManager.flags?.noStore) return
    
    const promoData = PromoManager.getPromoDataForLevel(this.#storage)
    if (!promoData) return
    
    const promoManager = new PromoManager()
    await promoManager.createPromoCard(promoData)
  }
  
  // 1 ------------- level result
  #showAndAnimate = async () => {
    const btnNext = this.#view.getChildByLabel('btnNext', true)
    this.#view.visible = true
    
    try {
      const btnNextArrow = btnNext.getChildByLabel('btnNextArrow')
      const btnBadge = btnNext.getChildByLabel('btnBadge')
      const {characterSpine} = this.#refs
      
      this.#showTimeline = gsap.timeline()
        .call(async () => {
          await this.#soundManager.stopAll()
          await this.#soundManager.play('sfx_victory')
          this.#playSpeech()
          this.#soundManager.play('m_victory')
        })
        .fromTo(characterSpine, {alpha: 0}, {alpha: 1}, '<')
        .fromTo(this.#view, {alpha: 0}, {alpha: 1})
      
      this.#showTimeline
        .fromTo(this.#refs.speechBubble.scale, {x: 0, y: 0}, {x: 1, y: 1, duration: 1, ease: 'back.out(2.5)'}, '<')
        .set(btnNext, {eventMode: 'none'})
        .fromTo(btnNext.scale, {x: 0, y: 0}, {x: 1, y: 1, delay: 2.5, ease: 'back.out(2.5)'})
        .from(btnNextArrow, {x: '-=150', alpha: 0, duration: 0.3, delay: 0.2, ease: 'elastic.out(0.5, 0.3)'}, '<')
      
      if (btnBadge) {
        this.#showTimeline
          .set(btnBadge, {visible: true})
          .fromTo(btnBadge.scale, {x: 0, y: 1}, {x: 1, y: 1, ease: 'back.out(2.5)'})
      }
      
      this.#showTimeline
        .set(btnNext, {eventMode: 'static'})
        .to(this.#refs.speechBubble, {alpha: 0, delay: 2})
      
    } catch (err) {
      btnNext.eventMode = 'static'
      console.error('[showAndAnimate]', err)
    }
  }
  
  #setBtnNextValue = () => {
    const btnNextArrow = this.#btnNext.getChildByLabel('btnNextArrow')
    const arrowText = btnNextArrow.getChildByLabel('arrowText')
    
    const nextLevelIndex = this.#storage.userLevel
    arrowText.text = `${i18next.t('level')} ${nextLevelIndex}`
    
  }
  
  #createBtnBadge = () => {
    // 1 определить какой следующий уровень
    const nextLevel = LevelConfig.getGameLevelData(this.#storage.playerData.levelIndex)
    const {levelType} = GameUtils.extractSpineLevelSuffix(nextLevel.spineName)
    // ничего не делаем если тип уровня не определен
    if (!levelType) return
    this.#levelType = levelType
    
    const badge = new BtnBadge({type: levelType})
    this.#btnNext.addChild(badge)
  }
  
  #initCharacter = async () => {
    let loadingText = null
    
    if (!InitialLoad.characterSpineIsLoaded) {
      loadingText = GameUtils.createText(`${i18next.t('textLoading')}...`, {
        style: {...primaryFontStyle, fill: 0xFFFFFF, fontSize: 60},
      })
      loadingText.position.set(WORLD.HALF_W, WORLD.HALF_H)
      this.#game.view.addChildAt(loadingText, 2)
    }
    
    await InitialLoad.characterSpinePromise()
    loadingText?.destroy()
    
    const hero = new SkinContainerView({refs: this.#refs})
    this.#game.view.addChildAt(hero, 2)
    
    const {characterSpine} = this.#refs
    
    const animations = characterSpine.skeleton.data.animations
      .filter(anim => anim.name !== 'startLevel')
      .map(anim => anim.name)
    
    const randomNumber = MathTools.getRandomNumber(0, animations.length - 1, 0)
    characterSpine.state.setAnimation(0, animations[randomNumber], true)
  }
  
  #initSkinManager = () => {
    this.#skinManager = new SkinManager()
  }
  
  #setStoryText = () => {
    try {
      const {outroText} = this.levelEntity.storyTextData
      // const testText = "Великолепная работа! Из хаоса и забытых вещей ты сотворил уют и чистоту — теперь номер снова готов принимать гостей с распростёртыми объятиями."
      this.#refs.speechBubbleText.text = outroText
    } catch (e) {
      console.warn('speechBubbleText error', e)
    }
  }
  
  #playSpeech = () => {
    if (!this.#canPlaySounds) return
    
    try {
      const {outroSpeech} = this.levelEntity.storyTextData
      this.#soundManager.play(outroSpeech)
    } catch (e) {
      console.warn('playSpeech error', e)
    }
  }
  
  #hideInterface = () => {
    this.#view.interactiveChildren = false
    
    return gsap.timeline()
      .to([this.#view, this.#refs.skinContainerView], {alpha: 0, visible: false})
  }
  
  #unHideInterface = () => {
    this.#view.interactiveChildren = true
    
    return gsap.timeline()
      .to([this.#view, this.#refs.skinContainerView], {alpha: 1, visible: true})
  }
  
  #btnNextHandler = async () => {
    this.#canPlaySounds = false
    
    YaMetrika.finalScreenBtnNext()
    this.#setEvents(false)
    clearTimeLine(this.#showTimeline, true, 1)
    
    await this.state.runNextLevel()
  }
  
  #btnHomeHandler = async () => {
    YaMetrika.finalScreenBtnHome()
    
    this.#setEvents(false)
    this.#soundManager.play('sfx_btnClick')
    await ButtonAnimator.click(this.btnHome)
    this.state.checkoutState(GAME_STATES.gameState)
  }
  
  #btnStoreHandler = () => {
    YaMetrika.finalScreenBtnStore()
    
    this.#soundManager.play('sfx_btnClick')
    this.#hideInterface()
    this.#createStore()
  }
  
  // todo дублирование
  #createStore = () => {
    const view = new StoreView()
    new Store(view)
  }
  
  #btnByeAd = () => {
    YaMetrika.finalScreenBtnDisableAd()
    const id = rewardsCatalog.store.noAdPack.id
    
    const paymentManager = Locator.paymentManager
    paymentManager.onPurchase(id)
  }
  
  #setPriceTextForBtnAd = async () => {
    if (!this.btnByeAd) return
    
    const btnByeAdText = this.btnByeAd.getChildByLabel('btnByeAdText')
    if (!btnByeAdText) return
    
    try {
      const catalog = await SdkManager.purchase.getCatalog()
      if (!catalog || catalog?.length) return
      
      const adPackId = rewardsCatalog.store.noAdPack.id
      const data = catalog[adPackId]
      
      const currency = SdkManager.purchase.getCurrency()
      
      btnByeAdText.text = `${data.price}\n${currency}`
    } catch (err) {
      console.log('[setPriceTextForBtnAd]', err)
      btnByeAdText.text = ''
    }
  }
  
  #checkAdPassPurchased = () => {
    if (this.#storage.playerData.hasAdPass) {
      const card = this.btnByeAd
      card.eventMode = 'none'
      
      const grayscale = new GrayscaleFilter(1)
      card.filters = [grayscale]
      
      const btnByeAdText = this.btnByeAd.getChildByLabel('btnByeAdText')
      btnByeAdText.visible = false
    }
  }
  
  // ---------- other
  #sendCompleteLvlMetrika = () => {
    const stopwatch = this.levelEntity.modulesInitializer.getMod('stopwatch')
    const levelPlayTime = stopwatch.seconds
    YaMetrika.completeLevel(this.levelEntity.config, this.#storage, levelPlayTime)
  }
}
