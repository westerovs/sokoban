import {Container, Texture} from 'pixi.js'
import Locator from '../../engine/Locator.ts'
import {createCircle} from '../commonUtils.js'
import GameUtils from '../gameUtils/GameUtils.js'
import {applyInteractive} from '../../components/buttons/buttons.js'
import SdkManager from '../../engine/SdkManager.js'

/**
  Для теста добавить в BaseAdapter следующий метод:
    (ориентир initMuteLogic метод)
    
   forceMute = (isMuted = false) => {
     if (isMuted) {
      this._muted = true;
     this.events.emit(AUDIO_OFF_EVENT);
     } else {
       this._muted = false;
       this.events.emit(AUDIO_ON_EVENT);
     }
   }
*/
export default class TestSoundButton extends Container {
  #game = Locator.game
  #soundSprite
  #soundIsEnabled = true
  #textureKey = {
    on: 'icon-sfx-on',
    off: 'icon-sfx-off',
  }
  
  constructor(props) {
    super({label: 'testSoundButton', ...props})
    
    this.#init()
  }
  
  #init = () => {
    applyInteractive(this)
    this.position.set(50, 150)
    this.scale.set(0.6)
    this.#renderYoutubeSoundTestButton()
    
    this.on('pointerup', this.#checkoutState)
  }
  
  // кнопка для тестирования звука, которая эмитирует кнопку звука создаваемую платформой
  #renderYoutubeSoundTestButton = () => {
    const wrapperCircle = createCircle({r: 80, center: true})
    this.#soundSprite = GameUtils.createSprite(this.#textureKey.on)
    this.#soundSprite.position.set(-1, -2)
    
    this.addChild(wrapperCircle, this.#soundSprite)
    Locator.uiLayer.globalUiLayer.addChild(this)
  }
  
  #checkoutState = () => {
    this.#soundIsEnabled = !this.#soundIsEnabled
    
    const key = this.#soundIsEnabled ? this.#textureKey.on : this.#textureKey.off
    this.#soundSprite.texture = Texture.from(key)
    
    if (this.#soundIsEnabled) this.#enabledAction()
    else this.#disabledAction()
  }
  
  #enabledAction = () => {
    console.warn('sound force on')
    SdkManager.adapter.forceMute(false)
  }
  
  #disabledAction = () => {
    console.warn('sound force off')
    SdkManager.adapter.forceMute(true)
  }
}
