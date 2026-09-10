import i18next from 'i18next'
import {Container, Sprite, Text} from 'pixi.js'
import type {LevelDifficulty} from '@/game/gameConfig/levels/levelDifficulty.js'
import {primaryFontStyle} from '@/game/styles.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'

// Отображает метку сложности на кнопке следующего уровня.

const BADGE_TINTS: Record<LevelDifficulty, number> = {
  easy: 0x75a934, // Цвет лёгкого уровня
  medium: 0xd2a83f, // Цвет среднего уровня
  hard: 0xef7b2d, // Цвет тяжёлого уровня
  veryHard: 0xd83d45, // Цвет очень тяжёлого уровня
}

export default class BtnBadge extends Container {
  #background!: Sprite
  #difficulty: LevelDifficulty
  #text!: Text

  // Сохраняет сложность уровня и создаёт соответствующую метку.
  constructor({difficulty}: {difficulty: LevelDifficulty}) {
    super({label: 'level-difficulty-badge'})

    this.#difficulty = difficulty
    this.#init()
  }

  // Обновляет категорию, цвет и локализованную подпись.
  setDifficulty(difficulty: LevelDifficulty) {
    this.#difficulty = difficulty
    this.#background.tint = BADGE_TINTS[difficulty]
    this.#text.text = i18next.t(`difficultyLevels.${difficulty}`)
  }

  // Создаёт фон и текст метки.
  #init = () => {
    this.#background = GameUtils.createSprite('btn-badge', {label: 'level-difficulty-badge-background'})
    this.#text = GameUtils.createText('', {
      name: 'levelDifficultyBadgeText',
      style: {
        ...primaryFontStyle,
        fontSize: 23,
        fill: 0xffffff,
      },
    })
    this.#text.x = 10
    this.#text.angle = -1
    this.addChild(this.#background, this.#text)
    this.setDifficulty(this.#difficulty)
  }
}
