import {gsap} from 'gsap'
import {ASSETS_URL} from '@/game/gameConfig/constants.js'
import Locator from '../../../../engine/Locator.ts'

export default class StateIntro {
  #level

  constructor(level) {
    this.#level = level
  }

  execute = async () => {
    this.#tryPlayAmbient()
    await this.#createStartLevelAnimation()
  }

  // -------------------- STATE INTRO
  #createStartLevelAnimation = async () => {
    Locator.options.setMainScreenNavigation(false)
    Locator.options.setVisibleToggle(true)

    const {globalUiLayer, stateUiLayer} = Locator.uiLayer

    await gsap.timeline().set(stateUiLayer, {visible: true}).fromTo([globalUiLayer, stateUiLayer], {alpha: 0}, {alpha: 1})

    Locator.options.view.optionsToggleBtn.eventMode = 'static'
  }

  #tryPlayAmbient = () => {
    const {amb} = this.#level.config
    if (!amb) return

    const basePath = ASSETS_URL.local
    const src = `${basePath}assets/audio/ambience/${amb}.mp3`
    Locator.soundManager.loadAndPlayAmbient(amb, src, {loop: true})
  }
}
