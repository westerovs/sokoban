import i18next from 'i18next'
import {Circle, Container, Graphics, Text} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {primaryFontStyle} from '@/game/styles.ts'
import type {LocationSelectionState} from '../../menuTypes.js'
import LocationCatalogRow from './LocationCatalogRow.js'
import {CATALOG_COLORS} from './locationCatalogTheme.js'

// Показывает постраничный каталог локаций поверх основного экрана.

const PAGE_SIZE = 4 // Число строк на одной странице каталога

type LocationCatalogCallbacks = {
  onClose: () => void
  onLocationSelect: (locationId: string) => void
  onPageSelect: (pageIndex: number) => void
}

export default class LocationCatalogView extends Container {
  #background!: Graphics
  #back!: Container
  #callbacks: LocationCatalogCallbacks
  #locations: LocationSelectionState[] = []
  #next!: Container
  #pageIndex = 0
  #pageText!: Text
  #previous!: Container
  #rows: LocationCatalogRow[] = []
  #title!: Text

  constructor(callbacks: LocationCatalogCallbacks) {
    super({label: 'location-catalog-view', visible: false})
    this.#callbacks = callbacks
    this.#init()
  }

  // Обновляет данные каталога и создаёт только строки выбранной страницы.
  show = (locations: LocationSelectionState[], pageIndex: number) => {
    this.#locations = locations
    this.#pageIndex = pageIndex
    this.visible = true
    this.#replaceRows()
  }

  // Скрывает каталог и освобождает временные строки.
  hide = () => {
    this.visible = false
    this.#clearRows()
  }

  // Перестраивает панель одной колонкой в портрете и двумя в альбоме.
  resize = (isNarrow: boolean) => {
    if (!this.visible) return
    const {width: screenWidth, height: screenHeight} = Locator.uiLayer.uiData
    const width = isNarrow ? 540 : Math.min(1700, screenWidth - 100)
    const height = isNarrow ? 780 : Math.min(720, screenHeight - 100)
    this.#title.style.fontSize = isNarrow ? 40 : 60
    this.#pageText.style.fontSize = isNarrow ? 27 : 40
    this.#back.scale.set(isNarrow ? 1 : 1.3)
    this.#previous.scale.set(isNarrow ? 1 : 1.3)
    this.#next.scale.set(isNarrow ? 1 : 1.3)
    this.#drawBackground(width, height)
    this.#layoutHeader(width, height)
    this.#layoutRows(width, isNarrow ? 1 : 2)
  }

  // Создаёт постоянные части каталога.
  #init = () => {
    this.#createBackground()
    this.#createHeader()
    this.#createFooter()
  }

  // Создаёт общую светлую панель.
  #createBackground = () => {
    this.#background = new Graphics({label: 'location-catalog-background'})
    this.addChild(this.#background)
  }

  // Создаёт заголовок и кнопку возврата.
  #createHeader = () => {
    this.#title = new Text({
      label: 'location-catalog-title',
      text: i18next.t('locationSelect.allLocations'),
      style: {...primaryFontStyle, fill: CATALOG_COLORS.ink, fontSize: 40},
    })
    this.#title.anchor.set(0.5)
    this.#back = this.#createRoundButton('location-catalog-back', 'left', this.#callbacks.onClose)
    this.addChild(this.#title, this.#back)
  }

  // Создаёт кнопки листания и номер страницы.
  #createFooter = () => {
    this.#previous = this.#createRoundButton('location-catalog-previous', 'left', () => this.#selectPage(-1))
    this.#next = this.#createRoundButton('location-catalog-next', 'right', () => this.#selectPage(1))
    this.#pageText = new Text({
      label: 'location-catalog-page',
      style: {...primaryFontStyle, fill: CATALOG_COLORS.muted, fontSize: 27},
    })
    this.#pageText.anchor.set(0.5)
    this.addChild(this.#previous, this.#next, this.#pageText)
  }

  // Создаёт круглую светлую кнопку с векторной стрелкой.
  #createRoundButton = (label: string, direction: 'left' | 'right', onPress: () => void) => {
    const button = new Container({label, eventMode: 'static', cursor: 'pointer', hitArea: new Circle(0, 0, 34)})
    const background = new Graphics({label: `${label}-background`})
      .circle(0, 3, 34)
      .fill({color: 0x9b8b5b, alpha: 0.18})
      .circle(0, 0, 34)
      .fill(CATALOG_COLORS.background)
      .stroke({color: CATALOG_COLORS.border, width: 2})
    const arrow = new Graphics({label: `${label}-icon`})
      .moveTo(-4, -7)
      .lineTo(4, 0)
      .lineTo(-4, 7)
      .stroke({color: CATALOG_COLORS.ink, width: 3, join: 'round', cap: 'round'})
    arrow.rotation = direction === 'left' ? Math.PI : 0
    button.addChild(background, arrow)
    button.on('pointertap', onPress)
    return button
  }

  // Расставляет заголовок и нижнюю навигацию внутри панели.
  #layoutHeader = (width: number, height: number) => {
    const top = -height / 2
    const bottom = height / 2
    this.#back.position.set(-width / 2 + 54, top + 54)
    this.#title.position.set(22, top + 54)
    this.#previous.position.set(-170, bottom - 48)
    this.#next.position.set(170, bottom - 48)
    this.#pageText.position.set(0, bottom - 48)
  }

  // Раскладывает строки текущей страницы с равными отступами.
  #layoutRows = (width: number, columns: number) => {
    const gap = 14 // Расстояние между строками
    const rowWidth = (width - 40 - gap * (columns - 1)) / columns
    const rowHeight = columns === 1 ? 138 : 230
    const top = columns === 1 ? -278 : -230
    this.#rows.forEach((row, index) => {
      const column = index % columns
      const line = Math.floor(index / columns)
      row.position.set(-width / 2 + 20 + column * (rowWidth + gap), top + line * (rowHeight + gap))
      row.resize(rowWidth, rowHeight)
    })
  }

  // Рисует панель с мягкой тенью и кремовой рамкой.
  #drawBackground = (width: number, height: number) => {
    this.#background
      .clear()
      .roundRect(-width / 2, -height / 2 + 6, width, height, 32)
      .fill({color: 0x302817, alpha: 0.2})
      .roundRect(-width / 2, -height / 2, width, height, 32)
      .fill(CATALOG_COLORS.background)
      .stroke({color: CATALOG_COLORS.border, width: 3})
  }

  // Пересоздаёт строки только для видимой страницы.
  #replaceRows = () => {
    this.#clearRows()
    const start = this.#pageIndex * PAGE_SIZE
    this.#locations.slice(start, start + PAGE_SIZE).forEach((location, index) => {
      const previous = this.#locations[start + index - 1]
      const row = new LocationCatalogRow(
        location,
        previous ? i18next.t(previous.titleKey) : '',
        this.#callbacks.onLocationSelect,
      )
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
    this.#callbacks.onPageSelect(this.#pageIndex + offset)
  }

  // Удаляет строки предыдущей страницы.
  #clearRows = () => {
    this.#rows.forEach((row) => row.destroy({children: true}))
    this.#rows = []
  }
}
