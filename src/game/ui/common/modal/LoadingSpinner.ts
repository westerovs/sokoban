import {gsap} from 'gsap'
import {Container, Graphics} from 'pixi.js'
import {popupColors} from '../../../styles.js'

// Отображает вращающийся индикатор ожидания внутри модального окна.

const SHOW_DELAY = 0.15 // Задержка появления индикатора
const ROTATION_DURATION = 0.8 // Длительность полного оборота

export default class LoadingSpinner extends Container {
  #animation: gsap.core.Tween | null = null

  // Создаёт скрытый индикатор ожидания.
  constructor() {
    super({label: 'modalLoadingSpinner'})

    this.visible = false
    this.#init()
  }

  // Запускает бесконечное вращение индикатора.
  start() {
    if (this.#animation) return

    this.#animation = gsap.to(this, {
      rotation: Math.PI * 2,
      duration: ROTATION_DURATION,
      delay: SHOW_DELAY,
      ease: 'none',
      repeat: -1,
      onStart: () => (this.visible = true),
    })
  }

  // Останавливает вращение и скрывает индикатор.
  stop() {
    this.#animation?.kill()
    this.#animation = null
    this.rotation = 0
    this.visible = false
  }

  // Останавливает анимацию и освобождает графику.
  destroy(options?: Parameters<Container['destroy']>[0]) {
    this.stop()
    const destroyOptions = typeof options === 'object' ? {...options, children: true} : {children: true}
    super.destroy(destroyOptions)
  }

  // Рисует дугу индикатора.
  #init() {
    const arc = new Graphics({label: 'modalLoadingSpinnerArc'})
      .arc(0, 0, 32, -Math.PI / 2, Math.PI / 2)
      .stroke({width: 8, color: popupColors.border, cap: 'round'})

    this.addChild(arc)
  }
}
