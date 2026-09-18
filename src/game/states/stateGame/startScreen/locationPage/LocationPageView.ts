import i18next from 'i18next'
import type {DestroyOptions} from 'pixi.js'
import {Container, Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import LocationNav from '@/game/states/stateGame/startScreen/locationPage/locationNav/LocationNav.ts'
import {primaryFontStyle} from '@/game/styles.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import type {HintStep} from '@/game/utils/Hint.ts'
import Hint from '@/game/utils/Hint.ts'
import type {GameMenuCallbacks, LevelEntry, LocationSelectionState} from '../menuTypes.js'
import LocationCarousel from './locationCarousel/LocationCarousel.ts'
import LocationCatalogView from './locationCatalog/LocationCatalogView.js'

// Отображает страницы карточек локаций и кнопку продолжения игры.

const PAGE_SIZE = 4 // Количество локаций на одной странице
const LAYOUT_WIDTH = 560 // Базовая ширина портретной раскладки
const LAYOUT_HORIZONTAL_PADDING = 28 // Суммарный горизонтальный отступ раскладки
const NAVIGATION_CARD_GAP = 24 // Отступ переключателя от верхнего края карточки
const CONTINUE_CONTROLS_GAP = 160 // Отступ кнопки продолжения от элементов карусели
const CAROUSEL_HINT_STEPS: readonly HintStep[] = [
  {type: 'swipe', deltaX: -120},
  {type: 'swipe', deltaX: 120},
  {type: 'tap'},
]

export default class LocationPageView extends Container {
  #carousel!: LocationCarousel
  #continueButton!: Container
  #continueSubtitle!: Text
  #continueTitle!: Text
  #hint!: Hint
  #hintShown = false
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
    this.visible = false
    this.#init(onContinue)
  }

  // Показывает указанную страницу локаций и запускает обучение один раз за открытие экрана.
  show = (locations: LocationSelectionState[], pageIndex: number, continueEntry: LevelEntry | null) => {
    const isNewVisit = !this.visible
    this.visible = true
    if (isNewVisit) this.#hintShown = false
    this.#setData(locations, pageIndex, continueEntry)
    if (isNewVisit) this.#showHintOnce()
  }

  // Скрывает экран выбора локации.
  hide = () => {
    this.visible = false
    this.#catalogOpen = false
    void this.#catalog?.hide(false)
    this.#carousel.setPaused(true)
    this.#hint.stop()
  }

  // Перестраивает расположение элементов под текущий размер окна.
  updateAdaptive = () => {
    const {width} = Locator.uiLayer.uiData
    const layoutWidth = Math.max(LAYOUT_WIDTH, this.#carousel.preferredWidth)
    this.position.set(0)
    this.scale.set(Math.min((width - LAYOUT_HORIZONTAL_PADDING) / layoutWidth, 1))
    this.#carousel.layout()
    this.#layoutPageNavigation()
    this.#catalog?.resize()
    this.#continueButton.position.set(0, this.#carousel.controlsY + CONTINUE_CONTROLS_GAP)
  }

  override destroy(options?: DestroyOptions) {
    this.#hint.stop()
    this.#carousel.setPaused(true)
    this.#catalog?.destroy({children: true})
    this.#catalog = null
    const destroyOptions = typeof options === 'boolean' ? {children: true} : {...options, children: true}
    super.destroy(destroyOptions)
  }

  #setData = (locations: LocationSelectionState[], pageIndex: number, continueEntry: LevelEntry | null) => {
    this.#locations = locations
    this.#pageIndex = pageIndex
    this.#replaceTabs(locations.length)
    this.#hint.stop()
    this.#carousel.setData(locations.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE))
    this.#chapterSelector.setText(i18next.t('locationSelect.chapter', {chapter: pageIndex + 1}))
    this.#updatePageNavigation()
    this.#setContinueEntry(continueEntry)
    this.updateAdaptive()
    if (this.#catalogOpen) this.#showCatalog()
  }

  // Создаёт постоянные элементы экрана.
  #init = (onContinue: GameMenuCallbacks['onContinue']) => {
    this.#createTabsContainer()
    this.#createCarousel()
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

  #createCarousel = () => {
    this.#carousel = new LocationCarousel({
      onInteraction: this.#stopHint,
      onLocationSelect: this.#onLocationSelect,
    })
    this.addChild(this.#carousel)
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

    const background = GameUtils.createSprite('btn-primary', {label: 'btnContinueAdventure-background'})
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

  // Выравнивает переключатель относительно верхнего края карточек.
  #layoutPageNavigation = () => {
    const navigationY = this.#carousel.cardTop - NAVIGATION_CARD_GAP - this.#chapterSelector.height / 2
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
    this.#carousel.visible = visible
    this.#carousel.setPaused(!visible)
    this.#continueButton.visible = visible
    if (!visible) this.#hint.stop()
  }

  #showHintOnce = () => {
    const target = this.#carousel.selectedCard
    if (this.#hintShown || this.#catalogOpen || !target) return
    this.#hintShown = true
    this.#hint.start(target, {steps: CAROUSEL_HINT_STEPS, targetPoint: {x: 0, y: 0}})
  }

  #stopHint = () => {
    this.#hint.stop()
  }
}
