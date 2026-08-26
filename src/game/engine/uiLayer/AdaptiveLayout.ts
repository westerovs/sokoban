import type {Container} from 'pixi.js'

type UiData = {
  scaleFactorX: number
  scaleFactorY: number
  width: number
  widthWithPadding: number
  height: number
  heightWithPadding: number
  center: {
    x: number
    y: number
  }
}

type AlignRightOptions = {
  x?: number
  y?: number
  viewWidth?: number
}

type AdaptiveView = Container & {
  alignRight?: () => void
  updateAdaptive?: boolean | (() => void)
  _initScale?: number
  _customPosition?: {
    x?: number
    y?: number
  }
}

export default class AdaptiveLayout {
  readonly #uiPadding: number

  constructor(uiPadding: number) {
    this.#uiPadding = uiPadding
  }

  // Прижимает элемент к правому краю
  public alignRight = (view: AdaptiveView, uiData: UiData, {x = 0, y = 0, viewWidth}: AlignRightOptions = {}) => {
    const {widthWithPadding} = uiData

    // Сбрасывает масштаб
    view.scale.set(1)

    const contentWidth = viewWidth ?? view.width
    const uiWidth = uiData.width
    if (contentWidth > uiWidth) view.scale.set(uiWidth / contentWidth)

    const scaledWidth = contentWidth * view.scale.x
    view.position.set(widthWithPadding - scaledWidth / 2 + x, y)
  }

  // делает элемент адаптивным, ставит либо в центр, либо в кастомную позицию
  public resizeAdaptive = (view: AdaptiveView, uiData: UiData) => {
    try {
      if (view.alignRight && view.label) {
        view.alignRight()
        return
      }

      if (!view.updateAdaptive || !view.label || view.alignRight) return

      this.#setAdaptivePosition(view, uiData)
      this.#setAdaptiveScale(view, uiData)
    } catch (err) {
      console.error('[resizeStateUiLayer]', err)
    }
  }

  #setAdaptivePosition = (view: AdaptiveView, uiData: UiData) => {
    const {x, y} = uiData.center
    if (view._customPosition) {
      const {x: customX, y: customY} = view._customPosition
      view.position.set(customX ?? x, customY ?? y)
    } else {
      // Устанавливает позицию по центру
      view.position.set(x, y)
    }
  }

  #setAdaptiveScale = (view: AdaptiveView, uiData: UiData) => {
    const uiWidth = uiData.width
    const availableWidth = uiWidth - this.#uiPadding * 2

    // Сбрасывает масштаб
    view.scale.set(1)
    // Устанавливает адаптивный масштаб
    if (view.width > availableWidth) {
      view.scale.set(availableWidth / view.width)
    } else {
      const initScale = view._initScale ?? 1
      view.scale.set(initScale)
    }
  }
}

export type {AdaptiveView, AlignRightOptions, UiData}
