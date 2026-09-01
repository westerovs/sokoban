<!-- Описывает назначение файлов карт, оформления и локаций Sokoban. -->

# Уровни Sokoban

Все 101 карта разделены по локациям в папке [`maps`](maps). Например, карты первой грядки находятся в `maps/garden-1.xsb`, а второй — в `maps/garden-2.xsb`.

[`locations.json`](locations.json) задаёт 16 игровых локаций, их карточки, фон, звук и порядок карт внутри каждой главы. Имя XSB-файла совпадает с `id` локации, а каждый `id` уровня должен встречаться в `locations.json` ровно один раз.

Оформление также разделено по локациям в папке [`appearance`](appearance). Игровые JSON в `src/game/gameConfig/levels/generated` создаются автоматически и вручную не редактируются.

Общая справка: [`docs/levels/overview.md`](../docs/levels/overview.md).

Дорожные карты:

- [добавление уровня в существующую карточку](../docs/levels/add-level-to-existing-card.md);
- [создание карточки локации и добавление в главы](../docs/levels/create-location-card.md).

Основные команды:

```bash
npm run levels
npm run levels:check
```

`npm start` и `npm run build` также обновляют игровые JSON автоматически.
