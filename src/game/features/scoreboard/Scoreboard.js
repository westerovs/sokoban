import {gsap} from 'gsap'
import i18next from 'i18next'
import SdkManager from '../../engine/SdkManager.js'
import {Sprite, Texture} from 'pixi.js'
import ScoreRow, {ROW_SIZE} from './ScoreRow.js'
import {mockData} from './mockData.js'
import LoadUtils from '../../utils/gameUtils/LoadUtils.js'

const avatarTextures = []

export default class Scoreboard {
  #view
  
  #textLoading
  #maxTopPlayers = 5
  #maxPlayers = 8
  #maxNeighbors = 2
  
  constructor(view) {
    this.#view = view
    
    this.#init()
  }

  #init = async () => {
    const showPromise = this.#view.show()
    const spriteSheetLoaded = await this.#loadSpritesheet()
    if (!spriteSheetLoaded || this.#view.destroyed) return

    this.#prepare()
    const isShown = await showPromise
    if (!isShown) return this.#view.destroy()

    await this.#loadPlayers()
  }

  #loadSpritesheet = async () => {
    this.#view.animateLoadingStart()

    try {
      await LoadUtils.loadSpriteSheet({spriteSheetName: 'leaders'})
      return true
    } catch (error) {
      console.error('[Scoreboard] Не удалось загрузить атлас лидеров', error)
      if (!this.#view.destroyed) this.#view.destroy()
      return false
    } finally {
      if (!this.#view.destroyed) this.#view.animateLoadingEnd()
    }
  }

  #loadPlayers = async () => {
    const players = await this.#getPlayers()
    if (this.#view.destroyed || !players || !players.length) return

    this.#createPlayersList(players)
    this.#setPositionGap(players)
    this.#markCurrentPlayer()
    this.#animateList()
  }
  
  #prepare = () => {
    avatarTextures.forEach(texture => texture.destroy(true))
    avatarTextures.length = 0
    
    if (this.#view.loadingText) {
      this.#view.loadingText.visible = true
      this.#textLoading = this.#view.loadingText
    }
  }
  
  #getPlayers = async () => {
    const players = import.meta.env.VITE_PLATFORM_NAME === 'noAdapter'
      ? mockData.slice(0, this.#maxPlayers)
      : await SdkManager.leaderboard.getEntries(
        this.#maxPlayers,
        this.#maxNeighbors,
      )

    if (!players) {
      this.#textLoading.text = i18next.t('scoreBoard.networkError')
      return Promise.resolve(players)
    }
    if (players?.length === 0) {
      this.#textLoading.text = i18next.t('scoreBoard.noPlayers')
      return Promise.resolve(players)
    }

    this.#textLoading.text = `${i18next.t('textLoading')}...`
    return Promise.resolve(players)
  }
  
  #createPlayersList = (players) => {
    const startPositionY = this.#view.startPositionYFirstRow
    const offsetAfterFifthRow = (i) => (i > 4) ? this.#view.header.height / 2 : 0
    
    Object.values(players).forEach((data, i) => {
      const {title, id, avatar, rank, score} = data
      
      const row = new ScoreRow({view: this.#view, id, rank, title, score, y: (ROW_SIZE.rowHeight * i)})
      row.y = i * (ROW_SIZE.rowHeight + ROW_SIZE.offsetBetweenRows) - startPositionY + offsetAfterFifthRow(i)
      this.#view.list.addChild(row)
      
      this.#loadAvatar(row, avatar)
      
      row.changeFontSizeAfterTop(row, i)
      this.#addTopRankMedal(row, i)
      
      row.trimUserNameByAvailableWidth(title)
    })
  }

  #setPositionGap = (players) => {
    const gapLine = this.#view.gapLine
    if (players.length > this.#maxTopPlayers) gapLine.visible = true

    const fifthRow = this.#view.list.children.at(4)
    if (!fifthRow) return
    
    gapLine.y = fifthRow.y + fifthRow.height + (gapLine.height + 20)
  }
  
  #markCurrentPlayer = () => {
    const currentPlayerID = SdkManager.sdk.player.getId()
    const row = this.#view.list.children.find(item => item?.id === currentPlayerID)

    if (row) {
      const userNameText = row.textUserName
      userNameText.style.fill = this.#view.userPlayerTextFill
      userNameText.style.fontStyle = 'italic'
      userNameText.text += ' ' // фиксит баг с обрезанием последней буквы при italic
      row.fillRow(this.#view.userPlayerRowFill)
    }
  }
  
  #animateList = () => {
    gsap.timeline()
      .fromTo([this.#view.list, this.#view.gapLine], {alpha: 0}, {alpha: 1, duration: 0.1, ease: 'none'})
      .set(this.#textLoading, {visible: false}, '<')
  }
  
  #loadAvatar = async (row, avatarUrl) => {
    const avatarContainer = row.avatarContainer

    try {
      const texture = await Texture.fromURL(avatarUrl)

      if (this.#view.destroyed || row.destroyed || avatarContainer.destroyed) {
        texture.destroy(true)
        return
      }

      avatarTextures.push(texture)
      
      const avatar = new Sprite(texture)
      avatar.anchor.set(0.5)
      avatar.width = ROW_SIZE.avatarSize - 10
      avatar.height = ROW_SIZE.avatarSize - 10
      
      avatarContainer.addChild(avatar)
    } catch (error) {
      if (this.#view.destroyed || row.destroyed) return
      row.createFallBackTexture()
    }
  }
  
  #addTopRankMedal = (row, i) => {
    if (i === 0) row.createMedal(row, 'leader-medal1')
    if (i === 1) row.createMedal(row, 'leader-medal2')
    if (i === 2) row.createMedal(row, 'leader-medal3')
    if (i === 3) row.createMedal(row, 'leader-medal4')
    if (i === 4) row.createMedal(row, 'leader-medal5')
  }

}
