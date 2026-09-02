import type {ContainerChild} from 'pixi.js'

// Расширяет типы PixiJS служебными полями, которые использует игровая сцена.

declare module 'pixi.js' {
  interface Container<C extends ContainerChild = ContainerChild> {
    _initScale?: number
    type?: string
  }
}
