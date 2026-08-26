import i18next from 'i18next'
import {Container} from 'pixi.js'
import {LEVEL_TYPES} from '@/game/gameConfig/constants.js'
import {primaryFontStyle} from '@/game/styles.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'

const COLORS = {
  white: 0xffffff,
  red: 0xff2b3e,
  black: 0x2f2f2f,
  orange: 0xffa500,
}

export default class BtnBadge extends Container {
  #type

  constructor({type} = {}) {
    super()

    this.#type = type

    this.#init()
  }

  #init = () => {
    this.label = 'btnBadge'
    this.position.set(90, 46)
    this.angle = -10
    this.visible = false

    this.#createContent()
  }

  #createContent() {
    const {badgeTint, message, textFill} = this.#getBadgeData()

    const background = GameUtils.createSprite('btn-badge')
    background.tint = badgeTint

    const text = GameUtils.createText(message, {
      name: 'arrowText',
      style: {
        ...primaryFontStyle,
        fontSize: 23,
        fill: textFill,
      },
    })
    text.x = 10
    text.angle = -1

    this.addChild(background, text)
  }

  #getBadgeData() {
    const data = {
      badgeTint: COLORS.white,
      message: '',
      textFill: 0xffffff,
    }

    if (this.#type === LEVEL_TYPES.SHADOWS.name) {
      data.badgeTint = COLORS.orange
      data.message = `${i18next.t(`difficultyLevels.${LEVEL_TYPES.SHADOWS.difficulty}`)}`
    }

    if (this.#type === LEVEL_TYPES.IDENTICAL.name) {
      data.badgeTint = COLORS.orange
      data.message = `${i18next.t(`difficultyLevels.${LEVEL_TYPES.IDENTICAL.difficulty}`)}`
    }

    if (this.#type === LEVEL_TYPES.WORDS.name) {
      data.badgeTint = COLORS.red
      data.message = `${i18next.t(`difficultyLevels.${LEVEL_TYPES.WORDS.difficulty}`)}`
    }

    if (this.#type === LEVEL_TYPES.ANAGRAMS.name) {
      data.badgeTint = COLORS.red
      data.message = `${i18next.t(`difficultyLevels.${LEVEL_TYPES.ANAGRAMS.difficulty}`)}`
    }

    if (this.#type === LEVEL_TYPES.GENERATOR.name) {
      data.badgeTint = COLORS.black
      data.message = `${i18next.t(`difficultyLevels.${LEVEL_TYPES.GENERATOR.difficulty}`)}`
    }

    if (this.#type === LEVEL_TYPES.NEW_YEAR.name) {
      data.message = `${i18next.t('difficultyLevels.newYear')}`
      data.textFill = 0x000000
    }

    return data
  }
}
