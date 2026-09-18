import {gsap} from 'gsap'
import type {DestroyOptions, FederatedPointerEvent, PointData} from 'pixi.js'
import {Container, Rectangle} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import type {LocationSelectionState} from '../../menuTypes.ts'
import LocationCard, {CARD_HEIGHT, CARD_WIDTH} from '../locationCard/LocationCard.ts'
import LocationCarouselControls from './LocationCarouselControls.ts'

const CARD_Y = -35 // Вертикальная позиция карточек
const CONTROLS_GAP = 37 // Отступ элементов управления от нижнего края карточки
const SIDE_CARD_OFFSET_RATIO = 0.4 // Смещение боковой карточки относительно её ширины
const STACK_STEP_RATIO = 0.15 // Шаг дальних слоёв относительно ширины карточки
const ACTIVE_SCALE = 1.16 // Масштаб выбранной карточки
const SIDE_SCALE = 0.9 // Масштаб ближайшей боковой карточки
const SIDE_SCALE_STEP = 0.035 // Уменьшение масштаба каждого дальнего слоя
const SWIPE_PREVIEW_RESPONSE = 0.16 // Доля движения указателя, передаваемая активной карточке
const SWIPE_PREVIEW_LIMIT_RATIO = 0.08 // Максимальное смещение активной карточки относительно её ширины
const EDGE_SWIPE_RESISTANCE = 0.25 // Сопротивление свайпу за краями списка
const GESTURE_THRESHOLD = 20 // Дельта, после которой нажатие считается жестом
const TRANSITION_DURATION = 0.28 // Длительность перелистывания в секундах
const CAROUSEL_MIN_WIDTH = 560 // Минимальная ширина области свайпа
const CAROUSEL_HIT_PADDING = 32 // Запас области свайпа вокруг карточек

type LocationCarouselOptions = {
  onInteraction: () => void
  onLocationSelect: (locationId: string) => void
}

type CardLayout = {
  alpha: number
  scale: number
  x: number
  zIndex: number
}

type PointerStart = {
  client: PointData
  local: PointData
}

export default class LocationCarousel extends Container {
  #activePointerId: number | null = null
  #cards: LocationCard[] = []
  #cardsLayer!: Container
  #controls!: LocationCarouselControls
  #gestureDistance = 0
  #onInteraction: () => void
  #onLocationSelect: (locationId: string) => void
  #paused = false
  #pointerStart: PointerStart | null = null
  #selectedIndex = 0
  #swipePreviewX = 0
  #transition: gsap.core.Timeline | null = null

  constructor({onInteraction, onLocationSelect}: LocationCarouselOptions) {
    super({label: 'location-carousel'})

    this.#onInteraction = onInteraction
    this.#onLocationSelect = onLocationSelect
    this.#init()
  }

  get selectedCard() {
    return this.#cards[this.#selectedIndex] ?? null
  }

  get cardTop() {
    return CARD_Y - (CARD_HEIGHT * ACTIVE_SCALE) / 2
  }

  get controlsY() {
    return CARD_Y + (CARD_HEIGHT * ACTIVE_SCALE) / 2 + CONTROLS_GAP
  }

  get preferredWidth() {
    const depth = Math.max(1, this.#cards.length - 1)
    const offset = CARD_WIDTH * (SIDE_CARD_OFFSET_RATIO + (depth - 1) * STACK_STEP_RATIO)
    const scale = SIDE_SCALE - (depth - 1) * SIDE_SCALE_STEP
    return Math.max(CAROUSEL_MIN_WIDTH, (offset + (CARD_WIDTH * scale) / 2) * 2)
  }

  setData = (locations: LocationSelectionState[]) => {
    this.stop()
    this.#replaceCards(locations)
    this.#selectedIndex = Math.max(
      0,
      locations.findIndex(({isCurrent}) => isCurrent),
    )
    this.#controls.setCount(this.#cards.length)
    this.#controls.setSelectedIndex(this.#selectedIndex, this.#cards.length)
    this.setPaused(false)
    this.#layoutCards()
  }

  setPaused = (paused: boolean) => {
    this.#paused = paused
    this.#cards.forEach((card) => card.setEffectsPaused(paused))
    if (paused) this.stop()
    this.#cardsLayer.eventMode = paused ? 'none' : 'static'
  }

  layout = () => {
    this.#transition?.kill()
    this.#transition = null
    this.#resetPointer()
    this.#swipePreviewX = 0
    this.#cardsLayer.eventMode = this.#paused ? 'none' : 'static'
    this.#updateHitArea()
    this.#controls.y = this.controlsY
    this.#layoutCards()
  }

  stop = () => {
    this.#transition?.kill()
    this.#transition = null
    this.#resetPointer()
    this.#swipePreviewX = 0
    this.#cardsLayer.eventMode = this.#paused ? 'none' : 'static'
    this.#stopCardFeedback()
  }

  override destroy(options?: DestroyOptions) {
    this.stop()
    this.#removePointerListeners()
    const destroyOptions = typeof options === 'boolean' ? {children: true} : {...options, children: true}
    super.destroy(destroyOptions)
  }

  #init = () => {
    this.#createCardsLayer()
    this.#createControls()
  }

  #createCardsLayer = () => {
    this.#cardsLayer = new Container({label: 'location-carousel-cards', sortableChildren: true})
    this.#cardsLayer.eventMode = this.#paused ? 'none' : 'static'
    this.#cardsLayer.interactiveChildren = false
    this.#cardsLayer.cursor = 'grab'
    this.#cardsLayer.hitArea = new Rectangle(-280, -270, 560, 540)
    this.#addPointerListeners()
    this.addChild(this.#cardsLayer)
  }

  #createControls = () => {
    this.#controls = new LocationCarouselControls({
      onNext: () => this.#selectRelative(1),
      onPrevious: () => this.#selectRelative(-1),
      onSelect: this.#selectIndex,
    })
    this.#controls.y = this.controlsY
    this.addChild(this.#controls)
  }

  #addPointerListeners = () => {
    this.#cardsLayer.on('pointerdown', this.#handlePointerDown)
    this.#cardsLayer.on('globalpointermove', this.#handlePointerMove)
    this.#cardsLayer.on('pointerup', this.#handlePointerUp)
    this.#cardsLayer.on('pointerupoutside', this.#handlePointerUp)
    this.#cardsLayer.on('pointercancel', this.#handlePointerCancel)
  }

  #removePointerListeners = () => {
    this.#cardsLayer.off('pointerdown', this.#handlePointerDown)
    this.#cardsLayer.off('globalpointermove', this.#handlePointerMove)
    this.#cardsLayer.off('pointerup', this.#handlePointerUp)
    this.#cardsLayer.off('pointerupoutside', this.#handlePointerUp)
    this.#cardsLayer.off('pointercancel', this.#handlePointerCancel)
  }

  #replaceCards = (locations: LocationSelectionState[]) => {
    this.#cards.forEach((card) => card.destroy({children: true}))
    this.#cards = locations.map((location) => this.#createCard(location))
    this.#updateHitArea()
  }

  #createCard = (location: LocationSelectionState) => {
    const card = new LocationCard(location, this.#onLocationSelect)
    card.setState(location)
    card.eventMode = 'none'
    this.#cardsLayer.addChild(card)
    return card
  }

  #layoutCards = () => {
    this.#cards.forEach((card, index) => {
      this.#applyCardLayout(card, this.#getCardLayout(index), index === this.#selectedIndex)
    })
  }

  #applyCardLayout = (card: LocationCard, layout: CardLayout, isSelected: boolean) => {
    card.visible = true
    card.position.set(layout.x + (isSelected ? this.#swipePreviewX : 0), CARD_Y)
    card.scale.set(layout.scale)
    card.alpha = layout.alpha
    card.zIndex = layout.zIndex
  }

  #getCardLayout = (index: number): CardLayout => {
    const distance = index - this.#selectedIndex
    if (distance === 0) return {alpha: 1, scale: ACTIVE_SCALE, x: 0, zIndex: 10}

    const depth = Math.abs(distance)
    return {
      alpha: 0.8 - (depth - 1) * 0.1,
      scale: SIDE_SCALE - (depth - 1) * SIDE_SCALE_STEP,
      x: Math.sign(distance) * (CARD_WIDTH * SIDE_CARD_OFFSET_RATIO + (depth - 1) * CARD_WIDTH * STACK_STEP_RATIO),
      zIndex: 6 - depth,
    }
  }

  #selectRelative = (offset: number) => {
    const index = this.#selectedIndex + offset
    if (index < 0 || index >= this.#cards.length) {
      this.#snapBack()
      return
    }
    this.#selectIndex(index)
  }

  #selectIndex = (index: number) => {
    this.#onInteraction()
    if (this.#transition || index === this.#selectedIndex || index < 0 || index >= this.#cards.length) return
    this.#stopCardFeedback()
    this.#selectedIndex = index
    this.#swipePreviewX = 0
    this.#cardsLayer.eventMode = 'none'
    this.#controls.setSelectedIndex(index, this.#cards.length)
    this.#transition = this.#createTransition()
    Locator.soundManager.play('sfx_swipe')
  }

  #createTransition = () => {
    const timeline = gsap.timeline({onComplete: this.#finishTransition})
    this.#cards.forEach((card, index) => this.#addCardTransition(timeline, card, this.#getCardLayout(index)))
    return timeline
  }

  #addCardTransition = (timeline: gsap.core.Timeline, card: LocationCard, layout: CardLayout) => {
    card.zIndex = layout.zIndex
    timeline.to(card, {x: layout.x, alpha: layout.alpha, duration: TRANSITION_DURATION, ease: 'power2.out'}, 0)
    timeline.to(card.scale, {x: layout.scale, y: layout.scale, duration: TRANSITION_DURATION, ease: 'power2.out'}, 0)
  }

  #finishTransition = () => {
    this.#transition = null
    this.#cardsLayer.eventMode = this.#paused ? 'none' : 'static'
    this.#layoutCards()
  }

  #handlePointerDown = (event: FederatedPointerEvent) => {
    const isUnsupportedMouseButton = event.pointerType === 'mouse' && event.button !== 0
    if (this.#transition || this.#activePointerId !== null || !event.isPrimary || isUnsupportedMouseButton) return
    this.#onInteraction()
    this.#stopCardFeedback()
    this.#activePointerId = event.pointerId
    this.#pointerStart = {
      client: {x: event.client.x, y: event.client.y},
      local: this.toLocal(event.global),
    }
    this.#gestureDistance = 0
    this.#swipePreviewX = 0
    this.#cardsLayer.cursor = 'grabbing'
  }

  #handlePointerMove = (event: FederatedPointerEvent) => {
    if (event.pointerId !== this.#activePointerId || !this.#pointerStart) return
    const delta = this.#getPointerDelta(event)
    this.#gestureDistance = Math.max(this.#gestureDistance, Math.hypot(delta.clientX, delta.clientY))
    this.#swipePreviewX = this.#getSwipePreviewOffset(delta.localX)
    this.#layoutCards()
  }

  #handlePointerUp = (event: FederatedPointerEvent) => {
    if (event.pointerId !== this.#activePointerId) return
    const delta = this.#getPointerDelta(event)
    const distance = Math.max(this.#gestureDistance, Math.hypot(delta.clientX, delta.clientY))
    const isGesture = distance > GESTURE_THRESHOLD
    this.#resetPointer()
    if (!isGesture) return this.#handleCardTap()
    if (Math.abs(delta.clientX) > GESTURE_THRESHOLD) this.#selectRelative(delta.clientX < 0 ? 1 : -1)
    else this.#snapBack()
  }

  #handlePointerCancel = (event: FederatedPointerEvent) => {
    if (event.pointerId !== this.#activePointerId) return
    this.#resetPointer()
    this.#snapBack()
  }

  #getSwipePreviewOffset = (rawOffset: number) => {
    const beyondStart = this.#selectedIndex === 0 && rawOffset > 0
    const beyondEnd = this.#selectedIndex === this.#cards.length - 1 && rawOffset < 0
    const resistance = beyondStart || beyondEnd ? EDGE_SWIPE_RESISTANCE : 1
    const offset = rawOffset * SWIPE_PREVIEW_RESPONSE * resistance
    const limit = CARD_WIDTH * SWIPE_PREVIEW_LIMIT_RATIO
    return Math.max(-limit, Math.min(limit, offset))
  }

  #getPointerDelta = (event: FederatedPointerEvent) => {
    const pointer = this.toLocal(event.global)
    return {
      clientX: event.client.x - this.#pointerStart!.client.x,
      clientY: event.client.y - this.#pointerStart!.client.y,
      localX: pointer.x - this.#pointerStart!.local.x,
    }
  }

  #handleCardTap = () => {
    this.#swipePreviewX = 0
    this.#layoutCards()
    this.selectedCard?.activate()
  }

  #snapBack = () => {
    this.#swipePreviewX = 0
    this.#cardsLayer.eventMode = 'none'
    this.#transition = this.#createTransition()
  }

  #resetPointer = () => {
    this.#activePointerId = null
    this.#pointerStart = null
    this.#gestureDistance = 0
    if (this.#cardsLayer) this.#cardsLayer.cursor = 'grab'
  }

  #updateHitArea = () => {
    const width = this.preferredWidth
    const height = CARD_HEIGHT * ACTIVE_SCALE + CAROUSEL_HIT_PADDING * 2
    this.#cardsLayer.hitArea = new Rectangle(-width / 2, CARD_Y - height / 2, width, height)
  }

  #stopCardFeedback = () => {
    this.#cards.forEach((card) => card.stopInteractionFeedback())
  }
}
