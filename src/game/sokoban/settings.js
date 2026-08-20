const SOKOBAN_SETTINGS = Object.freeze({
  tileSize: 100, // Базовый размер клетки до адаптивного масштабирования
  maxBoardColumns: 10, // Максимальное количество столбцов игровой доски
  maxBoardRows: 10, // Максимальное количество строк игровой доски
  minHorizontalPadding: 32, // Минимальный боковой отступ в координатах игрового мира
  maxHorizontalPadding: 96, // Максимальный боковой отступ в координатах игрового мира
  horizontalPaddingRatio: 0.06, // Доля видимой ширины для бокового отступа
  maxHorizontalPaddingRatio: 0.1, // Предельная доля ширины для одного бокового отступа
  verticalPadding: 64, // Верхний и нижний отступы в координатах игрового мира
  rotateTallBoardInLandscape: true, // Разрешает поворот вытянутой доски в горизонтальной ориентации
})

export {
  SOKOBAN_SETTINGS,
}
