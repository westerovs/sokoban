import {Color} from 'pixi.js'
import {ColorOverlayFilter, OutlineFilter} from 'pixi-filters'

export default class Filters {
  static colorOverlay = (hex = 0xfff111, alpha = 1) => {
    const color = new Color(hex).toNumber()
    const colorOverlayFilter = new ColorOverlayFilter({color, alpha})
    colorOverlayFilter.name = 'colorOverlay'

    return colorOverlayFilter
  }

  static outlineFilter = (thickness, color) => {
    const outlineFilter = new OutlineFilter({thickness, color})
    outlineFilter.name = 'outlineFilter'

    return outlineFilter
  }
}
