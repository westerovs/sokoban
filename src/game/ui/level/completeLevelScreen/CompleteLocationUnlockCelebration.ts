import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container} from 'pixi.js'
import Locator from '@/game/engine/Locator.js'
import {WORLD} from '@/game/gameConfig/constants.js'
import type {LocationDefinition} from '@/game/gameConfig/levels/levelTypes.js'
import LocationCard from '@/game/states/stateGame/startScreen/locationPage/locationCard/LocationCard.ts'
import LocationUnlockCelebration from '@/game/states/stateGame/startScreen/locationPage/LocationUnlockCelebration.js'

/**
 * Показывает на экране завершения уровня карточку новой локации и эффекты её разблокировки.
 * Компонент управляет только временным представлением карточки и очищает его после закрытия.
 */

const BLOCK_CENTER_Y = 66.5 // Центр общего блока карточки и сообщения относительно карточки
const SHOW_SECONDS = 3.5 // Время показа разблокировки до исчезновения

export default class CompleteLocationUnlockCelebration extends Container {
  #card: LocationCard | null = null
  #effects!: LocationUnlockCelebration
  #timeline: gsap.core.Timeline | null = null
  #resolve: (() => void) | null = null

  // Создаёт контейнер эффекта в координатах экрана завершения.
  constructor() {
    super({label: 'complete-location-unlock-celebration', visible: false})

    this.eventMode = 'none'
    this.#init()
  }

  // Показывает временную карточку открытой локации.
  show(location: LocationDefinition | null): Promise<void> {
    this.hide()
    if (!location) return Promise.resolve()

    this.#card = this.#createCard(location)
    this.addChildAt(this.#card, 0)
    this.visible = true
    this.alpha = 1
    this.#effects.start({
      card: this.#card,
      cardScale: 1, // Карточка уже создана в размере экрана завершения
      height: WORLD.HEIGHT,
      isNarrow: false, // Экран завершения использует фиксированную широкую компоновку
      locationName: i18next.t(location.titleKey),
      scale: 1, // Контейнер работает непосредственно в координатах игрового мира
      width: WORLD.WIDTH,
    })
    this.resize()
    return this.#waitForHide()
  }

  // Центрирует карточку и сообщение как единый блок в доступном экране.
  resize() {
    const {width, height} = Locator.uiLayer.uiData
    const scale = Math.min(1, (width - 40) / 540, (height - 80) / 520)
    this.scale.set(scale)
    this.position.set(WORLD.HALF_W, WORLD.HALF_H - BLOCK_CENTER_Y * scale)
    this.#effects.resize({width, height, scale, isNarrow: false, cardScale: 1})
  }

  // Останавливает эффект и удаляет временную карточку.
  hide() {
    this.#timeline?.kill()
    this.#timeline = null
    this.#effects.stop()
    this.#card?.destroy({children: true})
    this.#card = null
    this.visible = false
    this.#resolve?.()
    this.#resolve = null
  }

  // Освобождает карточку и дочерние эффекты.
  destroy(options?: Parameters<Container['destroy']>[0]) {
    this.hide()
    super.destroy(options)
  }

  // Создаёт общий эффект разблокировки.
  #init() {
    this.#effects = new LocationUnlockCelebration()
    this.addChild(this.#effects)
  }

  // Дожидается окончания показа и плавно скрывает временный блок.
  #waitForHide() {
    return new Promise<void>((resolve) => {
      this.#resolve = resolve
      this.#timeline = gsap
        .timeline()
        .to(this, {alpha: 0, duration: 0.4, delay: SHOW_SECONDS})
        .call(() => this.hide())
    })
  }

  // Создаёт неинтерактивную карточку новой локации.
  #createCard(location: LocationDefinition) {
    const state = {
      ...location,
      completedCount: 0,
      isCompleted: false,
      isCurrent: true,
      isUnlocked: true,
      lockedAfterTitleKey: null,
      totalCount: location.levels.length,
    }
    const card = new LocationCard(state, () => {})
    card.setState(state)
    card.cursor = 'default'
    card.eventMode = 'none'
    return card
  }
}
