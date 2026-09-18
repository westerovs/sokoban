import {gsap} from 'gsap'
import i18next from 'i18next'
import type {DestroyOptions} from 'pixi.js'
import {Container, Graphics, Sprite, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import type {LocationSelectionState} from '../../menuTypes.ts'
import LocationCardProgress from './LocationCardProgress.ts'


const CARD_WIDTH = 250
const CARD_HEIGHT = 350
const CARD_ART_SIZE = 196
const CARD_ART_CORNER_RADIUS = 10
const CARD_ART_HOVER_SCALE = 1.25
const CARD_ART_ZOOM_DURATION = 0.25
const CARD_TITLE_WIDTH = 200
const CARD_TITLE_HEIGHT = 44
const CARD_TITLE_Y = -156
const CARD_PROGRESS_Y = 126
const CURRENT_PROGRESS_SCALE = 1.04
const CURRENT_PROGRESS_PULSE_DURATION = 1.1

export default class LocationCard extends Container {
  #levelPic!: Sprite
  #artScale!: number
  #background!: Sprite
  #location: LocationSelectionState
  #lockIcon!: Sprite
  #onSelect: (locationId: string) => void
  #progress!: LocationCardProgress
  #title!: Text

  constructor(location: LocationSelectionState, onSelect: (locationId: string) => void) {
    super({label: `location-card-${location.id}`})

    this.#location = location
    this.#onSelect = onSelect
    this.cursor = 'pointer'
    this.#init()
  }

  get locationId() {
    return this.#location.id
  }

  setState = (state: LocationSelectionState) => {
    this.#progress.setState(state)
    this.#setCurrentIndicator(state.isCurrent)
    this.#lockIcon.visible = !state.isUnlocked
    this.eventMode = state.isUnlocked ? 'static' : 'none'
    this.alpha = state.isUnlocked ? 1 : 0.78
    if (!state.isUnlocked) this.#resetArtScale()
  }

  override destroy(options?: DestroyOptions) {
    gsap.killTweensOf(this.#levelPic.scale)
    gsap.killTweensOf(this.#progress.scale)
    super.destroy(options)
  }

  #init = () => {
    this.#createCover()
    this.#createLevelPic()

    this.#createHeader()
    this.#createProgress()
    this.#createTablet()

    this.#lockIcon = GameUtils.createSprite('icon-lock', {
      label: `${this.label}-lock`,
      scale: 1.5,
    })
    this.addChild(this.#lockIcon)
    this.on('pointertap', this.#handleSelect)

    // this.on('pointerenter', this.#handlePointerEnter)
    // this.on('pointerleave', this.#handlePointerLeave)
  }

  #createCover = () => {
    this.#background = GameUtils.createSprite('main-pop-up', {
      label: `cover`
    })
    this.#background.setSize(CARD_WIDTH, CARD_HEIGHT)
    this.addChild(this.#background)
  }

  #createLevelPic = () => {
    this.#levelPic = GameUtils.createSprite(this.#location.cardTexture, {label: `${this.label}-art`})
    // this.#artScale = Math.max(CARD_ART_SIZE / this.#levelPic.texture.width, CARD_ART_SIZE / this.#levelPic.texture.height)
    // this.#levelPic.scale.set(this.#artScale)
    this.#levelPic.position.set(0, 0)

    this.addChild(this.#levelPic)
  }

  #createMask = () => {
    const mask = new Graphics({label: `${this.label}-art-mask`})
    mask
      .roundRect(
        -CARD_ART_SIZE / 2,
        CARD_ART_SIZE / 2,
        CARD_ART_SIZE,
        CARD_ART_SIZE,
        CARD_ART_CORNER_RADIUS,
      )
      .fill(0xffffff)
    this.#levelPic.mask = mask
    this.addChild(this.#levelPic, mask)
  }

  #createHeader = () => {
    const titleBackground = GameUtils.createSprite('select-board', {
      label: `${this.label}-title-background`
    })
    titleBackground.setSize(CARD_TITLE_WIDTH, CARD_TITLE_HEIGHT)
    titleBackground.position.set(0, CARD_TITLE_Y)

    this.#title = GameUtils.createText(i18next.t(this.#location.titleKey), {
      name: `${this.label}-title`,
      style: {
        ...primaryFontStyle,
        align: 'center',
        fill: 0xffefb0,
        fontSize: 28,
        stroke: {color: 0x102217, width: 5, join: 'round'},
      },
    })
    this.#title.position.set(0, CARD_TITLE_Y)
    this.addChild(titleBackground, this.#title)
  }

  #createTablet = () => {
    const tablet = GameUtils.createSprite('small-tablet')
    tablet.y = 80
    this.addChild(tablet)
  }

  #createProgress = () => {
    this.#progress = new LocationCardProgress(`${this.label}-progress`)
    this.#progress.position.set(0, CARD_PROGRESS_Y)
    this.addChild(this.#progress)
  }

  #setCurrentIndicator = (isCurrent: boolean) => {
    gsap.killTweensOf(this.#progress.scale)
    this.#progress.scale.set(1)
    if (!isCurrent) return

    gsap.to(this.#progress.scale, {
      x: CURRENT_PROGRESS_SCALE,
      y: CURRENT_PROGRESS_SCALE,
      duration: CURRENT_PROGRESS_PULSE_DURATION,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    })
  }


  #animateArtScale = (multiplier: number) => {
    gsap.to(this.#levelPic.scale, {
      x: this.#artScale * multiplier,
      y: this.#artScale * multiplier,
      duration: CARD_ART_ZOOM_DURATION,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  #resetArtScale = () => {
    gsap.killTweensOf(this.#levelPic.scale)
    this.#levelPic.scale.set(this.#artScale)
  }

  // --------- events

  #handleSelect = () => {
    this.#onSelect(this.#location.id)
  }

  #handlePointerEnter = () => {
    this.#animateArtScale(CARD_ART_HOVER_SCALE)
  }

  #handlePointerLeave = () => {
    this.#animateArtScale(1)
  }
}

export {CARD_HEIGHT, CARD_WIDTH}
