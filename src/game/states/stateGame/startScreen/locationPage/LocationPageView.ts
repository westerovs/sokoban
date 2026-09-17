import i18next from 'i18next'
import {Container, Graphics, Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {primaryFontStyle} from '@/game/styles.ts'
import type {GameMenuCallbacks, LevelEntry, LocationDefinition, LocationSelectionState} from '../menuTypes.js'
import LocationCard, {CARD_HEIGHT, CARD_WIDTH} from './LocationCard.js'
import LocationTab, {LOCATION_TAB_WIDTH} from './locationTabs/LocationTab.ts'
import LocationTabsArrow, {LOCATION_PAGE_ARROW_RADIUS} from './locationTabs/LocationTabsArrow.ts'
import LocationUnlockCelebration from './LocationUnlockCelebration.js'

// Отображает страницы карточек локаций и кнопку продолжения игры.

const PAGE_SIZE = 4 // Количество локаций на одной странице
const NARROW_LAYOUT_WIDTH = 1200 // Порог переключения на узкую раскладку
const VISIBLE_TAB_COUNT = 3 // Максимальное количество одновременно видимых вкладок
const TAB_GAP = 270 // Расстояние между центрами соседних вкладок
const PAGE_ARROW_GAP = 52 // Отступ стрелки от края ряда вкладок
const NARROW_NAVIGATION_SCALE = 0.56 // Масштаб переключателя в узкой раскладке
const NARROW_CARD_SCALE = 0.82 // Масштаб карточек в портретной раскладке
const CARD_GAP = 45 // Единый промежуток между карточками по обеим осям
const WIDE_CARD_ROW_Y = -45 // Центр ряда карточек в альбомной раскладке
const NARROW_CARD_ROW_Y = -178 // Центр первого ряда карточек в портретной раскладке
const NAVIGATION_CARD_GAP = 24 // Отступ переключателя от верхнего края карточек

export default class LocationPageView extends Container {
  #cards: LocationCard[] = []
  #cardsContainer!: Container
  #continueButton!: Container
  #continueSubtitle!: Text
  #continueTitle!: Text
  #leftPageArrow!: LocationTabsArrow
  #onLocationSelect: GameMenuCallbacks['onLocationSelect']
  #onPageSelect: GameMenuCallbacks['onPageSelect']
  #pageNavigation!: Container
  #pageIndex = 0 // Текущая страница локаций
  #rightPageArrow!: LocationTabsArrow
  #tabs: LocationTab[] = []
  #tabsContainer!: Container
  #unlockCelebration!: LocationUnlockCelebration

  constructor({
    onContinue,
    onLocationSelect,
    onPageSelect,
  }: Pick<GameMenuCallbacks, 'onContinue' | 'onLocationSelect' | 'onPageSelect'>) {
    super({label: 'location-page-view'})

    this.#onLocationSelect = onLocationSelect
    this.#onPageSelect = onPageSelect
    this.#init(onContinue)
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
    this.#replaceTabs(locations.length)
    this.#replaceCards(locations.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE))
    this.#tabs.forEach((tab, index) => tab.setActive(index === pageIndex))
    this.#updatePageNavigation()
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
    this.#layoutCards(isNarrow)
    this.#layoutPageNavigation(isNarrow)
    this.#continueButton.position.set(0, isNarrow ? 445 : 410)
    this.#unlockCelebration.resize({
      cardScale: isNarrow ? NARROW_CARD_SCALE : 1,
      height: Locator.uiLayer.uiData.height,
      isNarrow,
      scale: this.scale.x,
      width,
    })
  }

  // Создаёт постоянные элементы экрана.
  #init = (onContinue: GameMenuCallbacks['onContinue']) => {
    this.#createTabsContainer()
    this.#createCardsContainer()
    this.#createContinueButton(onContinue)

    this.#unlockCelebration = new LocationUnlockCelebration()
    this.addChild(this.#continueButton, this.#unlockCelebration)
  }

  #createTabsContainer = () => {
    this.#pageNavigation = new Container({label: 'location-page-navigation'})
    this.#tabsContainer = new Container({label: 'location-tabs'})
    this.#leftPageArrow = new LocationTabsArrow('left', () => this.#selectRelativePage(-1))
    this.#rightPageArrow = new LocationTabsArrow('right', () => this.#selectRelativePage(1))
    this.#pageNavigation.addChild(this.#tabsContainer, this.#leftPageArrow, this.#rightPageArrow)
    this.addChild(this.#pageNavigation)
  }

  #createCardsContainer = () => {
    this.#cardsContainer = new Container({label: 'location-cards'})
    this.addChild(this.#cardsContainer)
  }

  // Заменяет вкладки согласно количеству доступных страниц.
  #replaceTabs = (locationCount: number) => {
    const pageCount = Math.ceil(locationCount / PAGE_SIZE)
    if (this.#tabs.length === pageCount) return

    this.#tabs.forEach((tab) => tab.destroy({children: true}))
    this.#tabs = Array.from({length: pageCount}, (_, pageIndex) => {
      const text = i18next.t('locationSelect.chapter', {chapter: pageIndex + 1})
      const tab = new LocationTab(pageIndex, text, this.#onPageSelect)
      this.#tabsContainer.addChild(tab)
      return tab
    })
  }

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

    this.#continueButton = button
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

  // Выравнивает переключатель относительно верхнего края карточек.
  #layoutPageNavigation = (isNarrow: boolean) => {
    const navigationScale = isNarrow ? NARROW_NAVIGATION_SCALE : 1
    const cardScale = isNarrow ? NARROW_CARD_SCALE : 1
    const rowY = isNarrow ? NARROW_CARD_ROW_Y : WIDE_CARD_ROW_Y
    const cardTop = rowY - (CARD_HEIGHT * cardScale) / 2
    const navigationY = cardTop - NAVIGATION_CARD_GAP - LOCATION_PAGE_ARROW_RADIUS * navigationScale
    this.#pageNavigation.position.set(0, navigationY)
    this.#pageNavigation.scale.set(navigationScale)
    this.#updatePageNavigation()
  }

  // Показывает окно вкладок вокруг текущей страницы и обновляет крайние стрелки.
  #updatePageNavigation = () => {
    const visibleCount = Math.min(VISIBLE_TAB_COUNT, this.#tabs.length)
    const firstVisibleIndex = this.#getFirstVisibleTabIndex()
    this.#tabs.forEach((tab, index) => {
      const visibleIndex = index - firstVisibleIndex
      tab.visible = visibleIndex >= 0 && visibleIndex < visibleCount
      tab.position.set((visibleIndex - (visibleCount - 1) / 2) * TAB_GAP, 0)
    })
    const arrowX = (LOCATION_TAB_WIDTH + (visibleCount - 1) * TAB_GAP) / 2 + PAGE_ARROW_GAP
    this.#leftPageArrow.position.set(-arrowX, 0)
    this.#rightPageArrow.position.set(arrowX, 0)
    this.#leftPageArrow.visible = this.#pageIndex > 0
    this.#rightPageArrow.visible = this.#pageIndex < this.#tabs.length - 1
  }

  // Рассчитывает начало видимого окна вкладок с учётом краёв списка.
  #getFirstVisibleTabIndex = () => {
    const preferredIndex = this.#pageIndex - Math.floor(VISIBLE_TAB_COUNT / 2)
    const maxIndex = Math.max(this.#tabs.length - VISIBLE_TAB_COUNT, 0)
    return Math.min(Math.max(preferredIndex, 0), maxIndex)
  }

  // Запрашивает соседнюю страницу, если она существует.
  #selectRelativePage = (offset: number) => {
    const pageIndex = this.#pageIndex + offset
    if (pageIndex < 0 || pageIndex >= this.#tabs.length) return

    this.#onPageSelect(pageIndex)
  }

  // Располагает карточки для широкой или узкой раскладки.
  #layoutCards = (isNarrow: boolean) => {
    const scale = isNarrow ? NARROW_CARD_SCALE : 1
    const columnCount = isNarrow ? 2 : PAGE_SIZE
    const columnStep = CARD_WIDTH * scale + CARD_GAP
    const rowStep = CARD_HEIGHT * scale + CARD_GAP
    this.#cards.forEach((card, index) => {
      const column = index % columnCount
      const row = Math.floor(index / columnCount)
      const x = (column - (columnCount - 1) / 2) * columnStep
      const y = (isNarrow ? NARROW_CARD_ROW_Y : WIDE_CARD_ROW_Y) + row * rowStep
      card.scale.set(scale)
      card.position.set(x, y)
    })
  }
}
