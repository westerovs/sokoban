import {normalizeTileTransform} from '../../../src/game/sokoban/appearance/tileAppearance.js'
import {getBrushFlipAxis, isTransformableBrush, transformEditorBrush} from './brushTransforms.js'
import type {BrushTransformAction} from './brushTransforms.js'
import type {EditorBrush} from './editorTypes.js'

const TOOLS = [
  {
    id: 'flip-x-button',
    action: 'flipX',
    title: 'Отзеркалить по X (слева направо)',
    path: 'M12 3v18M9 6 3 12l6 6V6Zm6 0 6 6-6 6V6Z',
  },
  {
    id: 'flip-y-button',
    action: 'flipY',
    title: 'Отзеркалить по Y (сверху вниз)',
    path: 'M3 12h18M6 9l6-6 6 6H6Zm0 6 6 6 6-6H6Z',
  },
  {
    id: 'rotate-tile-button',
    action: 'rotate',
    title: 'Повернуть на 90° по часовой стрелке',
    path: 'M21 3v6h-6M21 9l-3-3a8 8 0 1 0 2 9',
  },
] as const

/** Manual brush controls only: never changes the atlas or already painted cells. */
export default class TileTransformControls {
  #brush: EditorBrush | null = null
  #enabled = false
  #visible = true
  #buttons = new Map<BrushTransformAction, HTMLButtonElement>()
  #palette: HTMLElement
  #preview: HTMLImageElement | null = null
  #onSelect: (brush: EditorBrush) => void

  constructor(fillButton: HTMLButtonElement, palette: HTMLElement, onSelect: (brush: EditorBrush) => void) {
    this.#palette = palette
    this.#onSelect = onSelect
    const row = document.createElement('div')
    row.className = 'editor-tools__buttons'
    fillButton.before(row)
    row.append(fillButton)
    TOOLS.forEach((tool) => row.append(this.#createButton(tool)))
  }

  update(brush: EditorBrush | null, enabled: boolean, visible: boolean) {
    this.#brush = brush
    this.#enabled = enabled && isTransformableBrush(brush)
    this.#visible = visible
    const transform = normalizeTileTransform(brush?.transform)
    TOOLS.forEach(({action, title}) => {
      const button = this.#buttons.get(action) as HTMLButtonElement
      button.hidden = !visible
      button.disabled = !this.#enabled || !visible
      if (action === 'rotate') button.title = `${title} · ${transform.rotation}°`
      else button.ariaPressed = String(transform[getBrushFlipAxis(transform, action)])
    })
    this.#updatePreview(transform)
  }

  #createButton(tool: (typeof TOOLS)[number]) {
    const button = document.createElement('button')
    button.id = tool.id
    button.className = 'editor-button editor-button--compact editor-fill-button editor-transform-button'
    button.type = 'button'
    button.title = tool.title
    button.ariaLabel = tool.title
    button.disabled = true
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('aria-hidden', 'true')
    path.setAttribute('d', tool.path)
    svg.append(path)
    button.append(svg)
    button.addEventListener('click', () => {
      if (!this.#enabled || !this.#visible || !this.#brush) return
      this.#onSelect(transformEditorBrush(this.#brush, tool.action))
    })
    this.#buttons.set(tool.action, button)
    return button
  }

  #updatePreview(transform: ReturnType<typeof normalizeTileTransform>) {
    if (this.#preview) this.#preview.style.transform = ''
    this.#preview = this.#palette.querySelector<HTMLImageElement>('.editor-tile-button[aria-pressed="true"] img')
    if (!this.#preview || !isTransformableBrush(this.#brush)) return
    const {rotation, flipX, flipY} = transform
    this.#preview.style.transform = `rotate(${rotation}deg) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`
  }
}
