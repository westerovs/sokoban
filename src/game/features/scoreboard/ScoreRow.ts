import {Container, Sprite, Text, Texture} from 'pixi.js'
import type {Graphics} from 'pixi.js'
import {FONT_COLORS, primaryFontStyle} from '@/game/styles.js'
import {createRect} from '@/game/utils/commonUtils.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import type ScoreboardView from './ScoreboardView.js'

// Отображает одну строку игрока в таблице лидеров.

const ROW_SIZE = {
  rowHeight: 80, // Высота строки игрока.
  avatarSize: 80, // Размер области аватара.
  offsetBetweenRows: 6, // Вертикальный промежуток между строками.
}

export default class ScoreRow extends Container {
  // params
  #view: ScoreboardView
  #id: string
  #title: string
  #rank: number
  #score: number
  // view
  #rowWrapper!: Graphics
  #avatarContainer!: Container
  #textUserName!: Text
  #textScore!: Text
  #textRank!: Text
  // other
  #viewWidth: number
  #viewPadding: number
  #height = 80
  #rowWidth: number
  #baseTextStyle = {
    ...primaryFontStyle,
    fill: 0xffffff,
    fontSize: 26,
  }

  // Сохраняет данные игрока и создаёт визуальную строку.
  constructor({
    view,
    id,
    title,
    rank,
    score = 0,
  }: {
    view: ScoreboardView
    id: string
    title: string
    rank: number
    score?: number
    y?: number
  }) {
    super({label: `score-row-${id}`})

    this.#view = view
    this.#id = id
    this.#title = title
    this.#rank = rank
    this.#score = score

    this.#viewWidth = view.rect.width
    this.#viewPadding = view.padding
    this.#rowWidth = this.#viewWidth - 40

    this.#create()
  }

  // Возвращает идентификатор игрока.
  get id() {
    return this.#id
  }

  // Возвращает контейнер аватара.
  get avatarContainer() {
    return this.#avatarContainer
  }

  // Возвращает текст имени игрока.
  get textUserName() {
    return this.#textUserName
  }

  // Возвращает текст места игрока.
  get textRank() {
    return this.#textRank
  }

  // Создаёт резервный аватар.
  createFallBackTexture = () => {
    const fallbackTexture = Texture.from('avatar-user-default') // Заглушка (белая текстура)
    const avatar = new Sprite({texture: fallbackTexture, label: 'scoreboard-fallback-avatar'})
    avatar.anchor.set(0.5)
    avatar.width = ROW_SIZE.avatarSize - 10
    avatar.height = ROW_SIZE.avatarSize - 10

    this.#avatarContainer.addChild(avatar)
  }

  // Добавляет строке медаль за место в пятёрке лидеров.
  createMedal = (row: ScoreRow, textureKey: string) => {
    const textRank = row.textRank
    textRank.visible = false

    const medal = GameUtils.createSprite(textureKey, {anchorX: 0})
    medal.position.set(this.#avatarContainer.x + medal.width + ROW_SIZE.offsetBetweenRows, this.#avatarContainer.y)

    this.#textUserName.x = medal.x + medal.width + 10

    row.addChild(medal)
  }

  // Окрашивает фон строки.
  fillRow = (color = FONT_COLORS.accentFont) => {
    this.#rowWrapper.tint = color
  }

  // вычисляет свободное расстояние между rank и score
  trimUserNameByAvailableWidth = (text: string, gap = 14) => {
    const scoreLeftX = this.#textScore.x - this.#textScore.width
    const maxWidth = Math.max(0, scoreLeftX - this.#textUserName.x - gap)

    this.#trimTextByWidth(this.#textUserName, text, maxWidth)
  }

  // если это лидеры после 5-го, то уменьшает размер их rank + корректирует отступ
  changeFontSizeAfterTop = (row: ScoreRow, i: number) => {
    if (i >= 5) {
      const textRank = row.textRank
      textRank.scale.set(0.7)

      this.#textUserName.x = textRank.x + textRank.width + 10
    }
  }

  // --------------- create ---------------
  // Создаёт все визуальные элементы строки.
  #create = () => {
    this.#createRowWrapper()
    this.#createAvatarContainer()
    this.#createTextRank()
    this.#createTextUserName()
    this.#createTextScore()
    this.#createIconCup()
  }

  // Создаёт фоновую подложку строки.
  #createRowWrapper = () => {
    this.#rowWrapper = createRect({
      w: this.#rowWidth,
      h: this.#height,
      color: 0xcccccc,
      center: true,
    })
    this.addChild(this.#rowWrapper)
  }

  // Создаёт контейнер и подложку аватара.
  #createAvatarContainer = () => {
    const avatarContainer = new Container({label: 'scoreboard-avatar-container'})
    this.#avatarContainer = avatarContainer
    avatarContainer.x = -(this.#rowWidth / 2) + ROW_SIZE.avatarSize / 2

    const avatarCover = createRect({
      w: ROW_SIZE.avatarSize,
      h: ROW_SIZE.avatarSize,
      center: true,
      color: 0x838996,
    })
    avatarContainer.addChild(avatarCover)

    this.addChild(avatarContainer)
  }

  // Создаёт текст места игрока.
  #createTextRank = () => {
    const textRank = new Text({label: 'scoreboard-rank', text: this.#rank, style: {...this.#baseTextStyle}})
    this.#textRank = textRank
    textRank.anchor.set(0, 0.5)
    textRank.x = -(this.#rowWidth / 2) + ROW_SIZE.avatarSize + 10

    this.addChild(textRank)
  }

  // Создаёт текст имени игрока.
  #createTextUserName = () => {
    const textUserName = new Text({
      label: 'userName',
      text: this.#title,
      style: {...this.#baseTextStyle, fill: FONT_COLORS.secondFont},
    })
    this.#textUserName = textUserName
    textUserName.anchor.set(0, 0.5)
    textUserName.x = this.#textRank.x + this.#textRank.width + 10

    this.addChild(textUserName)
  }

  // Создаёт текст результата игрока.
  #createTextScore = () => {
    const textScore = new Text({label: 'scoreboard-score', text: this.#score, style: {...this.#baseTextStyle}})
    this.#textScore = textScore
    textScore.anchor.set(1, 0.5)
    textScore.x = this.#rowWidth / 2 - ROW_SIZE.avatarSize + 10

    this.addChild(textScore)
  }

  // Создаёт иконку кубка рядом с результатом.
  #createIconCup = () => {
    const iconCup = GameUtils.createSprite('icon-cup')
    iconCup.x = this.#viewWidth / 2 - iconCup.width - this.#viewPadding

    this.addChild(iconCup)
  }

  // Обрезает текст двоичным поиском до доступной ширины.
  #trimTextByWidth = (textField: Text, text: string, maxWidth = 300, ellipsis = '...') => {
    textField.text = text

    if (textField.width <= maxWidth) return

    let left = 0
    let right = text.length
    let result = text

    while (left <= right) {
      const middle = Math.floor((left + right) / 2)
      const value = `${text.slice(0, middle)}${ellipsis}`

      textField.text = value

      if (textField.width <= maxWidth) {
        result = value
        left = middle + 1
      } else {
        right = middle - 1
      }
    }

    textField.text = result
  }
}

export {
  ROW_SIZE,
}
