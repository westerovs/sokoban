import {gsap} from 'gsap'
import {Container, Graphics, Rectangle} from 'pixi.js'
import ButtonAnimator from '@/game/utils/animations/ButtonAnimator.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {SOKOBAN_HUD_SETTINGS} from './settings.js'

export default class SokobanHudButton extends Container {
  #iconName
  #onPress
  #background
  #icon
  #size = 0
  #isEnabled = null
  #pulseTimeline = null

  constructor({iconName, label, onPress}) {
    super({label})

    this.#iconName = iconName
    this.#onPress = onPress
    this.#init()
  }

  setEnabled(isEnabled) {
    if (this.#isEnabled === isEnabled) return

    this.#isEnabled = isEnabled
    this.eventMode = isEnabled ? 'static' : 'none'
    this.cursor = isEnabled ? 'pointer' : 'default'
    this.alpha = isEnabled ? 1 : SOKOBAN_HUD_SETTINGS.disabledAlpha
    this.#drawBackground()
  }

  setLayoutSize(size, iconSize) {
    this.#size = size
    this.#setHitArea()
    this.#setIconSize(iconSize)
    this.#drawBackground()
  }

  pulse() {
    this.stopPulse()
    this.#pulseTimeline = gsap.timeline({
      onComplete: () => this.stopPulse(),
    })
      .to(this.scale, {
        x: 1.14,
        y: 1.14,
        duration: 0.18,
        ease: 'sine.inOut',
        repeat: 5,
        yoyo: true,
      })
  }

  stopPulse() {
    this.#pulseTimeline?.kill()
    this.#pulseTimeline = null
    this.scale.set(1)
  }

  destroy(options) {
    this.stopPulse()
    super.destroy(options)
  }

  #init() {
    this.#background = new Graphics({label: this.label + '-background'})
    this.#icon = GameUtils.createSprite(this.#iconName, {label: this.label + '-icon'})

    this.addChild(this.#background, this.#icon)
    this.on('pointertap', this.#handlePress)
    ButtonAnimator.initOverHandler(this)
    this.setEnabled(true)
  }

  #setHitArea() {
    this.hitArea = new Rectangle(
      -this.#size / 2,
      -this.#size / 2,
      this.#size,
      this.#size,
    )
  }

  #setIconSize(iconSize) {
    this.#icon.scale.set(1)
    const iconScale = iconSize / Math.max(this.#icon.width, this.#icon.height)

    this.#icon.scale.set(iconScale)
  }

  #drawBackground() {
    if (!this.#size) return

    const settings = SOKOBAN_HUD_SETTINGS
    const color = this.#isEnabled ? settings.buttonColor : settings.buttonDisabledColor
    const cornerRadius = this.#size * settings.buttonCornerRadiusRatio
    const borderWidth = this.#size * settings.buttonBorderWidthRatio

    this.#background
      .clear()
      .roundRect(
        -this.#size / 2,
        -this.#size / 2,
        this.#size,
        this.#size,
        cornerRadius,
      )
      .fill(color)
      .stroke({color: settings.buttonBorderColor, width: borderWidth})
  }

  #handlePress = () => {
    if (!this.#isEnabled) return
    this.#onPress()
  }
}
