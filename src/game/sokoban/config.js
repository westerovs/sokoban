const SOKOBAN_SYMBOLS = Object.freeze({
  void: '_',
  wall: '#',
  floor: ' ',
  player: '@',
  box: '$',
  target: '.',
  boxOnTarget: '-',
  playerOnTarget: '*',
})

const SOKOBAN_DIRECTIONS = Object.freeze({
  up: Object.freeze({x: 0, y: -1}),
  down: Object.freeze({x: 0, y: 1}),
  left: Object.freeze({x: -1, y: 0}),
  right: Object.freeze({x: 1, y: 0}),
})

const ROTATED_DIRECTIONS = Object.freeze({
  up: 'left',
  down: 'right',
  left: 'down',
  right: 'up',
})

const SOKOBAN_TEXTURES = Object.freeze({
  floor: 'floor1',
  wall: 'wall1',
  target: 'tile-dot',
  box: 'box1',
  player: 'tile-player',
})

export {ROTATED_DIRECTIONS, SOKOBAN_DIRECTIONS, SOKOBAN_SYMBOLS, SOKOBAN_TEXTURES}
