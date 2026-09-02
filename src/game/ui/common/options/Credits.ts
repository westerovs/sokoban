import i18next from 'i18next'
import {Container, Text} from 'pixi.js'
import type {TextStyleOptions} from 'pixi.js'
import {applyInteractive} from '@/game/components/buttons/buttons.js'
import Locator from '@/game/engine/Locator.ts'
import {GAME_NAMES} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {FONT_COLORS, primaryFontStyle} from '@/game/styles.js'
import ButtonAnimator from '@/game/utils/animations/ButtonAnimator.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import type OptionsView from './OptionsView.js'

// Показывает авторов и музыкальные лицензии внутри окна настроек.

export default class Credits extends Container {
  #game = Locator.game
  #optionsView: OptionsView
  #btnCredits!: Container
  #btnCreditsText!: Text
  #isVisible = false // Текущее состояние экрана авторов
  #style: TextStyleOptions = {
    ...primaryFontStyle,
    fill: FONT_COLORS.secondFont,
  }

  // Сохраняет окно настроек и создаёт раздел авторов.
  constructor(optionsView: OptionsView) {
    super({label: 'creditsContainer'})

    this.#optionsView = optionsView
    this.eventMode = 'none'
    this.visible = false

    this.#init()
  }

  // Создаёт кнопку, содержимое и игровые события раздела.
  #init = () => {
    this.#createCreditsBtn()
    this.#createCreditsText()
    this.#setEvents()
  }

  // Создаёт кнопку перехода между настройками и авторами.
  #createCreditsBtn = () => {
    this.#btnCredits = new Container({label: 'btnCredits'})
    this.#btnCredits.scale.set(0.6)
    this.#btnCredits.y = 190

    const cover = GameUtils.createSprite('btn-tertiary', {label: 'btnCredits-cover'})
    cover.scale.set(0.9, 0.7)

    const text = `${i18next.t('credits.authors')}`
    this.#btnCreditsText = GameUtils.createText(text, {
      style: {...primaryFontStyle, fontSize: 40},
    })

    this.#btnCredits.addChild(cover, this.#btnCreditsText)
    applyInteractive(this.#btnCredits)

    ButtonAnimator.initOverHandler(this.#btnCredits)

    this.#optionsView.addChild(this.#btnCredits)
  }

  // Создаёт статические подписи раздела авторов.
  #createCreditsText = () => {
    const topHeader = GameUtils.createText(`${i18next.t('credits.authors')}`, {style: {...this.#style}})
    topHeader.y = -180

    const publisher = GameUtils.createText('© DRAGAMES, 2026', {style: {...this.#style}})
    publisher.y = -140

    const headerMusic = GameUtils.createText(`${i18next.t('credits.music')}`, {style: {...this.#style}})
    headerMusic.y = -65

    const musicContainer = this.#createMusicRows()
    musicContainer.y = -25

    const license = GameUtils.createText(`${i18next.t('credits.licensed')}`, {style: {...this.#style}})
    license.y = 108

    this.addChild(topHeader, publisher, headerMusic, musicContainer, license)

    this.#optionsView.addChild(this)
  }

  // Создаёт контейнер строк с авторами музыки.
  #createMusicRows = () => {
    const rowOffset = 30
    const musicContainer = new Container({label: 'credits-music'})
    const authors = this.#getMusicAuthors()

    authors.forEach((track, i) => {
      musicContainer.addChild(track)
      track.y = i * rowOffset
    })

    return musicContainer
  }

  // Возвращает строки музыкальных лицензий для текущей игры.
  #getMusicAuthors = () => {
    const trackStyle: TextStyleOptions = {...this.#style, fontSize: 21, align: 'center'}

    const authors: Text[] = []
    if (String(GAME_NAMES.currentName) === GAME_NAMES.detective) {
      const track1 = GameUtils.createText(`\n"Late Night Romantic Jazz" \nSOULFULJAMTRACKS`, {style: {...trackStyle}})
      authors.push(track1)
    }
    if (String(GAME_NAMES.currentName) === GAME_NAMES.detectiveGirl) {
      const track1 = GameUtils.createText(`"Detective" - The_Mountain`, {style: {...trackStyle}})
      const track2 = GameUtils.createText(`"Documentary_Tidal" - Coma-Media`, {style: {...trackStyle}})
      const track3 = GameUtils.createText(`"Quiet Documentary" - The_Mountain`, {style: {...trackStyle}})
      authors.push(track1, track2, track3)
    }

    return authors
  }

  // Подписывает раздел на команды показа и скрытия.
  #setEvents = () => {
    this.#game.on(GAME_EVENTS.Options.btnCredits, this.#checkoutVisible)
    this.#game.on(GAME_EVENTS.Options.hide, this.#hide)
  }

  // Переключает видимость раздела и основных кнопок настроек.
  #setVisible = (isVisible: boolean) => {
    this.#isVisible = isVisible

    const text = this.#isVisible ? 'back' : 'authors'
    this.#btnCreditsText.text = i18next.t(`credits.${text}`)

    this.#optionsView.buttons.forEach((button: Container) => (button.visible = !this.#isVisible))
    this.#optionsView.checkboxZoom.visible = !this.#isVisible

    this.visible = this.#isVisible
  }

  // Переключает текущую видимость раздела.
  #checkoutVisible = () => {
    this.#setVisible(!this.#isVisible)
  }

  // Скрывает раздел авторов.
  #hide = () => {
    this.#setVisible(false)
  }
}
