import {gsap} from 'gsap'
import {ASSETS_URL} from '@/game/gameConfig/constants.js'
import Locator from '../../../../engine/Locator.ts'
import type {RuntimeLevelConfig} from '@/game/gameConfig/levels/levelTypes.js'

// Показывает вступление уровня и запускает его фоновую атмосферу.

export default class StateIntro {
  #level: {config: RuntimeLevelConfig}

  // Сохраняет текущий уровень.
  constructor(level: {config: RuntimeLevelConfig}) {
    this.#level = level
  }

  // Запускает атмосферу и анимацию появления уровня.
  execute = async () => {
    this.#tryPlayAmbient()
    await this.#createStartLevelAnimation()
  }

  // -------------------- STATE INTRO
  // Показывает UI уровня и включает кнопку настроек.
  #createStartLevelAnimation = async () => {
    Locator.options.setMainScreenNavigation(false)
    Locator.options.setVisibleToggle(true)

    const {globalUiLayer, stateUiLayer} = Locator.uiLayer

    await gsap.timeline().set(stateUiLayer, {visible: true}).fromTo([globalUiLayer, stateUiLayer], {alpha: 0}, {alpha: 1})

    Locator.options.view.optionsToggleBtn.eventMode = 'static'
  }

  // Загружает и запускает атмосферный звук уровня.
  #tryPlayAmbient = () => {
    const {amb} = this.#level.config
    if (!amb) return

    const basePath = ASSETS_URL.local
    const src = `${basePath}assets/audio/ambience/${amb}.mp3`
    Locator.soundManager.loadAndPlayAmbient(amb, src, {loop: true})
  }
}
