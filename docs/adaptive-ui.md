# Адаптивный UI

За расчёт доступной области интерфейса отвечает [`UiLayer`](../src/game/engine/uiLayer/UiLayer.ts). Его локальные координаты начинаются у левого верхнего края видимой UI-области и заканчиваются в `uiData.width` и `uiData.height`.

Стандартное позиционирование и масштабирование выполняет [`AdaptiveLayout`](../src/game/engine/uiLayer/AdaptiveLayout.ts). `UiLayer` хранит его экземпляр и сохраняет публичные методы `resizeAdaptive()` и `alignRight()`, поэтому остальной код работает с адаптивностью через `Locator.uiLayer`.

## Доступные данные

```js
const {
  width,
  height,
  widthWithPadding,
  heightWithPadding,
  center,
} = Locator.uiLayer.uiData
```

- `width` и `height` — полный размер видимой UI-области;
- `widthWithPadding` и `heightWithPadding` — правый и нижний края с внутренним отступом;
- `center` — координаты центра UI-области.

## Адаптивная позиция и уменьшение по ширине

Наличие публичного `updateAdaptive` служит признаком, что элемент нужно позиционировать через `AdaptiveLayout` и при необходимости уменьшать по ширине. По умолчанию элемент размещается в `uiData.center`.

```js
import {Container} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'

export default class AdaptiveView extends Container {
  constructor() {
    super({label: 'adaptiveView'})

    this._initScale = 1.2
    this.#init()
  }

  updateAdaptive = () => {
    Locator.uiLayer.resizeAdaptive(this)
  }

  #init = () => {
    this.#createContent()
    Locator.uiLayer.stateUiLayer.addChild(this)
    this.updateAdaptive()
  }

  #createContent = () => {
    // Создание содержимого.
  }
}
```

`resizeAdaptive()`:

- устанавливает позицию в `uiData.center` либо использует `_customPosition`;
- оставляет горизонтальные отступы от краёв;
- уменьшает слишком широкий элемент;
- восстанавливает `_initScale`, когда места снова достаточно.

Содержимое нужно создать до первого вызова `updateAdaptive()`, иначе ширина элемента ещё неизвестна. `_initScale` необязателен, по умолчанию используется `1`.

### Пользовательская позиция

Необязательное поле `_customPosition` позволяет переопределить одну или обе координаты стандартной адаптивной позиции:

```js
this._customPosition = {
  x: 180,
  y: 320,
}
```

Можно указать только одну координату. Для отсутствующей координаты `AdaptiveLayout` использует соответствующую координату из `uiData.center`:

```js
this._customPosition = {y: 320}
```

В этом примере элемент остаётся по центру горизонтали, а его вертикальная координата всегда равна `320`. Поле нужно заполнить до первого вызова `resizeAdaptive()`.

Само наличие `_customPosition` не включает адаптивность. Элементу по-прежнему нужны непустой `label` и публичный `updateAdaptive`. Для элементов с методом `alignRight` пользовательская позиция не применяется, потому что их положение рассчитывает `alignRight()`.

Сам `UiLayer` не вызывает реализацию `updateAdaptive()` во время общего resize. Наличие метода используется как маркер, после чего `AdaptiveLayout` применяет стандартный алгоритм позиции и масштаба. Метод нужен элементу для первоначального ручного вызова.

## Привязка справа

Правая граница меняется вместе с шириной окна, поэтому для неё используется `UiLayer.alignRight()`.

```js
export default class RightAlignedView extends Container {
  constructor() {
    super({label: 'rightAlignedView'})
    this.#init()
  }

  alignRight = () => {
    Locator.uiLayer.alignRight(this, {
      x: 0,
      y: 60,
    })
  }

  #init = () => {
    this.#createContent()
    Locator.uiLayer.stateUiLayer.addChild(this)
    this.alignRight()
  }
}
```

Публичный метод должен называться `alignRight`: при каждом resize `UiLayer` обнаруживает и вызывает именно его.

Параметры:

- `x` — смещение от рассчитанной позиции: положительное вправо, отрицательное влево;
- `y` — вертикальная координата;
- `viewWidth` — сохранённая исходная ширина, если текущие bounds нестабильны.

### Нестабильная ширина

Маски, фильтры и `filterArea` могут менять `view.width`. В таком случае сохраните естественную ширину до их применения:

```js
#adaptiveWidth

alignRight = () => {
  Locator.uiLayer.alignRight(this, {
    y: 60,
    viewWidth: this.#adaptiveWidth,
  })
}

#init = () => {
  this.#createContent()
  this.#adaptiveWidth = this.width
  this.#applyFilters()
  Locator.uiLayer.stateUiLayer.addChild(this)
  this.alignRight()
}
```

## Привязка слева

Левая граница в локальных координатах `UiLayer` всегда равна `0`, поэтому отдельный `alignLeft()` сейчас не требуется. Задайте постоянную координату после создания элемента:

```js
const LEFT_OFFSET = 50

button.position.set(LEFT_OFFSET, 60)
Locator.uiLayer.globalUiLayer.addChild(button)
```

Если локальная точка элемента находится в центре, учтите половину его ширины:

```js
view.x = LEFT_OFFSET + view.width / 2
```

Такой элемент не нужно включать в адаптивный resize, пока его размер и вертикальное положение не зависят от viewport. Шестерёнка настроек использует именно этот принцип.

## Выбор слоя

Адаптивность не определяет время жизни элемента:

- постоянный элемент добавляйте в `globalUiLayer`;
- элемент текущего экрана или уровня — в `stateUiLayer`;
- модалку открывайте через `openModal()` либо наследуйте от `BaseModal`.

`UiLayer` автоматически рассматривает только прямых потомков этих слоёв. Не добавляйте адаптивный элемент непосредственно в корень `UiLayer`.

Примеры в проекте:

- центрирование — `GameMenuView`, `StoreView`, `ScoreboardView`;
- привязка справа — `StatBadge`, `ButtonsHintView`;
- привязка слева — `optionsToggleBtn`.
