# Уровни Sokoban

Все 101 карта хранятся в одном каноническом файле [`levels.xsb`](levels.xsb). Этот файл одновременно задаёт порядок уровней в игре и открывается в Sokoban-решателях.

Другие XSB-файлы проекту не нужны. `src/game/gameConfig/levels.json` создаётся автоматически и вручную не редактируется.

Полное руководство: [`docs/sokoban-levels.md`](../docs/sokoban-levels.md).

Основные команды:

```bash
npm run levels
npm run levels:check
```

`npm start` и `npm run build` также обновляют игровой JSON автоматически.
