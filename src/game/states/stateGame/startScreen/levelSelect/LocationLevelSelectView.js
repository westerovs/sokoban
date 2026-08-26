import i18next from 'i18next'
import {Container, Graphics, Text} from 'pixi.js'
import ButtonContainer from '../../../../components/buttons/ButtonContainer.js'
import Locator from '../../../../engine/Locator.ts'
import {primaryFontStyle} from '../../../../styles.js'
import LevelPreview from './LevelPreview.js'
import LevelSelectButton from './LevelSelectButton.js'

export default class LocationLevelSelectView extends Container {
  #levelButtons = []
  #levelsContainer
  #onLevelSelect
  #playButton
  #preview
  #record
  #selectedEntry
  #title

  constructor({onBack, onLevelSelect, onPlay}) {
    super({label: 'location-level-select-view'})

    this.#onLevelSelect = onLevelSelect
    this.#init(onBack, onPlay)
  }

  setData = (location, levels, selectedEntry) => {
    this.#selectedEntry = selectedEntry
    this.#title.text = i18next.t(location.titleKey)
    this.#preview.setLevel(selectedEntry.level)
    this.#setRecord(selectedEntry.level)
    this.#replaceLevelButtons(levels, selectedEntry.level.id)
    this.updateAdaptive()
  }

  updateSelectedLevel = (levels, selectedEntry) => {
    this.#selectedEntry = selectedEntry
    this.#preview.setLevel(selectedEntry.level)
    this.#setRecord(selectedEntry.level)
    this.#levelButtons.forEach((button, index) => {
      button.setState({...levels[index], isSelected: levels[index].id === selectedEntry.level.id})
    })
  }

  updateAdaptive = () => {
    const {width} = Locator.uiLayer.uiData
    this.position.set(0)
    this.scale.set(Math.min((width - 28) / 560, 1))
    this.#layoutPreview()
    this.#layoutLevels()
    this.#playButton.position.set(0, 445)
  }

  #init = (onBack, onPlay) => {
    this.#createHeader(onBack)
    this.#preview = new LevelPreview()
    this.#levelsContainer = new Container({label: 'level-select-buttons'})
    this.#createLevelsPanel()
    this.#playButton = this.#createPlayButton(onPlay)
    this.addChild(this.#preview, this.#levelsContainer, this.#playButton)
  }

  #createHeader = (onBack) => {
    const back = new ButtonContainer({props: {name: 'btnLocationBack'}, spriteKeys: ['btn-back'], initScale: 0.72})
    back.position.set(-760, -430)
    back.on('pointertap', onBack)
    this.#title = new Text({
      label: 'location-level-title',
      text: '',
      style: {...primaryFontStyle, fill: 0xffe6a1, fontSize: 64, stroke: {color: 0x19251d, width: 7}},
    })
    this.#title.anchor.set(0.5)
    this.#title.y = -430
    this.addChild(back, this.#title)
  }

  #createLevelsPanel = () => {
    const panel = new Graphics({label: 'level-select-panel'})
    panel.roundRect(-300, -230, 600, 460, 28).fill({color: 0x132319, alpha: 0.92})
    panel.stroke({color: 0xa98c48, width: 5})
    this.#record = new Text({
      label: 'level-preview-record',
      text: '',
      style: {...primaryFontStyle, fill: 0xffe6a1, fontSize: 25},
    })
    this.#record.anchor.set(0.5)
    this.#record.y = -178
    this.#levelsContainer.addChild(panel, this.#record)
  }

  #createPlayButton = (onPlay) => {
    const button = new ButtonContainer({
      props: {name: 'btnPlaySelectedLevel'},
      spriteKeys: ['btn-primary'],
      initScale: 0.82,
    })
    button.addCenterText({
      text: i18next.t('levelSelect.play'),
      style: {...primaryFontStyle, fill: 0x303b12, fontSize: 42},
    })
    button.on('pointertap', onPlay)
    return button
  }

  #replaceLevelButtons = (levels, selectedLevelId) => {
    this.#levelButtons.forEach((button) => button.destroy({children: true}))
    this.#levelButtons = levels.map((level) => {
      const button = new LevelSelectButton(level, this.#onLevelSelect)
      button.setState({...level, isSelected: level.id === selectedLevelId})
      this.#levelsContainer.addChild(button)
      return button
    })
  }

  #layoutPreview = () => {
    const back = this.getChildByLabel('btnLocationBack')
    this.#title.position.set(0, -400)
    back.position.set(235, -400)
    this.#preview.position.set(0, -145)
    this.#preview.resize(500, 430)
  }

  #layoutLevels = () => {
    this.#levelsContainer.position.set(0, 235)
    this.#levelsContainer.scale.set(0.8)
    this.#levelButtons.forEach((button, index) => {
      const column = index % 4
      const row = Math.floor(index / 4)
      button.position.set((column - 1.5) * 135, -75 + row * 105)
    })
  }

  #setRecord = (level) => {
    this.#record.text = level.pushRecord ? i18next.t('sokoban.record', {record: level.pushRecord}) : ''
  }
}
