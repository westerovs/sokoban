import i18next from 'i18next'
import {Container, FederatedPointerEvent, Graphics, Text} from 'pixi.js'
import ButtonContainer from '@/game/components/buttons/ButtonContainer.ts'
import Locator from '@/game/engine/Locator.ts'
import LocalStorage from '@/game/engine/storage/LocalStorage.ts'
import type {LevelDefinition} from '@/game/gameConfig/levels/levelTypes.ts'
import {openSokobanLevelEditor} from '@/game/sokoban/editor/openSokobanLevelEditor.ts'
import {primaryFontStyle} from '@/game/styles.ts'
import {fitTextWidth} from '@/game/utils/fitTextWidth.js'
import type {GameMenuCallbacks, LevelEntry, LevelSelectionState, LocationDefinition} from '../menuTypes.js'
import LevelPreview from './LevelPreview.js'
import LevelPreviewStatsView from './LevelPreviewStatsView.js'
import LevelSelectButton from './LevelSelectButton.js'

/**
 * Отображает выбор уровня локации и отладочный переход в редактор.
 */

const DIFFICULTY_BADGE_HORIZONTAL_PADDING = 18 // Горизонтальный внутренний отступ плашки сложности
const DIFFICULTY_BADGE_MARGIN = 12 // Отступ плашки сложности от правого края предпросмотра
const LEVELS_PANEL_WIDTH = 600 // Ширина панели списка уровней
const PREVIEW_HEIGHT = 390 // Высота области предпросмотра
const PREVIEW_WIDTH = 500 // Ширина области предпросмотра

export default class LevelSelectPage extends Container {
  #backButton!: ButtonContainer
  #authorText: Text | null = null
  #difficultyBadge!: Container
  #difficultyBackground!: Graphics
  #difficultyText!: Text
  #levelButtons: LevelSelectButton[] = []
  #levelButtonsRow!: Container
  #levelsContainer!: Container
  #onLevelSelect: GameMenuCallbacks['onLevelSelect']
  #playButton!: ButtonContainer
  #levelPreview!: LevelPreview
  #records!: LevelPreviewStatsView
  #selectedEntry: LevelEntry | null = null
  #title!: Text

  constructor({onBack, onLevelSelect, onPlay}: Pick<GameMenuCallbacks, 'onBack' | 'onLevelSelect' | 'onPlay'>) {
    super({label: 'level-select-page'})

    this.#onLevelSelect = onLevelSelect
    this.#init(onBack, onPlay)
  }

  // Обновляет состояние через операцию `setData`.
  setData = (location: LocationDefinition, levels: LevelSelectionState[], selectedEntry: LevelEntry) => {
    this.#selectedEntry = selectedEntry
    this.#title.text = i18next.t(location.titleKey)
    fitTextWidth(this.#title, PREVIEW_WIDTH)
    this.#levelPreview.setLevel(selectedEntry.level)
    this.#setDifficulty(selectedEntry.level)
    this.#setPersonalBest(selectedEntry.level)
    this.#setAuthor(selectedEntry.level)
    this.#createLevelButtons(levels, selectedEntry.level.id)
    this.updateAdaptive()
  }

  // Обновляет состояние через операцию `updateSelectedLevel`.
  updateSelectedLevel = (levels: LevelSelectionState[], selectedEntry: LevelEntry) => {
    this.#selectedEntry = selectedEntry
    this.#levelPreview.setLevel(selectedEntry.level)
    this.#setDifficulty(selectedEntry.level)
    this.#setPersonalBest(selectedEntry.level)
    this.#setAuthor(selectedEntry.level)
    this.#levelButtons.forEach((button, index) => {
      button.setState({...levels[index], isSelected: levels[index].id === selectedEntry.level.id})
    })
  }

  // Обновляет состояние через операцию `updateAdaptive`.
  updateAdaptive = () => {
    const {width, height} = Locator.uiLayer.uiData
    this.position.set(0)
    this.scale.set(Math.min((width - 28) / 560, (height - 70) / 1030, 1))
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init = (onBack: GameMenuCallbacks['onBack'], onPlay: GameMenuCallbacks['onPlay']) => {
    this.#createTitle()
    this.#createLevelPreview()
    this.#createLevelsContainer()
    this.#createActionButtons(onBack, onPlay)
  }

  #createTitle = () => {
    this.#title = new Text({
      label: 'location-level-title',
      text: '',
      style: {...primaryFontStyle, fill: 0xffe6a1, fontSize: 64, stroke: {color: 0x19251d, width: 7, join: 'round'}},
    })
    this.#title.anchor.set(0.5)
    this.#title.position.set(0, -420)
    this.addChild(this.#title)
  }

  #createLevelPreview = () => {
    this.#levelPreview = new LevelPreview()
    this.#levelPreview.position.set(0, -140)
    this.#levelPreview.resize(PREVIEW_WIDTH, PREVIEW_HEIGHT)
    this.#levelPreview.eventMode = 'static'
    this.#levelPreview.on('pointertap', this.#openLevelEditor)
    this.addChild(this.#levelPreview)
    this.#createDifficultyBadge()
  }

  // Создаёт плашку сложности поверх правого верхнего края предпросмотра.
  #createDifficultyBadge = () => {
    this.#difficultyBadge = new Container({label: 'level-preview-difficulty-badge'})
    this.#difficultyBackground = new Graphics({label: 'level-preview-difficulty-background'})
    this.#difficultyText = new Text({
      label: 'level-preview-difficulty-text',
      text: '',
      style: {...primaryFontStyle, fill: 0xffedbd, fontSize: 20, stroke: {color: 0x19251d, width: 3, join: 'round'}},
    })
    this.#difficultyText.anchor.set(0.5)
    this.#difficultyBadge.addChild(this.#difficultyBackground, this.#difficultyText)

    this.#levelPreview.addChild(this.#difficultyBadge)
  }

  // Обновляет ширину и позицию плашки по фактическому размеру текста.
  #updateDifficultyBadge = () => {
    const badgeHeight = 40 // Высота плашки сложности
    const badgeWidth = this.#difficultyText.width + DIFFICULTY_BADGE_HORIZONTAL_PADDING * 2
    this.#difficultyBackground
      .clear()
      .roundRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight, 16)
      .fill({color: 0x132319, alpha: 0.96})
      .stroke({color: 0xa98c48, width: 3})
    this.#difficultyBadge.position.set(
      PREVIEW_WIDTH / 2 - badgeWidth / 2 - DIFFICULTY_BADGE_MARGIN,
      -PREVIEW_HEIGHT / 2,
    )
  }

  // ------------ панель выбора уровней
  #createLevelsContainer = () => {
    this.#levelsContainer = new Container({label: 'level-select-panel', y: 235})
    this.#levelsContainer.scale.set(0.8)
    this.addChild(this.#levelsContainer)

    this.#createPanelGraphics()
    this.#createRecords()
    this.#createAuthorText()
    this.#createLevelButtonsRow()
  }

  #createPanelGraphics = () => {
    const graphics = new Graphics({label: 'level-select-graphics'})
    graphics.roundRect(-LEVELS_PANEL_WIDTH / 2, -150, LEVELS_PANEL_WIDTH, 300, 28).fill({color: 0x132319, alpha: 0.92})
    graphics.stroke({color: 0xa98c48, width: 5})

    this.#levelsContainer.addChild(graphics)
  }

  #createRecords = () => {
    this.#records = new LevelPreviewStatsView()
    this.#records.y = -112
    this.#levelsContainer.addChild(this.#records)
  }

  #createAuthorText() {
    if (!LocalStorage.isDebug) return
    this.#authorText = new Text({
      label: 'level-preview-author',
      text: '',
      style: {...primaryFontStyle, fontSize: 26, fill: 0xffe6a1, stroke: {color: 0x19251d, width: 3, join: 'round'}},
    })
    this.#authorText.anchor.set(0.5)
    this.#authorText.position.set(0, -170)
    this.#levelsContainer.addChild(this.#authorText)
  }

  // ------------ Кнопки Играть и Назад
  // Создаёт и размещает кнопки действий в общей строке.
  #createActionButtons = (onBack: GameMenuCallbacks['onBack'], onPlay: GameMenuCallbacks['onPlay']) => {
    const gap = 24 // Расстояние между кнопками действий
    const y = 455 // Вертикальная позиция кнопок действий
    this.#backButton = this.#createBackButton(onBack)
    this.#playButton = this.#createPlayButton(onPlay)
    const rowWidth = this.#backButton.width + gap + this.#playButton.width
    const rowLeft = -rowWidth / 2
    this.#backButton.position.set(rowLeft + this.#backButton.width / 2, y)
    this.#playButton.position.set(rowLeft + this.#backButton.width + gap + this.#playButton.width / 2, y)
  }

  #createBackButton = (onBack: GameMenuCallbacks['onBack']) => {
    const button = new ButtonContainer({
      props: {name: 'btnLocationBack'},
      spriteKeys: ['btn-ui-1', {key: 'icon-skin-back', scale: 0.8}],
      initScale: 0.75,
    })
    button.on('pointertap', onBack)
    this.addChild(button)

    return button
  }

  #createPlayButton = (onPlay: GameMenuCallbacks['onPlay']) => {
    const button = new ButtonContainer({
      props: {name: 'btnPlaySelectedLevel'},
      spriteKeys: ['btn-primary'],
      initScale: 0.82,
    })
    button.addCenterText({
      text: i18next.t('levelSelect.play'),
      style: {...primaryFontStyle, fill: 0x303b12, fontSize: 42},
    })
    button.on('pointertap', () => onPlay(this.#selectedEntry!.level.id))
    this.addChild(button)

    return button
  }

  // ------------ Выбор уровней
  #createLevelButtonsRow = () => {
    this.#levelButtonsRow = new Container({label: 'level-buttons-row', y: -24})
    this.#levelsContainer.addChild(this.#levelButtonsRow)
  }

  // Создаёт кнопки выбора уровней внутри их контейнера.
  #createLevelButtons = (levels: LevelSelectionState[], selectedLevelId: string) => {
    this.#levelButtons.forEach((button) => button.destroy({children: true}))

    this.#levelButtons = levels.map((level, index) => {
      const button = new LevelSelectButton(level, this.#onLevelSelect)
      const column = index % 4
      const row = Math.floor(index / 4)
      button.setState({...level, isSelected: level.id === selectedLevelId})
      button.position.set((column - 1.5) * 135, row * 105)
      this.#levelButtonsRow.addChild(button)
      return button
    })
  }

  // Показывает лучший результат игрока для выбранного уровня.
  #setPersonalBest(level: LevelDefinition) {
    this.#records.setData(Locator.storage.getSokobanRecords(level.id))
  }

  // Показывает локализованную сложность выбранного уровня.
  #setDifficulty(level: LevelDefinition) {
    this.#difficultyText.text = i18next.t(`difficultyLevels.${level.difficulty}`).toUpperCase()
    fitTextWidth(
      this.#difficultyText,
      PREVIEW_WIDTH - DIFFICULTY_BADGE_MARGIN * 2 - DIFFICULTY_BADGE_HORIZONTAL_PADDING * 2,
    )
    this.#updateDifficultyBadge()
  }

  // Показывает автора выбранного уровня только в отладочном режиме.
  #setAuthor(level: LevelDefinition) {
    if (!this.#authorText) return
    this.#authorText.text = i18next.t('sokoban.author', {author: level.authorId})
    fitTextWidth(this.#authorText, LEVELS_PANEL_WIDTH)
  }

  // Выполняет отдельную операцию `openLevelEditor`.
  #openLevelEditor = (event: FederatedPointerEvent) => {
    if (!LocalStorage.isDebug || !event.ctrlKey || !this.#selectedEntry) return

    event.stopPropagation()
    openSokobanLevelEditor(this.#selectedEntry.level.id)
  }
}
