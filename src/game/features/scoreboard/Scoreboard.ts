import {gsap} from 'gsap'
import i18next from 'i18next'
import {Sprite, Texture} from 'pixi.js'
import type {Text} from 'pixi.js'
import SdkManager from '../../engine/SdkManager.js'
import type {SdkLeaderboardEntry} from '../../engine/sdkTypes.js'
import LoadUtils from '../../utils/gameUtils/LoadUtils.js'
import {mockData} from './mockData.js'
import ScoreRow, {ROW_SIZE} from './ScoreRow.js'
import type ScoreboardView from './ScoreboardView.js'

// Загружает данные таблицы лидеров и наполняет её представление.

type TextureWithLegacyLoader = typeof Texture & {
  fromURL: (url: string) => Promise<Texture>
}

const avatarTextures: Texture[] = []

export default class Scoreboard {
  #view: ScoreboardView

  #textLoading!: Text
  #maxTopPlayers = 5
  #maxPlayers = 8
  #maxNeighbors = 2

  // Сохраняет представление и запускает загрузку таблицы.
  constructor(view: ScoreboardView) {
    this.#view = view

    this.#init()
  }

  // Показывает окно, загружает ресурсы и данные игроков.
  #init = async () => {
    const showPromise = this.#view.show()
    const spriteSheetLoaded = await this.#loadSpritesheet()
    if (!spriteSheetLoaded || this.#view.destroyed) return

    this.#prepare()
    const isShown = await showPromise
    if (!isShown) return this.#view.destroy()

    await this.#loadPlayers()
  }

  // Загружает спрайтшит таблицы лидеров.
  #loadSpritesheet = async () => {
    this.#view.animateLoadingStart()

    try {
      await LoadUtils.loadSpriteSheet({spriteSheetName: 'leaders'})
      return true
    } catch (error) {
      console.error('[Scoreboard]: failed to load leaderboard atlas', error)
      if (!this.#view.destroyed) this.#view.destroy()
      return false
    } finally {
      if (!this.#view.destroyed) this.#view.animateLoadingEnd()
    }
  }

  // Загружает игроков и создаёт строки списка.
  #loadPlayers = async () => {
    const players = await this.#getPlayers()
    if (this.#view.destroyed || !players || !players.length) return

    this.#createPlayersList(players)
    this.#setPositionGap(players)
    this.#markCurrentPlayer()
    this.#animateList()
  }

  // Очищает старые текстуры и показывает индикатор загрузки.
  #prepare = () => {
    avatarTextures.forEach((texture) => texture.destroy(true))
    avatarTextures.length = 0

    if (this.#view.loadingText) {
      this.#view.loadingText.visible = true
      this.#textLoading = this.#view.loadingText
    }
  }

  // Получает тестовый или платформенный список игроков.
  #getPlayers = async () => {
    const players =
      import.meta.env.VITE_PLATFORM_NAME === 'noAdapter'
        ? mockData.slice(0, this.#maxPlayers)
        : await SdkManager.leaderboard.getEntries(this.#maxPlayers, this.#maxNeighbors)

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

  // Создаёт строки всех полученных игроков.
  #createPlayersList = (players: SdkLeaderboardEntry[]) => {
    const startPositionY = this.#view.startPositionYFirstRow
    // Добавляет визуальный разрыв после пятой строки.
    const offsetAfterFifthRow = (i: number) => (i > 4 ? this.#view.header!.height / 2 : 0)

    Object.values(players).forEach((data, i) => {
      const {title, id, avatar, rank, score} = data

      const row = new ScoreRow({view: this.#view, id, rank, title, score, y: ROW_SIZE.rowHeight * i})
      row.y = i * (ROW_SIZE.rowHeight + ROW_SIZE.offsetBetweenRows) - startPositionY + offsetAfterFifthRow(i)
      this.#view.list.addChild(row)

      this.#loadAvatar(row, avatar)

      row.changeFontSizeAfterTop(row, i)
      this.#addTopRankMedal(row, i)

      row.trimUserNameByAvailableWidth(title)
    })
  }

  // Размещает разделитель между лидерами и соседями игрока.
  #setPositionGap = (players: SdkLeaderboardEntry[]) => {
    const gapLine = this.#view.gapLine
    if (players.length > this.#maxTopPlayers) gapLine.visible = true

    const fifthRow = this.#view.list.children.at(4)
    if (!fifthRow) return

    gapLine.y = fifthRow.y + fifthRow.height + (gapLine.height + 20)
  }

  // Выделяет строку текущего игрока.
  #markCurrentPlayer = () => {
    const currentPlayerID = SdkManager.player.getId()
    const row = this.#view.list.children.find((item) => (item as ScoreRow).id === currentPlayerID) as ScoreRow | undefined

    if (row) {
      const userNameText = row.textUserName
      userNameText.style.fill = this.#view.userPlayerTextFill
      userNameText.style.fontStyle = 'italic'
      userNameText.text += ' ' // фиксит баг с обрезанием последней буквы при italic
      row.fillRow(this.#view.userPlayerRowFill)
    }
  }

  // Анимирует появление готового списка.
  #animateList = () => {
    gsap
      .timeline()
      .fromTo([this.#view.list, this.#view.gapLine], {alpha: 0}, {alpha: 1, duration: 0.1, ease: 'none'})
      .set(this.#textLoading, {visible: false}, '<')
  }

  // Загружает аватар игрока или показывает резервную текстуру.
  #loadAvatar = async (row: ScoreRow, avatarUrl: string) => {
    const avatarContainer = row.avatarContainer

    try {
      const texture = await (Texture as TextureWithLegacyLoader).fromURL(avatarUrl)

      if (this.#view.destroyed || row.destroyed || avatarContainer.destroyed) {
        texture.destroy(true)
        return
      }

      avatarTextures.push(texture)

      const avatar = new Sprite({texture, label: 'scoreboard-avatar'})
      avatar.anchor.set(0.5)
      avatar.width = ROW_SIZE.avatarSize - 10
      avatar.height = ROW_SIZE.avatarSize - 10

      avatarContainer.addChild(avatar)
    } catch (error) {
      if (this.#view.destroyed || row.destroyed) return
      row.createFallBackTexture()
      console.error('[Scoreboard]: avatar loading failed', error)
    }
  }

  // Добавляет медаль строкам пяти лучших игроков.
  #addTopRankMedal = (row: ScoreRow, i: number) => {
    if (i === 0) row.createMedal(row, 'leader-medal1')
    if (i === 1) row.createMedal(row, 'leader-medal2')
    if (i === 2) row.createMedal(row, 'leader-medal3')
    if (i === 3) row.createMedal(row, 'leader-medal4')
    if (i === 4) row.createMedal(row, 'leader-medal5')
  }
}
