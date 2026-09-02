import i18next from 'i18next'
import {Container} from 'pixi.js'
import ButtonContainer from '@/game/components/buttons/ButtonContainer.ts'
import {primaryFontStyle} from '@/game/styles.ts'
import BaseModal from '@/game/ui/common/modal/BaseModal.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'

// Создаёт представление модального окна с предложением оценить игру.

export default class RateUsView extends BaseModal {
  // Создаёт содержимое окна оценки.
  constructor() {
    super({label: 'rateUsView', forceUpdateAdaptive: true, isNeedCloseButton: false})

    this.#init()
  }

  // Собирает визуальную иерархию окна.
  #init = () => {
    const innerModal = this.#createInnerModal()
    const innerContainer = this.#createInnerContainer()

    innerModal.addChild(innerContainer)
    this.addChild(innerModal)
  }

  // Создаёт контейнер содержимого модального окна.
  #createInnerModal() {
    return new Container({label: 'innerModal'})
  }

  // Создаёт группу элементов окна оценки.
  #createInnerContainer() {
    const innerContainer = new Container({label: 'innerContainer'})

    innerContainer.addChild(...this.#createStars())
    innerContainer.addChild(this.#createTitle())
    innerContainer.addChild(this.#createReward())
    innerContainer.addChild(this.#createButtonLater())
    innerContainer.addChild(this.#createButtonEnter())

    return innerContainer
  }

  // Создаёт ряд звёзд оценки.
  #createStars() {
    const stars = []
    const count = 5
    const centerY = -110
    let starWidth = 0

    for (let i = 0; i < count; i++) {
      const star = GameUtils.createSprite('icon-star', {label: `rateUsStar${i + 1}`})

      if (!starWidth) starWidth = star.width

      const offsetX = (i - (count - 1) / 2) * starWidth
      star.position.set(offsetX, centerY)
      stars.push(star)
    }

    return stars
  }

  // Создаёт заголовок окна оценки.
  #createTitle() {
    const title = GameUtils.createText(`${i18next.t('rateUs')}`, {
      name: 'rateUsTitle',
      style: {
        ...primaryFontStyle,
        fontSize: 26,
        align: 'center',
      },
    })
    title.y = -40

    return title
  }

  // Создаёт отображение награды.
  #createReward() {
    const reward = new Container({label: 'rateUsReward'})
    reward.y = 30

    const text = GameUtils.createText('+5', {
      name: 'rateUsRewardText',
      style: {
        ...primaryFontStyle,
        fontSize: 40,
      },
    })
    text.position.set(-30, -4)

    const icon = GameUtils.createSprite('icon-loupe', {label: 'rateUsRewardIcon'})
    icon.position.set(24, -6)

    reward.addChild(text, icon)
    return reward
  }

  // Создаёт кнопку отложенного действия.
  #createButtonLater() {
    return this.#createButton({
      name: 'btnLater',
      textureKey: 'btn-tertiary',
      text: `${i18next.t('rateUsBtnLater')}`,
      x: -104,
    })
  }

  // Создаёт кнопку перехода к оценке.
  #createButtonEnter() {
    return this.#createButton({
      name: 'btnEnter',
      textureKey: 'btn-primary',
      text: `${i18next.t('rateUsBtnGive')}`,
      x: 104,
    })
  }

  // Создаёт кнопку окна по переданным параметрам.
  #createButton({name, textureKey, text, x}: {name: string; textureKey: string; text: string; x: number}) {
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
