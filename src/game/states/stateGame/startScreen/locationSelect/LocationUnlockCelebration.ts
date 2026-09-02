import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container, Graphics, Sprite, Text, Texture, Ticker} from 'pixi.js'
import Locator from '../../../../engine/Locator.ts'
import {primaryFontStyle} from '../../../../styles.js'
import GameUtils from '../../../../utils/gameUtils/GameUtils.js'

// Показывает анимацию разблокировки карточки новой локации.

const CARD_WIDTH = 250 // Ширина карточки локации
const CARD_HEIGHT = 350 // Высота карточки локации
const CONFETTI_COUNT = 64 // Количество частиц конфетти
const CONFETTI_COLORS = [0xf94144, 0xf8961e, 0xf9c74f, 0x90be6d, 0x43aa8b, 0x577590, 0x9b5de5, 0xf15bb5] // Палитра конфетти

type ConfettiItem = {
  drift: number
  phase: number
  speed: number
  spin: number
  sprite: Sprite
}

type CelebrationLayout = {
  cardScale?: number
  height: number
  isNarrow: boolean
  scale: number
  width: number
}

type CelebrationStartOptions = CelebrationLayout & {
  card?: Container
  locationName: string
}

export default class LocationUnlockCelebration extends Container {
  #bounds = {height: 1080, width: 1920}
  #confetti: ConfettiItem[] = []
  #confettiContainer!: Container
  #glow!: Graphics
  #glowTween: gsap.core.Timeline | null = null
  #lock!: Sprite
  #message!: Text
  #messageBackground!: Graphics
  #messageContainer!: Container
  #messageY = 260 // Вертикальная позиция сообщения
  #messageTween: gsap.core.Tween | null = null
  #targetCard: Container | null = null
  #targetAlpha: number | null = null
  #targetScale: {x: number; y: number} | null = null
  #timeline: gsap.core.Timeline | null = null
  #veil!: Graphics

  // Создаёт скрытый контейнер праздничной анимации.
  constructor() {
    super({label: 'location-unlock-celebration', visible: false})

    this.eventMode = 'none'
    this.#init()
  }

  // Запускает анимацию для указанной карточки.
  start = ({card, cardScale, height, isNarrow, locationName, scale, width}: CelebrationStartOptions) => {
    this.stop()
    if (!card) return

    this.#targetCard = card
    this.#targetAlpha = card.alpha
    this.#targetScale = {x: card.scale.x, y: card.scale.y}
    this.#message.text = i18next.t('locationSelect.unlocked', {location: locationName})
    this.visible = true
    this.resize({cardScale, height, isNarrow, scale, width})
    this.#resetConfetti(true)
    Locator.game.app.ticker.add(this.#update)
    this.#animateUnlock()
  }

  // Останавливает анимацию и восстанавливает карточку.
  stop = () => {
    Locator.game.app.ticker.remove(this.#update)
    this.#killAnimations()
    this.#restoreTargetVisual()
    this.#targetCard = null
    this.#targetAlpha = null
    this.#targetScale = null
    this.visible = false
  }

  // Пересчитывает область эффекта под текущий размер интерфейса.
  resize = ({cardScale, height, isNarrow, scale, width}: CelebrationLayout) => {
    const safeScale = Math.max(scale, 0.01)
    this.#bounds.width = width / safeScale
    this.#bounds.height = height / safeScale
    this.#layoutMessage(isNarrow)
    if (this.#targetScale && cardScale) this.#targetScale = {x: cardScale, y: cardScale}
    this.#layoutTarget()
  }

  // Освобождает анимацию и графические ресурсы контейнера.
  destroy(options?: Parameters<Container['destroy']>[0]) {
    this.stop()
    super.destroy(options)
  }

  // Создаёт все слои праздничной анимации.
  #init = () => {
    this.#confettiContainer = new Container({label: 'location-unlock-confetti'})
    this.#veil = new Graphics({label: 'location-unlock-veil'})
    this.#glow = this.#createGlow()
    this.#lock = GameUtils.createSprite('icon-lock', {label: 'location-unlock-lock', scale: 1.7})
    this.#messageContainer = this.#createMessage()
    this.#createConfetti()
    this.addChild(this.#confettiContainer, this.#veil, this.#glow, this.#lock, this.#messageContainer)
  }

  // Создаёт свечение вокруг разблокируемой карточки.
  #createGlow = () => {
    const glow = new Graphics({label: 'location-unlock-glow'})
    glow.circle(0, 0, 86).fill({color: 0xe8ff62, alpha: 0.2})
    glow.circle(0, 0, 68).stroke({color: 0xe8ff62, width: 8, alpha: 0.9})
    return glow
  }

  // Создаёт контейнер сообщения о разблокировке.
  #createMessage = () => {
    const container = new Container({label: 'location-unlock-message'})
    this.#messageBackground = new Graphics({label: 'location-unlock-message-background'})
    this.#message = GameUtils.createText('', {
      name: 'location-unlock-message-text',
      style: {...primaryFontStyle, align: 'center', fill: 0xffe9a8, fontSize: 25, lineHeight: 31},
    })
    container.addChild(this.#messageBackground, this.#message)
    return container
  }

  // Располагает сообщение для выбранной раскладки.
  #layoutMessage = (isNarrow: boolean) => {
    const height = isNarrow ? 70 : 96
    const width = isNarrow ? 470 : 500
    this.#messageY = isNarrow ? 355 : 260
    this.#messageContainer.y = this.#messageY
    this.#message.style.fontSize = isNarrow ? 22 : 25
    this.#message.style.lineHeight = isNarrow ? 26 : 31
    this.#messageBackground.clear().roundRect(-width / 2, -height / 2, width, height, 24)
    this.#messageBackground.fill({color: 0x14291b, alpha: 0.96})
    this.#messageBackground.stroke({color: 0xdfff58, width: 5})
  }

  // Создаёт пул частиц конфетти.
  #createConfetti = () => {
    for (let index = 0; index < CONFETTI_COUNT; index++) {
      const sprite = GameUtils.createSprite(Texture.WHITE, {label: `location-unlock-confetti-${index}`})
      const item = {sprite, drift: 0, phase: 0, speed: 0, spin: 0}
      this.#confetti.push(item)
      this.#confettiContainer.addChild(sprite)
    }
  }

  // Совмещает затемнение, свечение и замок с целевой карточкой.
  #layoutTarget = () => {
    if (!this.#targetCard || !this.#targetScale) return

    const {x, y} = this.#targetCard.position
    const scale = this.#targetScale.x
    this.#veil.clear().roundRect((-CARD_WIDTH * scale) / 2, (-CARD_HEIGHT * scale) / 2, CARD_WIDTH * scale, CARD_HEIGHT * scale, 20)
    this.#veil.fill({color: 0x07110c, alpha: 0.68})
    this.#veil.position.set(x, y)
    this.#glow.position.set(x, y)
    this.#lock.position.set(x, y)
    this.#lock.scale.set(1.7 * scale)
  }

  // Собирает общую последовательность анимации разблокировки.
  #animateUnlock = () => {
    const {x, y} = this.#targetCard!.position
    this.#timeline = gsap.timeline()
    this.#timeline.set(this.#veil, {alpha: 1})
    this.#animateCardAppearance()
    this.#animateMessageAppearance()
    this.#animateGlowAppearance()
    this.#animateLockLanding(x, y)
    this.#animateCardOpening(y)
    this.#timeline.call(this.#finishUnlock)
  }

  // Анимирует появление карточки.
  #animateCardAppearance = () => {
    this.#timeline!.fromTo(this.#targetCard, {alpha: 0}, {alpha: this.#targetAlpha!, duration: 0.45}, 0)
    this.#timeline!.fromTo(
      this.#targetCard!.scale,
      {x: this.#targetScale!.x * 0.68, y: this.#targetScale!.y * 0.68},
      {x: this.#targetScale!.x, y: this.#targetScale!.y, duration: 0.65, ease: 'back.out(2.5)'},
      0,
    )
  }

  // Анимирует появление сообщения.
  #animateMessageAppearance = () => {
    this.#timeline!.fromTo(this.#messageContainer, {alpha: 0, y: this.#messageY + 30}, {alpha: 1, y: this.#messageY, duration: 0.55})
    this.#timeline!.fromTo(this.#messageContainer.scale, {x: 0.6, y: 0.6}, {x: 1, y: 1, duration: 0.65, ease: 'back.out(2.4)'}, '<')
  }

  // Анимирует появление свечения.
  #animateGlowAppearance = () => {
    this.#timeline!.fromTo(this.#glow, {alpha: 0}, {alpha: 1, duration: 0.35}, 0.15)
    this.#timeline!.fromTo(this.#glow.scale, {x: 0.2, y: 0.2}, {x: 1, y: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)'}, 0.15)
  }

  // Анимирует падение замка на карточку.
  #animateLockLanding = (x: number, y: number) => {
    this.#timeline!.fromTo(
      this.#lock,
      {alpha: 0, angle: -18, x, y: y - 220},
      {alpha: 1, angle: 0, x, y, duration: 0.65, ease: 'bounce.out'},
      0.15,
    )
  }

  // Анимирует исчезновение замка и раскрытие карточки.
  #animateCardOpening = (y: number) => {
    this.#timeline!.to(this.#veil, {alpha: 0, duration: 0.45}, 0.82)
    this.#timeline!.to(this.#lock, {alpha: 0, angle: 130, y: y + 270, duration: 0.9, ease: 'back.in(1.5)'}, 0.82)
    this.#timeline!.fromTo(
      this.#targetCard!.scale,
      {x: this.#targetScale!.x, y: this.#targetScale!.y},
      {x: this.#targetScale!.x * 1.07, y: this.#targetScale!.y * 1.07, duration: 0.32, repeat: 1, yoyo: true},
      0.82,
    )
  }

  // Завершает основную последовательность и запускает мягкое ожидание.
  #finishUnlock = () => {
    this.#restoreTargetVisual()
    this.#glowTween = gsap
      .timeline()
      .to(this.#glow.scale, {x: 1.28, y: 1.28, duration: 0.55, ease: 'sine.out'})
      .to(this.#glow, {alpha: 0, duration: 0.55, ease: 'sine.out'}, '<')
    this.#messageTween = gsap.to(this.#messageContainer, {y: this.#messageY - 6, duration: 1.1, ease: 'sine.inOut', repeat: -1, yoyo: true})
  }

  // Обновляет положение частиц на каждом кадре.
  #update = (ticker: Ticker) => {
    const delta = Math.min(ticker.deltaMS / 1000, 0.05)
    this.#confetti.forEach((item) => this.#moveConfetti(item, delta))
  }

  // Перемещает одну частицу конфетти.
  #moveConfetti = (item: ConfettiItem, delta: number) => {
    const {sprite} = item
    item.phase += delta * 3.5
    sprite.y += item.speed * delta
    sprite.x += (item.drift + Math.sin(item.phase) * 35) * delta
    sprite.rotation += item.spin * delta
    if (sprite.y > this.#bounds.height / 2 + 30) this.#resetConfettiItem(item, false)
    this.#wrapConfettiX(sprite)
  }

  // Перезапускает все частицы конфетти.
  #resetConfetti = (fillScreen: boolean) => {
    this.#confetti.forEach((item) => this.#resetConfettiItem(item, fillScreen))
  }

  // Случайно размещает и настраивает одну частицу.
  #resetConfettiItem = (item: ConfettiItem, fillScreen: boolean) => {
    const size = this.#random(9, 20)
    const top = -this.#bounds.height / 2
    item.sprite.setSize(size, size * 0.55)
    item.sprite.tint = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
    item.sprite.position.set(
      this.#random(-this.#bounds.width / 2, this.#bounds.width / 2),
      fillScreen ? this.#random(top, -top) : top - this.#random(0, 160),
    )
    item.drift = this.#random(-70, 70)
    item.phase = Math.random() * Math.PI * 2
    item.speed = this.#random(150, 300)
    item.spin = this.#random(-7, 7)
  }

  // Переносит частицу на противоположный край области.
  #wrapConfettiX = (sprite: Sprite) => {
    const halfWidth = this.#bounds.width / 2
    if (sprite.x < -halfWidth) sprite.x = halfWidth
    if (sprite.x > halfWidth) sprite.x = -halfWidth
  }

  // Останавливает все активные GSAP-анимации эффекта.
  #killAnimations = () => {
    this.#timeline?.kill()
    this.#glowTween?.kill()
    this.#messageTween?.kill()
    this.#timeline = null
    this.#glowTween = null
    this.#messageTween = null
  }

  // Восстанавливает исходную прозрачность и масштаб карточки.
  #restoreTargetVisual = () => {
    if (!this.#targetCard || !this.#targetScale || this.#targetAlpha === null) return
    this.#targetCard.scale.set(this.#targetScale.x, this.#targetScale.y)
    this.#targetCard.alpha = this.#targetAlpha
  }

  // Возвращает случайное число в заданном диапазоне.
  #random = (min: number, max: number) => min + Math.random() * (max - min)
}
