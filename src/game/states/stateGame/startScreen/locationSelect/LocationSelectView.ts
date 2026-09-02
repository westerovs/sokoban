import i18next from 'i18next'
import {Container, Graphics, Text} from 'pixi.js'
import Locator from '../../../../engine/Locator.ts'
import {primaryFontStyle} from '../../../../styles.js'
import type {GameMenuCallbacks, LevelEntry, LocationDefinition, LocationSelectionState} from '../menuTypes.js'
import LocationCard from './LocationCard.js'
import LocationTab from './LocationTab.js'
import LocationUnlockCelebration from './LocationUnlockCelebration.js'

// Отображает страницы карточек локаций и кнопку продолжения игры.

const PAGE_SIZE = 4 // Количество локаций на одной странице
const NARROW_LAYOUT_WIDTH = 1200 // Порог переключения на узкую раскладку

export default class LocationSelectView extends Container {
  #cards: LocationCard[] = []
  #cardsContainer!: Container
  #continueButton!: Container
  #continueSubtitle!: Text
  #continueTitle!: Text
  #onLocationSelect: GameMenuCallbacks['onLocationSelect']
  #pageIndex = 0 // Текущая страница локаций
  #tabs: LocationTab[] = []
  #unlockCelebration!: LocationUnlockCelebration

  // Сохраняет обработчики и создаёт содержимое выбора локаций.
  constructor({onContinue, onLocationSelect, onPageSelect}: Pick<GameMenuCallbacks, 'onContinue' | 'onLocationSelect' | 'onPageSelect'>) {
    super({label: 'location-select-view'})

    this.#onLocationSelect = onLocationSelect
    this.#init(onContinue, onPageSelect)
  }

  // Показывает указанную страницу локаций и актуальный прогресс.
  setData = (
    locations: LocationSelectionState[],
    pageIndex: number,
    continueEntry: LevelEntry | null,
    unlockedLocation: LocationDefinition | null,
  ) => {
    this.#unlockCelebration.stop()
    this.#pageIndex = pageIndex
    this.#replaceCards(locations.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE))
    this.#tabs.forEach((tab, index) => tab.setActive(index === pageIndex))
    this.#setContinueEntry(continueEntry)
    this.updateAdaptive()
    this.#showUnlockCelebration(unlockedLocation)
  }

  // Скрывает экран и останавливает праздничную анимацию.
  hide = () => {
    this.visible = false
    this.#unlockCelebration.stop()
  }

  // Перестраивает расположение элементов под текущий размер окна.
  updateAdaptive = () => {
    const {width} = Locator.uiLayer.uiData
    const isNarrow = width < NARROW_LAYOUT_WIDTH
    this.position.set(0)
    this.scale.set(isNarrow ? Math.min((width - 28) / 560, 1) : 1)
    this.#layoutTabs(isNarrow)
    this.#layoutCards(isNarrow)
    this.#continueButton.position.set(0, isNarrow ? 445 : 410)
    this.#unlockCelebration.resize({
      cardScale: isNarrow ? 0.82 : 1,
      height: Locator.uiLayer.uiData.height,
      isNarrow,
      scale: this.scale.x,
      width,
    })
  }

  // Создаёт постоянные элементы экрана.
  #init = (onContinue: GameMenuCallbacks['onContinue'], onPageSelect: GameMenuCallbacks['onPageSelect']) => {
    this.#createTitle()
    this.#createTabs(onPageSelect)
    this.#cardsContainer = new Container({label: 'location-cards'})
    this.addChild(this.#cardsContainer)
    this.#continueButton = this.#createContinueButton(onContinue)
    this.#unlockCelebration = new LocationUnlockCelebration()
    this.addChild(this.#continueButton, this.#unlockCelebration)
  }

  // Создаёт заголовок экрана.
  #createTitle = () => {
    const title = new Text({
      label: 'location-select-title',
      text: i18next.t('locationSelect.title'),
      style: {...primaryFontStyle, fill: 0xffe6a1, fontSize: 58, stroke: {color: 0x19251d, width: 7}},
    })
    title.anchor.set(0.5)
    title.y = -390
    this.addChild(title)
  }

  // Создаёт вкладки страниц локаций.
  #createTabs = (onPageSelect: GameMenuCallbacks['onPageSelect']) => {
    const tabsContainer = new Container({label: 'location-tabs'})
    this.#tabs = Array.from({length: 4}, (_, pageIndex) => {
      const from = pageIndex * PAGE_SIZE + 1
      const text = i18next.t('locationSelect.chapters', {from, to: from + PAGE_SIZE - 1})
      const tab = new LocationTab(pageIndex, text, onPageSelect)
      tabsContainer.addChild(tab)
      return tab
    })
    tabsContainer.y = -300
    this.addChild(tabsContainer)
  }

  // Создаёт кнопку продолжения игры.
  #createContinueButton = (onContinue: GameMenuCallbacks['onContinue']) => {
    const button = new Container({
      label: 'btnContinueAdventure',
      eventMode: 'static',
      cursor: 'pointer',
    })
    const background = new Graphics({label: 'btnContinueAdventure-background'})
    background.roundRect(-240, -50, 480, 100, 28).fill({color: 0x9fbd3b})
    background.stroke({color: 0xe7de83, width: 5})
    this.#continueTitle = new Text({
      label: 'btnContinueAdventure-title',
      text: i18next.t('locationSelect.continue'),
      style: {...primaryFontStyle, fill: 0x303b12, fontSize: 31},
    })
    this.#continueTitle.anchor.set(0.5)
    this.#continueTitle.y = -15
    this.#continueSubtitle = new Text({
      label: 'btnContinueAdventure-subtitle',
      text: '',
      style: {...primaryFontStyle, fill: 0x3e4b1d, fontSize: 22},
    })
    this.#continueSubtitle.anchor.set(0.5)
    this.#continueSubtitle.y = 22
    button.addChild(background, this.#continueTitle, this.#continueSubtitle)
    button.on('pointertap', onContinue)
    return button
  }

  // Обновляет подпись цели продолжения.
  #setContinueEntry = (entry: LevelEntry | null) => {
    if (!entry) return

    this.#continueSubtitle.text = i18next.t('locationSelect.continueLocation', {
      level: entry.locationLevelIndex + 1,
      location: i18next.t(entry.location.titleKey),
    })
  }

  // Запускает поздравление для только что открытой локации.
  #showUnlockCelebration = (location: LocationDefinition | null) => {
    if (!location) return this.#unlockCelebration.stop()

    const card = this.#cards.find(({locationId}) => locationId === location.id)
    const {height, width} = Locator.uiLayer.uiData
    const isNarrow = width < NARROW_LAYOUT_WIDTH
    this.#unlockCelebration.start({
      card,
      cardScale: card?.scale.x,
      height,
      isNarrow,
      locationName: i18next.t(location.titleKey),
      scale: this.scale.x,
      width,
    })
  }

  // Заменяет карточки данными текущей страницы.
  #replaceCards = (locations: LocationSelectionState[]) => {
    this.#cards.forEach((card) => card.destroy({children: true}))
    this.#cards = locations.map((location) => {
      const card = new LocationCard(location, this.#onLocationSelect)
      card.setState(location)
      this.#cardsContainer.addChild(card)
      return card
    })
  }

  // Располагает вкладки для широкой или узкой раскладки.
  #layoutTabs = (isNarrow: boolean) => {
    const tabsContainer = this.getChildByLabel('location-tabs')!
    const gap = isNarrow ? 136 : 270
    const scale = isNarrow ? 0.5 : 1
    tabsContainer.scale.set(scale)
    this.#tabs.forEach((tab, index) => tab.position.set(((index - 1.5) * gap) / scale, 0))
  }

  // Располагает карточки для широкой или узкой раскладки.
  #layoutCards = (isNarrow: boolean) => {
    const scale = isNarrow ? 0.82 : 1
    this.#cards.forEach((card, index) => {
      const column = isNarrow ? index % 2 : index
      const row = isNarrow ? Math.floor(index / 2) : 0
      const x = isNarrow ? (column - 0.5) * 250 : (column - 1.5) * 300
      const y = isNarrow ? -128 + row * 300 : 5
      card.scale.set(scale)
      card.position.set(x, y)
    })
  }
}
