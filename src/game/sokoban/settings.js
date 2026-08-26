const SOKOBAN_SETTINGS = Object.freeze({
  tileSize: 100, // Базовый размер клетки до адаптивного масштабирования
  moveDuration: 0.18, // Длительность перемещения игрока и ящика между клетками
  moveEase: 'power2.out', // Плавность перемещения игрока и ящика
  boxOnTargetTint: 0xaaaaaa, // Затемнение ящика, установленного на точку
  maxBoardColumns: 20, // Максимальное количество столбцов игровой доски
  maxBoardRows: 14, // Максимальное количество строк игровой доски
  minHorizontalPadding: 32, // Минимальный боковой отступ в координатах игрового мира
  maxHorizontalPadding: 96, // Максимальный боковой отступ в координатах игрового мира
  horizontalPaddingRatio: 0.06, // Доля видимой ширины для бокового отступа
  maxHorizontalPaddingRatio: 0.1, // Предельная доля ширины для одного бокового отступа
  boardTopPadding: 48, // Верхний отступ доски в координатах игрового мира
  boardBottomPadding: 110, // Нижняя область, зарезервированная под компактный HUD
  rotateTallBoardInLandscape: false, // Сохраняет исходную ориентацию структуры уровня
})

const SOKOBAN_HUD_SETTINGS = Object.freeze({
  heightInTiles: 0.5, // Высота HUD относительно отображаемой высоты клетки
  bottomPadding: 24, // Отступ HUD от нижней границы экрана
  sidePadding: 40, // Минимальный боковой отступ HUD
  cornerRadiusRatio: 0.22, // Радиус скругления панели относительно её высоты
  borderWidthRatio: 0.025, // Толщина обводки панели относительно её высоты
  panelColor: 0xf1ead8, // Цвет фона панели HUD
  panelAlpha: 0.9, // Прозрачность фона панели HUD
  borderColor: 0x243d50, // Цвет обводки панели HUD
  buttonSizeRatio: 0.78, // Размер подложки кнопки относительно высоты HUD
  buttonCornerRadiusRatio: 0.18, // Радиус скругления кнопки относительно её размера
  buttonColor: 0xf2c766, // Цвет подложки кнопки
  buttonDisabledColor: 0xc9c2ae, // Цвет недоступной кнопки
  buttonBorderColor: 0x493b28, // Цвет обводки кнопки
  buttonBorderWidthRatio: 0.035, // Толщина обводки кнопки относительно её размера
  buttonIconSizeRatio: 0.52, // Размер иконки кнопки относительно высоты HUD
  stepsIconSizeRatio: 0.5, // Размер иконки шагов относительно высоты HUD
  horizontalPadding: 20, // Отступ крайних кнопок от левого и правого края HUD
  controlsGap: 20, // Расстояние между кнопкой отмены и блоком шагов
  stepsGapRatio: 0.5, // Расстояние от иконки шагов до счётчика относительно высоты HUD
  stepsFontSizeRatio: 0.35, // Размер счётчика шагов относительно высоты HUD
  levelFontSizeRatio: 0.32, // Размер названия уровня относительно высоты HUD
  textColor: 0x172b38, // Цвет текста HUD
  disabledAlpha: 0.55, // Прозрачность недоступной кнопки
})

export {SOKOBAN_HUD_SETTINGS, SOKOBAN_SETTINGS}
