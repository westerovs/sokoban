import {Assets, Sprite, Texture, Ticker} from 'pixi.js'

const random = (min = 0, max = min) => min + Math.random() * (max - min)
const lerp = (start, end, progress) => start + (end - start) * progress

const upgradeConfig = (config, textures = []) => ({
  ...config,
  textures,
})

class Emitter {
  #autoUpdate = false
  #destroyed = false
  #elapsed = 0
  #emitterElapsed = 0
  #ownerX = 0
  #ownerY = 0
  #particles = []
  #playOnceCallback

  emit = false

  constructor(container, config) {
    this.container = container
    this.config = config
  }

  get autoUpdate() {
    return this.#autoUpdate
  }

  set autoUpdate(value) {
    if (this.#autoUpdate === value || this.#destroyed) return

    this.#autoUpdate = value
    Ticker.shared[value ? 'add' : 'remove'](this.#update)
  }

  updateOwnerPos = (x, y) => {
    this.#ownerX = x
    this.#ownerY = y
  }

  playOnceAndDestroy = (callback) => {
    this.#playOnceCallback = callback
    this.emit = true
    this.autoUpdate = true
  }

  cleanup = () => {
    this.#particles.forEach(({view}) => view.destroy())
    this.#particles.length = 0
  }

  destroy = () => {
    if (this.#destroyed) return

    this.autoUpdate = false
    this.emit = false
    this.cleanup()
    this.#destroyed = true
  }

  #update = (ticker) => {
    if (this.#destroyed) return

    const delta = Math.min(ticker.deltaMS / 1000, 0.1)
    const emitterLifetime = this.config.emitterLifetime ?? -1

    if (this.emit) {
      this.#emitterElapsed += delta

      if (emitterLifetime >= 0 && this.#emitterElapsed >= emitterLifetime) {
        this.emit = false
      }

      this.#elapsed += delta
      const frequency = Math.max(this.config.frequency ?? 0.1, 0.001)

      while (this.#elapsed >= frequency && this.#particles.length < (this.config.maxParticles ?? 100)) {
        this.#elapsed -= frequency
        this.#spawnParticle()
      }
    }

    this.#updateParticles(delta)

    if (!this.emit && this.#particles.length === 0 && this.#playOnceCallback) {
      const callback = this.#playOnceCallback
      this.#playOnceCallback = null
      callback()
    }
  }

  #spawnParticle = () => {
    const texture = this.config.textures?.[0] ?? Assets.get('particle') ?? Texture.WHITE
    const scaleMultiplier = random(this.config.scale?.minimumScaleMultiplier ?? 1, 1)
    const speedMultiplier = random(this.config.speed?.minimumSpeedMultiplier ?? 1, 1)
    const startScale = (this.config.scale?.start ?? 1) * scaleMultiplier
    const startRotation = random(this.config.startRotation?.min, this.config.startRotation?.max)
    const speed = (this.config.speed?.start ?? 0) * speedMultiplier
    const angle = startRotation * Math.PI / 180
    const position = this.#getSpawnPosition()
    const view = new Sprite({
      texture,
      anchor: 0.5,
      x: position.x,
      y: position.y,
      scale: startScale,
      rotation: angle,
      tint: this.config.color?.start ?? 0xffffff,
      alpha: this.config.alpha?.start ?? 1,
    })

    this.container.addChild(view)
    this.#particles.push({
      view,
      age: 0,
      lifetime: Math.max(random(this.config.lifetime?.min ?? 1, this.config.lifetime?.max ?? 1), 0.001),
      startScale,
      endScale: (this.config.scale?.end ?? startScale) * scaleMultiplier,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      rotationSpeed: random(this.config.rotationSpeed?.min, this.config.rotationSpeed?.max) * Math.PI / 180,
    })
  }

  #getSpawnPosition = () => {
    const baseX = this.#ownerX + (this.config.pos?.x ?? 0)
    const baseY = this.#ownerY + (this.config.pos?.y ?? 0)

    if (this.config.spawnType === 'circle') {
      const circle = this.config.spawnCircle ?? {}
      const angle = Math.random() * Math.PI * 2
      const radius = Math.sqrt(Math.random()) * (circle.r ?? 0)

      return {
        x: baseX + (circle.x ?? 0) + Math.cos(angle) * radius,
        y: baseY + (circle.y ?? 0) + Math.sin(angle) * radius,
      }
    }

    if (this.config.spawnType === 'rect') {
      const rect = this.config.spawnRect ?? {}
      return {
        x: baseX + (rect.x ?? 0) + Math.random() * (rect.w ?? 0),
        y: baseY + (rect.y ?? 0) + Math.random() * (rect.h ?? 0),
      }
    }

    return {x: baseX, y: baseY}
  }

  #updateParticles = (delta) => {
    const acceleration = this.config.acceleration ?? {x: 0, y: 0}

    for (let index = this.#particles.length - 1; index >= 0; index--) {
      const item = this.#particles[index]
      item.age += delta

      if (item.age >= item.lifetime) {
        item.view.destroy()
        this.#particles.splice(index, 1)
        continue
      }

      const progress = item.age / item.lifetime
      item.velocityX += (acceleration.x ?? 0) * delta
      item.velocityY += (acceleration.y ?? 0) * delta

      const speed = Math.hypot(item.velocityX, item.velocityY)
      if ((this.config.maxSpeed ?? 0) > 0 && speed > this.config.maxSpeed) {
        const ratio = this.config.maxSpeed / speed
        item.velocityX *= ratio
        item.velocityY *= ratio
      }

      item.view.x += item.velocityX * delta
      item.view.y += item.velocityY * delta
      item.view.rotation += item.rotationSpeed * delta
      item.view.alpha = lerp(this.config.alpha?.start ?? 1, this.config.alpha?.end ?? 1, progress)
      item.view.scale.set(lerp(item.startScale, item.endScale, progress))
    }
  }
}

export {Emitter, upgradeConfig}
