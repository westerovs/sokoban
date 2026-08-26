import {Assets, Container, Texture} from 'pixi.js'
import Locator from '@/game/engine/Locator.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {Emitter, upgradeConfig} from '@/game/utils/particles/ParticleEmitter.js'

const particlesConfig = {
  alpha: {
    start: 1,
    end: 0,
  },
  scale: {
    start: 0.2,
    end: 0.6,
    minimumScaleMultiplier: 0.8,
  },
  color: {
    start: '#fff2b0',
    end: '#ffe9a6',
  },
  speed: {
    start: 200,
    end: 50,
    minimumSpeedMultiplier: 1,
  },
  acceleration: {
    x: 0,
    y: 0,
  },
  maxSpeed: 0,
  startRotation: {
    min: 180,
    max: 360,
  },
  noRotation: false,
  rotationSpeed: {
    min: -20,
    max: 20,
  },
  lifetime: {
    min: 0.6,
    max: 1.2,
  },
  frequency: 0.05,
  emitterLifetime: -1,
  maxParticles: 80,
  pos: {
    x: 0,
    y: 0,
  },
  spawnType: 'circle',
  spawnCircle: {
    x: 0,
    y: 0,
    r: 10,
  },
}

export default class TrailEmitter extends Container {
  #game = Locator.game
  #parent
  #target
  #emitter
  #toCenter
  #view = this

  constructor({parent, target, toCenter = false} = {}) {
    super()
    this.#parent = parent
    this.#target = target
    this.visible = false
    this.#toCenter = toCenter

    this.#init()
  }

  #init = () => {
    this.#game.on(GAME_EVENTS.completeLevel, this.destroyComponent)
    this.#initializeEmitter()
    this.#parent.addChild(this.#view)
  }

  #initializeEmitter = () => {
    const texture = Assets.get('icon-star') ?? Texture.WHITE
    const config = upgradeConfig(
      {
        ...particlesConfig,
        frequency: 0.01,
        emitterLifetime: -1,
      },
      [texture],
    )

    this.#emitter = new Emitter(this.#view, config)
    this.#emitter.autoUpdate = true
    this.#emitter.emit = true

    // обновляем позицию за стрелой каждый кадр
    this.#game.app.ticker.add(this.#update)
  }

  #update = () => {
    try {
      if (!this.#emitter || !this.#target || this.#target.destroyed) return

      // длина от центра до кончика в координатах родителя (учитывает scale)
      const tipOffset = this.#target.width

      // координаты кончика в системе координат stateUiLayer (родитель = this.#parent)
      const tipX = this.#target.x + Math.cos(this.#target.rotation) * tipOffset
      const tipY = this.#target.y + Math.sin(this.#target.rotation) * tipOffset

      if (this.#toCenter) {
        this.#emitter.updateOwnerPos(this.#target.x, this.#target.y)
        return
      }

      this.#emitter.updateOwnerPos(tipX, tipY)
    } catch (e) {
      console.error('[TrailEmitter]', e)
    }
  }

  pause = () => {
    if (this.#emitter) {
      this.#emitter.emit = false
      this.visible = false
    }
  }

  resume = () => {
    if (this.#emitter) {
      this.#emitter.emit = true
      this.visible = true
    }
  }

  destroyComponent = () => {
    this.#game.app.ticker.remove(this.#update)
    this.#game.off(GAME_EVENTS.completeLevel, this.destroyComponent)

    try {
      if (this.#emitter) {
        this.#emitter.emit = false
        this.#emitter.autoUpdate = false
        this.#emitter.cleanup()
        this.#emitter.destroy()
        this.#emitter = null
      }

      this.#target = null
      this.destroy({children: true})
    } catch (e) {
      console.error('[DartsTrail]', e)
    }
  }
}
