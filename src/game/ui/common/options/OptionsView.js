import {Container} from 'pixi.js'
import {gsap} from 'gsap'
import i18next from 'i18next'
import Locator from '../../../engine/Locator.ts'
import GameUtils from '../../../utils/gameUtils/GameUtils.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'
import BaseModal from '@/game/ui/common/modal/BaseModal.js'
import {applyInteractive} from '../../../components/buttons/buttons.js'
import ButtonAnimator from '../../../utils/animations/ButtonAnimator.js'
import SdkManager from '../../../engine/SdkManager.js'
import {destroyTimeLine} from '../../../utils/animations/gsapUtils.js'
import {GAME_NAMES} from '../../../gameConfig/constants.js'
import Credits from './Credits.js'

export const VIEW_SIZE = {
  w: 430,
  h: 400,
  buttonsGap: 74,
}
const BUTTONS_GAP = 15
const BUTTONS_DATA = {
  sfxBtn: {
    name: 'sfxBtn',
    textureON: 'icon-sfx-on',
    textureOFF: 'icon-sfx-off',
    position: {
      x: -VIEW_SIZE.buttonsGap,
      y: -(VIEW_SIZE.buttonsGap) - BUTTONS_GAP,
    }
  },
  musicBtn: {
    name: 'musicBtn',
    textureON: 'icon-music-on',
    textureOFF: 'icon-music-off',
    position: {
      x: VIEW_SIZE.buttonsGap,
      y: -(VIEW_SIZE.buttonsGap) - BUTTONS_GAP,
    }
  },
  btnMainScreen: {
    name: 'btnMainScreen',
    textureON: 'icon-home',
    textureOFF: null,
    position: {
      x: 0,
      y: (VIEW_SIZE.buttonsGap) - BUTTONS_GAP,
    }
  }
}

const isNeedCreditsField = () => {
  const availableGames = [GAME_NAMES.detective, GAME_NAMES.detectiveGirl]
  return availableGames.includes(GAME_NAMES.currentName)
}

export default class OptionsView extends BaseModal {
  #game = Locator.game
  #optionsToggleBtn
  
  #sfxBtn
  #musicBtn
  #btnMainScreen
  #checkboxZoom
  #buttons = []
  #timeLine = null
  #credits
  
  constructor() {
    super({
      ...VIEW_SIZE,
      h: isNeedCreditsField() ? VIEW_SIZE.h + 70 : VIEW_SIZE.h,
      label: 'OptionsView',
      forceUpdateAdaptive: true,
    })
    
    this.eventMode = 'static'
    this.label = 'optionView'
    this.zIndex = 10
    this.visible = false
    
    this.#init()
  }
  
  get optionsToggleBtn() {
    return this.#optionsToggleBtn
  }
  
  get buttons() {
    return this.#buttons
  }
  
  get sfxBtn() {
    return this.#sfxBtn
  }
  
  get musicBtn() {
    return this.#musicBtn
  }
  
  get checkboxZoom() {
    return this.#checkboxZoom
  }
  
  get btnMainScreen() {
    return this.#btnMainScreen
  }

  async hide() {
    await this.toggleVisibility()
  }
  
  toggleVisibility = async () => {
    if (this.#timeLine?.isActive()) return
    
    const isVisible = !this.visible
    if (isVisible && !Locator.uiLayer.openModal(this)) return

    this.visible = isVisible
    
    isVisible ? SdkManager.gameplayStop() : SdkManager.gameplayStart()
    
    if (!isVisible) {
      this.#game.emit(GAME_EVENTS.Options.hide)
    }
    
    this.#timeLine = await gsap.timeline({ease: 'linear'})
      .to(this.#optionsToggleBtn, {angle: isVisible ? 90 : 0, duration: 0.1})
      .eventCallback('onComplete', () => {
        if (!isVisible) Locator.uiLayer.closeModal(this)
        destroyTimeLine(this.#timeLine)
      })
  }
  
  #init = () => {
    this.#createWheel()
    this.#createButtons()
    this.#createCheckboxRow()
    this.#checkFlagVisibleSoundButtons()
    
    this.#buttons = [this.#sfxBtn, this.#musicBtn, this.#btnMainScreen]
    
    this.#initCredits()
  }

  #createWheel = () => {
    this.#optionsToggleBtn = GameUtils.createSprite('icon-wheel', {
      label: 'optionsToggleBtn',
      interactive: true,
    })
    ButtonAnimator.initOverHandler(this.#optionsToggleBtn)
    
    this.#optionsToggleBtn.visible = false
    this.#optionsToggleBtn.position.set(50, 60)
    this.#optionsToggleBtn._initPosition = {x: 50, y: 60}
    
    Locator.uiLayer.globalUiLayer.addChild(this.#optionsToggleBtn)
  }
  
  #createButtons = () => {
    const map = Object.values(BUTTONS_DATA).map((data) => {
      return this.#createButton(data)
    })
    
    this.#sfxBtn = map.find(item => item.label === BUTTONS_DATA.sfxBtn.name)
    this.#musicBtn = map.find(item => item.label === BUTTONS_DATA.musicBtn.name)
    this.#btnMainScreen = map.find(item => item.label === BUTTONS_DATA.btnMainScreen.name)
  }
  
  #createButton = ({name, textureON, textureOFF, position} = {}) => {
    const container = new Container()
    container.audioData = {
      textureON,
      textureOFF
    }
    container.label = name
    container.position.copyFrom(position)
    
    if (isNeedCreditsField()) {
      container.y -= 40
    }
    
    applyInteractive(container)
    
    const wrapper = GameUtils.createSprite('btn-ui-1')
    const icon =  GameUtils.createSprite(textureON, {label: 'icon'})
    
    container.addChild(wrapper, icon)
    this.addChild(container)
    
    ButtonAnimator.initOverHandler([container])
    return container
  }
  
  #createCheckboxRow = () => {
    const checkboxes = new Container()
    checkboxes.label = 'checkboxes'
    checkboxes.position.set(0, isNeedCreditsField() ? 140 : 180)
    
    this.#checkboxZoom = GameUtils.createCheckbox({
      text: `${i18next.t('option.checkboxZoom')}`,
      name: 'checkboxZoom'
    })
    
    checkboxes.addChild(this.#checkboxZoom)
    this.addChild(checkboxes)
  }
  
  #checkFlagVisibleSoundButtons = () => {
    if (SdkManager.flags.hideSoundButtons) {
      this.#musicBtn.visible = false
      this.#sfxBtn.visible = false
      this.#btnMainScreen.y = 0
    }
  }
  
  // ----------------- credits
  #initCredits = () => {
    if (!isNeedCreditsField()) return
    
    this.#credits = new Credits(this)
  }
}
