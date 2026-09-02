import i18next from 'i18next'
import {Container, FederatedPointerEvent, Graphics, Text} from 'pixi.js'
import ButtonContainer from '../../../../components/buttons/ButtonContainer.js'
import Locator from '../../../../engine/Locator.ts'
import LocalStorage from '../../../../engine/storage/LocalStorage.js'
import type {LevelDefinition} from '../../../../gameConfig/levels/levelTypes.js'
import {openSokobanLevelEditor} from '../../../../sokoban/editor/openSokobanLevelEditor.js'
import {primaryFontStyle} from '../../../../styles.js'
import type {GameMenuCallbacks, LevelEntry, LevelSelectionState, LocationDefinition} from '../menuTypes.js'
import LevelPreview from './LevelPreview.js'
import LevelSelectButton from './LevelSelectButton.js'

/**
 * Отображает выбор уровня локации и отладочный переход в редактор.
 */

const ACTION_BUTTON_GAP = 24 // Расстояние между кнопками действий
const ACTION_BUTTONS_Y = 445 // Вертикальная позиция кнопок действий
const BACK_BUTTON_SCALE = 0.75 // Масштаб кнопки возврата
const LEVELS_PANEL_HEIGHT = 320 // Высота панели списка уровней
const LEVELS_PANEL_WIDTH = 600 // Ширина панели списка уровней
const PREVIEW_HEIGHT = 390 // Высота области предпросмотра
const PREVIEW_WIDTH = 500 // Ширина области предпросмотра

export default class LocationLevelSelectView extends Container {
  #backButton!: ButtonContainer
  #levelButtons: LevelSelectButton[] = []
  #levelsContainer!: Container
  #onLevelSelect: GameMenuCallbacks['onLevelSelect']
  #playButton!: ButtonContainer
  #preview!: LevelPreview
  #record!: Text
  #selectedEntry: LevelEntry | null = null
  #title!: Text

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor({onBack, onLevelSelect, onPlay}: Pick<GameMenuCallbacks, 'onBack' | 'onLevelSelect' | 'onPlay'>) {
    super({label: 'location-level-select-view'})

    this.#onLevelSelect = onLevelSelect
    this.#init(onBack, onPlay)
  }

  // Обновляет состояние через операцию `setData`.
  setData = (location: LocationDefinition, levels: LevelSelectionState[], selectedEntry: LevelEntry) => {
    this.#selectedEntry = selectedEntry
    this.#title.text = i18next.t(location.titleKey)
    this.#preview.setLevel(selectedEntry.level)
    this.#setRecord(selectedEntry.level)
    this.#replaceLevelButtons(levels, selectedEntry.level.id)
    this.updateAdaptive()
  }

  // Обновляет состояние через операцию `updateSelectedLevel`.
  updateSelectedLevel = (levels: LevelSelectionState[], selectedEntry: LevelEntry) => {
    this.#selectedEntry = selectedEntry
    this.#preview.setLevel(selectedEntry.level)
    this.#setRecord(selectedEntry.level)
    this.#levelButtons.forEach((button, index) => {
      button.setState({...levels[index], isSelected: levels[index].id === selectedEntry.level.id})
    })
  }

  // Обновляет состояние через операцию `updateAdaptive`.
  updateAdaptive = () => {
    const {width} = Locator.uiLayer.uiData
    this.position.set(0)
    this.scale.set(Math.min((width - 28) / 560, 1))
    this.#layoutPreview()
    this.#layoutLevels()
    this.#layoutActionButtons()
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init = (onBack: GameMenuCallbacks['onBack'], onPlay: GameMenuCallbacks['onPlay']) => {
    this.#createHeader()
    this.#preview = new LevelPreview()
    this.#preview.eventMode = 'static'
    this.#preview.on('pointertap', this.#openLevelEditor)
    this.#levelsContainer = new Container({label: 'level-select-buttons'})
    this.#createLevelsPanel()
    this.#backButton = this.#createBackButton(onBack)
    this.#playButton = this.#createPlayButton(onPlay)
    this.addChild(this.#preview, this.#levelsContainer, this.#backButton, this.#playButton)
  }

  // Создаёт данные или представление для операции `createHeader`.
  #createHeader = () => {
    this.#title = new Text({
      label: 'location-level-title',
      text: '',
      style: {...primaryFontStyle, fill: 0xffe6a1, fontSize: 64, stroke: {color: 0x19251d, width: 7}},
    })
    this.#title.anchor.set(0.5)
    this.addChild(this.#title)
  }

  // Создаёт данные или представление для операции `createLevelsPanel`.
  #createLevelsPanel = () => {
    const panel = new Graphics({label: 'level-select-panel'})
    panel
      .roundRect(-LEVELS_PANEL_WIDTH / 2, -LEVELS_PANEL_HEIGHT / 2, LEVELS_PANEL_WIDTH, LEVELS_PANEL_HEIGHT, 28)
      .fill({color: 0x132319, alpha: 0.92})
    panel.stroke({color: 0xa98c48, width: 5})
    this.#record = new Text({
      label: 'level-preview-record',
      text: '',
      style: {...primaryFontStyle, fill: 0xffe6a1, fontSize: 25},
    })
    this.#record.anchor.set(0.5)
    this.#record.y = -125
    this.#levelsContainer.addChild(panel, this.#record)
  }

  // Создаёт данные или представление для операции `createBackButton`.
  #createBackButton = (onBack: GameMenuCallbacks['onBack']) => {
    const button = new ButtonContainer({
      props: {name: 'btnLocationBack'},
      spriteKeys: ['btn-ui-1', {key: 'icon-skin-back', scale: 0.8}],
      initScale: BACK_BUTTON_SCALE,
    })
    button.on('pointertap', onBack)
    return button
  }

  // Создаёт данные или представление для операции `createPlayButton`.
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
    return button
  }

  // Выполняет отдельную операцию `replaceLevelButtons`.
  #replaceLevelButtons = (levels: LevelSelectionState[], selectedLevelId: string) => {
    this.#levelButtons.forEach((button) => button.destroy({children: true}))
    this.#levelButtons = levels.map((level) => {
      const button = new LevelSelectButton(level, this.#onLevelSelect)
      button.setState({...level, isSelected: level.id === selectedLevelId})
      this.#levelsContainer.addChild(button)
      return button
    })
  }

  // Рассчитывает расположение через операцию `layoutPreview`.
  #layoutPreview = () => {
    this.#title.position.set(0, -420)
    this.#preview.position.set(0, -165)
    this.#preview.resize(PREVIEW_WIDTH, PREVIEW_HEIGHT)
  }

  // Рассчитывает расположение через операцию `layoutLevels`.
  #layoutLevels = () => {
    this.#levelsContainer.position.set(0, 205)
    this.#levelsContainer.scale.set(0.8)
    this.#levelButtons.forEach((button, index) => {
      const column = index % 4
      const row = Math.floor(index / 4)
      button.position.set((column - 1.5) * 135, -35 + row * 105)
    })
  }

  // Рассчитывает расположение через операцию `layoutActionButtons`.
  #layoutActionButtons = () => {
    const rowWidth = this.#backButton.width + ACTION_BUTTON_GAP + this.#playButton.width
    const rowLeft = -rowWidth / 2
    this.#backButton.position.set(rowLeft + this.#backButton.width / 2, ACTION_BUTTONS_Y)
    this.#playButton.position.set(rowLeft + this.#backButton.width + ACTION_BUTTON_GAP + this.#playButton.width / 2, ACTION_BUTTONS_Y)
  }

  // Обновляет состояние через операцию `setRecord`.
  #setRecord = (level: LevelDefinition) => {
    this.#record.text = level.pushRecord ? i18next.t('sokoban.record', {record: level.pushRecord}) : ''
  }

  // Выполняет отдельную операцию `openLevelEditor`.
  #openLevelEditor = (event: FederatedPointerEvent) => {
    if (!LocalStorage.isDebug || !event.ctrlKey || !this.#selectedEntry) return

    event.stopPropagation()
    openSokobanLevelEditor(this.#selectedEntry.level.id)
  }
}
