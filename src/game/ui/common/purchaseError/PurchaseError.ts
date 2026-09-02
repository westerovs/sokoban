import type {TextStyleOptions} from 'pixi.js'
import {Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {primaryFontStyle} from '@/game/styles.js'
import BaseModal from '@/game/ui/common/modal/BaseModal.js'

// Показывает модальное сообщение об ошибке покупки.

export default class PurchaseError extends BaseModal {
  #message: string
  #style: TextStyleOptions = {
    ...primaryFontStyle,
    fontSize: 35,
    lineHeight: 50,
    wordWrap: true,
    wordWrapWidth: 400,
    align: 'center',
    fontFamily: 'primaryFont',
  }

  // Сохраняет сообщение и создаёт окно ошибки.
  constructor(message: string) {
    super({h: 300, forceUpdateAdaptive: true})

    this.label = 'purchaseError'
    this.#message = message
    this.rect.tint = 0xa9261b
    this.#create()
  }

  // Добавляет окно на UI-слой и создаёт текст.
  #create() {
    this.zIndex = 999
    Locator.uiLayer.stateUiLayer.addChild(this)
    this.#setText()
  }

  // Создаёт текст сообщения, если он задан.
  #setText() {
    if (!this.#message) return
    const text = new Text({label: 'purchase-error-message', text: this.#message, style: this.#style})
    text.anchor.set(0.5)
    this.addChild(text)
  }
}
