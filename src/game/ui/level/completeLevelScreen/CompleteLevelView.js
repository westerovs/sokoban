import i18next from 'i18next'
import {Container} from 'pixi.js'
import ButtonContainer from '@/game/components/buttons/ButtonContainer.js'
import {applyInteractive} from '@/game/components/buttons/buttons.js'
import SdkManager from '@/game/engine/SdkManager.js'
import {GAME_NAMES, WORLD} from '@/game/gameConfig/constants.js'
import {GAME_NAME} from '@/game/generatedAssets/buildMeta.js'
import {primaryFontStyle} from '@/game/styles.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import CompleteLocationUnlockCelebration from './CompleteLocationUnlockCelebration.js'

const STYLES = {
  btnNext: {
    ...primaryFontStyle,
    fontSize: 36,
  },
  btnNextLevel: {
    ...primaryFontStyle,
    fontSize: 22,
  },
  arrow: {
    ...primaryFontStyle,
    fontSize: 22,
    fill: 0xffffff,
  },
}

export default class CompleteLevelView extends Container {
  #locationUnlockCelebration
  #refs

  constructor({refs} = {}) {
    super()

    this.#refs = refs
    this.label = 'completeLevelView'

    this.#init()
  }

  showLocationUnlock = (location) => {
    this.#locationUnlockCelebration.show(location)
  }

  #init = () => {
    this.#refs.completeLevelView = this
    this.#createButtonsContainer()
    this.#locationUnlockCelebration = new CompleteLocationUnlockCelebration()
    this.addChild(this.#locationUnlockCelebration)
  }

  #createButtonsContainer() {
    const buttonsContainer = new Container()
    buttonsContainer.label = 'btnsContainer'
    buttonsContainer.position.set(WORLD.HALF_W, 800)

    buttonsContainer.addChild(this.#createButtonNext())

    if (SdkManager.flags?.noStore) {
      buttonsContainer.addChild(this.#createButtonBack(), this.#createButtonHome())
    } else {
      buttonsContainer.addChild(
        this.#createButtonStore(),
        this.#createButtonBack(),
        this.#createButtonHome(),
        this.#createButtonByeAd(),
      )
    }

    this.addChild(buttonsContainer)
  }

  #createButtonNext() {
    const button = new Container()
    button.label = 'btnNext'
    applyInteractive(button, {isButton: true})

    const textureKey = GAME_NAME === GAME_NAMES.hotel ? 'btn-start' : 'btn-next'
    const background = GameUtils.createSprite(textureKey)
    const text = GameUtils.createText(`${i18next.t('btnNextText')}`, {
      name: 'btnNextText',
      style: STYLES.btnNext,
    })
    text.y = -16
    const levelText = GameUtils.createText('', {
      name: 'btnNextLevelText',
      style: STYLES.btnNextLevel,
    })
    levelText.y = 28
    const arrow = this.#createButtonNextArrow()

    button.addChild(background, text, levelText, arrow)
    return button
  }

  #createButtonNextArrow() {
    const arrow = new Container()
    arrow.label = 'btnNextArrow'
    arrow.position.set(-54, -75)

    const background = GameUtils.createSprite('btn-next-arrow')
    const text = GameUtils.createText('', {
      name: 'arrowText',
      style: STYLES.arrow,
    })

    arrow.addChild(background, text)
    return arrow
  }

  #createButtonStore() {
    return new ButtonContainer({
      props: {
        name: 'btnBuyLoupe',
        x: -195,
        y: 195,
      },
      spriteKeys: ['btn-ui-2', {key: 'icon-loupe-plus', scale: 0.6}],
      overHandler: false,
    })
  }

  #createButtonHome() {
    return new ButtonContainer({
      props: {
        name: 'btnHome',
        x: 65,
        y: 199,
      },
      spriteKeys: ['btn-ui-1', 'icon-home'],
      overHandler: false,
    })
  }

  #createButtonBack() {
    return new ButtonContainer({
      props: {
        name: 'btnBackToLevels',
        x: -65,
        y: 199,
      },
      spriteKeys: ['btn-ui-1', {key: 'icon-skin-back', scale: 0.8}],
      overHandler: false,
    })
  }

  #createButtonByeAd() {
    const button = new ButtonContainer({
      props: {
        name: 'btnByeAd',
        x: 195,
        y: 199,
      },
      spriteKeys: ['btn-ui-2', 'icon-noAd'],
      overHandler: false,
    })

    const text = GameUtils.createText('100\nголосов', {
      name: 'btnByeAdText',
      anchorX: 1,
      anchorY: 0,
      style: {
        ...primaryFontStyle,
        fontSize: 22,
        lineHeight: 21,
        fill: 0xffffff,
        stroke: {color: '#000000', width: 2},
        align: 'right',
      },
    })
    text.position.set(50, 10)

    button.addChild(text)
    return button
  }
}
