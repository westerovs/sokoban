import i18next from 'i18next'
import {Container} from 'pixi.js'
import {LEVEL_TYPES} from '@/game/gameConfig/constants.js'
import {primaryFontStyle} from '@/game/styles.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'

// Отображает метку сложности на кнопке следующего уровня.

const COLORS = {
  white: 0xffffff, // Белый цвет метки
  red: 0xff2b3e, // Красный цвет метки
  black: 0x2f2f2f, // Тёмный цвет метки
  orange: 0xffa500, // Оранжевый цвет метки
}

export default class BtnBadge extends Container {
  #type: string | null

  // Сохраняет тип уровня и создаёт соответствующую метку.
  constructor({type = null}: {type?: string | null} = {}) {
    super({label: 'btnBadge'})

    this.#type = type

    this.#init()
  }

  // Настраивает положение метки и создаёт содержимое.
  #init = () => {
    this.position.set(90, 46)
    this.angle = -10
    this.visible = false

    this.#createContent()
  }

  // Создаёт фон и текст метки.
  #createContent() {
    const {badgeTint, message, textFill} = this.#getBadgeData()

    const background = GameUtils.createSprite('btn-badge', {label: 'btnBadge-background'})
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

  // Выбирает цвета и подпись по типу уровня.
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
