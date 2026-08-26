import i18next from 'i18next'
import {Container, Graphics, Text} from 'pixi.js'
import {primaryFontStyle} from '../../../../styles.js'
import GameUtils from '../../../../utils/gameUtils/GameUtils.js'

const CARD_WIDTH = 250
const CARD_HEIGHT = 350

export default class LocationCard extends Container {
  #background
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
    this.eventMode = state.isUnlocked ? 'static' : 'none'
    this.alpha = state.isUnlocked ? 1 : 0.78
  }

  #init = () => {
    this.#createBackground()
    this.#createTexts()
    this.#frame = new Graphics({label: `${this.label}-frame`})
    this.#status = new Graphics({label: `${this.label}-status`})
    this.#lockIcon = GameUtils.createSprite('icon-lock', {label: `${this.label}-lock`, scale: 1.5})
    this.addChild(this.#frame, this.#status, this.#lockIcon)
    this.on('pointertap', this.#handleSelect)
  }

  #createBackground = () => {
    this.#background = GameUtils.createSprite(this.#location.cardTexture, {label: `${this.label}-art`})
    this.#background.width = CARD_WIDTH - 18
    this.#background.height = CARD_HEIGHT - 18
    this.addChild(this.#background)
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
    this.#frame.clear().roundRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 22)
    this.#frame.stroke({color, width, alpha: 0.95})
  }

  #drawStatus = ({isCompleted, isUnlocked}) => {
    this.#status.clear()
    if (!isUnlocked) return this.#drawLockedOverlay()
    if (isCompleted) this.#drawCheck()
  }

  #drawLockedOverlay = () => {
    this.#status.roundRect(-CARD_WIDTH / 2 + 5, -CARD_HEIGHT / 2 + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10, 18)
    this.#status.fill({color: 0x07110c, alpha: 0.62})
  }

  #drawCheck = () => {
    this.#status.circle(101, 151, 24).fill({color: 0x71972c}).stroke({color: 0xe9d084, width: 4})
    this.#status.moveTo(90, 151).lineTo(99, 160).lineTo(114, 141).stroke({color: 0xffffff, width: 6})
  }

  #handleSelect = () => {
    this.#onSelect(this.#location.id)
  }
}
