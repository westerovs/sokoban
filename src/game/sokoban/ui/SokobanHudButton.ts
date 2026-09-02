import {gsap} from 'gsap'
import type {DestroyOptions, Sprite} from 'pixi.js'
import {Container, Graphics, Rectangle} from 'pixi.js'
import ButtonAnimator from '@/game/utils/animations/ButtonAnimator.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {SOKOBAN_HUD_SETTINGS} from '../config/settings.js'

/**
 * Отображает интерактивную кнопку панели управления Sokoban.
 */

export default class SokobanHudButton extends Container {
  #iconName: string
  #onPress: () => void
  #background!: Graphics
  #icon!: Sprite
  #size = 0
  #isEnabled: boolean | null = null
  #pulseTimeline: gsap.core.Timeline | null = null

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor({iconName, label, onPress}: {iconName: string; label: string; onPress: () => void}) {
    super({label})

    this.#iconName = iconName
    this.#onPress = onPress
    this.#init()
  }

  // Включает или отключает взаимодействие с элементом.
  setEnabled(isEnabled: boolean) {
    if (this.#isEnabled === isEnabled) return

    this.#isEnabled = isEnabled
    this.eventMode = isEnabled ? 'static' : 'none'
    this.cursor = isEnabled ? 'pointer' : 'default'
    this.alpha = isEnabled ? 1 : SOKOBAN_HUD_SETTINGS.disabledAlpha
    this.#drawBackground()
  }

  // Применяет размер кнопки и её иконки.
  setLayoutSize(size: number, iconSize: number) {
    this.#size = size
    this.#setHitArea()
    this.#setIconSize(iconSize)
    this.#drawBackground()
  }

  // Запускает привлекающую внимание пульсацию кнопки.
  pulse() {
    this.stopPulse()
    this.#pulseTimeline = gsap
      .timeline({
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

  // Останавливает пульсацию и восстанавливает масштаб кнопки.
  stopPulse() {
    this.#pulseTimeline?.kill()
    this.#pulseTimeline = null
    this.scale.set(1)
  }

  // Освобождает обработчики, анимации и ресурсы экземпляра.
  destroy(options?: DestroyOptions) {
    this.stopPulse()
    super.destroy(options)
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init() {
    this.#background = new Graphics({label: this.label + '-background'})
    this.#icon = GameUtils.createSprite(this.#iconName, {label: this.label + '-icon'})

    this.addChild(this.#background, this.#icon)
    this.on('pointertap', this.#handlePress)
    ButtonAnimator.initOverHandler(this)
    this.setEnabled(true)
  }

  // Обновляет интерактивную область кнопки.
  #setHitArea() {
    this.hitArea = new Rectangle(-this.#size / 2, -this.#size / 2, this.#size, this.#size)
  }

  // Масштабирует иконку до заданного размера.
  #setIconSize(iconSize: number) {
    this.#icon.scale.set(1)
    const iconScale = iconSize / Math.max(this.#icon.width, this.#icon.height)

    this.#icon.scale.set(iconScale)
  }

  // Перерисовывает подложку кнопки для текущего состояния.
  #drawBackground() {
    if (!this.#size) return

    const settings = SOKOBAN_HUD_SETTINGS
    const color = this.#isEnabled ? settings.buttonColor : settings.buttonDisabledColor
    const cornerRadius = this.#size * settings.buttonCornerRadiusRatio
    const borderWidth = this.#size * settings.buttonBorderWidthRatio

    this.#background
      .clear()
      .roundRect(-this.#size / 2, -this.#size / 2, this.#size, this.#size, cornerRadius)
      .fill(color)
      .stroke({color: settings.buttonBorderColor, width: borderWidth})
  }

  // Активирует направление выбранной кнопки крестовины.
  #handlePress = () => {
    if (!this.#isEnabled) return
    this.#onPress()
  }
}
