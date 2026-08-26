import {Assets, Particle, ParticleContainer, Rectangle, Texture} from 'pixi.js'
import {LIVE_OPS_ID} from '@/game/components/liveOpsController/LiveOpsController.js'
import Locator from '@/game/engine/Locator.js'
import {GAME_NAMES} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {GAME_NAME} from '@/game/generatedAssets/buildMeta.js'
import {Logger} from '@/game/utils/Logger.js'
import defaultConfig from './defaultConfig.json'
import newYearConfig from './newYearConfig.json'

export default class MagicDust {
  #config
  #particles = []
  #particleContainer
  #spawnElapsed = 0
  #game
  #parent

  constructor(game, parent) {
    this.#game = game
    this.#parent = parent
  }

  get container() {
    return this.#particleContainer
  }

  init = () => {
    try {
      if (!this.#parent) {
        console.warn('[MagicDust] Родительский контейнер не определён')
        return
      }

      this.#initializeEmitter()
      this.#parent.addChildAt(this.#particleContainer, Math.min(1, this.#parent.children.length))
      this.#game.app.ticker.add(this.#update)
      this.#game.on(GAME_EVENTS.clearLevel, this.destroy)
    } catch (error) {
      console.error('[MagicDust] Ошибка при инициализации MagicDust:', error)
    }
  }

  destroy = () => {
    try {
      this.#game.app.ticker.remove(this.#update)
      this.#particles.length = 0

      if (this.#particleContainer) {
        this.#particleContainer.destroy()
        this.#particleContainer = null
      }

      this.#game.off(GAME_EVENTS.clearLevel, this.destroy)
      Logger.log('', '[MagicDust] destroy')
    } catch (e) {
      Logger.warn('', '[MagicDust]', e)
    }
  }

  #initializeEmitter = () => {
    try {
      const texture = Assets.get('particle') ?? Texture.WHITE
      const bounds = this.#parent.getLocalBounds()

      const isNewYear = Locator.liveOps.isActive(LIVE_OPS_ID.NEW_YEAR)
      const particleColor = isNewYear ? '#FFFFFF' : this.#getColorByGameName()

      this.#config = {
        ...(isNewYear ? newYearConfig : defaultConfig),
        color: {
          start: particleColor,
          end: particleColor,
        },
      }

      this.#particleContainer = new ParticleContainer({
        texture,
        zIndex: 1,
        boundsArea: new Rectangle(bounds.x, bounds.y, Math.max(bounds.width, 1), Math.max(bounds.height, 1)),
        dynamicProperties: {
          vertex: true,
          position: true,
          color: true,
        },
      })
    } catch (error) {
      console.error('[MagicDust] Ошибка при инициализации эмиттера:', error)
      throw error
    }
  }

  #update = (ticker) => {
    if (!this.#particleContainer || !this.#config) return

    const delta = Math.min(ticker.deltaMS / 1000, 0.1)
    this.#spawnElapsed += delta

    while (this.#spawnElapsed >= this.#config.frequency && this.#particles.length < this.#config.maxParticles) {
      this.#spawnElapsed -= this.#config.frequency
      this.#spawnParticle()
    }

    for (let index = this.#particles.length - 1; index >= 0; index--) {
      const item = this.#particles[index]
      item.age += delta

      if (item.age >= item.lifetime) {
        this.#particleContainer.removeParticle(item.particle)
        this.#particles.splice(index, 1)
        continue
      }

      const progress = item.age / item.lifetime
      item.velocityX += this.#config.acceleration.x * delta
      item.velocityY += this.#config.acceleration.y * delta

      const speed = Math.hypot(item.velocityX, item.velocityY)
      if (this.#config.maxSpeed > 0 && speed > this.#config.maxSpeed) {
        const speedRatio = this.#config.maxSpeed / speed
        item.velocityX *= speedRatio
        item.velocityY *= speedRatio
      }

      item.particle.x += item.velocityX * delta
      item.particle.y += item.velocityY * delta
      item.particle.alpha = this.#lerp(this.#config.alpha.start, this.#config.alpha.end, progress)

      const scale = this.#lerp(item.startScale, item.endScale, progress)
      item.particle.scaleX = scale
      item.particle.scaleY = scale
    }
  }

  #spawnParticle = () => {
    const {texture} = this.#particleContainer
    const scaleMultiplier = this.#random(this.#config.scale.minimumScaleMultiplier ?? 1, 1)
    const speedMultiplier = this.#random(this.#config.speed.minimumSpeedMultiplier ?? 1, 1)
    const startScale = this.#config.scale.start * scaleMultiplier
    const startSpeed = this.#config.speed.start * speedMultiplier
    const particle = new Particle({
      texture,
      x: (this.#config.pos?.x ?? 0) + Math.random() * this.#parent.width,
      y: (this.#config.pos?.y ?? 0) + Math.random() * this.#parent.height,
      scaleX: startScale,
      scaleY: startScale,
      anchorX: 0.5,
      anchorY: 0.5,
      tint: this.#config.color.start,
      alpha: this.#config.alpha.start,
    })

    this.#particleContainer.addParticle(particle)
    this.#particles.push({
      particle,
      age: 0,
      lifetime: this.#random(this.#config.lifetime.min, this.#config.lifetime.max),
      startScale,
      endScale: this.#config.scale.end * scaleMultiplier,
      velocityX: startSpeed,
      velocityY: 0,
    })
  }

  #lerp = (start, end, progress) => start + (end - start) * progress

  #random = (min, max) => min + Math.random() * (max - min)

  #getColorByGameName = () => {
    if (GAME_NAME === GAME_NAMES.detective) return '#ffdd00'
    if (GAME_NAME === GAME_NAMES.detectiveGirl) return '#FFFFFF'

    return '#FFFFFF'
  }
}
