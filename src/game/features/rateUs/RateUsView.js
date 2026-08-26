import i18next from 'i18next'
import {Container} from 'pixi.js'
import ButtonContainer from '@/game/components/buttons/ButtonContainer.js'
import {primaryFontStyle} from '@/game/styles.js'
import BaseModal from '@/game/ui/common/modal/BaseModal.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'

export default class RateUsView extends BaseModal {
  #refs

  constructor({refs, ...props} = {}) {
    super({
      label: 'rateUsView',
      forceUpdateAdaptive: true,
      ...props,
    })

    this.#refs = refs
    this.label = 'rateUsView'

    this.#init()
  }

  #init = () => {
    if (this.#refs) this.#refs.rateUsView = this

    this.btnClose.visible = false
    this.btnClose.eventMode = 'none'

    this.#createInnerModal()
    this.#createInnerContainer()
  }

  #createInnerModal() {
    const innerModal = new Container()
    innerModal.label = 'innerModal'

    this.addChild(innerModal)
  }

  #createInnerContainer() {
    const innerContainer = new Container()
    innerContainer.label = 'innerContainer'

    innerContainer.addChild(...this.#createStars())
    innerContainer.addChild(this.#createTitle())
    innerContainer.addChild(this.#createReward())
    innerContainer.addChild(this.#createButtonLater(), this.#createButtonEnter())

    this.addChild(innerContainer)
  }

  #createStars() {
    const stars = []
    const count = 5
    const centerY = -110
    let starWidth = 0

    for (let i = 0; i < count; i++) {
      const star = GameUtils.createSprite('icon-star')

      if (!starWidth) starWidth = star.width

      const offsetX = (i - (count - 1) / 2) * starWidth
      star.position.set(offsetX, centerY)
      stars.push(star)
    }

    return stars
  }

  #createTitle() {
    const title = GameUtils.createText(`${i18next.t('rateUs')}`, {
      style: {
        ...primaryFontStyle,
        fontSize: 26,
        align: 'center',
      },
    })
    title.y = -40

    return title
  }

  #createReward() {
    const reward = new Container()
    reward.y = 30

    const text = GameUtils.createText('+5', {
      style: {
        ...primaryFontStyle,
        fontSize: 40,
      },
    })
    text.position.set(-30, -4)

    const icon = GameUtils.createSprite('icon-loupe')
    icon.position.set(24, -6)

    reward.addChild(text, icon)
    return reward
  }

  #createButtonLater() {
    return this.#createButton({
      name: 'btnLater',
      textureKey: 'btn-tertiary',
      text: `${i18next.t('rateUsBtnLater')}`,
      x: -104,
    })
  }

  #createButtonEnter() {
    return this.#createButton({
      name: 'btnEnter',
      textureKey: 'btn-primary',
      text: `${i18next.t('rateUsBtnGive')}`,
      x: 104,
    })
  }

  #createButton({name, textureKey, text, x}) {
    const button = new ButtonContainer({
      props: {
        name,
        x,
        y: 100,
      },
      initScale: 0.65,
      spriteKeys: [textureKey],
      overHandler: false,
    })
    button.addCenterText({
      text,
      style: {
        ...primaryFontStyle,
        fontSize: 30,
      },
    })

    return button
  }
}
