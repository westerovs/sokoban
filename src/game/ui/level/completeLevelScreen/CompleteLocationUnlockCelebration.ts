import i18next from 'i18next'
import {Container} from 'pixi.js'
import {WORLD} from '@/game/gameConfig/constants.js'
import type {LocationDefinition} from '@/game/gameConfig/levels/levelTypes.js'
import LocationCard from '@/game/states/stateGame/startScreen/locationSelect/LocationCard.js'
import LocationUnlockCelebration from '@/game/states/stateGame/startScreen/locationSelect/LocationUnlockCelebration.js'

/**
 * Показывает на экране завершения уровня карточку новой локации и эффекты её разблокировки.
 * Компонент управляет только временным представлением карточки и очищает его после закрытия.
 */

const POSITION_Y = 245 // Центр карточки по вертикали в координатах игрового мира

export default class CompleteLocationUnlockCelebration extends Container {
  #card: LocationCard | null = null
  #effects!: LocationUnlockCelebration

  // Создаёт контейнер эффекта в координатах экрана завершения.
  constructor() {
    super({label: 'complete-location-unlock-celebration', visible: false})

    this.eventMode = 'none'
    this.position.set(WORLD.HALF_W, POSITION_Y)
    this.#init()
  }

  // Показывает временную карточку открытой локации.
  show = (location: LocationDefinition | null) => {
    this.hide()
    if (!location) return

    this.#card = this.#createCard(location)
    this.addChildAt(this.#card, 0)
    this.visible = true
    this.#effects.start({
      card: this.#card,
      cardScale: 1, // Карточка уже создана в размере экрана завершения
      height: WORLD.HEIGHT,
      isNarrow: false, // Экран завершения использует фиксированную широкую компоновку
      locationName: i18next.t(location.titleKey),
      scale: 1, // Контейнер работает непосредственно в координатах игрового мира
      width: WORLD.WIDTH,
    })
  }

  // Останавливает эффект и удаляет временную карточку.
  hide = () => {
    this.#effects.stop()
    this.#card?.destroy({children: true})
    this.#card = null
    this.visible = false
  }

  // Освобождает карточку и дочерние эффекты.
  destroy(options?: Parameters<Container['destroy']>[0]) {
    this.hide()
    super.destroy(options)
  }

  // Создаёт общий эффект разблокировки.
  #init = () => {
    this.#effects = new LocationUnlockCelebration()
    this.addChild(this.#effects)
  }

  // Создаёт неинтерактивную карточку новой локации.
  #createCard = (location: LocationDefinition) => {
    const state = {
      ...location,
      completedCount: 0,
      isCompleted: false,
      isCurrent: true,
      isUnlocked: true,
      totalCount: location.levels.length,
    }
    const card = new LocationCard(state, () => {})
    card.setState({
      ...state,
      completedCount: 0,
      isCompleted: false,
      isCurrent: true,
      isUnlocked: true,
      totalCount: location.levels.length,
    })
    card.cursor = 'default'
    card.eventMode = 'none'
    return card
  }
}
