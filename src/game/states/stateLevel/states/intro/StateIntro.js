import {gsap} from 'gsap'
import Locator from '@/game/engine/Locator.ts'
import LocalStorage from '@/game/engine/storage/LocalStorage.js'
import {ASSETS_URL} from '@/game/gameConfig/constants.js'
import SpineUtils from '@/game/utils/SpineUtils.js'

export default class StateIntro {
  #level
  #animationSpeed = (LocalStorage.isDebug && LocalStorage.isLog) ? 10 : 1
  #view = Locator.game.view
  
  constructor(level) {
    this.#level = level
  }
  
  execute = async () => {
    this.#createStartLevelAnimation()
    
    Locator.uiFader.show()
    
    this.#tryPlayAmbient()
    await this.#showSpeechBubble()
    
    if (Locator.storage.playerData.option_zoom) {
      gsap.timeline()
        .set(Locator.game.refs.zoomButtonsContainer, {visible: true})
        .to(Locator.game.refs.zoomButtonsContainer, {alpha: 1, delay: 1})
        .from(Locator.game.refs.zoomButtonsContainer.children, {y: 0, ease: 'back.inOut'}, '<')
    }
  }

  // -------------------- STATE INTRO
  #createStartLevelAnimation = async () => {
    const startLevelAnimation = SpineUtils.createSpine({
      spineName: 'startLevelAnimation',
      autorun: true,
      animationName: 'idle',
      speed: this.#animationSpeed,
    })
    startLevelAnimation.zIndex = 1
    this.#view.addChild(startLevelAnimation)
    startLevelAnimation.eventMode = 'none'
    
    await gsap.to(startLevelAnimation, {alpha: 0, duration: 1, delay: 4})
    await SpineUtils.hideAndDestroySpine(startLevelAnimation)
  }
  
  #showSpeechBubble = async () => {
    const {introSpeechBubble} = this.#level.refs
    
    this.#setStoryText(introSpeechBubble)
    
    await gsap.timeline()
      .set(introSpeechBubble, {alpha: 0, visible: true})
      .to({}, {delay: 0.25})
      .to(introSpeechBubble, {alpha: 1, duration: 1, ease: 'linear'})
      .to({}, {delay: 2.5}, '<')
      .to(introSpeechBubble, {alpha: 0})
      .timeScale(this.#animationSpeed)
      .eventCallback('onComplete', () => {
        introSpeechBubble.destroy({children: true})
      })
  }
  
  #setStoryText = (introSpeechBubble) => {
    const bubbleText = introSpeechBubble.getChildByLabel('speechBubbleText', 1)
    const {introText} = this.#level.storyTextData

    // const testText = "The answers are gathered, but the spirit of the living room leaves a strange feeling of incompleteness"

    try {
      bubbleText.text = introText
    } catch (e) {
      console.log('[setStoryText] err', e)
    }
  }
  
  #tryPlayAmbient = () => {
    const {amb} = this.#level.config
    if (!amb) return
    
    const basePath = ASSETS_URL.local
    const src = `${basePath}assets/audio/ambience/${amb}.mp3`
    Locator.soundManager.loadAndPlaySFX(amb, src, {loop: true})
  }
}
