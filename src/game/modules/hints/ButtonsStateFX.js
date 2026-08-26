import {gsap} from 'gsap'
import DarkenFilter from '../../utils/filters/DarkenFilter.js'

export default class ButtonsStateFX {
  #buttons

  constructor(buttons) {
    this.#buttons = buttons
  }

  checkoutBtnState = (button, isDisabled) => {
    try {
      if (button.destroyed) return

      return new Promise((resolve) => {
        const tl = gsap.timeline({onComplete: resolve})

        for (const itemBtn of this.#buttons) {
          itemBtn.cursor = 'not-allowed'
          if (itemBtn === button) continue

          if (isDisabled) this.#applyDarken(itemBtn, tl)
          else this.#removeDarken(itemBtn, tl)
        }
      })
    } catch (e) {
      console.log('[ButtonsStateFX checkoutBtnState]', e)
    }
  }

  #applyDarken = (btn, tl) => {
    try {
      if (btn.destroyed) return

      if (!btn.darkenFilter) {
        btn.darkenFilter = new DarkenFilter(0)
        btn.filters = [...(btn.filters ?? []), btn.darkenFilter]
      }

      tl.to(btn.darkenFilter, {duration: 0.3, darkness: 0.5}, 0)
    } catch (e) {
      console.log('[ButtonsStateFX applyDarken]', e)
    }
  }

  #removeDarken = (btn, tl) => {
    try {
      if (btn.destroyed) return
      if (!btn.darkenFilter) return

      tl.to(btn.darkenFilter, {duration: 0.3, darkness: 0}, 0).add(() => {
        if (btn.filters) {
          btn.filters = btn.filters.filter((f) => f !== btn.darkenFilter)
        }
        btn.darkenFilter = null
      }, 0.3)
    } catch (e) {
      console.log('[ButtonsStateFX removeDarken]', e)
    }
  }
}
