import {Container} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {FONT_COLORS, primaryFontStyle} from '@/game/styles.js'
import {applyInteractive} from '@/game/components/buttons/buttons.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import ButtonAnimator from '@/game/utils/animations/ButtonAnimator.js'
import i18next from 'i18next'
import {GAME_NAMES} from '@/game/gameConfig/constants.js'

export default class Credits extends Container {
  #game = Locator.game
  #optionsView
  #btnCredits
  #btnCreditsText
  #isVisible = false
  #style = {
    ...primaryFontStyle,
    fill: FONT_COLORS.secondFont
  }
  
  constructor(optionsView) {
    super()
    
    this.#optionsView = optionsView
    this.label = 'creditsContainer'
    this.eventMode = 'none'
    this.visible = false
    
    this.#init()
  }
  
  #init = () => {
    this.#createCreditsBtn()
    this.#createCreditsText()
    this.#setEvents()
  }
  
  #createCreditsBtn = () => {
    this.#btnCredits = new Container()
    this.#btnCredits.label = 'btnCredits'
    this.#btnCredits.scale.set(0.6)
    this.#btnCredits.y = 190

    const cover = GameUtils.createSprite('btn-tertiary')
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
  
  #createMusicRows = () => {
    const rowOffset = 30
    const musicContainer = new Container()
    const authors = this.#getMusicAuthors()
    
    authors.forEach((track, i) => {
      musicContainer.addChild(track)
      track.y = i * rowOffset
    })
    
    return musicContainer
  }
  
  #getMusicAuthors = () => {
    const trackStyle = {...this.#style, fontSize: 21, align: 'center'}
    
    const authors = []
    if (GAME_NAMES.currentName === GAME_NAMES.detective) {
      const track1 = GameUtils.createText(`\n"Late Night Romantic Jazz" \nSOULFULJAMTRACKS`, {style: {...trackStyle}})
      authors.push(track1)
    }
    if (GAME_NAMES.currentName === GAME_NAMES.detectiveGirl) {
      const track1 = GameUtils.createText(`"Detective" - The_Mountain`, {style: {...trackStyle}})
      const track2 = GameUtils.createText(`"Documentary_Tidal" - Coma-Media`, {style: {...trackStyle}})
      const track3 = GameUtils.createText(`"Quiet Documentary" - The_Mountain`, {style: {...trackStyle}})
      authors.push(track1, track2, track3)
    }
    
    return authors
  }
  
  #setEvents = () => {
    this.#game.on(GAME_EVENTS.Options.btnCredits, this.#checkoutVisible)
    this.#game.on(GAME_EVENTS.Options.hide, this.#hide)
  }
  
  #setVisible = (isVisible) => {
    this.#isVisible = isVisible
    
    const text = this.#isVisible ? 'back' : 'authors'
    this.#btnCreditsText.text = i18next.t(`credits.${text}`)
    
    this.#optionsView.buttons.forEach(button => button.visible = !this.#isVisible)
    this.#optionsView.checkboxZoom.visible = !this.#isVisible
    
    this.visible = this.#isVisible
  }
  
  #checkoutVisible = () => {
    this.#setVisible(!this.#isVisible)
  }
  
  #hide = () => {
    this.#setVisible(false)
  }
}
