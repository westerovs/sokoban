import {Assets, Container, Sprite, Texture, Ticker} from 'pixi.js'

// Реализует простой совместимый эмиттер спрайтовых частиц без внешней зависимости.

type EmitterConfig = Record<string, any> & {
  textures?: Texture[]
}

type EmitterParticle = {
  age: number
  endScale: number
  lifetime: number
  rotationSpeed: number
  startScale: number
  velocityX: number
  velocityY: number
  view: Sprite
}

// Возвращает случайное число в заданном диапазоне.
const random = (min = 0, max = min) => min + Math.random() * (max - min)

// Линейно интерполирует значение между началом и концом.
const lerp = (start: number, end: number, progress: number) => start + (end - start) * progress

// Добавляет загруженные текстуры к конфигурации эмиттера.
const upgradeConfig = <Config extends Record<string, any>>(config: Config, textures: Texture[] = []): Config & {textures: Texture[]} => ({
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
  #particles: EmitterParticle[] = []
  #playOnceCallback: (() => void) | null = null

  emit = false
  container: Container
  config: EmitterConfig

  // Сохраняет контейнер и конфигурацию частиц.
  constructor(container: Container, config: EmitterConfig) {
    this.container = container
    this.config = config
  }

  // Возвращает состояние автоматического обновления.
  get autoUpdate() {
    return this.#autoUpdate
  }

  // Подключает или отключает эмиттер от общего тикера.
  set autoUpdate(value: boolean) {
    if (this.#autoUpdate === value || this.#destroyed) return

    this.#autoUpdate = value
    Ticker.shared[value ? 'add' : 'remove'](this.#update)
  }

  // Обновляет позицию владельца эмиттера.
  updateOwnerPos = (x: number, y: number) => {
    this.#ownerX = x
    this.#ownerY = y
  }

  // Запускает один цикл эмиссии и вызывает обработчик после завершения.
  playOnceAndDestroy = (callback: () => void) => {
    this.#playOnceCallback = callback
    this.emit = true
    this.autoUpdate = true
  }

  // Удаляет все активные частицы.
  cleanup = () => {
    this.#particles.forEach(({view}) => view.destroy())
    this.#particles.length = 0
  }

  // Полностью останавливает и очищает эмиттер.
  destroy = () => {
    if (this.#destroyed) return

    this.autoUpdate = false
    this.emit = false
    this.cleanup()
    this.#destroyed = true
  }

  // Обновляет эмиссию и частицы на каждом кадре.
  #update = (ticker: Ticker) => {
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

  // Создаёт одну частицу из текущей конфигурации.
  #spawnParticle = () => {
    const texture = this.config.textures?.[0] ?? Assets.get('particle') ?? Texture.WHITE
    const scaleMultiplier = random(this.config.scale?.minimumScaleMultiplier ?? 1, 1)
    const speedMultiplier = random(this.config.speed?.minimumSpeedMultiplier ?? 1, 1)
    const startScale = (this.config.scale?.start ?? 1) * scaleMultiplier
    const startRotation = random(this.config.startRotation?.min, this.config.startRotation?.max)
    const speed = (this.config.speed?.start ?? 0) * speedMultiplier
    const angle = (startRotation * Math.PI) / 180
    const position = this.#getSpawnPosition()
    const view = new Sprite({
      label: 'particle-emitter-particle',
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
      rotationSpeed: (random(this.config.rotationSpeed?.min, this.config.rotationSpeed?.max) * Math.PI) / 180,
    })
  }

  // Рассчитывает позицию рождения частицы.
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

  // Перемещает, вращает и затухает активные частицы.
  #updateParticles = (delta: number) => {
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
