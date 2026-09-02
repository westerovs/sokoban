import {Container} from 'pixi.js'
import ButtonContainer from '../../../components/buttons/ButtonContainer.js'
import Locator from '../../../engine/Locator.ts'
import LocationLevelSelectView from './levelSelect/LocationLevelSelectView.js'
import LocationSelectView from './locationSelect/LocationSelectView.js'
import type {GameMenuCallbacks, LevelEntry, LevelSelectionState, LocationDefinition, LocationSelectionState} from './menuTypes.js'

// Объединяет экраны выбора локации, уровня и кнопки верхней панели.

const TOP_BAR_BASE_WIDTH = 640 // Базовая ширина верхней панели
const TOP_BAR_MIN_SCALE = 0.72 // Минимальный масштаб кнопок панели

export default class GameMenuView extends Container {
  #levelSelectView!: LocationLevelSelectView
  #locationSelectView!: LocationSelectView
  #toolButtons: ButtonContainer[] = []

  // Создаёт оба экрана меню и служебные кнопки.
  constructor(callbacks: GameMenuCallbacks) {
    super({label: 'game-menu-view'})

    this.#init(callbacks)
  }

  // Возвращает кнопки верхней панели.
  get toolButtons() {
    return this.#toolButtons
  }

  // Показывает страницу выбора локации.
  showLocations = (
    locations: LocationSelectionState[],
    pageIndex: number,
    continueEntry: LevelEntry | null,
    unlockedLocation: LocationDefinition | null,
  ) => {
    this.#locationSelectView.visible = true
    this.#levelSelectView.visible = false
    this.#locationSelectView.setData(locations, pageIndex, continueEntry, unlockedLocation)
  }

  // Показывает уровни выбранной локации.
  showLevels = (location: LocationDefinition, levels: LevelSelectionState[], selectedEntry: LevelEntry) => {
    this.#locationSelectView.hide()
    this.#levelSelectView.visible = true
    this.#levelSelectView.setData(location, levels, selectedEntry)
  }

  // Обновляет выбранный уровень без пересоздания экрана.
  updateSelectedLevel = (levels: LevelSelectionState[], selectedEntry: LevelEntry) => {
    this.#levelSelectView.updateSelectedLevel(levels, selectedEntry)
  }

  // Адаптирует меню и служебные кнопки к размеру окна.
  updateAdaptive = () => {
    const {center} = Locator.uiLayer.uiData
    this.position.copyFrom(center)
    this.scale.set(1)
    this.#locationSelectView.updateAdaptive()
    this.#levelSelectView.updateAdaptive()
    this.#toolButtons.forEach((button) => button.alignRight?.())
  }

  // Создаёт представления меню и добавляет их на UI-слой.
  #init = (callbacks: GameMenuCallbacks) => {
    this.#locationSelectView = new LocationSelectView(callbacks)
    this.#levelSelectView = new LocationLevelSelectView(callbacks)
    this.#levelSelectView.visible = false
    this.addChild(this.#locationSelectView, this.#levelSelectView)
    Locator.uiLayer.stateUiLayer.addChild(this)
    this.#createToolButtons(callbacks)
  }

  // Создаёт кнопки таблицы лидеров и магазина.
  #createToolButtons = ({onLeaderboard, onStore}: GameMenuCallbacks) => {
    this.#createToolButton('btnLeaders', 'icon-cup', -140, onLeaderboard)
    this.#createToolButton('btnStore', 'icon-store', -70, onStore)
  }

  // Создаёт одну адаптивную кнопку верхней панели.
  #createToolButton = (name: string, icon: string, x: number, onPress: () => void) => {
    const button = new ButtonContainer({
      props: {name},
      spriteKeys: ['btn-ui-3', icon],
    })
    button.alignRight = () => {
      Locator.uiLayer.alignRight(button, {x, y: 60})
      button.scale.set(this.#getTopBarScale())
    }
    button.alignRight()
    button.on('pointertap', onPress)
    this.#toolButtons.push(button)
    Locator.uiLayer.stateUiLayer.addChild(button)
  }

  // Рассчитывает масштаб кнопок верхней панели.
  #getTopBarScale = () => {
    const {width} = Locator.uiLayer.uiData
    return Math.min(1, Math.max(TOP_BAR_MIN_SCALE, (width - 40) / TOP_BAR_BASE_WIDTH))
  }
}
