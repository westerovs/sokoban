import type {DestroyOptions} from 'pixi.js'
import {Assets, Container, Sprite, Texture, Ticker} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'

type GlowParticle = {
  baseScale: number
  phase: number
  rotationSpeed: number
  speedMultiplier: number
  sprite: Sprite
  twinkleSpeed: number
  wobbleAmplitude: number
  wobblePhase: number
  wobbleSpeed: number
}

type Point = {x: number; y: number}

const PARTICLE_COUNT = 16 // Количество звёзд вокруг активной карточки
const PATH_SPEED = 125 // Скорость движения звёзд по контуру в пикселях в секунду
const PATH_PADDING = 12 // Отступ траектории от границ карточки
const PATH_CORNER_RADIUS = 32 // Радиус скругления траектории в пикселях
const PARTICLE_MIN_SIZE = 9 // Минимальный размер звезды в пикселях
const PARTICLE_SIZE_STEP = 2 // Разница размеров соседних звёзд в пикселях
const PARTICLE_SIZE_VARIANTS = 5 // Количество вариантов размера звезды
const STAR_TINTS = [0xffc83d, 0xffdf6b, 0xfff1ad] as const // Золотые оттенки свечения

export default class ActiveCardGlowEmitter extends Container {
  #cornerLength!: number
  #elapsed = 0
  #height: number
  #halfHeight!: number
  #halfPathLength!: number
  #halfWidth!: number
  #horizontalLength!: number
  #isActive = false
  #particles: GlowParticle[] = []
  #ticker = Locator.game.app.ticker
  #verticalLength!: number
  #width: number

  constructor(label: string, width: number, height: number) {
    super({label, eventMode: 'none', visible: false})

    this.#width = width
    this.#height = height
    this.#init()
  }

  setActive = (isActive: boolean) => {
    if (this.#isActive === isActive) return

    this.#isActive = isActive
    this.visible = isActive
    this.#ticker[isActive ? 'add' : 'remove'](this.#update)
  }

  override destroy(options?: DestroyOptions) {
    this.#ticker.remove(this.#update)
    this.#particles.length = 0
    super.destroy(options)
  }

  #init = () => {
    this.#createPathGeometry()
    this.#createParticles()
  }

  #createPathGeometry = () => {
    this.#halfWidth = this.#width / 2 + PATH_PADDING
    this.#halfHeight = this.#height / 2 + PATH_PADDING
    this.#horizontalLength = (this.#halfWidth - PATH_CORNER_RADIUS) * 2
    this.#verticalLength = (this.#halfHeight - PATH_CORNER_RADIUS) * 2
    this.#cornerLength = (Math.PI * PATH_CORNER_RADIUS) / 2
    this.#halfPathLength = this.#horizontalLength + this.#verticalLength + this.#cornerLength * 2
  }

  #createParticles = () => {
    const texture = Assets.get('icon-star') ?? Texture.WHITE

    for (let index = 0; index < PARTICLE_COUNT; index++) {
      const particle = this.#createParticle(texture, index)
      this.#particles.push(particle)
      this.addChild(particle.sprite)
    }
  }

  #createParticle = (texture: Texture, index: number): GlowParticle => {
    const size = PARTICLE_MIN_SIZE + (index % PARTICLE_SIZE_VARIANTS) * PARTICLE_SIZE_STEP
    const sprite = new Sprite({
      label: `${this.label}-star-${index}`,
      texture,
      anchor: 0.5,
      blendMode: 'add',
      tint: STAR_TINTS[index % STAR_TINTS.length],
    })

    return {
      baseScale: size / Math.max(texture.width, 1),
      phase: (index / PARTICLE_COUNT + ((index * 7) % 5) * 0.006) % 1,
      rotationSpeed: index % 2 === 0 ? 1.2 : -0.9,
      speedMultiplier: 1 + (((index * 37) % 9) - 4) * 0.025,
      sprite,
      twinkleSpeed: 2.4 + (index % 4) * 0.45,
      wobbleAmplitude: 3 + (index % 4) * 1.3,
      wobblePhase: index * 2.399,
      wobbleSpeed: 0.8 + (index % 5) * 0.13,
    }
  }

  #update = (ticker: Ticker) => {
    const delta = Math.min(ticker.deltaMS / 1000, 0.05)
    this.#elapsed += delta

    for (const particle of this.#particles) this.#updateParticle(particle, delta)
  }

  #updateParticle = (particle: GlowParticle, delta: number) => {
    const pathLength = this.#halfPathLength * 2
    const distance =
      (particle.phase * pathLength + this.#elapsed * PATH_SPEED * particle.speedMultiplier) % pathLength
    const twinkle = (Math.sin(this.#elapsed * particle.twinkleSpeed + particle.phase * Math.PI * 6) + 1) / 2
    const position = this.#applyWobble(this.#getPathPosition(distance), distance, pathLength, particle)
    const scale = particle.baseScale * (0.72 + twinkle * 0.42)

    particle.sprite.position.set(position.x, position.y)
    particle.sprite.scale.set(scale)
    particle.sprite.alpha = 0.28 + twinkle * 0.72
    particle.sprite.rotation += particle.rotationSpeed * delta
  }

  // Смещает звезду поперёк контура плавной волной с индивидуальной фазой.
  #applyWobble = (position: Point, distance: number, pathLength: number, particle: GlowParticle) => {
    const nextPosition = this.#getPathPosition((distance + 1) % pathLength)
    const tangentX = nextPosition.x - position.x
    const tangentY = nextPosition.y - position.y
    const tangentLength = Math.max(Math.hypot(tangentX, tangentY), 0.001)
    const wobble = Math.sin(this.#elapsed * particle.wobbleSpeed + particle.wobblePhase) * particle.wobbleAmplitude

    return {
      x: position.x - (tangentY / tangentLength) * wobble,
      y: position.y + (tangentX / tangentLength) * wobble,
    }
  }

  #getPathPosition = (distance: number) => {
    if (distance < this.#halfPathLength) return this.#getTopRightHalfPosition(distance)
    return this.#getBottomLeftHalfPosition(distance - this.#halfPathLength)
  }

  #getTopRightHalfPosition = (distance: number) => {
    if (distance < this.#horizontalLength)
      return {x: -this.#halfWidth + PATH_CORNER_RADIUS + distance, y: -this.#halfHeight}
    distance -= this.#horizontalLength
    if (distance < this.#cornerLength)
      return this.#getArcPosition(
        this.#halfWidth - PATH_CORNER_RADIUS,
        -this.#halfHeight + PATH_CORNER_RADIUS,
        -Math.PI / 2,
        distance,
      )
    distance -= this.#cornerLength
    if (distance < this.#verticalLength)
      return {x: this.#halfWidth, y: -this.#halfHeight + PATH_CORNER_RADIUS + distance}
    return this.#getArcPosition(
      this.#halfWidth - PATH_CORNER_RADIUS,
      this.#halfHeight - PATH_CORNER_RADIUS,
      0,
      distance - this.#verticalLength,
    )
  }

  #getBottomLeftHalfPosition = (distance: number) => {
    if (distance < this.#horizontalLength)
      return {x: this.#halfWidth - PATH_CORNER_RADIUS - distance, y: this.#halfHeight}
    distance -= this.#horizontalLength
    if (distance < this.#cornerLength)
      return this.#getArcPosition(
        -this.#halfWidth + PATH_CORNER_RADIUS,
        this.#halfHeight - PATH_CORNER_RADIUS,
        Math.PI / 2,
        distance,
      )
    distance -= this.#cornerLength
    if (distance < this.#verticalLength)
      return {x: -this.#halfWidth, y: this.#halfHeight - PATH_CORNER_RADIUS - distance}
    return this.#getArcPosition(
      -this.#halfWidth + PATH_CORNER_RADIUS,
      -this.#halfHeight + PATH_CORNER_RADIUS,
      Math.PI,
      distance - this.#verticalLength,
    )
  }

  // Преобразует пройденное расстояние по углу в точку дуги без изменения линейной скорости.
  #getArcPosition = (centerX: number, centerY: number, startAngle: number, distance: number) => {
    const angle = startAngle + (distance / this.#cornerLength) * (Math.PI / 2)
    return {
      x: centerX + Math.cos(angle) * PATH_CORNER_RADIUS,
      y: centerY + Math.sin(angle) * PATH_CORNER_RADIUS,
    }
  }
}
