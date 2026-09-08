import i18next from 'i18next'
import type {DestroyOptions, Sprite, TextStyleOptions} from 'pixi.js'
import {Container, Graphics, Text} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {SOKOBAN_HUD_SETTINGS} from '../config/settings.js'
import SokobanHudButton from './SokobanHudButton.js'

/**
 * Отображает панель шагов, рекорда и действий уровня Sokoban.
 */

export default class SokobanHud extends Container {
  updateAdaptive = true
  _customPosition = {x: 0, y: 0}
  #levelNumber: number
  #pushRecord?: number
  #onUndo: () => void
  #onRestart: () => void
  #stepsText!: Text
  #stepsIcon!: Sprite
  #stepsView!: Container
  #levelText!: Text
  #recordText!: Text
  #panel!: Graphics
  #backButton!: SokobanHudButton
  #restartButton!: SokobanHudButton
  #isEnabled = false
  #steps = 0

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor({
    levelNumber,
    pushRecord,
    onUndo,
    onRestart,
  }: {
    levelNumber: number
    pushRecord?: number
    onUndo: () => void
    onRestart: () => void
  }) {
    super({label: 'sokoban-hud'})

    this.#levelNumber = levelNumber
    this.#pushRecord = pushRecord
    this.#onUndo = onUndo
    this.#onRestart = onRestart
    this.#init()
  }

  // Обновляет отображаемое количество шагов.
  setSteps(steps: number) {
    this.#steps = steps
    this.#stepsText.text = String(steps)
    this.#updateButtons()
  }

  // Включает или отключает взаимодействие с элементом.
  setEnabled(isEnabled: boolean) {
    this.#isEnabled = isEnabled
    this.#updateButtons()
  }

  // Привлекает внимание к кнопке отмены хода.
  pulseUndoButton() {
    this.#backButton.pulse()
  }

  // Останавливает пульсацию кнопки отмены хода.
  stopUndoButtonPulse() {
    this.#backButton?.stopPulse()
  }

  // Рассчитывает и применяет расположение представления.
  layout({
    boardWidth,
    tileSize,
    availableWidth,
    centerX,
    availableHeight,
  }: {
    boardWidth: number
    tileSize: number
    availableWidth: number
    centerX: number
    availableHeight: number
  }) {
    const settings = SOKOBAN_HUD_SETTINGS
    const height = tileSize * settings.heightInTiles
    const borderWidth = height * settings.borderWidthRatio
    const maxAvailableWidth = Math.max(availableWidth - settings.sidePadding * 2 - borderWidth, 1)
    const width = Math.min(boardWidth, maxAvailableWidth)

    this.#drawPanel(width, height)
    this.#layoutContent(width, height)
    this.#positionHud(centerX, availableHeight, height)
  }

  // Освобождает обработчики, анимации и ресурсы экземпляра.
  destroy(options?: DestroyOptions) {
    this.stopUndoButtonPulse()
    super.destroy(options)
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init() {
    this.#panel = new Graphics({label: 'sokoban-hud-panel'})
    this.#stepsView = this.#createStepsView()
    this.#levelText = this.#createLevelText()
    this.#recordText = this.#createRecordText()
    this.#backButton = this.#createButton('icon-back', 'sokoban-undo-button', this.#onUndo)
    this.#restartButton = this.#createButton('icon-restart', 'sokoban-restart-button', this.#onRestart)

    this.addChild(this.#panel, this.#stepsView, this.#backButton, this.#levelText, this.#recordText, this.#restartButton)
    this.setSteps(0)
  }

  // Создаёт блок иконки и счётчика шагов.
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

  // Создаёт подпись номера уровня.
  #createLevelText() {
    const levelText = new Text({
      label: 'sokoban-level-text',
      text: `${i18next.t('level')} ${this.#levelNumber}`,
      style: this.#createTextStyle(1),
    })

    levelText.anchor.set(0.5)
    return levelText
  }

  // Создаёт подпись рекорда по толчкам.
  #createRecordText() {
    const recordText = new Text({
      label: 'sokoban-record-text',
      text: this.#pushRecord ? i18next.t('sokoban.record', {record: this.#pushRecord}) : '',
      style: this.#createTextStyle(1),
      visible: Number.isInteger(this.#pushRecord),
    })

    recordText.anchor.set(0.5)
    return recordText
  }

  // Перерисовывает фон и рамку панели HUD.
  #drawPanel(width: number, height: number) {
    const settings = SOKOBAN_HUD_SETTINGS

    this.#panel
      .clear()
      .roundRect(-width / 2, -height / 2, width, height, height * settings.cornerRadiusRatio)
      .fill({color: settings.panelColor, alpha: settings.panelAlpha})
      .stroke({color: settings.borderColor, width: height * settings.borderWidthRatio})
  }

  // Рассчитывает размеры и положение всего содержимого HUD.
  #layoutContent(width: number, height: number) {
    const settings = SOKOBAN_HUD_SETTINGS
    const buttonSize = height * settings.buttonSizeRatio

    this.#stepsText.x = height * settings.stepsGapRatio
    this.#stepsText.style.fontSize = height * settings.stepsFontSizeRatio
    this.#layoutCenterTexts(height)
    this.#setStepsIconSize(height * settings.stepsIconSizeRatio)
    this.#backButton.setLayoutSize(buttonSize, height * settings.buttonIconSizeRatio)
    this.#restartButton.setLayoutSize(buttonSize, height * settings.buttonIconSizeRatio)
    this.#positionContent(width)
  }

  // Размещает подписи уровня и рекорда по центру HUD.
  #layoutCenterTexts(height: number) {
    const settings = SOKOBAN_HUD_SETTINGS
    const hasRecord = this.#recordText.visible

    this.#levelText.style.fontSize = height * settings.levelFontSizeRatio
    this.#levelText.y = hasRecord ? -height * settings.levelWithRecordOffsetRatio : 0
    this.#recordText.style.fontSize = height * settings.recordFontSizeRatio
    this.#recordText.y = height * settings.recordOffsetRatio
  }

  // Выравнивает крайние элементы и блок шагов внутри HUD.
  #positionContent(width: number) {
    this.#alignLeft(this.#backButton, width)
    this.#alignRight(this.#restartButton, width)
    this.#positionStepsAfterBack()
    this.#levelText.x = 0
    this.#recordText.x = 0
  }

  // Выравнивает элемент по левому краю панели.
  #alignLeft(view: Container, width: number) {
    const bounds = view.getLocalBounds()

    view.x = -width / 2 + SOKOBAN_HUD_SETTINGS.horizontalPadding - bounds.x
  }

  // Выравнивает элемент по правому краю панели.
  #alignRight(view: Container, width: number) {
    const bounds = view.getLocalBounds()

    view.x = width / 2 - SOKOBAN_HUD_SETTINGS.horizontalPadding - bounds.x - bounds.width
  }

  // Размещает счётчик шагов рядом с кнопкой отмены.
  #positionStepsAfterBack() {
    const backBounds = this.#backButton.getLocalBounds()
    const stepsBounds = this.#stepsView.getLocalBounds()
    const backRight = this.#backButton.x + backBounds.x + backBounds.width

    this.#stepsView.x = backRight + SOKOBAN_HUD_SETTINGS.controlsGap - stepsBounds.x
  }

  // Масштабирует иконку счётчика шагов.
  #setStepsIconSize(iconSize: number) {
    this.#stepsIcon.scale.set(1)
    const iconScale = iconSize / Math.max(this.#stepsIcon.width, this.#stepsIcon.height)

    this.#stepsIcon.scale.set(iconScale)
  }

  // Размещает HUD относительно доски и доступной высоты.
  #positionHud(centerX: number, availableHeight: number, height: number) {
    const y = availableHeight - SOKOBAN_HUD_SETTINGS.bottomPadding - height / 2

    this._customPosition.x = centerX
    this._customPosition.y = y
    this.position.set(centerX, y)
    this.scale.set(1)
  }

  // Создаёт единый стиль текста заданного размера.
  #createTextStyle(fontSize: number): TextStyleOptions {
    return {
      fill: SOKOBAN_HUD_SETTINGS.textColor,
      fontFamily: 'primaryFont',
      fontSize,
      fontWeight: '800',
    }
  }

  // Создаёт интерактивную кнопку с заданной иконкой.
  #createButton(iconName: string, label: string, onPress: () => void) {
    return new SokobanHudButton({iconName, label, onPress})
  }

  // Обновляет доступность кнопок HUD.
  #updateButtons() {
    this.#backButton?.setEnabled(this.#isEnabled && this.#steps > 0)
    this.#restartButton?.setEnabled(this.#isEnabled)
  }
}
