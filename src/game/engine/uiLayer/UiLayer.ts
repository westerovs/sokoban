import {Container, Rectangle} from 'pixi.js'
import FadeOverlay from '@/game/engine/uiLayer/FadeOverlay.js'
import {WORLD} from '@/game/gameConfig/constants.js'
import DebugRect from '@/game/utils/debug/DebugRect.js'
import type {AdaptiveView, AlignRightOptions, UiData} from './AdaptiveLayout.js'
import AdaptiveLayout from './AdaptiveLayout.js'
import ModalLayer from './ModalLayer.js'

/**
 * Создаёт контейнер для UI элементов
 *<pre>
 * UiLayer
 * ├── globalUiLayer
 * ├── stateUiLayer
 * └── modalLayer
 * </pre>
 * Сам контейнер может служить для элементов которые нужны на всех экранах,
 * такие элементы не очищаются при переключении стейтов.
 *
 * globalUiLayer хранит постоянные элементы интерфейса между стейтами.
 * stateUiLayer хранит временные элементы текущего стейта: меню, кнопки и подсказки.
 * modalLayer хранит общий fade и открытое модальное окно поверх всего остального UI.
 * При переходе на новый стейт очищается только stateUiLayer.
 * */

type ModalView = AdaptiveView

export type UiSize = {
  width: number
  height: number
}

export default class UiLayer extends Container {
  #globalUiLayer!: Container
  #stateUiLayer!: Container
  #modalLayer!: ModalLayer
  #uiData!: UiData
  #debugRect: DebugRect | null = null
  #fade: FadeOverlay | null = null
  readonly #uiBounds = new Rectangle()
  readonly #uiPadding = 40
  readonly #adaptiveLayout = new AdaptiveLayout(this.#uiPadding)
  readonly #isDebug = false

  constructor() {
    super()

    this.zIndex = 1
    this.label = 'UiLayer'
    this.sortableChildren = true
    this.boundsArea = this.#uiBounds

    this.#init()
  }

  get uiData() {
    return this.#uiData
  }

  get ui() {
    return this
  }

  get stateUiLayer() {
    return this.#stateUiLayer
  }

  get globalUiLayer() {
    return this.#globalUiLayer
  }

  get modalLayer() {
    return this.#modalLayer
  }

  public destroyStateUiLayerChildren = () => {
    this.destroyFade()
    const children = this.#stateUiLayer.removeChildren()

    children.forEach((child) => {
      child.destroy({children: true})
    })
  }

  public resize = () => {
    this.#setUiData()
    this.#updateBoundsArea()

    this.pivot.set(this.#uiData.width / 2, this.#uiData.height / 2)
    this.position.set(WORLD.HALF_W, WORLD.HALF_H)

    this.#resizeUiChildren()

    this.#debugRect?.update(this.#uiData)
    this.#fade?.update(this.#uiData)
    this.#modalLayer.resize(this.#uiData)
  }

  public openModal = (view: ModalView) => {
    const isOpened = this.#modalLayer.open(view)
    if (isOpened) this.resizeAdaptive(view)

    return isOpened
  }

  public closeModal = (view: ModalView) => {
    this.#modalLayer.close(view)
  }

  // метод, который принимает вьюху и подгоняет её размер и позиционирование под мир игры
  public resizeAdaptive = (view: AdaptiveView) => {
    this.#adaptiveLayout.resizeAdaptive(view, this.#uiData)
  }

  // прижать элемент к правому краю
  public alignRight = (view: AdaptiveView, options: AlignRightOptions = {}) => {
    this.#adaptiveLayout.alignRight(view, this.#uiData, options)
  }

  public createFade = (positionIndex: number = 0) => {
    if (this.#fade) return this.#fade

    this.#fade = new FadeOverlay()
    this.#stateUiLayer.addChildAt(this.#fade, positionIndex)
    this.#fade.update(this.#uiData)

    return this.#fade
  }

  public destroyFade = () => {
    if (!this.#fade) return

    this.#fade.destroy()
    this.#fade = null
  }

  #init = () => {
    this.#setUiData()
    this.#updateBoundsArea()
    this.#createGlobalUiLayer()
    this.#createStateUiLayer()
    this.#createDebugRect()
    this.#createModalLayer()
  }

  #setUiData = () => {
    const scaleFactorX = Math.min(WORLD.WIDTH / window.innerWidth, WORLD.HEIGHT / window.innerHeight)
    const width = window.innerWidth * scaleFactorX

    const scaleFactorY = WORLD.HEIGHT / window.innerHeight
    const height = window.innerHeight * scaleFactorY

    this.#uiData = {
      scaleFactorX,
      scaleFactorY,
      width,
      widthWithPadding: width - this.#uiPadding,
      height,
      heightWithPadding: height - this.#uiPadding,
      center: {x: width / 2, y: height / 2},
    }
  }

  #updateBoundsArea = () => {
    this.#uiBounds.set(0, 0, this.#uiData.width, this.#uiData.height)
  }

  // нужен для настройки резайза видимой части UI окна
  #createDebugRect = () => {
    if (!this.#isDebug) return

    this.#debugRect = new DebugRect()
    this.#globalUiLayer.addChild(this.#debugRect)
    this.#debugRect.update(this.#uiData)
  }

  // UI-элементы, которые переживают смену стейтов
  #createGlobalUiLayer = () => {
    this.#globalUiLayer = new Container({
      label: 'globalUiLayer',
      zIndex: 1,
    })
    this.addChild(this.#globalUiLayer)
  }

  // UI-элементы, которые очищаются при смене стейтов
  #createStateUiLayer = () => {
    this.#stateUiLayer = new Container({
      label: 'stateUiLayer',
      sortableChildren: true,
    })
    this.addChild(this.#stateUiLayer)
  }

  // Слой с fade для добавления модальных окон
  #createModalLayer = () => {
    this.#modalLayer = new ModalLayer()
    this.#modalLayer.resize(this.#uiData)
    this.addChild(this.#modalLayer)
  }

  #resizeUiChildren = () => {
    const globalUiLayerChildren = this.#globalUiLayer.children
    const stateUiLayerChildren = this.#stateUiLayer.children
    const modalView = this.#modalLayer.view
    const modalLayerChildren = modalView ? [modalView] : []

    const children = [...globalUiLayerChildren, ...stateUiLayerChildren, ...modalLayerChildren]

    children.forEach(this.resizeAdaptive)
  }
}
