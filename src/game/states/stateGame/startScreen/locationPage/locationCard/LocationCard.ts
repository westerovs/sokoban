import {gsap} from 'gsap'
import i18next from 'i18next'
import type {DestroyOptions} from 'pixi.js'
import {Container, Sprite} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import ActiveCardGlowEmitter from '@/game/ui/common/emitters/activeCardGlow/ActiveCardGlowEmitter.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import type {LocationSelectionState} from '../../menuTypes.ts'
import LocationCardProgress from './LocationCardProgress.ts'

const CARD_WIDTH = 250
const CARD_HEIGHT = 350
const LOCKED_ART_TINT = 0x5a5a5a

export default class LocationCard extends Container {
  #activeGlow!: ActiveCardGlowEmitter
  #levelPic!: Sprite
  #background!: Sprite
  #location: LocationSelectionState
  #lockIcon!: Sprite
  #onSelect: (locationId: string) => void
  #progress!: LocationCardProgress

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
    this.#activeGlow.setActive(state.isCurrent && state.isUnlocked)
    this.#lockIcon.visible = !state.isUnlocked
    this.#levelPic.tint = state.isUnlocked ? 0xffffff : LOCKED_ART_TINT
    this.eventMode = state.isUnlocked ? 'static' : 'none'
  }

  override destroy(options?: DestroyOptions) {
    gsap.killTweensOf(this.#levelPic.scale)
    gsap.killTweensOf(this.#progress.scale)
    this.#activeGlow.destroy({children: true})
    super.destroy(options)
  }

  #init = () => {
    this.#createCover()
    this.#createLevelPic()

    this.#createHeader()
    this.#createProgress()
    this.#createTablet()
    this.#createLock()
    this.#createActiveGlow()
    this.on('pointertap', this.#handleSelect)

    // this.on('pointerenter', this.#handlePointerEnter)
    // this.on('pointerleave', this.#handlePointerLeave)
  }

  #createCover = () => {
    this.#background = GameUtils.createSprite('main-pop-up', {
      label: `cover`,
    })
    this.#background.setSize(CARD_WIDTH, CARD_HEIGHT)
    this.addChild(this.#background)
  }

  #createLevelPic = () => {
    this.#levelPic = GameUtils.createSprite(this.#location.cardTexture, {label: `${this.label}-art`})
    this.#levelPic.position.set(0, -32)
    this.#levelPic.setSize(190, 200)

    this.addChild(this.#levelPic)
  }

  #createHeader = () => {
    const header = new Container({label: `${this.label}-header`})
    header.position.set(0, -145)

    const background = GameUtils.createSprite('select-board', {
      label: `${this.label}-title-background`,
      scale: 0.9,
    })

    const title = GameUtils.createText(i18next.t(this.#location.titleKey), {
      name: `${this.label}-title`,
      style: {
        ...primaryFontStyle,
        align: 'center',
        fill: 0xffefb0,
        fontSize: 26,
        stroke: {color: 0x102217, width: 5, join: 'round'},
      },
    })
    title.y = -2

    header.addChild(background, title)
    this.addChild(header)
  }

  #createTablet = () => {
    const tablet = GameUtils.createSprite('small-tablet', {label: `${this.label}-tablet`})
    tablet.y = 80
    this.addChild(tablet)
  }

  #createProgress = () => {
    this.#progress = new LocationCardProgress(`${this.label}-progress`)
    this.#progress.position.set(0, 118)
    this.addChild(this.#progress)
  }

  #createLock = () => {
    this.#lockIcon = GameUtils.createSprite('icon-lock', {
      label: `${this.label}-lock`,
      scale: 1.5,
    })
    this.addChild(this.#lockIcon)
  }

  #createActiveGlow = () => {
    this.#activeGlow = new ActiveCardGlowEmitter(`${this.label}-active-glow`, CARD_WIDTH, CARD_HEIGHT)
    this.addChild(this.#activeGlow)
  }

  #handleSelect = () => {
    this.#onSelect(this.#location.id)
  }
}

export {CARD_HEIGHT, CARD_WIDTH}
