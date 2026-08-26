# Уровни Sokoban

Все 101 карта хранятся в одном каноническом файле [`levels.xsb`](levels.xsb). Он открывается в Sokoban-решателях целиком, без создания отдельных файлов «мои/не мои».

[`locations.json`](locations.json) задаёт 16 игровых локаций, их карточки, фон, звук и порядок карт внутри каждой главы. Каждый `id` из XSB должен встречаться в нём ровно один раз.

Другие XSB-файлы проекту не нужны. `src/game/gameConfig/levels.json` создаётся автоматически и вручную не редактируется.

Полное руководство: [`docs/sokoban-levels.md`](../docs/sokoban-levels.md).

Основные команды:

```bash
npm run levels
npm run levels:check
```

`npm start` и `npm run build` также обновляют игровой JSON автоматически.
