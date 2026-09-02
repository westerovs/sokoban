import {gsap} from 'gsap'
import type {Container} from 'pixi.js'
import DarkenFilter from '../../utils/filters/DarkenFilter.js'

// Затемняет неактивные кнопки подсказок и восстанавливает их состояние.

type HintButton = Container & {
  darkenFilter?: DarkenFilter | null
}

export default class ButtonsStateFX {
  #buttons: HintButton[]

  // Сохраняет список кнопок подсказок.
  constructor(buttons: HintButton[]) {
    this.#buttons = buttons
  }

  // Анимирует состояние остальных кнопок относительно выбранной.
  checkoutBtnState = (button: HintButton, isDisabled: boolean) => {
    try {
      if (button.destroyed) return

      return new Promise<void>((resolve) => {
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

  // Добавляет кнопке фильтр затемнения.
  #applyDarken = (btn: HintButton, tl: gsap.core.Timeline) => {
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

  // Убирает фильтр затемнения с кнопки.
  #removeDarken = (btn: HintButton, tl: gsap.core.Timeline) => {
    try {
      if (btn.destroyed) return
      if (!btn.darkenFilter) return

      tl.to(btn.darkenFilter, {duration: 0.3, darkness: 0}, 0).add(() => {
        if (btn.filters) {
          btn.filters = btn.filters.filter((filter) => filter !== btn.darkenFilter)
        }
        btn.darkenFilter = null
      }, 0.3)
    } catch (e) {
      console.log('[ButtonsStateFX removeDarken]', e)
    }
  }
}
