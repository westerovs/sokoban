import {Container, Sprite, Text, Texture} from 'pixi.js'
import {createRect} from '@/game/utils/commonUtils.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {FONT_COLORS, primaryFontStyle} from '@/game/styles.js'

export const ROW_SIZE = {
  rowHeight: 80,
  avatarSize: 80,
  offsetBetweenRows: 6,
}

export default class ScoreRow extends Container {
  // params
  #view
  #id
  #title
  #rank
  #score
  // view
  #rowWrapper
  #avatarContainer
  #textUserName
  #textScore
  #textRank
  // other
  #viewWidth
  #viewPadding
  #height = 80
  #rowWidth
  #baseTextStyle = {
    ...primaryFontStyle, fill: 0xFFFFFF, fontSize: 26,
  }
  
  constructor({view, id, title, rank, score = 0} = {}) {
    super()
    
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
  
  get id() {
    return this.#id
  }
  
  get avatarContainer() {
    return this.#avatarContainer
  }
  
  get textUserName() {
    return this.#textUserName
  }
  
  get textRank() {
    return this.#textRank
  }
  
  createFallBackTexture = () => {
    const fallbackTexture = Texture.from('avatar-user-default') // Заглушка (белая текстура)
    const avatar = new Sprite(fallbackTexture)
    avatar.anchor.set(0.5)
    avatar.width = ROW_SIZE.avatarSize - 10
    avatar.height = ROW_SIZE.avatarSize - 10
    
    this.#avatarContainer.addChild(avatar)
  }
  
  createMedal = (row, textureKey) => {
    const textRank = row.textRank
    textRank.visible = false
    
    const medal = GameUtils.createSprite(textureKey, {anchorX: 0})
    medal.position.set(this.#avatarContainer.x + medal.width + ROW_SIZE.offsetBetweenRows, this.#avatarContainer.y)
    
    this.#textUserName.x = medal.x + medal.width + 10
    
    row.addChild(medal)
  }
  
  fillRow = (color = FONT_COLORS.accentFont) => {
    this.#rowWrapper.tint = color
  }
  
  // вычисляет свободное расстояние между rank и score
  trimUserNameByAvailableWidth = (text, gap = 14) => {
    const scoreLeftX = this.#textScore.x - this.#textScore.width
    const maxWidth = Math.max(0, scoreLeftX - this.#textUserName.x - gap)
    
    this.#trimTextByWidth(this.#textUserName, text, maxWidth)
  }
  
  // если это лидеры после 5-го, то уменьшает размер их rank + корректирует отступ
  changeFontSizeAfterTop = (row, i) => {
    if (i >= 5) {
      const textRank = row.textRank
      textRank.scale.set(0.7)
      
      this.#textUserName.x = textRank.x + textRank.width + 10
    }
  }
  
  // --------------- create ---------------
  #create = () => {
    this.#createRowWrapper()
    this.#createAvatarContainer()
    this.#createTextRank()
    this.#createTextUserName()
    this.#createTextScore()
    this.#createIconCup()
  }
  
  #createRowWrapper = () => {
    this.#rowWrapper = createRect({
      w: this.#rowWidth,
      h: this.#height,
      color: 0xCCCCCC,
      center: true
    })
    this.addChild(this.#rowWrapper)
  }
  
  #createAvatarContainer = () => {
    const avatarContainer = new Container()
    this.#avatarContainer = avatarContainer
    avatarContainer.x = -(this.#rowWidth / 2) + ROW_SIZE.avatarSize / 2
    
    const avatarCover = createRect(
      {
        w: ROW_SIZE.avatarSize,
        h: ROW_SIZE.avatarSize,
        center: true,
        color: 0x838996
      })
    avatarContainer.addChild(avatarCover)
    
    this.addChild(avatarContainer)
  }
  
  #createTextRank = () => {
    const textRank = new Text({text: this.#rank, style: {...this.#baseTextStyle}})
    this.#textRank = textRank
    textRank.anchor.set(0, 0.5)
    textRank.x = -(this.#rowWidth / 2) + ROW_SIZE.avatarSize + 10
    
    this.addChild(textRank)
  }
  
  #createTextUserName = () => {
    const textUserName = new Text({
      text: this.#title,
      style: {...this.#baseTextStyle, fill: FONT_COLORS.secondFont}
    })
    this.#textUserName = textUserName
    textUserName.label = 'userName'
    textUserName.anchor.set(0, 0.5)
    textUserName.x = this.#textRank.x + this.#textRank.width + 10
    
    this.addChild(textUserName)
  }
  
  #createTextScore = () => {
    const textScore = new Text({text: this.#score, style: {...this.#baseTextStyle}})
    this.#textScore = textScore
    textScore.anchor.set(1, 0.5)
    textScore.x = (this.#rowWidth / 2) - ROW_SIZE.avatarSize + 10
    
    this.addChild(textScore)
  }
  
  #createIconCup = () => {
    const iconCup = GameUtils.createSprite('icon-cup')
    iconCup.x = (this.#viewWidth / 2) - iconCup.width - this.#viewPadding
    
    this.addChild(iconCup)
  }
  
  #trimTextByWidth = (textField, text, maxWidth = 300, ellipsis = '...') => {
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
