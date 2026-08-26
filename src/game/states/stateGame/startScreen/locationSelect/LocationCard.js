import i18next from 'i18next'
import {gsap} from 'gsap'
import {Container, Graphics, Text} from 'pixi.js'
import {primaryFontStyle} from '../../../../styles.js'
import GameUtils from '../../../../utils/gameUtils/GameUtils.js'

const CARD_WIDTH = 250
const CARD_HEIGHT = 350
const CARD_BACKGROUND_ALPHA = 0.7 // Прозрачность чёрной подложки карточки
const CARD_ART_HOVER_SCALE = 1.25 // Увеличение изображения карточки при наведении на 25%
const CARD_ART_ZOOM_DURATION = 0.25 // Длительность плавного зума изображения в секундах
const LOCKED_ART_TINT = 0x616161 // Затемнение изображения заблокированной карточки

export default class LocationCard extends Container {
  #background
  #backgroundMask
  #backgroundScale
  #frame
  #location
  #lockIcon
  #onSelect
  #progressText
  #status
  #title

  constructor(location, onSelect) {
    super({label: `location-card-${location.id}`})

    this.#location = location
    this.#onSelect = onSelect
    this.cursor = 'pointer'
    this.#init()
  }

  get locationId() {
    return this.#location.id
  }

  setState = (state) => {
    this.#drawFrame(state)
    this.#drawStatus(state)
    this.#lockIcon.visible = !state.isUnlocked
    this.#progressText.visible = state.isUnlocked
    this.#progressText.text = state.isCompleted ? i18next.t('locationSelect.completed') : `${state.completedCount} / ${state.totalCount}`
    this.#background.tint = state.isUnlocked ? 0xffffff : LOCKED_ART_TINT
    this.eventMode = state.isUnlocked ? 'static' : 'none'
    this.alpha = state.isUnlocked ? 1 : 0.78
    if (!state.isUnlocked) this.#resetBackgroundScale()
  }

  #init = () => {
    this.#frame = new Graphics({label: `${this.label}-frame`})
    this.addChild(this.#frame)
    this.#createBackground()
    this.#createTexts()
    this.#status = new Graphics({label: `${this.label}-status`})
    this.#lockIcon = GameUtils.createSprite('icon-lock', {label: `${this.label}-lock`, scale: 1.5})
    this.addChild(this.#status, this.#lockIcon)
    this.on('pointertap', this.#handleSelect)
    this.on('pointerenter', this.#handlePointerEnter)
    this.on('pointerleave', this.#handlePointerLeave)
  }

  #createBackground = () => {
    this.#background = GameUtils.createSprite(this.#location.cardTexture, {label: `${this.label}-art`})
    this.#background.width = CARD_WIDTH
    this.#background.height = CARD_HEIGHT
    this.#backgroundScale = {x: this.#background.scale.x, y: this.#background.scale.y}
    this.#backgroundMask = new Graphics({label: `${this.label}-art-mask`})
    this.#background.mask = this.#backgroundMask
    this.addChild(this.#background, this.#backgroundMask)
  }

  #createTexts = () => {
    this.#title = this.#createText(i18next.t(this.#location.titleKey), -142, 29)
    this.#progressText = this.#createText('', 143, 24)
    this.addChild(this.#title, this.#progressText)
  }

  #createText = (text, y, fontSize) => {
    const label = y < 0 ? 'title' : 'progress'
    const view = new Text({
      label: `${this.label}-${label}`,
      text,
      style: {...primaryFontStyle, align: 'center', fill: 0xffefb0, fontSize, stroke: {color: 0x102217, width: 5}},
    })
    view.anchor.set(0.5)
    view.position.set(0, y)
    return view
  }

  #drawFrame = ({isCurrent, isUnlocked}) => {
    const color = isCurrent ? 0xd9ff5d : isUnlocked ? 0xb99951 : 0x655f4b
    const width = isCurrent ? 6 : 4
    this.#frame
      .clear()
      .roundRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 22)
      .fill({color: 0x000000, alpha: CARD_BACKGROUND_ALPHA})
      .stroke({color, width, alpha: 0.95})
    this.#drawBackgroundMask(width)
  }

  #drawBackgroundMask = (frameWidth) => {
    const inset = frameWidth / 2

    this.#backgroundMask
      .clear()
      .roundRect(-CARD_WIDTH / 2 + inset, -CARD_HEIGHT / 2 + inset, CARD_WIDTH - frameWidth, CARD_HEIGHT - frameWidth, 22 - inset)
      .fill(0xffffff)
  }

  #drawStatus = ({isCompleted, isUnlocked}) => {
    this.#status.clear()
    if (isUnlocked && isCompleted) this.#drawCheck()
  }

  #drawCheck = () => {
    this.#status.circle(101, 151, 24).fill({color: 0x71972c}).stroke({color: 0xe9d084, width: 4})
    this.#status.moveTo(90, 151).lineTo(99, 160).lineTo(114, 141).stroke({color: 0xffffff, width: 6})
  }

  #handleSelect = () => {
    this.#onSelect(this.#location.id)
  }

  #handlePointerEnter = () => {
    this.#animateBackgroundScale(CARD_ART_HOVER_SCALE)
  }

  #handlePointerLeave = () => {
    this.#animateBackgroundScale(1)
  }

  #animateBackgroundScale = (multiplier) => {
    gsap.to(this.#background.scale, {
      x: this.#backgroundScale.x * multiplier,
      y: this.#backgroundScale.y * multiplier,
      duration: CARD_ART_ZOOM_DURATION,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  #resetBackgroundScale = () => {
    gsap.killTweensOf(this.#background.scale)
    this.#background.scale.set(this.#backgroundScale.x, this.#backgroundScale.y)
  }
}
