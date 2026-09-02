import type {ContainerOptions} from 'pixi.js'
import {Container, Sprite, Texture} from 'pixi.js'
import {applyInteractive} from '../../components/buttons/buttons.js'
import Locator from '../../engine/Locator.ts'
import SdkManager from '../../engine/SdkManager.js'
import {createCircle} from '../commonUtils.js'
import GameUtils from '../gameUtils/GameUtils.js'

// Создаёт отладочную кнопку принудительного включения и выключения звука платформы.

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
  #soundSprite!: Sprite
  #soundIsEnabled = true // Текущее тестовое состояние звука
  #textureKey = {
    on: 'icon-sfx-on', // Текстура включённого звука
    off: 'icon-sfx-off', // Текстура выключенного звука
  }

  // Создаёт кнопку с переданными параметрами контейнера.
  constructor(props: ContainerOptions = {}) {
    super({label: 'testSoundButton', ...props})

    this.#init()
  }

  // Настраивает кнопку и её событие.
  #init = () => {
    applyInteractive(this)
    this.position.set(50, 150)
    this.scale.set(0.6)
    this.#renderYoutubeSoundTestButton()

    this.on('pointerup', this.#checkoutState)
  }

  // кнопка для тестирования звука, которая эмитирует кнопку звука создаваемую платформой
  // Создаёт фон и иконку тестовой кнопки.
  #renderYoutubeSoundTestButton = () => {
    const wrapperCircle = createCircle({r: 80, center: true})
    this.#soundSprite = GameUtils.createSprite(this.#textureKey.on, {label: 'test-sound-icon'})
    this.#soundSprite.position.set(-1, -2)

    this.addChild(wrapperCircle, this.#soundSprite)
    Locator.uiLayer.globalUiLayer.addChild(this)
  }

  // Переключает состояние тестового звука.
  #checkoutState = () => {
    this.#soundIsEnabled = !this.#soundIsEnabled

    const key = this.#soundIsEnabled ? this.#textureKey.on : this.#textureKey.off
    this.#soundSprite.texture = Texture.from(key)

    if (this.#soundIsEnabled) this.#enabledAction()
    else this.#disabledAction()
  }

  // Принудительно включает звук платформы.
  #enabledAction = () => {
    console.warn('sound force on')
    SdkManager.adapter.forceMute?.(false)
  }

  // Принудительно отключает звук платформы.
  #disabledAction = () => {
    console.warn('sound force off')
    SdkManager.adapter.forceMute?.(true)
  }
}
