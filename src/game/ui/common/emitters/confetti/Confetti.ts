import {gsap} from 'gsap'
import {Container, Graphics, isMobile, Particle, ParticleContainer, Rectangle, Texture, Ticker} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {GAME_STYLES} from '@/game/styles.js'
import {CONFETTI_SETTINGS} from './config.js'

type Range = {
  readonly min: number
  readonly max: number
}

type PerformanceSettings = {
  readonly frequency: number
  readonly particlesPerWave: number
  readonly maxParticles: number
}

type ConfettiConfig = {
  readonly enabled: boolean
  readonly revealDuration: number
  readonly emissionDuration: number
  readonly gravity: number
  readonly spawnHeight: number
  readonly colors: readonly number[]
  readonly size: Range
  readonly velocityX: Range
  readonly velocityY: Range
  readonly spin: Range
  readonly sway: {
    readonly amplitude: number
    readonly frequency: number
  }
  readonly performance: PerformanceSettings
}

type ParticleState = {
  particle: Particle
  velocityX: number
  velocityY: number
  spin: number
  swayOffset: number
  age: number
}

type VisibleBounds = {
  x: number
  y: number
  width: number
  height: number
}

export default class Confetti {
  #game = Locator.game
  #config!: ConfettiConfig
  #container: Container | null = null
  #fade: Graphics | null = null
  #particleContainer: ParticleContainer | null = null
  #particles: ParticleState[] = []
  #bounds = new Rectangle(0, 0, 1, 1)
  #fadeTween: ReturnType<typeof gsap.to> | null = null
  #spawnElapsed = 0
  #emissionRemaining = 0
  #isRunning = false

  init = (): void => {
    this.#config = this.#createConfig()
    if (!this.#config.enabled) return

    this.#createView()
    this.#setEvents(true)
  }

  destroy = (): void => {
    this.#setEvents(false)
    this.#stop()
    this.#container?.destroy({children: true})
    this.#container = null
    this.#fade = null
    this.#particleContainer = null
  }

  #setEvents(isEnabled: boolean) {
    const action = isEnabled ? 'on' : 'off'

    this.#game[action](GAME_EVENTS.completeLevelWin, this.#start)
    this.#game[action](GAME_EVENTS.gameResize, this.#resize)
    this.#game[action](GAME_EVENTS.clearLevel, this.destroy)
  }

  #createConfig(): ConfettiConfig {
    const performance = isMobile.any ? CONFETTI_SETTINGS.mobile : CONFETTI_SETTINGS.desktop

    return {
      ...CONFETTI_SETTINGS,
      performance,
    }
  }

  #createView() {
    this.#container = new Container({label: 'confetti', visible: false})
    this.#fade = new Graphics({label: 'confetti-fade'})
    this.#particleContainer = this.#createParticleContainer()
    this.#container.addChild(this.#fade, this.#particleContainer)
  }

  #createParticleContainer(): ParticleContainer {
    return new ParticleContainer({
      label: 'confetti-particles',
      texture: Texture.WHITE,
      boundsArea: this.#bounds,
      dynamicProperties: {
        position: true,
        rotation: true,
      },
    })
  }

  #start = (): void => {
    if (this.#isRunning) return

    this.#game.view.addChild(this.#container)
    this.#resize()
    this.#container!.visible = true
    this.#particleContainer!.visible = true
    this.#spawnElapsed = 0
    this.#emissionRemaining = this.#config.emissionDuration
    this.#isRunning = true
    this.#startFade()
    this.#game.app.ticker.add(this.#update)
  }

  #startFade() {
    this.#fade!.alpha = 0
    this.#fadeTween = gsap.to(this.#fade!, {
      alpha: GAME_STYLES.fadeHalfAlpha,
      duration: this.#config.revealDuration,
      ease: 'linear',
      onComplete: () => {
        this.#fadeTween = null
      },
    })
  }

  #stop() {
    this.#game.app.ticker.remove(this.#update)
    this.#fadeTween?.kill()
    this.#fadeTween = null
    this.#isRunning = false
    this.#particles.length = 0
    if (!this.#particleContainer) return

    this.#particleContainer.particleChildren.length = 0
    this.#particleContainer.update()
  }

  #resize = (): void => {
    if (!this.#container) return

    const bounds = this.#getVisibleWorldBounds()
    this.#resizeParticles(bounds.width, bounds.height)
    this.#bounds.set(0, 0, bounds.width, bounds.height)
    this.#particleContainer!.position.set(bounds.x, bounds.y)
    this.#particleContainer!.boundsArea = this.#bounds
    this.#fade!.clear().rect(bounds.x, bounds.y, bounds.width, bounds.height).fill(0x000000)
  }

  #getVisibleWorldBounds(): VisibleBounds {
    const {scaleFactor, x, y} = Locator.gameResize.resizeData

    return {
      x: -x / scaleFactor,
      y: -y / scaleFactor,
      width: Math.max(window.innerWidth / scaleFactor, 1),
      height: Math.max(window.innerHeight / scaleFactor, 1),
    }
  }

  #resizeParticles(width: number, height: number) {
    if (this.#particles.length === 0) return

    const scaleX = width / this.#bounds.width
    const scaleY = height / this.#bounds.height

    for (const item of this.#particles) {
      item.particle.x *= scaleX
      item.particle.y *= scaleY
    }
  }

  #update = (ticker: Ticker): void => {
    const delta = Math.min(ticker.deltaMS / 1000, 0.05)

    this.#updateEmission(delta)
    this.#updateParticles(delta)
    this.#finishWhenEmpty()
  }

  #updateEmission(delta: number) {
    if (this.#emissionRemaining <= 0) return

    this.#emissionRemaining = Math.max(0, this.#emissionRemaining - delta)
    this.#spawnElapsed += delta
    const {frequency} = this.#config.performance

    while (this.#spawnElapsed >= frequency) {
      this.#spawnElapsed -= frequency
      this.#spawnWave()
    }
  }

  #spawnWave() {
    const {maxParticles, particlesPerWave} = this.#config.performance
    const availableCount = Math.min(particlesPerWave, maxParticles - this.#particles.length)
    if (availableCount <= 0) return

    for (let index = 0; index < availableCount; index++) this.#spawnParticle()
    this.#particleContainer!.update()
  }

  #spawnParticle() {
    const particle = this.#createParticle()

    this.#particleContainer!.particleChildren.push(particle)
    this.#particles.push({
      particle,
      velocityX: this.#randomRange(this.#config.velocityX),
      velocityY: this.#randomRange(this.#config.velocityY),
      spin: this.#randomSignedRange(this.#config.spin),
      swayOffset: Math.random() * Math.PI * 2,
      age: 0,
    })
  }

  #createParticle(): Particle {
    const texture = this.#particleContainer!.texture
    const width = this.#randomRange(this.#config.size)
    const height = this.#randomRange(this.#config.size) * 0.55

    return new Particle({
      texture,
      x: Math.random() * this.#bounds.width,
      y: Math.random() * Math.min(this.#config.spawnHeight, this.#bounds.height),
      scaleX: width / texture.width,
      scaleY: height / texture.height,
      anchorX: 0.5,
      anchorY: 0.5,
      rotation: Math.random() * Math.PI,
      tint: this.#randomItem(this.#config.colors),
    })
  }

  #updateParticles(delta: number) {
    let didRemove = false

    for (let index = this.#particles.length - 1; index >= 0; index--) {
      const item = this.#particles[index]
      this.#moveParticle(item, delta)
      if (item.particle.y <= this.#bounds.height + this.#config.size.max) continue

      this.#particles.splice(index, 1)
      this.#particleContainer!.particleChildren.splice(index, 1)
      didRemove = true
    }
    if (didRemove) this.#particleContainer!.update()
  }

  #moveParticle(item: ParticleState, delta: number) {
    const {particle} = item
    const sway = Math.sin(item.age * this.#config.sway.frequency + item.swayOffset)

    item.age += delta
    item.velocityY += this.#config.gravity * delta
    particle.x += (item.velocityX + sway * this.#config.sway.amplitude) * delta
    particle.y += item.velocityY * delta
    particle.rotation += item.spin * delta
    this.#keepParticleInsideWidth(item)
  }

  #keepParticleInsideWidth(item: ParticleState) {
    if (item.particle.x < 0) {
      item.particle.x = 0
      item.velocityX = Math.abs(item.velocityX)
    }
    if (item.particle.x > this.#bounds.width) {
      item.particle.x = this.#bounds.width
      item.velocityX = -Math.abs(item.velocityX)
    }
  }

  #finishWhenEmpty() {
    if (this.#emissionRemaining > 0 || this.#particles.length > 0) return

    this.#game.app.ticker.remove(this.#update)
    this.#isRunning = false
    this.#particleContainer!.visible = false
  }

  #randomRange({min, max}: Range): number {
    return min + Math.random() * (max - min)
  }

  #randomSignedRange(range: Range): number {
    const value = this.#randomRange(range)
    return Math.random() < 0.5 ? -value : value
  }

  #randomItem(items: readonly number[]): number {
    return items[Math.floor(Math.random() * items.length)]
  }
}
