import {Container} from 'pixi.js'
import ButtonContainer from '../../../components/buttons/ButtonContainer.js'
import Locator from '../../../engine/Locator.ts'
import LocationLevelSelectView from './levelSelect/LocationLevelSelectView.js'
import LocationSelectView from './locationSelect/LocationSelectView.js'

const TOP_BAR_BASE_WIDTH = 640
const TOP_BAR_MIN_SCALE = 0.72

export default class GameMenuView extends Container {
  #levelSelectView
  #locationSelectView
  #toolButtons = []

  constructor(callbacks) {
    super({label: 'game-menu-view'})

    this.#init(callbacks)
  }

  get toolButtons() {
    return this.#toolButtons
  }

  showLocations = (locations, pageIndex, continueEntry, unlockedLocation) => {
    this.#locationSelectView.visible = true
    this.#levelSelectView.visible = false
    this.#locationSelectView.setData(locations, pageIndex, continueEntry, unlockedLocation)
  }

  showLevels = (location, levels, selectedEntry) => {
    this.#locationSelectView.hide()
    this.#levelSelectView.visible = true
    this.#levelSelectView.setData(location, levels, selectedEntry)
  }

  updateSelectedLevel = (levels, selectedEntry) => {
    this.#levelSelectView.updateSelectedLevel(levels, selectedEntry)
  }

  updateAdaptive = () => {
    const {center} = Locator.uiLayer.uiData
    this.position.copyFrom(center)
    this.scale.set(1)
    this.#locationSelectView.updateAdaptive()
    this.#levelSelectView.updateAdaptive()
    this.#toolButtons.forEach((button) => button.alignRight())
  }

  #init = (callbacks) => {
    this.#locationSelectView = new LocationSelectView(callbacks)
    this.#levelSelectView = new LocationLevelSelectView(callbacks)
    this.#levelSelectView.visible = false
    this.addChild(this.#locationSelectView, this.#levelSelectView)
    Locator.uiLayer.stateUiLayer.addChild(this)
    this.#createToolButtons(callbacks)
  }

  #createToolButtons = ({onLeaderboard, onStore}) => {
    this.#createToolButton('btnLeaders', 'icon-cup', -140, onLeaderboard)
    this.#createToolButton('btnStore', 'icon-store', -70, onStore)
  }

  #createToolButton = (name, icon, x, onPress) => {
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

  #getTopBarScale = () => {
    const {width} = Locator.uiLayer.uiData
    return Math.min(1, Math.max(TOP_BAR_MIN_SCALE, (width - 40) / TOP_BAR_BASE_WIDTH))
  }
}
