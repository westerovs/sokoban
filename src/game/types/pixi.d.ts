import type {ContainerChild} from 'pixi.js'

// Расширяет типы PixiJS служебными полями, которые использует игровая сцена.

declare module 'pixi.js' {
  interface Container<C extends ContainerChild = ContainerChild> {
    _initScale?: number
    _customPosition?: {x?: number; y?: number}
    productID?: string
    type?: string
    typeName?: string
    updateAdaptive?: boolean | (() => void)
  }

  interface Sprite {
    initPos?: {x: number; y: number}
  }
}
