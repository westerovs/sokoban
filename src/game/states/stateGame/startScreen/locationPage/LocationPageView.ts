import i18next from 'i18next'
import {Container, Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import LocationNav from '@/game/states/stateGame/startScreen/locationPage/locationNav/LocationNav.ts'
import {primaryFontStyle} from '@/game/styles.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import Hint from '@/game/utils/Hint.ts'
import type {GameMenuCallbacks, LevelEntry, LocationSelectionState} from '../menuTypes.js'
import LocationCard, {CARD_HEIGHT, CARD_WIDTH} from './locationCard/LocationCard.ts'
import LocationCatalogView from './locationCatalog/LocationCatalogView.js'

// Отображает страницы карточек локаций и кнопку продолжения игры.

const PAGE_SIZE = 4 // Количество локаций на одной странице
const CARD_GAP = 25 // Единый промежуток между карточками по обеим осям
const CARD_ROW_Y = -178 // Центр первого ряда карточек
const LAYOUT_WIDTH = 560 // Базовая ширина портретной раскладки
const LAYOUT_HORIZONTAL_PADDING = 28 // Суммарный горизонтальный отступ раскладки
const CONTINUE_BUTTON_Y = 445 // Вертикальная позиция кнопки продолжения
const NAVIGATION_CARD_GAP = 24 // Отступ переключателя от верхнего края карточек

export default class LocationPageView extends Container {
  #cards: LocationCard[] = []
  #cardsContainer!: Container
  #continueButton!: Container
  #continueSubtitle!: Text
  #continueTitle!: Text
  #hint!: Hint
  #catalog: LocationCatalogView | null = null
  #catalogOpen = false
  #chapterSelector!: LocationNav
  #locations: LocationSelectionState[] = []
  #onLocationSelect: GameMenuCallbacks['onLocationSelect']
  #onPageSelect: GameMenuCallbacks['onPageSelect']
  #pageNavigation!: Container
  #pageIndex = 0 // Текущая страница локаций
  #tabsContainer!: Container
  #pageCount = 0

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
  setData = (locations: LocationSelectionState[], pageIndex: number, continueEntry: LevelEntry | null) => {
    this.#locations = locations
    this.#pageIndex = pageIndex
    this.#replaceTabs(locations.length)
    this.#replaceCards(locations.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE))
    this.#chapterSelector.setText(i18next.t('locationSelect.chapter', {chapter: pageIndex + 1}))
    this.#updatePageNavigation()
    this.#setContinueEntry(continueEntry)
    this.updateAdaptive()
    if (this.#catalogOpen) this.#showCatalog()
    this.#syncHint()
  }

  // Скрывает экран выбора локации.
  hide = () => {
    this.visible = false
    this.#catalogOpen = false
    void this.#catalog?.hide(false)
    this.#hint.stop()
  }

  // Перестраивает расположение элементов под текущий размер окна.
  updateAdaptive = () => {
    const {width} = Locator.uiLayer.uiData
    this.position.set(0)
    this.scale.set(Math.min((width - LAYOUT_HORIZONTAL_PADDING) / LAYOUT_WIDTH, 1))
    this.#layoutCards()
    this.#layoutPageNavigation()
    this.#catalog?.resize()
    this.#continueButton.position.set(0, CONTINUE_BUTTON_Y)
  }

  // Создаёт постоянные элементы экрана.
  #init = (onContinue: GameMenuCallbacks['onContinue']) => {
    this.#createTabsContainer()
    this.#createCardsContainer()
    this.#createContinueButton(onContinue)
    this.#createHint()

    this.addChild(this.#continueButton, this.#hint)
  }

  #createTabsContainer = () => {
    this.#pageNavigation = new Container({label: 'location-page-navigation'})
    this.#tabsContainer = new Container({label: 'location-tabs'})
    this.#chapterSelector = new LocationNav({
      onNext: () => this.#selectRelativePage(1),
      onOpenCatalog: this.#openCatalog,
      onPrevious: () => this.#selectRelativePage(-1),
    })
    this.#tabsContainer.addChild(this.#chapterSelector)
    this.#pageNavigation.addChild(this.#tabsContainer)
    this.addChild(this.#pageNavigation)
  }

  #createCardsContainer = () => {
    this.#cardsContainer = new Container({label: 'location-cards'})
    this.addChild(this.#cardsContainer)
  }

  #createHint = () => {
    this.#hint = new Hint()
  }

  // Создаёт каталог, который открывается поверх карточек по нажатию на главу.
  #createCatalog = () => {
    this.#catalog = new LocationCatalogView({
      onClose: this.#closeCatalog,
      onLocationSelect: this.#onLocationSelect,
    })
  }

  // Заменяет вкладки согласно количеству доступных страниц.
  #replaceTabs = (locationCount: number) => {
    this.#pageCount = Math.ceil(locationCount / PAGE_SIZE)
  }

  #createContinueButton = (onContinue: GameMenuCallbacks['onContinue']) => {
    const button = new Container({
      label: 'btnContinueAdventure',
      eventMode: 'static',
      cursor: 'pointer',
    })

    const background = GameUtils.createSprite('btn-primary')
    background.scale.set(1.5)

    this.#continueTitle = new Text({
      label: 'btnContinueAdventure-title',
      text: i18next.t('locationSelect.continue'),
      style: {
        ...primaryFontStyle,
        fill: 0xffffff,
        fontSize: 36,
        letterSpacing: 2,
        stroke: {color: 0x102217, width: 5, join: 'round'},
      },
    })
    this.#continueTitle.anchor.set(0.5)
    this.#continueTitle.y = -14

    this.#continueSubtitle = new Text({
      label: 'btnContinueAdventure-subtitle',
      text: '',
      style: {...primaryFontStyle, fill: 0x3e4b1d, fontSize: 22},
    })
    this.#continueSubtitle.anchor.set(0.5)
    this.#continueSubtitle.y = 18

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

  // Заменяет карточки данными текущей страницы.
  #replaceCards = (locations: LocationSelectionState[]) => {
    this.#hint.stop()
    this.#cards.forEach((card) => card.destroy({children: true}))
    this.#cards = locations.map((location) => {
      const card = new LocationCard(location, this.#onLocationSelect)
      card.setState(location)
      this.#cardsContainer.addChild(card)
      return card
    })
  }

  // Выравнивает переключатель относительно верхнего края карточек.
  #layoutPageNavigation = () => {
    const cardScale = 1
    const cardTop = CARD_ROW_Y - (CARD_HEIGHT * cardScale) / 2
    const navigationHalfHeight = this.#chapterSelector.height / 2
    const navigationY = cardTop - NAVIGATION_CARD_GAP - navigationHalfHeight
    this.#pageNavigation.position.set(0, navigationY)
    this.#pageNavigation.scale.set(1)
    this.#updatePageNavigation()
  }

  // Показывает окно вкладок вокруг текущей страницы и обновляет крайние стрелки.
  #updatePageNavigation = () => {
    this.#chapterSelector.setNavigationState(this.#pageIndex > 0, this.#pageIndex < this.#pageCount - 1)
  }

  // Запрашивает соседнюю страницу, если она существует.
  #selectRelativePage = (offset: number) => {
    const pageIndex = this.#pageIndex + offset
    if (pageIndex < 0 || pageIndex >= this.#pageCount) return

    this.#catalogOpen = false
    this.#hint.stop()
    this.#onPageSelect(pageIndex)
  }

  // Открывает каталог и скрывает элементы основного экрана под ним.
  #openCatalog = () => {
    this.#catalogOpen = true
    this.#showCatalog()
  }

  // Синхронизирует содержимое открытого каталога с текущей страницей.
  #showCatalog = () => {
    const shouldOpen = !this.#catalog
    if (shouldOpen) this.#createCatalog()
    Locator.soundManager.play('sfx_btnClick')

    this.#setMainContentVisible(false)
    this.#catalog!.setData(this.#locations, this.#pageIndex * PAGE_SIZE)
    this.#catalog!.resize()
    if (shouldOpen) void this.#catalog!.show()
  }

  // Закрывает каталог и возвращает прежний главный экран.
  #closeCatalog = () => {
    this.#catalogOpen = false
    this.#catalog = null
    this.#setMainContentVisible(true)
  }

  // Одновременно переключает карточки, навигацию и кнопку продолжения.
  #setMainContentVisible = (visible: boolean) => {
    this.#pageNavigation.visible = visible
    this.#cardsContainer.visible = visible
    this.#continueButton.visible = visible
    if (visible) this.#syncHint()
    else {
      this.#hint.stop()
    }
  }

  #syncHint = () => {
    if (this.#catalogOpen) return this.#hint.stop()

    const activeLocation = this.#locations.find(({isCurrent, isUnlocked}) => isCurrent && isUnlocked)
    const activeCard = this.#cards.find(({locationId}) => locationId === activeLocation?.id)
    if (activeCard) this.#hint.start(activeCard, {x: 0, y: 0})
    else this.#hint.stop()
  }

  // Располагает карточки в постоянной портретной сетке.
  #layoutCards = () => {
    const scale = 1
    const columnCount = 2
    const columnStep = CARD_WIDTH * scale + CARD_GAP
    const rowStep = CARD_HEIGHT * scale + CARD_GAP

    this.#cards.forEach((card, index) => {
      const column = index % columnCount
      const row = Math.floor(index / columnCount)
      const x = (column - (columnCount - 1) / 2) * columnStep
      const y = CARD_ROW_Y + row * rowStep
      // card.scale.set(scale)
      card.position.set(x, y)
    })
  }
}
