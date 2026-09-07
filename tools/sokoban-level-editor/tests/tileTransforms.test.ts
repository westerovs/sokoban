// Run from the repository root: node --import tsx --test tools/sokoban-level-editor/tests/tileTransforms.test.ts
import assert from 'node:assert/strict'
import {test} from 'node:test'
import type {Sprite} from 'pixi.js'
import {
  createTileAppearance,
  getTileTexture,
  getTileTransform,
  isTileAppearance,
  normalizeTileTransform,
} from '../../../src/game/sokoban/appearance/tileAppearance.js'
import type {TileTransform} from '../../../src/game/sokoban/appearance/tileAppearance.js'
import {applyTileTransform} from '../../../src/game/sokoban/rendering/applyTileTransform.js'
import {removeTileAppearances, setTileAppearance} from '../src/appearanceState.js'
import {isTransformableBrush, transformEditorBrush} from '../src/brushTransforms.js'
import type {BrushTransformAction} from '../src/brushTransforms.js'
import {compactEditorState, expandEditorState} from '../src/editorGrid.js'
import EditorSession from '../src/EditorSession.js'
import type {EditorBrush, EditorState} from '../src/editorTypes.js'

const defaults = {wall: 'wall', decor: 'decor', ground: 'ground', box: 'box', target: 'target'}
const brush: EditorBrush = {mode: 'tile', role: 'wall', texture: 'wall', label: 'Wall'}
const identity = {rotation: 0, flipX: false, flipY: false}
const actions: BrushTransformAction[] = ['flipX', 'flipY', 'rotate']
const point = {x: 3, y: 7}

// Independent integer-coordinate oracle, rather than the implementation's axis mapping.
const applyToPoint = ({rotation, flipX, flipY}: TileTransform, position = point) => {
  let x = position.x * (flipX ? -1 : 1)
  let y = position.y * (flipY ? -1 : 1)
  for (let turns = rotation / 90; turns > 0; turns--) [x, y] = [-y, x]
  return {x: x || 0, y: y || 0}
}
const applyAction = ({x, y}: typeof point, action: BrushTransformAction) => {
  if (action === 'flipX') return {x: -x, y}
  if (action === 'flipY') return {x, y: -y}
  return {x: -y, y: x}
}

test('all 16 orientations compose with each screen-axis action without mutating the brush', () => {
  for (const rotation of [0, 90, 180, 270]) {
    for (const flipX of [false, true]) {
      for (const flipY of [false, true]) {
        const transform = {rotation, flipX, flipY}
        for (const action of actions) {
          const initial = {...brush, transform: Object.freeze({...transform})}
          const next = transformEditorBrush(initial, action)
          assert.deepEqual(applyToPoint(next.transform!), applyAction(applyToPoint(transform), action))
          assert.deepEqual(initial.transform, transform)
          assert.notEqual(next, initial)
          assert.notEqual(next.transform, initial.transform)
        }
      }
    }
  }
})

test('5000 mixed operations match independently accumulated coordinates', () => {
  let selected = brush
  let expected = point
  let seed = 12345
  for (let index = 0; index < 5000; index++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const action = actions[seed % actions.length]
    selected = transformEditorBrush(selected, action)
    expected = applyAction(expected, action)
    assert.deepEqual(applyToPoint(selected.transform!), expected)
    assert.ok([0, 90, 180, 270].includes(selected.transform!.rotation))
  }
})

test('repeated complete turns and double reflections restore the original orientation', () => {
  let selected = transformEditorBrush(brush, 'flipX')
  const initial = selected.transform
  for (let turn = 0; turn < 10000; turn++) selected = transformEditorBrush(selected, 'rotate')
  assert.deepEqual(selected.transform, initial)
  for (const action of ['flipX', 'flipY'] as const) {
    assert.deepEqual(transformEditorBrush(transformEditorBrush(selected, action), action).transform, initial)
  }
})

test('player, eraser and incomplete brushes cannot be transformed', () => {
  for (const selected of [{mode: 'void', label: 'Void'}, {mode: 'player', label: 'Player'}, {mode: 'tile', label: 'Missing'}]) {
    assert.equal(isTransformableBrush(selected), false)
    for (const action of actions) assert.equal(transformEditorBrush(selected, action), selected)
  }
  assert.equal(isTransformableBrush(null), false)
  assert.equal(brush.transform, undefined)
})

test('legacy appearances remain strings and undefined appearances are identity transforms', () => {
  assert.equal(createTileAppearance('wall'), 'wall')
  assert.equal(createTileAppearance('wall', identity), 'wall')
  assert.equal(getTileTexture('wall'), 'wall')
  assert.equal(getTileTexture(createTileAppearance('wall', {rotation: 90, flipX: true})), 'wall')
  assert.equal(getTileTexture(undefined), undefined)
  assert.deepEqual(getTileTransform('wall'), identity)
  assert.deepEqual(getTileTransform(undefined), identity)
  assert.deepEqual(normalizeTileTransform({rotation: -90}), {...identity, rotation: 270})
  assert.deepEqual(normalizeTileTransform({rotation: Infinity}), identity)
})

test('validation accepts legacy and transformed appearances but rejects malformed values', () => {
  for (const value of ['wall', {texture: 'wall'}, {texture: 'wall', rotation: 90, flipX: true, flipY: false}]) {
    assert.equal(isTileAppearance(value), true)
  }
  for (const value of [null, [], '', 90, {}, {texture: 42}, {texture: 'wall', rotation: '90'},
    {texture: 'wall', rotation: 45}, {texture: 'wall', rotation: 360}, {texture: 'wall', rotation: NaN},
    {texture: 'wall', flipX: 1}, {texture: 'wall', flipY: 'false'}, {texture: 'wall', extra: true}]) {
    assert.equal(isTileAppearance(value), false)
  }
})

test('a transformed default is stored without changing other cells or sharing brush state', () => {
  const initial = {wall: {'1:0': 'other-wall'}}
  const selected = transformEditorBrush(transformEditorBrush(brush, 'flipX'), 'rotate')
  const result = setTileAppearance(initial, selected, '0:0', defaults)
  assert.deepEqual(result.wall?.['0:0'], {texture: 'wall', rotation: 90, flipX: true, flipY: false})
  assert.equal(result.wall?.['1:0'], 'other-wall')
  assert.deepEqual(initial, {wall: {'1:0': 'other-wall'}})
  selected.transform!.flipX = false
  assert.deepEqual(getTileTransform(result.wall?.['0:0']), {rotation: 90, flipX: true, flipY: false})
})

test('each paintable role stores its own orientation', () => {
  for (const role of Object.keys(defaults)) {
    const selected = transformEditorBrush({...brush, role, texture: role}, 'flipY')
    const result = setTileAppearance({}, selected, '0:0', defaults)
    assert.deepEqual(result[role]?.['0:0'], {texture: role, rotation: 0, flipX: false, flipY: true})
    assert.equal(Object.keys(result).length, 1)
  }
})

test('painting the ordinary default resets only that cell and erasing removes its transform', () => {
  const selected = transformEditorBrush(brush, 'rotate')
  const first = setTileAppearance({}, selected, '0:0', defaults)
  const second = setTileAppearance(first, selected, '1:0', defaults)
  const reset = setTileAppearance(second, brush, '0:0', defaults)
  assert.equal(reset.wall?.['0:0'], undefined)
  assert.deepEqual(reset.wall?.['1:0'], second.wall?.['1:0'])
  assert.deepEqual(removeTileAppearances(reset, '1:0', ['wall']), {})
})

test('ordinary defaults keep the old compact format, including explicit decor tiles', () => {
  assert.deepEqual(setTileAppearance({}, brush, '0:0', defaults), {})
  assert.deepEqual(setTileAppearance({}, {...brush, texture: 'custom-wall'}, '0:0', defaults), {wall: {'0:0': 'custom-wall'}})
  assert.deepEqual(setTileAppearance({}, {...brush, role: 'decor', texture: 'decor'}, '0:0', defaults), {decor: {'0:0': 'decor'}})
})

test('compact export, JSON reload and re-expansion preserve transforms and the map', () => {
  const appearance = {wall: {'0:0': createTileAppearance('wall', {rotation: 270, flipX: true})}}
  const level = {id: 'test', map: ['###', '#@#', '###']}
  const compact = compactEditorState(expandEditorState(level, appearance, 20, 20))
  assert.deepEqual(compact, {levelId: 'test', map: level.map, appearance})
  const reloaded = JSON.parse(JSON.stringify(compact)) as EditorState
  assert.deepEqual(compactEditorState(expandEditorState({id: reloaded.levelId, map: reloaded.map}, reloaded.appearance, 20, 20)), compact)
})

test('undo, redo and reset preserve visual-only edits without marking topology dirty', () => {
  const session = new EditorSession({id: 'test', map: ['#']}, {})
  const original = structuredClone(session.state)
  const selected = transformEditorBrush(brush, 'rotate')
  const y = session.state.map.findIndex((row) => row.includes('#'))
  const x = session.state.map[y].indexOf('#')
  const changed = {...session.state, appearance: setTileAppearance(session.state.appearance, selected, `${x}:${y}`, defaults)}
  assert.equal(session.apply(changed), true)
  assert.equal(session.isDirty, true)
  assert.equal(session.isMapDirty, false)
  assert.equal(session.undo(), true)
  assert.deepEqual(session.state, original)
  assert.equal(session.redo(), true)
  assert.deepEqual(session.state, changed)
  assert.equal(session.reset(), true)
  assert.deepEqual(session.state, original)
  assert.equal(session.canUndo, false)
})

const createSpriteStub = (width = 100, height = 100, scale = 1) => ({
  x: 150,
  y: 200,
  rotation: 0,
  texture: {
    orig: {width, height},
    frame: {width: width / 2, height: height / 2},
    trim: {x: width / 4, y: height / 4, width: width / 2, height: height / 2},
  },
  anchor: {x: 0.5, y: 1, set(x: number, y = x) {
    this.x = x
    this.y = y
  }},
  scale: {x: scale, y: scale, set(x: number, y = x) {
    this.x = x
    this.y = y
  }},
})

test('legacy sprites retain their original anchor, position, rotation and scale', () => {
  const sprite = createSpriteStub()
  const snapshot = JSON.stringify(sprite)
  applyTileTransform(sprite as unknown as Sprite, 'wall')
  assert.equal(JSON.stringify(sprite), snapshot)
  applyTileTransform(sprite as unknown as Sprite, undefined)
  assert.equal(JSON.stringify(sprite), snapshot)
})

test('transform math preserves the untrimmed center and scale without mutating atlas data', () => {
  for (const [width, height, scale] of [[100, 100, 1], [70, 140, 2], [160, 80, 0.5]]) {
    for (const rotation of [0, 90, 180, 270]) {
      for (const flipX of [false, true]) {
        for (const flipY of [false, true]) {
          const sprite = createSpriteStub(width, height, scale)
          const texture = JSON.stringify(sprite.texture)
          const appearance = createTileAppearance('wall', {rotation, flipX, flipY})
          applyTileTransform(sprite as unknown as Sprite, appearance)
          assert.equal(sprite.x + (0.5 - sprite.anchor.x) * width * sprite.scale.x, 150)
          assert.equal(sprite.y + (0.5 - sprite.anchor.y) * height * sprite.scale.y, 200 - height * scale / 2)
          assert.equal(Math.abs(sprite.scale.x), scale)
          assert.equal(Math.abs(sprite.scale.y), scale)
          assert.equal(sprite.rotation, rotation * Math.PI / 180)
          assert.equal(JSON.stringify(sprite.texture), texture)
        }
      }
    }
  }
})
