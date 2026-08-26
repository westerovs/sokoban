import i18next from 'i18next'
import {Container} from 'pixi.js'
import {WORLD} from '@/game/gameConfig/constants.js'
import LocationCard from '@/game/states/stateGame/startScreen/locationSelect/LocationCard.js'
import LocationUnlockCelebration from '@/game/states/stateGame/startScreen/locationSelect/LocationUnlockCelebration.js'

/**
 * Показывает на экране завершения уровня карточку новой локации и эффекты её разблокировки.
 * Компонент управляет только временным представлением карточки и очищает его после закрытия.
 */

const POSITION_Y = 245 // Центр карточки по вертикали в координатах игрового мира

export default class CompleteLocationUnlockCelebration extends Container {
  #card
  #effects

  constructor() {
    super({label: 'complete-location-unlock-celebration', visible: false})

    this.eventMode = 'none'
    this.position.set(WORLD.HALF_W, POSITION_Y)
    this.#init()
  }

  show = (location) => {
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

  hide = () => {
    this.#effects.stop()
    this.#card?.destroy({children: true})
    this.#card = null
    this.visible = false
  }

  destroy(options) {
    this.hide()
    super.destroy(options)
  }

  #init = () => {
    this.#effects = new LocationUnlockCelebration()
    this.addChild(this.#effects)
  }

  #createCard = (location) => {
    const card = new LocationCard(location, () => {})
    card.setState({
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
