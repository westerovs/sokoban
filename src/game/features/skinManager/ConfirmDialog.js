import Locator from '../../engine/Locator.ts'
import DialogWindow from '@/game/ui/common/modal/DialogWIndow.js'
import i18next from 'i18next'
import ButtonAnimator from '../../utils/animations/ButtonAnimator.js'
import {eventToggle} from '../../utils/gameUtils/GameUtils.js'

// todo отрефакторить. Часть логики перенести в DialogWindow
export default class ConfirmDialog {
  #game = Locator.game
  #skinContainerView
  #skinStoreView
  #btnSkin
  #dialogWindow
  #btnYes
  #btnNo
  #card
  
  constructor(skinStoreView) {
    this.#skinStoreView = skinStoreView
  }
  
  init = (card) => {
    this.#card = card
    
    this.#createDialogWindow()
    this.#initVariables()
    this.#hideStoreView()
    
    this.#setEvents(true)
  }
  
  destroy = () => {
    this.#setEvents(false)
    this.#dialogWindow.destroy({children: true})
  }
  
  #createDialogWindow = () => {
    this.#dialogWindow = new DialogWindow({innerText: `${i18next.t('confirmPurchase')}`})
    this.#dialogWindow.position.set(-202, 440)
    
    this.#skinContainerView = this.#game.refs.skinContainerView
    this.#skinContainerView.addChild(this.#dialogWindow)
  }
  
  #initVariables = () => {
    this.#btnYes = this.#dialogWindow.getChildByLabel('btnYes')
    this.#btnNo = this.#dialogWindow.getChildByLabel('btnNo')
    this.#btnSkin = this.#skinContainerView.getChildByLabel('btnSkin')
  }
  
  #hideStoreView = () => {
    this.#skinStoreView.visible = false
    this.#btnSkin.visible = false
  }
  
  #setEvents = (bool) => {
    const {gameOnceOff} = eventToggle(bool)
  
    this.#btnYes[gameOnceOff]('pointerup', this.#confirmYes)
    this.#btnNo[gameOnceOff]('pointerup', this.#confirmNo)
  }
  
  #confirmYes = async () => {
    this.#setEvents(false)
    Locator.soundManager.play('sfx_btnClick')
    await ButtonAnimator.click(this.#btnYes)
    
    this.#skinStoreView.hasMoneyAction(this.#card)
    this.#hideConfirmWindow()
  }
  
  #confirmNo = async () => {
    this.#setEvents(false)
    Locator.soundManager.play('sfx_btnClick')
    await ButtonAnimator.click(this.#btnNo)
    
    this.#hideConfirmWindow()
  }
  
  #hideConfirmWindow = () => {
    this.#dialogWindow.visible = false
    this.#skinStoreView.visible = true
    this.#btnSkin.visible = true
    
    this.#skinStoreView.interactiveChildren = true
    
    this.destroy()
  }
}
