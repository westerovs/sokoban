import assert from 'node:assert/strict'
import {test} from 'node:test'
import {replaceMissingDecorTextures, validateLevelAppearance} from '../../sokoban-levels/levelAppearance.js'
import EditorSession from './EditorSession.js'
import {applyEditorBrush} from './levelEditing.js'

// Проверяет сохранность смещений декора при преобразовании карты и работе истории.

const LEVEL = {id: 'test', authorId: 'test', map: ['#####', '#@$.#', '#####']} // Минимальная карта проверки
const APPEARANCE = {decor: {'0:0': 'decor-test', '1:0': 'decor-test'}, decorOffsets: {'0:0': {x: -12, y: 7}, '1:0': {x: 3, y: -2}}} // Два независимых объекта
const CATALOG = {groups: {decor: ['decor-test']}} // Допустимая текстура декора

test('Расширение, обрезка и история сохраняют смещение каждого экземпляра', () => {
  const session = new EditorSession(LEVEL, APPEARANCE)
  assert.deepEqual(session.getExportState().appearance, APPEARANCE)
  const state = structuredClone(session.state)
  const key = Object.keys(state.appearance.decorOffsets!)[0]
  state.appearance.decorOffsets![key].x = 42
  session.apply(state)
  assert.equal(session.getExportState().appearance.decorOffsets!['0:0'].x, 42)
  assert.equal(session.getExportState().appearance.decorOffsets!['1:0'].x, 3)
  assert.equal(session.isMapDirty, false)
  assert.equal(session.isDirty, true)
  session.undo()
  assert.deepEqual(session.getExportState().appearance, APPEARANCE)
  session.redo()
  assert.equal(session.getExportState().appearance.decorOffsets!['0:0'].x, 42)
})

test('Удаление декора удаляет только его смещение', () => {
  const session = new EditorSession(LEVEL, APPEARANCE)
  const keys = Object.keys(session.state.appearance.decor!)
  const [x, y] = keys[0].split(':').map(Number)
  const {state} = applyEditorBrush(session.state, {mode: 'void', label: 'Пустота'}, {x, y}, {})
  assert.equal(state.appearance.decorOffsets?.[keys[0]], undefined)
  assert.deepEqual(state.appearance.decorOffsets?.[keys[1]], {x: 3, y: -2})
})

test('Валидация отклоняет смещение без декора и нечисловые значения', () => {
  assert.doesNotThrow(() => validateLevelAppearance(LEVEL, APPEARANCE, CATALOG))
  assert.throws(() => validateLevelAppearance(LEVEL, {decorOffsets: APPEARANCE.decorOffsets}, CATALOG))
  for (const x of [NaN, Infinity, '12', null]) {
    assert.throws(() => validateLevelAppearance(LEVEL, {...APPEARANCE, decorOffsets: {'0:0': {x, y: 0}}}, CATALOG))
  }
})

test('Отсутствующий декор заменяется на пустую текстуру без изменения исходных данных', () => {
  const appearance = {decor: {'0:0': 'decor-missing'}}
  const catalog = {groups: {decor: ['d_empty']}}
  const resolved = replaceMissingDecorTextures(appearance, catalog)

  assert.deepEqual(resolved.appearance, {decor: {'0:0': 'd_empty'}})
  assert.deepEqual(resolved.replacements, [{positionKey: '0:0', texture: 'decor-missing'}])
  assert.deepEqual(appearance, {decor: {'0:0': 'decor-missing'}})
})

test('Отсутствующая текстура другого слоя остаётся ошибкой валидации', () => {
  const appearance = {wall: {'0:0': 'wall-missing'}}
  const catalog = {groups: {wall: ['wall-default'], decor: ['d_empty']}}
  const resolved = replaceMissingDecorTextures(appearance, catalog)

  assert.throws(() => validateLevelAppearance(LEVEL, resolved.appearance, catalog))
})
