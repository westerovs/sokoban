import i18next from 'i18next'
import {primaryFontStyle, popupColors} from '@/game/styles.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import ButtonContainer from '../../../components/buttons/ButtonContainer.js'
import BaseModal from './BaseModal.js'


export default class DialogWindow extends BaseModal {
  #innerText
  #size

  constructor({
                innerText = '',
                bodyColor = popupColors.body,
                borderColor = popupColors.border,
                size = {w: 400, h: 130},
              } = {}) {
    super({
      w: size.w,
      h: size.h,
      beginFill: bodyColor,
      borderFill: borderColor,
      isNeedCloseButton: false,
    })

    this.#innerText = innerText
    this.#size = size

    this.#init()
  }

  #init = () => {
    this.label = 'dialogWindow'
    this.visible = true
    this.pivot.set(-(this.#size.w / 2), -(this.#size.h / 2))

    this.#createDialogText()
    this.#createButtonYes()
    this.#createButtonNo()
  }

  #createDialogText() {
    const dialogText = GameUtils.createText(this.#innerText, {
      name: 'dialogText',
      style: {
        ...primaryFontStyle,
        fontSize: 32,
        wordWrap: true,
        wordWrapWidth: this.#size.w,
        align: 'center',
      }
    })
    dialogText.y = -10

    this.addChild(dialogText)
  }

  #createButtonYes() {
    const button = this.#createButton({
      name: 'btnYes',
      textureKey: 'btn-primary',
      text: `${i18next.t('yes')}`,
      x: -90,
    })

    this.addChild(button)
  }

  #createButtonNo() {
    const button = this.#createButton({
      name: 'btnNo',
      textureKey: 'btn-tertiary',
      text: `${i18next.t('no')}`,
      x: 90,
    })

    this.addChild(button)
  }

  #createButton({name, textureKey, text, x}) {
    const button = new ButtonContainer({
      props: {name, x, y: this.#size.h / 2,},
      spriteKeys: [{key: textureKey, scale: 0.5}],
      overHandler: false,
    })
    button.addCenterText({
      text,
      y: -2,
      style: {
        ...primaryFontStyle,
        fontSize: 26,
      }
    })

    return button
  }
}
