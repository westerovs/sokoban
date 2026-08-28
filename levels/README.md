# Уровни Sokoban

Все 101 карта хранятся в одном каноническом файле [`levels.xsb`](levels.xsb). Он открывается в Sokoban-решателях целиком, без создания отдельных файлов «мои/не мои».

[`locations.json`](locations.json) задаёт 16 игровых локаций, их карточки, фон, звук и порядок карт внутри каждой главы. Каждый `id` из XSB должен встречаться в нём ровно один раз.

Другие XSB-файлы проекту не нужны. `src/game/gameConfig/levels/levels.json` создаётся автоматически и вручную не редактируется.

Общая справка: [`docs/levels/overview.md`](../docs/levels/overview.md).

Дорожные карты:

- [добавление уровня в существующую карточку](../docs/levels/add-level-to-existing-card.md);
- [создание карточки локации и добавление в главы](../docs/levels/create-location-card.md).

Основные команды:

```bash
npm run levels
npm run levels:check
```

`npm start` и `npm run build` также обновляют игровой JSON автоматически.
