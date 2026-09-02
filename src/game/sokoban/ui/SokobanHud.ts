import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container, Graphics, Text} from 'pixi.js'
import type {DestroyOptions, Sprite, TextStyleOptions} from 'pixi.js'
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
  #deadlockWarning!: Container
  #deadlockWarningBackground!: Graphics
  #deadlockWarningY = 0
  #deadlockTimeline: gsap.core.Timeline | null = null
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

  // Показывает анимированное предупреждение о тупике.
  showDeadlockFeedback() {
    this.clearDeadlockFeedback()
    this.#deadlockWarning.visible = true
    this.#backButton.pulse()
    this.#deadlockTimeline = this.#createDeadlockTimeline()
  }

  // Останавливает и скрывает предупреждение о тупике.
  clearDeadlockFeedback() {
    this.#deadlockTimeline?.kill()
    this.#deadlockTimeline = null
    this.#backButton?.stopPulse()
    if (!this.#deadlockWarning) return

    this.#deadlockWarning.alpha = 0
    this.#deadlockWarning.visible = false
    this.#deadlockWarning.y = this.#deadlockWarningY
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
    this.#layoutDeadlockWarning(width, height)
    this.#positionHud(centerX, availableHeight, height)
  }

  // Освобождает обработчики, анимации и ресурсы экземпляра.
  destroy(options?: DestroyOptions) {
    this.clearDeadlockFeedback()
    super.destroy(options)
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init() {
    this.#panel = new Graphics({label: 'sokoban-hud-panel'})
    this.#stepsView = this.#createStepsView()
    this.#levelText = this.#createLevelText()
    this.#recordText = this.#createRecordText()
    this.#deadlockWarning = this.#createDeadlockWarning()

    this.#backButton = this.#createButton('icon-back', 'sokoban-undo-button', this.#onUndo)
    this.#restartButton = this.#createButton('icon-restart', 'sokoban-restart-button', this.#onRestart)

    this.addChild(
      this.#panel,
      this.#stepsView,
      this.#backButton,
      this.#levelText,
      this.#recordText,
      this.#restartButton,
      this.#deadlockWarning,
    )
    this.setSteps(0)
  }

  // Создаёт контейнер предупреждения о тупике.
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

  // Создаёт текст предупреждения о тупике.
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

  // Размещает предупреждение о тупике над HUD.
  #layoutDeadlockWarning(width: number, hudHeight: number) {
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

  // Создаёт анимацию предупреждения о тупике.
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

  // Завершает показ предупреждения и освобождает таймлайн.
  #finishDeadlockFeedback() {
    this.#deadlockTimeline = null
    this.#backButton.stopPulse()
    this.#deadlockWarning.visible = false
  }

  // Обновляет доступность кнопок HUD.
  #updateButtons() {
    this.#backButton?.setEnabled(this.#isEnabled && this.#steps > 0)
    this.#restartButton?.setEnabled(this.#isEnabled)
  }
}
