import assert from 'node:assert/strict'
import {test} from 'node:test'
import {getBoardTileVisualTransform} from '@/game/sokoban/rendering/getBoardTileVisualTransform.js'

// Проверяет совпадение компенсации поворота редактора и игровой доски.

test('Без поворота сохраняются якорь и исходное смещение', () => {
  const transform = getBoardTileVisualTransform({
    position: {x: 2, y: 3},
    anchorY: 1,
    tileSize: 100,
    rotation: 0,
    offset: {x: -12, y: 7},
  })

  assert.deepEqual(transform, {position: {x: 238, y: 407}, rotation: 0})
})

test('Поворот доски сохраняет экранную ориентацию и сторону якоря визуала', () => {
  const transform = getBoardTileVisualTransform({
    position: {x: 2, y: 3},
    anchorY: 1,
    tileSize: 100,
    rotation: Math.PI / 2,
    offset: {x: -12, y: 7},
  })

  assert.equal(transform.position.x, 307)
  assert.equal(transform.position.y, 362)
  assert.equal(transform.rotation, -Math.PI / 2)
})

test('Центрированный ящик остаётся в центре клетки при повороте', () => {
  const transform = getBoardTileVisualTransform({
    position: {x: 4, y: 3},
    anchorY: 0.5,
    tileSize: 100,
    rotation: Math.PI / 2,
  })

  assert.deepEqual(transform.position, {x: 450, y: 350})
})
