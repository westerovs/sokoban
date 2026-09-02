import {Color} from 'pixi.js'
import {ColorOverlayFilter, OutlineFilter} from 'pixi-filters'

// Создаёт настроенные фильтры, используемые игровым интерфейсом.

type NamedColorOverlayFilter = ColorOverlayFilter & {name: string}
type NamedOutlineFilter = OutlineFilter & {name: string}

export default class Filters {
  // Создаёт фильтр цветового наложения.
  static colorOverlay = (hex = 0xfff111, alpha = 1) => {
    const color = new Color(hex).toNumber()
    const colorOverlayFilter = new ColorOverlayFilter({color, alpha}) as NamedColorOverlayFilter
    colorOverlayFilter.name = 'colorOverlay'

    return colorOverlayFilter
  }

  // Создаёт контурный фильтр заданной толщины и цвета.
  static outlineFilter = (thickness: number, color: number) => {
    const outlineFilter = new OutlineFilter({thickness, color}) as NamedOutlineFilter
    outlineFilter.name = 'outlineFilter'

    return outlineFilter
  }
}
