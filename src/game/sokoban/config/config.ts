/**
 * Определяет символы карты, направления движения и имена текстур Sokoban.
 */

const SOKOBAN_SYMBOLS = Object.freeze({
  void: '_', // Пустая клетка вне доступного игрового поля
  wall: '#', // Непроходимая стена
  floor: ' ', // Проходимая клетка пола
  player: '@', // Игрок на обычном полу
  box: '$', // Ящик на обычном полу
  target: '.', // Свободная цель
  boxOnTarget: '-', // Ящик, установленный на цель
  playerOnTarget: '*', // Игрок, находящийся на цели
} as const)

const SOKOBAN_DIRECTIONS = Object.freeze({
  up: Object.freeze({x: 0, y: -1}), // Смещение на одну клетку вверх
  down: Object.freeze({x: 0, y: 1}), // Смещение на одну клетку вниз
  left: Object.freeze({x: -1, y: 0}), // Смещение на одну клетку влево
  right: Object.freeze({x: 1, y: 0}), // Смещение на одну клетку вправо
} as const)

const ROTATED_DIRECTIONS = Object.freeze({
  up: 'left', // Направление уровня для визуального движения вверх после поворота
  down: 'right', // Направление уровня для визуального движения вниз после поворота
  left: 'down', // Направление уровня для визуального движения влево после поворота
  right: 'up', // Направление уровня для визуального движения вправо после поворота
} as const)

const SOKOBAN_TEXTURES = Object.freeze({
  floor: 'floor1', // Текстура пола по умолчанию
  wall: 'wall1', // Текстура стены по умолчанию
  target: 'target1', // Текстура цели
  box: 'box1', // Текстура ящика по умолчанию
  player: 'tile-player', // Текстура игрока
} as const)

type SokobanDirectionName = keyof typeof SOKOBAN_DIRECTIONS
type SokobanDirection = (typeof SOKOBAN_DIRECTIONS)[SokobanDirectionName]
type SokobanSymbol = (typeof SOKOBAN_SYMBOLS)[keyof typeof SOKOBAN_SYMBOLS]

export {
  ROTATED_DIRECTIONS,
  SOKOBAN_DIRECTIONS,
  SOKOBAN_SYMBOLS,
  SOKOBAN_TEXTURES,
}

export type {
  SokobanDirection,
  SokobanDirectionName,
  SokobanSymbol,
}
