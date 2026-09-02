import type {DestroyOptions} from 'pixi.js'
import {Container} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import type {LevelAppearance} from '@/game/gameConfig/levels/levelTypes.js'
import type {SokobanDirectionName} from '../config/config.js'
import SokobanDpad from '../input/SokobanDpad.js'
import SokobanInput from '../input/SokobanInput.js'
import SokobanBoard from '../rendering/SokobanBoard.js'
import SokobanHud from '../ui/SokobanHud.js'
import type {SokobanMoveResult} from './SokobanLevel.js'
import SokobanLevel from './SokobanLevel.js'

/**
 * Координирует модель, ввод и представление одной игровой сессии Sokoban.
 */

type SokobanGameOptions = {
  map: string[]
  appearance?: LevelAppearance
  levelNumber: number
  pushRecord?: number
  onComplete?: () => void
  onMove?: () => void
  canMove?: () => boolean
}

export default class SokobanGame extends Container {
  #map: string[]
  #appearance: LevelAppearance
  #levelNumber: number
  #pushRecord?: number
  #onComplete?: () => void
  #onMove?: () => void
  #canMove?: () => boolean
  #level!: SokobanLevel
  #board!: SokobanBoard
  #hud!: SokobanHud
  #dpad!: SokobanDpad
  #input!: SokobanInput
  #dpadVisibilityHandler!: (isVisible: boolean) => void
  #isInputEnabled = false
  #isAnimatingMove = false
  #heldDirection: SokobanDirectionName | null = null

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor({map, appearance = {}, levelNumber, pushRecord, onComplete, onMove, canMove}: SokobanGameOptions) {
    super({label: 'sokoban-game'})

    this.#map = map
    this.#appearance = appearance
    this.#levelNumber = levelNumber
    this.#pushRecord = pushRecord
    this.#onComplete = onComplete
    this.#onMove = onMove
    this.#canMove = canMove
    this.#init()
  }

  // Пытается выполнить перемещение в заданном направлении.
  move(direction: SokobanDirectionName) {
    return this.#startMove(direction, null)
  }

  // Включает или отключает все способы управления уровнем.
  setInputEnabled(isEnabled: boolean) {
    this.#isInputEnabled = isEnabled
    this.#input.setEnabled(isEnabled)
    this.#hud.setEnabled(isEnabled)
    this.#dpad.setEnabled(isEnabled)
  }

  // Добавляет HUD и крестовину в интерфейсный слой игры.
  attachHud() {
    Locator.uiLayer.stateUiLayer.addChild(this.#hud, this.#dpad)
    this.#resizeUi()
  }

  // Скрывает HUD и экранную крестовину.
  hideInterface() {
    this.#hud.visible = false
    this.#dpad.visible = false
  }

  // Возвращает состояние на один шаг назад.
  undo() {
    if (!this.#canUseControls() || !this.#level.undo()) return false

    this.#updateViews()
    return true
  }

  // Возвращает уровень в исходное состояние.
  restart() {
    if (!this.#canUseControls() || !this.#level.restart()) return false

    this.#updateViews()
    return true
  }

  // Пересчитывает размеры и расположение представления.
  resize() {
    this.#board.resize()
    this.#resizeUi()
  }

  // Освобождает обработчики, анимации и ресурсы экземпляра.
  destroy(options?: DestroyOptions) {
    Locator.game.off(GAME_EVENTS.Options.checkboxSokobanDpad, this.#dpadVisibilityHandler)
    this.#input?.destroy()
    this.#hud?.destroy({children: true})
    this.#dpad?.destroy({children: true})
    this.#isInputEnabled = false
    super.destroy(options)
  }

  // Запускает игровой ход и его визуальную анимацию.
  #startMove(direction: SokobanDirectionName, heldDirection: SokobanDirectionName | null) {
    if (!this.#canUseControls()) return false

    const levelDirection = this.#board.getLevelDirection(direction)
    const result = this.#level.move(levelDirection)
    if (!result.moved) return false

    this.#isAnimatingMove = true
    this.#hud.setSteps(this.#level.steps)
    this.#onMove?.()
    const isContinuous = Boolean(heldDirection)
    this.#board.animateMove(result, {isContinuous}).then(() => this.#finishMove(result))
    return true
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init() {
    this.#level = new SokobanLevel(this.#map)
    this.#board = new SokobanBoard(this.#level, this.#appearance)
    this.#hud = new SokobanHud({
      levelNumber: this.#levelNumber,
      pushRecord: this.#pushRecord,
      onUndo: () => this.undo(),
      onRestart: () => this.restart(),
    })
    this.#dpad = new SokobanDpad((direction) => this.#setHeldDirection(direction))
    this.#input = new SokobanInput({
      onMove: (direction) => this.move(direction),
      onHeldDirectionChange: (direction) => this.#setHeldDirection(direction),
      pointerTarget: Locator.game.app.canvas,
    })
    this.#dpadVisibilityHandler = this.#setDpadVisible.bind(this)
    Locator.game.on(GAME_EVENTS.Options.checkboxSokobanDpad, this.#dpadVisibilityHandler)
    this.#setDpadVisible(Locator.storage.playerData.option_sokobanDpad)
    this.addChild(this.#board)
  }

  // Проверяет, разрешён ли новый ход в текущем состоянии игры.
  #canUseControls() {
    return this.#isInputEnabled && !this.#isAnimatingMove && this.#canMove?.() !== false
  }

  // Сохраняет удерживаемое направление и запускает движение.
  #setHeldDirection(direction: SokobanDirectionName | null) {
    if (direction === this.#heldDirection) return

    this.#heldDirection = direction
    this.#continueHeldMovement()
  }

  // Продолжает движение в удерживаемом направлении.
  #continueHeldMovement() {
    if (!this.#heldDirection) return
    this.#startMove(this.#heldDirection, this.#heldDirection)
  }

  // Завершает ход, обновляет тупик и проверяет победу.
  #finishMove(result: SokobanMoveResult) {
    this.#isAnimatingMove = false
    if (result.deadlockedBox) {
      this.#board.showDeadlock(result.deadlockedBox)
      this.#hud.showDeadlockFeedback()
    }
    if (result.completed) {
      this.#complete()
      return
    }

    this.#continueHeldMovement()
  }

  // Синхронизирует доску и HUD после изменения модели.
  #updateViews() {
    this.#hud.clearDeadlockFeedback()
    this.#board.update()
    this.#hud.setSteps(this.#level.steps)
  }

  // Пересчитывает расположение HUD и экранной крестовины.
  #resizeUi() {
    if (!this.#hud.parent) return

    const {width, height, center} = Locator.uiLayer.uiData
    const boardLayout = this.#board.getLayout(this.#hud.parent)

    this.#hud.layout({
      ...boardLayout,
      availableWidth: width,
      availableHeight: height,
      centerX: center.x,
    })
    this.#dpad.layout({width, height})
  }

  // Применяет настройку видимости экранной крестовины.
  #setDpadVisible(isVisible: boolean) {
    this.#dpad.setVisible(isVisible)
  }

  // Блокирует управление и сообщает о завершении уровня.
  #complete() {
    this.setInputEnabled(false)
    this.hideInterface()
    this.#onComplete?.()
  }
}
