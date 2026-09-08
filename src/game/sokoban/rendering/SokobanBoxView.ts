import {gsap} from 'gsap'
import type {Sprite} from 'pixi.js'
import {Container} from 'pixi.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import {SOKOBAN_SETTINGS} from '../config/settings.js'
import {applyTileVisualScale} from './applyTileVisualScale.js'

/**
 * Отображает один ящик Sokoban и его состояние на цели.
 */

const DEADLOCK_TINT = 0xff3030 // Красный цвет предупреждения о заблокированном ящике

// Смешивает два RGB-цвета с заданной интенсивностью.
const mixTint = (start: number, end: number, progress: number) => {
  const mixChannel = (shift: number) => {
    const startChannel = (start >> shift) & 0xff
    const endChannel = (end >> shift) & 0xff
    return Math.round(startChannel + (endChannel - startChannel) * progress) << shift
  }

  return mixChannel(16) | mixChannel(8) | mixChannel(0)
}

export default class SokobanBoxView extends Container {
  #tileSize: number
  #box!: Sprite
  #baseTint = 0xffffff
  #deadlockTintState = {progress: 0}
  #deadlockTimeline: gsap.core.Timeline | null = null

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(id: string, tileSize: number, textureName: string) {
    super({label: 'sokoban-' + id})

    this.#tileSize = tileSize
    this.#init(id, textureName)
  }

  // Обновляет визуальное состояние ящика на цели.
  setOnTarget(isOnTarget: boolean) {
    this.#baseTint = isOnTarget ? SOKOBAN_SETTINGS.boxOnTargetTint : 0xffffff
    this.#applyTint()
  }

  // Запускает мигающее красное окрашивание заблокированного ящика.
  showDeadlock() {
    this.clearDeadlock()
    this.#deadlockTimeline = this.#createDeadlockTimeline()
  }

  // Останавливает предупреждение и восстанавливает обычный цвет ящика.
  clearDeadlock() {
    this.#deadlockTimeline?.kill()
    this.#deadlockTimeline = null
    this.#deadlockTintState.progress = 0
    this.#applyTint()
  }

  // Компенсирует поворот игровой доски для внутреннего спрайта ящика.
  setBoardRotation(rotation: number) {
    this.#box.rotation = -rotation
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init(id: string, textureName: string) {
    this.#box = this.#createBox(id, textureName)
    this.addChild(this.#box)
  }

  // Создаёт спрайт ящика с выбранной текстурой.
  #createBox(id: string, textureName: string) {
    const box = GameUtils.createSprite(textureName, {
      label: 'sokoban-box-sprite-' + id,
      anchorY: 0.5,
    })

    box.position.set(this.#tileSize / 2, this.#tileSize / 2)
    applyTileVisualScale(box, this.#tileSize)

    return box
  }

  // Создаёт анимацию интенсивности красного оттенка.
  #createDeadlockTimeline() {
    return gsap
      .timeline({onComplete: () => this.clearDeadlock()})
      .to(this.#deadlockTintState, {progress: 1, duration: 0.14, onUpdate: () => this.#applyTint()})
      .to(this.#deadlockTintState, {
        progress: 0.25,
        duration: 0.22,
        repeat: 5,
        yoyo: true,
        onUpdate: () => this.#applyTint(),
      })
      .to(this.#deadlockTintState, {progress: 0, duration: 0.3, onUpdate: () => this.#applyTint()})
  }

  // Применяет текущую интенсивность предупреждающего оттенка к спрайту.
  #applyTint() {
    this.#box.tint = mixTint(this.#baseTint, DEADLOCK_TINT, this.#deadlockTintState.progress)
  }
}
