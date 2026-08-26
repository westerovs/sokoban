import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container} from 'pixi.js'
import BaseModal from '@/game/ui/common/modal/BaseModal.js'
import {applyInteractive} from '../../../components/buttons/buttons.js'
import Locator from '../../../engine/Locator.ts'
import SdkManager from '../../../engine/SdkManager.js'
import {GAME_NAMES} from '../../../gameConfig/constants.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'
import ButtonAnimator from '../../../utils/animations/ButtonAnimator.js'
import {destroyTimeLine} from '../../../utils/animations/gsapUtils.js'
import GameUtils from '../../../utils/gameUtils/GameUtils.js'
import Credits from './Credits.js'

const VIEW_SIZE = {
  w: 430,
  h: 470,
  buttonsGap: 74,
}
const BUTTONS_GAP = 15
const CHECKBOX_TEXT_STYLE = Object.freeze({
  fill: 0xf4edc5,
  fontFamily: 'primaryFont',
  fontSize: 24,
  fontWeight: '700',
})
const BUTTONS_DATA = {
  sfxBtn: {
    name: 'sfxBtn',
    textureON: 'icon-sfx-on',
    textureOFF: 'icon-sfx-off',
    position: {
      x: -VIEW_SIZE.buttonsGap,
      y: -VIEW_SIZE.buttonsGap - BUTTONS_GAP - 30,
    },
  },
  musicBtn: {
    name: 'musicBtn',
    textureON: 'icon-music-on',
    textureOFF: 'icon-music-off',
    position: {
      x: VIEW_SIZE.buttonsGap,
      y: -VIEW_SIZE.buttonsGap - BUTTONS_GAP - 30,
    },
  },
  btnMainScreen: {
    name: 'btnMainScreen',
    textureON: 'icon-home',
    textureOFF: null,
    position: {
      x: 0,
      y: 10,
    },
  },
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
  #checkboxSokobanDpad
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

  get checkboxSokobanDpad() {
    return this.#checkboxSokobanDpad
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

    if (isVisible) SdkManager.gameplayStop()
    else SdkManager.gameplayStart()

    if (!isVisible) {
      this.#game.emit(GAME_EVENTS.Options.hide)
    }

    this.#timeLine = await gsap
      .timeline({ease: 'linear'})
      .to(this.#optionsToggleBtn, {angle: isVisible ? 90 : 0, duration: 0.1})
      .eventCallback('onComplete', () => {
        if (!isVisible) Locator.uiLayer.closeModal(this)
        destroyTimeLine(this.#timeLine)
      })
  }

  #init = () => {
    this.#createWheel()
    this.#alightRightWheel()
    this.#createButtons()
    this.#createCheckboxRows()
    this.#checkFlagVisibleSoundButtons()

    this.#buttons = [this.#sfxBtn, this.#musicBtn, this.#btnMainScreen]

    this.#initCredits()
  }

  #createWheel = () => {
    this.#optionsToggleBtn = GameUtils.createSprite('icon-wheel', {
      label: 'optionsToggleBtn',
      interactive: true,
      visible: false,
    })
    
    ButtonAnimator.initOverHandler(this.#optionsToggleBtn)
    Locator.uiLayer.globalUiLayer.addChild(this.#optionsToggleBtn)
  }

  #alightRightWheel = () => {
    this.#optionsToggleBtn.alignRight = () => {
      Locator.uiLayer.alignRight(this.#optionsToggleBtn, {
        x: 0,
        y: 60,
      })
    }
    
    this.#optionsToggleBtn.alignRight()
  }
  
  #createButtons = () => {
    const map = Object.values(BUTTONS_DATA).map((data) => {
      return this.#createButton(data)
    })

    this.#sfxBtn = map.find((item) => item.label === BUTTONS_DATA.sfxBtn.name)
    this.#musicBtn = map.find((item) => item.label === BUTTONS_DATA.musicBtn.name)
    this.#btnMainScreen = map.find((item) => item.label === BUTTONS_DATA.btnMainScreen.name)
  }

  #createButton = ({name, textureON, textureOFF, position} = {}) => {
    const container = new Container({label: name})
    container.audioData = {
      textureON,
      textureOFF,
    }
    container.position.copyFrom(position)

    if (isNeedCreditsField()) {
      container.y -= 40
    }

    applyInteractive(container)

    const wrapper = GameUtils.createSprite('btn-ui-1')
    const icon = GameUtils.createSprite(textureON, {label: 'icon'})

    container.addChild(wrapper, icon)
    this.addChild(container)

    ButtonAnimator.initOverHandler([container])
    return container
  }

  #createCheckboxRows = () => {
    const checkboxes = new Container({label: 'option-checkboxes'})
    checkboxes.position.set(-VIEW_SIZE.w / 2 + 70, isNeedCreditsField() ? 140 : 148)

    this.#checkboxZoom = GameUtils.createCheckbox({
      text: `${i18next.t('option.checkboxZoom')}`,
      name: 'checkboxZoom',
      style: CHECKBOX_TEXT_STYLE,
    })
    this.#checkboxSokobanDpad = GameUtils.createCheckbox({
      text: `${i18next.t('option.checkboxSokobanDpad')}`,
      name: 'checkboxSokobanDpad',
      style: CHECKBOX_TEXT_STYLE,
    })
    this.#checkboxZoom.y = -25
    this.#checkboxSokobanDpad.y = 35
    this.#styleCheckbox(this.#checkboxZoom)
    this.#styleCheckbox(this.#checkboxSokobanDpad)

    checkboxes.addChild(this.#checkboxZoom, this.#checkboxSokobanDpad)
    this.addChild(checkboxes)
  }

  #styleCheckbox = (checkbox) => {
    checkbox.pivot.x = 0
    checkbox.getChildByLabel('checkbox').tint = 0xf4edc5
    checkbox.getChildByLabel('checkboxMark').tint = 0xf4edc5
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

export {VIEW_SIZE}
