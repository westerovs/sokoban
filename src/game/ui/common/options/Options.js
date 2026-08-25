import {Texture} from 'pixi.js'
import Locator from '../../../engine/Locator.ts'
import {GAME_STATES} from '../../../gameConfig/constants.js'
import {GAME_EVENTS} from '../../../gameConfig/gameEvents.js'
import OptionsView from './OptionsView.js'
import {STORAGE_KEYS} from '../../../engine/storage/defaultData.js'

export default class Options {
  #game
  #refs
  #storage
  #playerData
  #view
  #optionsToggleBtn
  #btnMainScreen
  #musicBtn
  #sfxBtn
  
  constructor(game) {
    this.#game = game
    
    // fast test
    // setTimeout(() => this.#toggleVisibility(), 500)
  }
  
  get view() {
    return this.#view
  }
  
  get optionsToggleBtn() {
    return this.#optionsToggleBtn
  }
  
  get isVisible() {
    return this.#view.visible
  }
  
  init = () => {
    this.#initVariables()
    this.#createView()
    
    this.#setInitParams()
    this.#setEvents()
  }
  
  setVisibleToggle = (isVisible) => {
    if (!this.#optionsToggleBtn) return
    
    this.#optionsToggleBtn.visible = isVisible
    this.#optionsToggleBtn.angle = 0
    
    if (isVisible === false && this.#view) {
      this.#view.visible = false
      Locator.uiLayer.closeModal(this.#view)
      this.#game.emit(GAME_EVENTS.Options.hide)
    }
  }
  
  #toggleVisibility = async () => {
    if (!this.#view) return
    await this.#view.toggleVisibility()
  }
  
  #initVariables = () => {
    this.#refs = this.#game.refs
    this.#storage = Locator.storage
    this.#playerData = this.#storage.playerData
  }
  
  #createView = () => {
    this.#view = new OptionsView()
    
    this.#optionsToggleBtn = this.#view.optionsToggleBtn
    this.#btnMainScreen = this.#view.btnMainScreen
    this.#musicBtn = this.#view.musicBtn
    this.#sfxBtn = this.#view.sfxBtn
  }
  
  #setInitParams = () => {
    this.#setAudioStatus(this.#sfxBtn, STORAGE_KEYS.option_isPlaySFX)
    this.#setAudioStatus(this.#musicBtn, STORAGE_KEYS.option_isPlayMusic)
    this.#setCheckboxStatus()
  }
  
  #setAudioStatus = (button, storageKey) => {
    const icon = button.getChildByLabel('icon')
    
    const isPlay = this.#playerData[storageKey]
    const {textureON, textureOFF} = button.audioData
    icon.texture = Texture.from(isPlay ? textureON : textureOFF)
    
    this.#game.emit(GAME_EVENTS.Options.toggleAudioVolume, storageKey, isPlay)
  }
  
  #setCheckboxStatus = () => {
    const mark = this.#view.checkboxZoom.getChildByLabel('checkboxMark')
    mark.visible = this.#storage.playerData.option_zoom
  }
  
  #setEvents = () => {
    this.#view.on('pointerup', this.#handleOptionClick)
    this.#optionsToggleBtn.on('pointerup', this.#onWheelHandler)
    
    this.#game.on(GAME_EVENTS.completeLevelWin, () => {
      this.#view.visible = false
      this.setVisibleToggle(false)
    })
  }
  
  #onWheelHandler = async () => {
    Locator.soundManager.play('sfx_btnClick')
    
    if (this.isVisible) await this.#toggleVisibility()
    else await this.#toggleVisibility()
  }
  
  #handleOptionClick = ({target}) => {
    if (target.label === 'baseModalRectBody') return
    Locator.soundManager.play('sfx_btnClick')
    
    if (target.label === this.#btnMainScreen.label) {
      this.#toggleVisibility()

      if (this.#game.stateName === GAME_STATES.gameState) return
      if (this.#game.stateName === GAME_STATES.levelState) {
        this.#game.currentState.checkoutState(GAME_STATES.gameState)
      }
    }
    
    if (target.label === this.#musicBtn.label) {
      this.#storage.gameSettings.toggleMusic()
      this.#setAudioStatus(target, STORAGE_KEYS.option_isPlayMusic)
    }
    if (target.label === this.#sfxBtn.label) {
      this.#storage.gameSettings.toggleSFX()
      this.#setAudioStatus(target, STORAGE_KEYS.option_isPlaySFX)
    }
    if (target.label === 'btnCredits') {
      this.#game.emit(GAME_EVENTS.Options.btnCredits)
    }
    
    this.#checkboxHandler(target)
  }
  
  #checkboxHandler = (target) => {
    if (target.label === 'checkboxZoom') {
      this.#storage.gameSettings.toggleZoom()
      
      const mark = this.#view.checkboxZoom.getChildByLabel('checkboxMark')
      mark.visible = this.#storage.playerData.option_zoom

      this.#game.emit(GAME_EVENTS.Options.checkboxZoom)
    }
  }
}
