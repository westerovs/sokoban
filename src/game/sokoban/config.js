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

const SOKOBAN_COLORS = Object.freeze({
  floor: 0xe9e0c8,
  floorBorder: 0xcfc2a3,
  wall: 0x314b5f,
  wallInset: 0x42657d,
  wallBorder: 0x1d3342,
  target: 0xe6b84c,
  targetCenter: 0xfff0a6,
  box: 0xc87332,
  boxInset: 0xe7a352,
  boxBorder: 0x743b20,
  boxOnTarget: 0x4c9f70,
  player: 0x2e9ba3,
  playerBorder: 0x155b68,
  playerDetail: 0xf8f5e8,
})

export {
  ROTATED_DIRECTIONS,
  SOKOBAN_COLORS,
  SOKOBAN_DIRECTIONS,
  SOKOBAN_SYMBOLS,
}
