import {SOKOBAN_SETTINGS} from '@/game/sokoban/config/settings.js'
import {compactEditorState, expandEditorState} from './editorGrid.js'

/**
 * Хранит снимки редактируемого уровня и историю отмены изменений.
 */

// Выполняет отдельную операцию `cloneState`.
const cloneState = (state) => structuredClone(state)
// Преобразует данные в формат операции `serializeState`.
const serializeState = (state) => JSON.stringify(state)

export default class EditorSession {
  #future = []
  #past = []
  #savedMap
  #savedState
  #state

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(level, appearance) {
    this.#init(level, appearance)
  }

  // Возвращает значение свойства `state`.
  get state() {
    return this.#state
  }

  // Возвращает значение свойства `isDirty`.
  get isDirty() {
    return serializeState(this.#state) !== this.#savedState
  }

  // Возвращает значение свойства `isMapDirty`.
  get isMapDirty() {
    return JSON.stringify(this.#state.map) !== this.#savedMap
  }

  // Возвращает значение свойства `canUndo`.
  get canUndo() {
    return this.#past.length > 0
  }

  // Возвращает значение свойства `canRedo`.
  get canRedo() {
    return this.#future.length > 0
  }

  // Обновляет состояние через операцию `apply`.
  apply(nextState) {
    if (serializeState(nextState) === serializeState(this.#state)) return false

    this.#past.push(cloneState(this.#state))
    this.#state = cloneState(nextState)
    this.#future = []
    return true
  }

  // Возвращает состояние на один шаг назад.
  undo() {
    const previousState = this.#past.pop()
    if (!previousState) return false

    this.#future.push(cloneState(this.#state))
    this.#state = previousState
    return true
  }

  // Повторно применяет отменённое изменение.
  redo() {
    const nextState = this.#future.pop()
    if (!nextState) return false

    this.#past.push(cloneState(this.#state))
    this.#state = nextState
    return true
  }

  // Отменяет все изменения и возвращает состояние на момент открытия или сохранения.
  reset() {
    if (!this.isDirty) return false
    this.#state = JSON.parse(this.#savedState)
    this.#past = []
    this.#future = []
    return true
  }

  // Возвращает компактное состояние без пустой рамки рабочего поля.
  getExportState() {
    return compactEditorState(this.#state)
  }

  // Инициализирует внутреннее состояние и зависимости.
  #init(level, appearance) {
    this.#state = expandEditorState(level, appearance, SOKOBAN_SETTINGS.maxBoardColumns, SOKOBAN_SETTINGS.maxBoardRows)
    this.#savedState = serializeState(this.#state)
    this.#savedMap = JSON.stringify(this.#state.map)
  }
}
