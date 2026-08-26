import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container, Graphics, Text} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {SOKOBAN_HUD_SETTINGS} from './settings.js'
import SokobanHudButton from './SokobanHudButton.js'

export default class SokobanHud extends Container {
  #levelNumber
  #onUndo
  #onRestart
  #stepsText
  #stepsIcon
  #stepsView
  #levelText
  #panel
  #backButton
  #restartButton
  #deadlockWarning
  #deadlockWarningBackground
  #deadlockWarningY = 0
  #deadlockTimeline = null
  #isEnabled = false
  #steps = 0

  constructor({levelNumber, onUndo, onRestart}) {
    super({label: 'sokoban-hud'})

    this.#levelNumber = levelNumber
    this.#onUndo = onUndo
    this.#onRestart = onRestart
    this.updateAdaptive = true
    this._customPosition = {}
    this.#init()
  }

  setSteps(steps) {
    this.#steps = steps
    this.#stepsText.text = String(steps)
    this.#updateButtons()
  }

  setEnabled(isEnabled) {
    this.#isEnabled = isEnabled
    this.#updateButtons()
  }

  showDeadlockFeedback() {
    this.clearDeadlockFeedback()
    this.#deadlockWarning.visible = true
    this.#backButton.pulse()
    this.#deadlockTimeline = this.#createDeadlockTimeline()
  }

  clearDeadlockFeedback() {
    this.#deadlockTimeline?.kill()
    this.#deadlockTimeline = null
    this.#backButton?.stopPulse()
    if (!this.#deadlockWarning) return

    this.#deadlockWarning.alpha = 0
    this.#deadlockWarning.visible = false
    this.#deadlockWarning.y = this.#deadlockWarningY
  }

  layout({boardWidth, tileSize, availableWidth, centerX, availableHeight}) {
    const settings = SOKOBAN_HUD_SETTINGS
    const height = tileSize * settings.heightInTiles
    const borderWidth = height * settings.borderWidthRatio
    const maxAvailableWidth = Math.max(availableWidth - settings.sidePadding * 2 - borderWidth, 1)
    const width = Math.min(boardWidth, maxAvailableWidth)

    this.#drawPanel(width, height)
    this.#layoutContent(width, height)
    this.#layoutDeadlockWarning(width, height)
    this.#positionHud(centerX, availableHeight, height)
  }

  destroy(options) {
    this.clearDeadlockFeedback()
    super.destroy(options)
  }

  #init() {
    this.#panel = new Graphics({label: 'sokoban-hud-panel'})
    this.#stepsView = this.#createStepsView()
    this.#levelText = this.#createLevelText()
    this.#deadlockWarning = this.#createDeadlockWarning()

    this.#backButton = this.#createButton('icon-back', 'sokoban-undo-button', this.#onUndo)
    this.#restartButton = this.#createButton('icon-restart', 'sokoban-restart-button', this.#onRestart)

    this.addChild(this.#panel, this.#stepsView, this.#backButton, this.#levelText, this.#restartButton, this.#deadlockWarning)
    this.setSteps(0)
  }

  #createDeadlockWarning() {
    const warning = new Container({
      label: 'sokoban-deadlock-warning',
      alpha: 0,
      visible: false,
    })
    this.#deadlockWarningBackground = new Graphics({label: 'sokoban-deadlock-warning-background'})
    const text = this.#createDeadlockWarningText()

    warning.addChild(this.#deadlockWarningBackground, text)
    return warning
  }

  #createDeadlockWarningText() {
    const text = new Text({
      label: 'sokoban-deadlock-warning-text',
      text: i18next.t('sokoban.deadlock'),
      style: {
        ...this.#createTextStyle(22),
        fill: 0xffffff,
      },
    })

    text.anchor.set(0.5)
    return text
  }

  #createStepsView() {
    const stepsView = new Container({label: 'sokoban-steps-view'})
    this.#stepsIcon = GameUtils.createSprite('icon-steps', {label: 'sokoban-steps-icon'})

    this.#stepsText = new Text({
      label: 'sokoban-steps-text',
      text: '0',
      style: this.#createTextStyle(1),
    })
    this.#stepsText.anchor.set(0.5)
    stepsView.addChild(this.#stepsIcon, this.#stepsText)

    return stepsView
  }

  #createLevelText() {
    const levelText = new Text({
      label: 'sokoban-level-text',
      text: `${i18next.t('level')} ${this.#levelNumber}`,
      style: this.#createTextStyle(1),
    })

    levelText.anchor.set(0.5)
    return levelText
  }

  #drawPanel(width, height) {
    const settings = SOKOBAN_HUD_SETTINGS

    this.#panel
      .clear()
      .roundRect(-width / 2, -height / 2, width, height, height * settings.cornerRadiusRatio)
      .fill({color: settings.panelColor, alpha: settings.panelAlpha})
      .stroke({color: settings.borderColor, width: height * settings.borderWidthRatio})
  }

  #layoutContent(width, height) {
    const settings = SOKOBAN_HUD_SETTINGS
    const buttonSize = height * settings.buttonSizeRatio

    this.#stepsText.x = height * settings.stepsGapRatio
    this.#stepsText.style.fontSize = height * settings.stepsFontSizeRatio
    this.#levelText.style.fontSize = height * settings.levelFontSizeRatio
    this.#setStepsIconSize(height * settings.stepsIconSizeRatio)
    this.#backButton.setLayoutSize(buttonSize, height * settings.buttonIconSizeRatio)
    this.#restartButton.setLayoutSize(buttonSize, height * settings.buttonIconSizeRatio)
    this.#positionContent(width)
  }

  #layoutDeadlockWarning(width, hudHeight) {
    const warningHeight = Math.max(hudHeight, 44)
    const warningWidth = Math.min(width, 520)
    const cornerRadius = warningHeight * 0.28

    this.#deadlockWarningBackground
      .clear()
      .roundRect(-warningWidth / 2, -warningHeight / 2, warningWidth, warningHeight, cornerRadius)
      .fill({color: 0x8f2634, alpha: 0.94})
      .stroke({color: 0xff8c96, width: 2})
    this.#deadlockWarningY = -hudHeight / 2 - warningHeight / 2 - 12
    this.#deadlockWarning.y = this.#deadlockWarningY
  }

  #positionContent(width) {
    this.#alignLeft(this.#backButton, width)
    this.#alignRight(this.#restartButton, width)
    this.#positionStepsAfterBack()
    this.#levelText.x = 0
  }

  #alignLeft(view, width) {
    const bounds = view.getLocalBounds()

    view.x = -width / 2 + SOKOBAN_HUD_SETTINGS.horizontalPadding - bounds.x
  }

  #alignRight(view, width) {
    const bounds = view.getLocalBounds()

    view.x = width / 2 - SOKOBAN_HUD_SETTINGS.horizontalPadding - bounds.x - bounds.width
  }

  #positionStepsAfterBack() {
    const backBounds = this.#backButton.getLocalBounds()
    const stepsBounds = this.#stepsView.getLocalBounds()
    const backRight = this.#backButton.x + backBounds.x + backBounds.width

    this.#stepsView.x = backRight + SOKOBAN_HUD_SETTINGS.controlsGap - stepsBounds.x
  }

  #setStepsIconSize(iconSize) {
    this.#stepsIcon.scale.set(1)
    const iconScale = iconSize / Math.max(this.#stepsIcon.width, this.#stepsIcon.height)

    this.#stepsIcon.scale.set(iconScale)
  }

  #positionHud(centerX, availableHeight, height) {
    const y = availableHeight - SOKOBAN_HUD_SETTINGS.bottomPadding - height / 2

    this._customPosition.x = centerX
    this._customPosition.y = y
    this.position.set(centerX, y)
    this.scale.set(1)
  }

  #createTextStyle(fontSize) {
    return {
      fill: SOKOBAN_HUD_SETTINGS.textColor,
      fontFamily: 'primaryFont',
      fontSize,
      fontWeight: '800',
    }
  }

  #createButton(iconName, label, onPress) {
    return new SokobanHudButton({iconName, label, onPress})
  }

  #createDeadlockTimeline() {
    return gsap
      .timeline({onComplete: () => this.#finishDeadlockFeedback()})
      .fromTo(this.#deadlockWarning, {alpha: 0, y: this.#deadlockWarningY + 10}, {alpha: 1, y: this.#deadlockWarningY, duration: 0.2})
      .to(this.#deadlockWarning, {
        alpha: 0,
        y: this.#deadlockWarningY - 6,
        duration: 0.3,
        delay: 1.7,
      })
  }

  #finishDeadlockFeedback() {
    this.#deadlockTimeline = null
    this.#backButton.stopPulse()
    this.#deadlockWarning.visible = false
  }

  #updateButtons() {
    this.#backButton?.setEnabled(this.#isEnabled && this.#steps > 0)
    this.#restartButton?.setEnabled(this.#isEnabled)
  }
}
