import i18next from 'i18next'
import {Sprite, Text} from 'pixi.js'
import {primaryFontStyle} from '@/game/styles.ts'
import BaseModal from '@/game/ui/common/modal/BaseModal.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.ts'
import type {LocationSelectionState} from '../../menuTypes.js'
import LocationCatalogRow from './LocationCatalogRow.js'

// Показывает постраничный каталог локаций поверх основного экрана.

const PAGE_SIZE = 6 // Число строк на одной странице каталога
const CATALOG_WIDTH = 540 // Фиксированная ширина портретной панели
const CATALOG_HEIGHT = 780 // Фиксированная высота портретной панели
const POPUP_BORDER_SIZE = 72 // Размер сохраняемых краёв деревянной панели
const CLOSE_BUTTON_INSET = 44 // Смещение крестика внутрь деревянной рамки
const ROW_WIDTH = 460 // Ширина деревянной вкладки локации
const ROW_HEIGHT = 92 // Высота деревянной вкладки локации
const ROW_GAP = 6 // Расстояние между вкладками локаций
const ROWS_TOP = -292 // Верхняя позиция первой вкладки

type LocationCatalogCallbacks = {
  onClose: () => void
  onLocationSelect: (locationId: string) => void
}

export default class LocationCatalogView extends BaseModal {
  #callbacks: LocationCatalogCallbacks
  #locations: LocationSelectionState[] = []
  #next!: Sprite
  #pageIndex = 0
  #pageText!: Text
  #previous!: Sprite
  #rows: LocationCatalogRow[] = []

  constructor(callbacks: LocationCatalogCallbacks) {
    super({
      label: 'location-catalog-view',
      w: CATALOG_WIDTH,
      h: CATALOG_HEIGHT,
      crossOffset: {x: CLOSE_BUTTON_INSET, y: -CLOSE_BUTTON_INSET},
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

  // Обновляет данные каталога и создаёт только строки выбранной страницы.
  setData = (locations: LocationSelectionState[], firstVisibleLocationIndex: number) => {
    this.#locations = locations
    this.#pageIndex = Math.floor(firstVisibleLocationIndex / PAGE_SIZE)
    this.#replaceRows()
  }

  override hide = async () => {
    if (this.destroyed) return

    this.#clearRows()
    this.#callbacks.onClose()
    await super.hide()
  }

  // Сохраняет портретную одноколоночную компоновку при любой ориентации.
  resize = () => {
    this.updateAdaptive()
    this.#layoutFooter(CATALOG_HEIGHT)
    this.#layoutRows()
  }

  // Создаёт постоянные части каталога.
  #init = () => {
    this.#setHeaderText()
    this.#createFooter()
  }

  // Устанавливает локализованный заголовок штатного фрейма модального окна.
  #setHeaderText = () => {
    if (!this.headerText) return
    this.headerText.text = i18next.t('locationSelect.allLocations')
  }

  // Создаёт кнопки листания и номер страницы.
  #createFooter = () => {
    this.#previous = this.#createPageButton('location-catalog-previous', 'left', () => this.#selectPage(-1))
    this.#next = this.#createPageButton('location-catalog-next', 'right', () => this.#selectPage(1))
    this.#pageText = new Text({
      label: 'location-catalog-page',
      style: {
        ...primaryFontStyle,
        fill: 0xffe6a1,
        fontSize: 27,
        stroke: {color: 0x5a2d0b, width: 3, join: 'round'},
      },
    })
    this.#pageText.anchor.set(0.5)
    this.addChild(this.#previous, this.#next, this.#pageText)
  }

  // Создаёт кнопку листания из текстуры вкладочной стрелки.
  #createPageButton = (label: string, direction: 'left' | 'right', onPress: () => void) => {
    const arrow = GameUtils.createSprite('tab-arrow', {label, interactive: true})
    arrow.scale.x = direction === 'left' ? 1 : -1
    arrow.on('pointertap', onPress)

    return arrow
  }

  // Расставляет нижнюю навигацию внутри панели.
  #layoutFooter = (height: number) => {
    const bottom = height / 2
    this.#previous.position.set(-170, bottom - 48)
    this.#next.position.set(170, bottom - 48)
    this.#pageText.position.set(0, bottom - 48)
  }

  // Раскладывает строки текущей страницы с равными отступами.
  #layoutRows = () => {
    this.#rows.forEach((row, index) => {
      row.position.set(-ROW_WIDTH / 2, ROWS_TOP + index * (ROW_HEIGHT + ROW_GAP))
      row.resize(ROW_WIDTH, ROW_HEIGHT)
    })
  }

  // Пересоздаёт строки только для видимой страницы.
  #replaceRows = () => {
    this.#clearRows()
    const start = this.#pageIndex * PAGE_SIZE
    this.#locations.slice(start, start + PAGE_SIZE).forEach((location) => {
      const row = new LocationCatalogRow(location, this.#callbacks.onLocationSelect)
      this.#rows.push(row)
      this.addChild(row)
    })
    this.#updateFooter()
  }

  // Обновляет доступность стрелок и номер страницы.
  #updateFooter = () => {
    const pageCount = Math.max(1, Math.ceil(this.#locations.length / PAGE_SIZE))
    this.#previous.visible = this.#pageIndex > 0
    this.#next.visible = this.#pageIndex < pageCount - 1
    this.#pageText.text = `${this.#pageIndex + 1} / ${pageCount}`
  }

  // Запрашивает соседнюю страницу каталога.
  #selectPage = (offset: number) => {
    const pageCount = Math.max(1, Math.ceil(this.#locations.length / PAGE_SIZE))
    const pageIndex = this.#pageIndex + offset
    if (pageIndex < 0 || pageIndex >= pageCount) return

    this.#pageIndex = pageIndex
    this.#replaceRows()
    this.#layoutRows()
  }

  // Удаляет строки предыдущей страницы.
  #clearRows = () => {
    this.#rows.forEach((row) => row.destroy({children: true}))
    this.#rows = []
  }
}
