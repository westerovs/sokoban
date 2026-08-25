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

  layout({boardWidth, tileSize, availableWidth, centerX, availableHeight}) {
    const settings = SOKOBAN_HUD_SETTINGS
    const height = tileSize * settings.heightInTiles
    const borderWidth = height * settings.borderWidthRatio
    const maxAvailableWidth = Math.max(availableWidth - settings.sidePadding * 2 - borderWidth, 1)
    const width = Math.min(boardWidth, maxAvailableWidth)

    this.#drawPanel(width, height)
    this.#layoutContent(width, height)
    this.#positionHud(centerX, availableHeight, height)
  }

  #init() {
    this.#panel = new Graphics({label: 'sokoban-hud-panel'})
    this.#stepsView = this.#createStepsView()
    this.#levelText = this.#createLevelText()

    this.#backButton = this.#createButton('icon-back', 'sokoban-undo-button', this.#onUndo)
    this.#restartButton = this.#createButton('icon-restart', 'sokoban-restart-button', this.#onRestart)

    this.addChild(this.#panel, this.#stepsView, this.#backButton, this.#levelText, this.#restartButton)
    this.setSteps(0)
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

    view.x = width / 2
      - SOKOBAN_HUD_SETTINGS.horizontalPadding
      - bounds.x
      - bounds.width
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

  #updateButtons() {
    this.#backButton?.setEnabled(this.#isEnabled && this.#steps > 0)
    this.#restartButton?.setEnabled(this.#isEnabled)
  }
}
