import {Container, Sprite, Texture} from 'pixi.js'
import Locator from '../../../engine/Locator.ts'
import {STORAGE_KEYS} from '../../../engine/storage/defaultData.js'
import {GAME_STATES} from '../../../gameConfig/constants.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'
import OptionsView from './OptionsView.js'
import type {OptionButton} from './OptionsView.js'
import type Game from '../../../Game.js'
import type Storage from '../../../engine/storage/Storage.js'
import type {PlayerData} from '../../../engine/storage/defaultData.js'
import type StateGame from '../../../states/stateGame/StateGame.js'

// Управляет настройками звука, управления и навигации между экранами.

type AudioStorageKey = 'option_isPlayMusic' | 'option_isPlaySFX'
type CheckboxStorageKey = 'option_sokobanDpad' | 'option_zoom'

export default class Options {
  #game: Game
  #refs: Record<string, any> = {}
  #storage!: Storage
  #playerData!: PlayerData
  #view!: OptionsView
  #optionsToggleBtn!: Sprite
  #btnBackToLevels!: OptionButton
  #btnMainScreen!: OptionButton
  #musicBtn!: OptionButton
  #sfxBtn!: OptionButton
  #checkboxSokobanDpad!: Container

  // Сохраняет игру для последующей инициализации настроек.
  constructor(game: Game) {
    this.#game = game

    // fast test
    // setTimeout(() => this.#toggleVisibility(), 500)
  }

  // Возвращает представление настроек.
  get view() {
    return this.#view
  }

  // Возвращает кнопку открытия настроек.
  get optionsToggleBtn() {
    return this.#optionsToggleBtn
  }

  // Возвращает текущую видимость окна настроек.
  get isVisible() {
    return this.#view?.visible ?? false
  }

  // Инициализирует зависимости, представление и события настроек.
  init = () => {
    this.#initVariables()
    this.#createView()

    this.#setInitParams()
    this.#setEvents()
  }

  // Управляет видимостью кнопки открытия настроек.
  setVisibleToggle = (isVisible: boolean) => {
    if (!this.#optionsToggleBtn) return

    this.#optionsToggleBtn.visible = isVisible
    this.#optionsToggleBtn.angle = 0

    if (isVisible === false && this.#view) {
      this.#view.visible = false
      Locator.uiLayer.closeModal(this.#view)
      this.#game.emit(GAME_EVENTS.Options.hide)
    }
  }

  // Настраивает кнопки навигации для главного экрана.
  setMainScreenNavigation = (isMainScreen: boolean) => {
    this.#view?.setMainScreenNavigation(isMainScreen)
  }

  // Переключает видимость окна настроек.
  #toggleVisibility = async () => {
    if (!this.#view) return
    await this.#view.toggleVisibility()
  }

  // Получает текущие ссылки на игру и профиль.
  #initVariables = () => {
    this.#refs = this.#game.refs
    this.#storage = Locator.storage
    this.#playerData = this.#storage.playerData
  }

  // Создаёт представление и сохраняет его интерактивные элементы.
  #createView = () => {
    this.#view = new OptionsView()

    this.#optionsToggleBtn = this.#view.optionsToggleBtn
    this.#btnBackToLevels = this.#view.btnBackToLevels
    this.#btnMainScreen = this.#view.btnMainScreen
    this.#musicBtn = this.#view.musicBtn
    this.#sfxBtn = this.#view.sfxBtn
    this.#checkboxSokobanDpad = this.#view.checkboxSokobanDpad
  }

  // Применяет сохранённые значения ко всем переключателям.
  #setInitParams = () => {
    this.#setAudioStatus(this.#sfxBtn!, STORAGE_KEYS.option_isPlaySFX)
    this.#setAudioStatus(this.#musicBtn!, STORAGE_KEYS.option_isPlayMusic)
    this.#setCheckboxStatus(this.#view!.checkboxZoom, STORAGE_KEYS.option_zoom)
    this.#setCheckboxStatus(this.#checkboxSokobanDpad!, STORAGE_KEYS.option_sokobanDpad)
  }

  // Обновляет иконку и громкость выбранного аудиоканала.
  #setAudioStatus = (button: OptionButton, storageKey: AudioStorageKey) => {
    const icon = button.getChildByLabel('icon') as Sprite

    const isPlay = this.#playerData[storageKey]
    const {textureON, textureOFF} = button.audioData
    icon.texture = Texture.from(isPlay ? textureON : textureOFF!)

    this.#game.emit(GAME_EVENTS.Options.toggleAudioVolume, storageKey, isPlay)
  }

  // Обновляет отметку выбранного переключателя.
  #setCheckboxStatus = (checkbox: Container, storageKey: CheckboxStorageKey) => {
    const mark = checkbox.getChildByLabel('checkboxMark')!
    mark.visible = Boolean(this.#storage.playerData[storageKey])
  }

  // Подключает события окна и автоматического скрытия.
  #setEvents = () => {
    this.#view!.on('pointerup', this.#handleOptionClick)
    this.#optionsToggleBtn!.on('pointerup', this.#onWheelHandler)

    this.#game.on(GAME_EVENTS.completeLevelWin, () => {
      this.#view!.visible = false
      this.setVisibleToggle(false)
    })
  }

  // Обрабатывает нажатие на кнопку-шестерёнку.
  #onWheelHandler = async () => {
    Locator.soundManager.play('sfx_btnClick')

    if (this.isVisible) await this.#toggleVisibility()
    else await this.#toggleVisibility()
  }

  // Выполняет действие выбранного элемента настроек.
  #handleOptionClick = ({target}: {target: Container}) => {
    if (target.label === 'baseModalRectBody') return
    Locator.soundManager.play('sfx_btnClick')

    if (target.label === this.#btnMainScreen!.label) {
      this.#navigateHome()
    }

    if (target.label === this.#btnBackToLevels!.label) {
      this.#navigateBack()
    }

    if (target.label === this.#musicBtn!.label) {
      this.#storage.gameSettings.toggleMusic()
      this.#setAudioStatus(target as OptionButton, STORAGE_KEYS.option_isPlayMusic)
    }
    if (target.label === this.#sfxBtn!.label) {
      this.#storage.gameSettings.toggleSFX()
      this.#setAudioStatus(target as OptionButton, STORAGE_KEYS.option_isPlaySFX)
    }
    if (target.label === 'btnCredits') {
      this.#game.emit(GAME_EVENTS.Options.btnCredits)
    }

    this.#checkboxHandler(target)
  }

  // Возвращает к списку локаций или на главный экран.
  #navigateBack = () => {
    this.#toggleVisibility()

    if (this.#game.stateName === GAME_STATES.gameState) {
      ;(this.#game.currentState as StateGame).stateStartScreen?.showLocations()
      return
    }

    if (this.#game.stateName !== GAME_STATES.levelState) return

    this.#game.requestSelectedLocationOnStart()
    this.#game.currentState?.checkoutState(GAME_STATES.gameState)
  }

  // Возвращает на главный экран текущего состояния.
  #navigateHome = () => {
    this.#toggleVisibility()

    if (this.#game.stateName === GAME_STATES.gameState) {
      ;(this.#game.currentState as StateGame).stateStartScreen?.showMainScreen()
      return
    }

    if (this.#game.stateName === GAME_STATES.levelState) {
      this.#game.currentState?.checkoutState(GAME_STATES.gameState)
    }
  }

  // Переключает настройку, соответствующую выбранному флажку.
  #checkboxHandler = (target: Container) => {
    if (target.label === 'checkboxZoom') {
      this.#storage.gameSettings.toggleZoom()
      this.#setCheckboxStatus(this.#view!.checkboxZoom, STORAGE_KEYS.option_zoom)
      this.#game.emit(GAME_EVENTS.Options.checkboxZoom)
    }
    if (target.label === 'checkboxSokobanDpad') {
      this.#storage.gameSettings.toggleSokobanDpad()
      this.#setCheckboxStatus(target, STORAGE_KEYS.option_sokobanDpad)
      this.#game.emit(GAME_EVENTS.Options.checkboxSokobanDpad, this.#storage.playerData.option_sokobanDpad)
    }
  }
}
