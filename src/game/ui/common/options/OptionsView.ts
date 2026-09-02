import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container, Sprite} from 'pixi.js'
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

// Отображает модальное окно настроек и его элементы управления.

const VIEW_SIZE = {
  w: 430, // Ширина окна настроек
  h: 470, // Базовая высота окна настроек
  buttonsGap: 74, // Горизонтальный отступ кнопок
}
const BUTTONS_GAP = 15 // Дополнительный отступ ряда кнопок
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
      x: VIEW_SIZE.buttonsGap,
      y: 10,
    },
  },
  btnBackToLevels: {
    name: 'btnBackToLevels',
    textureON: 'icon-skin-back',
    textureOFF: null,
    iconScale: 0.8,
    position: {
      x: -VIEW_SIZE.buttonsGap,
      y: 10,
    },
  },
}

type OptionButtonData = {
  iconScale?: number
  name: string
  position: {x: number; y: number}
  textureOFF: string | null
  textureON: string
}

type OptionButton = Container & {
  audioData: {
    textureOFF: string | null
    textureON: string
  }
}

type OptionsToggleButton = Sprite & {
  alignRight?: () => void
}

// Проверяет, нужен ли раздел авторов для текущей игры.
const isNeedCreditsField = () => {
  const availableGames: string[] = [GAME_NAMES.detective, GAME_NAMES.detectiveGirl]
  return availableGames.includes(String(GAME_NAMES.currentName))
}

export default class OptionsView extends BaseModal {
  #game = Locator.game
  #optionsToggleBtn!: OptionsToggleButton

  #sfxBtn!: OptionButton
  #musicBtn!: OptionButton
  #btnBackToLevels!: OptionButton
  #btnMainScreen!: OptionButton
  #checkboxZoom!: Container
  #checkboxSokobanDpad!: Container
  #buttons: OptionButton[] = []
  #timeLine: Awaited<ReturnType<typeof gsap.timeline>> | null = null
  #credits: Credits | null = null

  // Создаёт модальное окно настроек и его элементы.
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

  // Возвращает кнопку открытия настроек.
  get optionsToggleBtn() {
    return this.#optionsToggleBtn
  }

  // Возвращает основные кнопки настроек.
  get buttons() {
    return this.#buttons
  }

  // Возвращает кнопку звуковых эффектов.
  get sfxBtn() {
    return this.#sfxBtn
  }

  // Возвращает кнопку музыки.
  get musicBtn() {
    return this.#musicBtn
  }

  // Возвращает переключатель масштаба.
  get checkboxZoom() {
    return this.#checkboxZoom
  }

  // Возвращает переключатель экранного управления Sokoban.
  get checkboxSokobanDpad() {
    return this.#checkboxSokobanDpad
  }

  // Возвращает кнопку главного экрана.
  get btnMainScreen() {
    return this.#btnMainScreen
  }

  // Возвращает кнопку выбора локаций.
  get btnBackToLevels() {
    return this.#btnBackToLevels
  }

  // Настраивает навигационные кнопки для главного экрана.
  setMainScreenNavigation(isMainScreen: boolean) {
    this.#btnBackToLevels.visible = !isMainScreen
    this.#btnMainScreen.x = isMainScreen ? 0 : VIEW_SIZE.buttonsGap
  }

  // Скрывает окно через общую анимацию переключения.
  async hide() {
    await this.toggleVisibility()
  }

  // Переключает видимость окна и состояние игрового процесса.
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
        destroyTimeLine(this.#timeLine as gsap.core.Timeline | null)
      })
  }

  // Создаёт все элементы окна настроек.
  #init = () => {
    this.#createWheel()
    this.#alightRightWheel()
    this.#createButtons()
    this.#createCheckboxRows()
    this.#checkFlagVisibleSoundButtons()

    this.#buttons = [this.#sfxBtn, this.#musicBtn, this.#btnBackToLevels, this.#btnMainScreen]

    this.#initCredits()
  }

  // Создаёт кнопку-шестерёнку на глобальном UI-слое.
  #createWheel = () => {
    this.#optionsToggleBtn = GameUtils.createSprite('icon-wheel', {
      label: 'optionsToggleBtn',
      interactive: true,
      visible: false,
    }) as OptionsToggleButton

    ButtonAnimator.initOverHandler(this.#optionsToggleBtn)
    Locator.uiLayer.globalUiLayer.addChild(this.#optionsToggleBtn)
  }

  // Привязывает кнопку-шестерёнку к правому краю.
  #alightRightWheel = () => {
    this.#optionsToggleBtn.alignRight = () => {
      Locator.uiLayer.alignRight(this.#optionsToggleBtn, {
        x: 0,
        y: 60,
      })
    }

    this.#optionsToggleBtn.alignRight?.()
  }

  // Создаёт кнопки звука и навигации.
  #createButtons = () => {
    const map = Object.values(BUTTONS_DATA).map((data) => {
      return this.#createButton(data)
    })

    this.#sfxBtn = map.find((item) => item.label === BUTTONS_DATA.sfxBtn.name)!
    this.#musicBtn = map.find((item) => item.label === BUTTONS_DATA.musicBtn.name)!
    this.#btnBackToLevels = map.find((item) => item.label === BUTTONS_DATA.btnBackToLevels.name)!
    this.#btnMainScreen = map.find((item) => item.label === BUTTONS_DATA.btnMainScreen.name)!
  }

  // Создаёт одну кнопку настроек по описанию.
  #createButton = ({name, textureON, textureOFF, iconScale = 1, position}: OptionButtonData): OptionButton => {
    const container = new Container({label: name}) as OptionButton
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
    const icon = GameUtils.createSprite(textureON, {label: 'icon', scale: iconScale})

    container.addChild(wrapper, icon)
    this.addChild(container)

    ButtonAnimator.initOverHandler([container])
    return container
  }

  // Создаёт строки переключателей игрового управления.
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

  // Применяет общий цвет к переключателю.
  #styleCheckbox = (checkbox: Container) => {
    checkbox.pivot.x = 0
    checkbox.getChildByLabel('checkbox')!.tint = 0xf4edc5
    checkbox.getChildByLabel('checkboxMark')!.tint = 0xf4edc5
  }

  // Скрывает звуковые кнопки по платформенному флагу.
  #checkFlagVisibleSoundButtons = () => {
    if (SdkManager.flags.hideSoundButtons) {
      this.#musicBtn.visible = false
      this.#sfxBtn.visible = false
      this.#btnBackToLevels.y = 0
      this.#btnMainScreen.y = 0
    }
  }

  // ----------------- credits
  // Создаёт раздел авторов для поддерживаемых игр.
  #initCredits = () => {
    if (!isNeedCreditsField()) return

    this.#credits = new Credits(this)
  }
}

export {VIEW_SIZE}

export type {OptionButton}
