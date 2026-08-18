import {Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.js'
import BaseModal from '@/game/ui/common/modal/BaseModal.js'
import Locator from '@/game/engine/Locator.ts'

export default class PurchaseError extends BaseModal {
  #message
  #style = {
    ...primaryFontStyle,
    fontSize: 35,
    lineHeight: 50,
    wordWrap: true,
    wordWrapWidth: 400,
    align: 'center',
    fontFamily: 'primaryFont',
  }
  
  constructor(message) {
    super({h: 300, forceUpdateAdaptive: true})
    
    this.label = 'purchaseError'
    this.#message = message
    this.rect.tint = 0xA9261B
    this.#create()
  }
  
  #create() {
    this.zIndex = 999
    Locator.uiLayer.stateUiLayer.addChild(this)
    this.#setText()
  }
  
  #setText() {
    if (!this.#message) return
    const text = new Text({text: this.#message, style: this.#style})
    text.anchor.set(0.5)
    this.addChild(text)
  }
}
