import {ScrollBox} from '@pixi/ui'
import i18next from 'i18next'
import {Graphics} from 'pixi.js'
import BaseModal from '@/game/ui/common/modal/BaseModal.ts'
import type {LocationSelectionState} from '../../menuTypes.js'
import LocationCatalogRow from './LocationCatalogRow.js'
import {CATALOG_COLORS} from './locationCatalogTheme.js'

// Показывает прокручиваемый каталог всех игровых локаций.

const CATALOG_WIDTH = 540 // Фиксированная ширина портретной панели
const CATALOG_HEIGHT = 780 // Фиксированная высота портретной панели
const POPUP_BORDER_SIZE = 72 // Размер сохраняемых краёв деревянной панели
const ROW_WIDTH = 460 // Ширина деревянной вкладки локации
const ROW_HEIGHT = 92 // Высота деревянной вкладки локации
const ROW_GAP = 6 // Расстояние между вкладками локаций
const LIST_TOP = -292 // Верхняя граница области прокрутки
const LIST_HEIGHT = 620 // Высота видимой области прокрутки
const SCROLL_TRACK_X = 240 // Горизонтальная позиция индикатора прокрутки
const SCROLL_TRACK_WIDTH = 8 // Ширина дорожки индикатора
const MIN_SCROLL_THUMB_HEIGHT = 42 // Минимальная высота бегунка

type LocationCatalogCallbacks = {
  onClose: () => void
  onLocationSelect: (locationId: string) => void
}

export default class LocationCatalogView extends BaseModal {
  #callbacks: LocationCatalogCallbacks
  #rows: LocationCatalogRow[] = []
  #scrollBox!: ScrollBox
  #scrollThumb!: Graphics
  #scrollThumbHeight = 0
  #scrollTrack!: Graphics

  constructor(callbacks: LocationCatalogCallbacks) {
    super({
      label: 'location-catalog-view',
      w: CATALOG_WIDTH,
      h: CATALOG_HEIGHT,
      forceUpdateAdaptive: true,
      isNeedCloseButton: true,
      isNeedHeader: true,
      isSprite: true,
      nineSlice: {
        left: POPUP_BORDER_SIZE,
        top: POPUP_BORDER_SIZE,
        right: POPUP_BORDER_SIZE,
        bottom: POPUP_BORDER_SIZE,
      },
      spriteTexture: 'main-pop-up',
    })
    this.#callbacks = callbacks
    this.#init()
  }

  // Наполняет список всеми локациями и прокручивает к текущей группе.
  setData = (locations: LocationSelectionState[], firstVisibleLocationIndex: number) => {
    this.#replaceRows(locations)
    this.#scrollBox.scrollToPosition({y: firstVisibleLocationIndex * (ROW_HEIGHT + ROW_GAP)})
    this.#updateScrollProgress()
  }

  override hide = async (playClickSound = true) => {
    if (this.destroyed) return

    this.#clearRows()
    this.#callbacks.onClose()
    await super.hide(playClickSound)
  }

  // Сохраняет портретную одноколоночную компоновку при любой ориентации.
  resize = () => {
    this.updateAdaptive()
    this.#layoutScrollBox()
    this.#updateScrollProgress()
  }

  // Создаёт постоянные части прокручиваемого каталога.
  #init = () => {
    this.#setHeaderText()
    this.#createScrollBox()
    this.#createScrollProgress()
    this.#layoutScrollBox()
    this.onRender = this.#updateScrollProgress
  }

  // Устанавливает локализованный заголовок штатного фрейма модального окна.
  #setHeaderText = () => {
    if (!this.headerText) return
    this.headerText.text = i18next.t('locationSelect.allLocations')
  }

  // Создаёт область прокрутки с управлением пальцем и колесом мыши.
  #createScrollBox = () => {
    this.#scrollBox = new ScrollBox({
      width: ROW_WIDTH,
      height: LIST_HEIGHT,
      type: 'vertical',
      elementsMargin: ROW_GAP,
      globalScroll: false,
    })
    this.#scrollBox.label = 'location-catalog-scroll-box'
    this.addChild(this.#scrollBox)
  }

  // Создаёт дорожку и бегунок прогресса прокрутки.
  #createScrollProgress = () => {
    this.#scrollTrack = new Graphics({label: 'location-catalog-scroll-track'})
      .roundRect(0, 0, SCROLL_TRACK_WIDTH, LIST_HEIGHT, SCROLL_TRACK_WIDTH / 2)
      .fill({color: CATALOG_COLORS.muted, alpha: 0.28})
    this.#scrollThumb = new Graphics({label: 'location-catalog-scroll-thumb'})
    this.addChild(this.#scrollTrack, this.#scrollThumb)
  }

  // Размещает список и индикатор внутри деревянной панели.
  #layoutScrollBox = () => {
    this.#scrollBox.position.set(-ROW_WIDTH / 2, LIST_TOP)
    this.#scrollTrack.position.set(SCROLL_TRACK_X, LIST_TOP)
    this.#scrollThumb.x = SCROLL_TRACK_X
  }

  // Пересоздаёт строки и отдаёт их компоненту прокрутки.
  #replaceRows = (locations: LocationSelectionState[]) => {
    this.#clearRows()
    this.#rows = locations.map((location) => this.#createRow(location))
    this.#scrollBox.addItems(this.#rows)
    this.#scrollBox.resize(true)
    this.#drawScrollThumb()
  }

  // Создаёт одну строку заранее известного размера.
  #createRow = (location: LocationSelectionState) => {
    const row = new LocationCatalogRow(location, this.#callbacks.onLocationSelect)
    row.resize(ROW_WIDTH, ROW_HEIGHT)
    return row
  }

  // Перерисовывает бегунок с учётом доли видимого содержимого.
  #drawScrollThumb = () => {
    const contentHeight = this.#scrollBox.scrollHeight
    const visibleRatio = contentHeight > 0 ? Math.min(1, LIST_HEIGHT / contentHeight) : 1
    this.#scrollThumbHeight = Math.max(MIN_SCROLL_THUMB_HEIGHT, LIST_HEIGHT * visibleRatio)
    this.#scrollThumb.clear()
    this.#scrollThumb
      .roundRect(0, 0, SCROLL_TRACK_WIDTH, this.#scrollThumbHeight, SCROLL_TRACK_WIDTH / 2)
      .fill(CATALOG_COLORS.ink)
  }

  // Синхронизирует видимость и положение бегунка с прокруткой списка.
  #updateScrollProgress = () => {
    const maxScroll = Math.max(0, this.#scrollBox.scrollHeight - LIST_HEIGHT)
    const scrollPosition = Math.min(maxScroll, Math.max(0, -this.#scrollBox.scrollY))
    const progress = maxScroll > 0 ? scrollPosition / maxScroll : 0
    const progressRange = LIST_HEIGHT - this.#scrollThumbHeight
    const isScrollable = maxScroll > 0
    this.#scrollTrack.visible = isScrollable
    this.#scrollThumb.visible = isScrollable
    this.#scrollThumb.y = LIST_TOP + progressRange * progress
  }

  // Удаляет прежние строки перед повторным наполнением списка.
  #clearRows = () => {
    this.#scrollBox.removeItems()
    this.#rows.forEach((row) => row.destroy({children: true}))
    this.#rows = []
  }
}
