import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {test} from 'node:test'
import {parseXsb, serializeXsb} from '../sokoban-levels/xsbFormat.mjs'
import {readLibraryData, saveLibraryLevel} from './libraryStorage.js'

// Проверяет сохранение самостоятельных уровней, защиту исходников и восстановление после ошибок.

const MAP = ['#####', '#@$.#', '#####'] // Минимальная корректная карта для проверки записи
const GROUPS = {wall: ['wall-test'], ground: ['ground-test'], decor: ['decor-test']} // Каталог тестовых текстур

// Создаёт изолированную библиотеку с двумя коллекциями в системной временной папке.
const createFixture = (context: {after: (callback: () => void) => void}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sokoban-library-test-'))
  context.after(() => {
    assert.equal(path.dirname(root), fs.realpathSync(os.tmpdir()))
    assert.ok(path.basename(root).startsWith('sokoban-library-test-'))
    fs.rmSync(root, {recursive: true})
  })
  for (const collection of ['custom', 'XSokoban']) {
    fs.mkdirSync(path.join(root, collection, 'hard'), {recursive: true})
    fs.writeFileSync(path.join(root, collection, 'author.json'), JSON.stringify({authorId: collection}))
  }
  return root
}

// Возвращает корректный запрос с возможностью заменить отдельные поля.
const createRequest = (overrides = {}) => ({directory: 'custom/hard', name: 'custom-001', map: MAP, appearance: {}, ...overrides})

test('Новый файл открывается без generated и сохраняет карту, автора и оформление', (context) => {
  const root = createFixture(context)
  const appearance = {wall: {'0:0': 'wall-test'}}
  const libraryPath = saveLibraryLevel(root, readLibraryData(root, new Set()), createRequest({appearance}), true, GROUPS)
  assert.equal(libraryPath, 'custom/hard/custom-001.xsb')
  const data = readLibraryData(root, new Set())
  assert.deepEqual(data.levels[0], {id: 'custom-001', map: MAP, authorId: 'custom', libraryPath, appearance})
  assert.deepEqual(data.usedIds, ['custom-001'])
  assert.equal(data.directories.length, 2)
})

test('Смещения одинакового декора сохраняются отдельно в XSB', (context) => {
  const root = createFixture(context)
  const appearance = {decor: {'0:0': 'decor-test', '1:0': 'decor-test'}, decorOffsets: {'0:0': {x: -15, y: 8}, '1:0': {x: 20, y: -10}}}
  saveLibraryLevel(root, readLibraryData(root, new Set()), createRequest({appearance}), true, GROUPS)
  assert.deepEqual(readLibraryData(root, new Set()).levels[0].appearance, appearance)
})

test('Повторная запись обновляет файл и удаляет старый хвост оформления', (context) => {
  const root = createFixture(context)
  saveLibraryLevel(root, readLibraryData(root, new Set()), createRequest({appearance: {wall: {'0:0': 'wall-test'}}}), true, GROUPS)
  const map = ['#####', '#@ -#', '#####']
  saveLibraryLevel(root, readLibraryData(root, new Set()), createRequest({map}), false, GROUPS)
  const [level] = readLibraryData(root, new Set()).levels
  assert.deepEqual(level.map, ['#####', '#@ -#', '#####'])
  assert.deepEqual(level.appearance, {})
})

test('Занятый ID защищён во всех коллекциях и при другом регистре', (context) => {
  const root = createFixture(context)
  const initial = readLibraryData(root, new Set())
  saveLibraryLevel(root, initial, createRequest(), true, GROUPS)
  const data = readLibraryData(root, new Set(['custom-001']))
  assert.equal(data.levels.length, 0)
  for (const name of ['custom-001', 'CUSTOM-001']) {
    assert.throws(() => saveLibraryLevel(root, data, createRequest({directory: 'XSokoban/hard', name}), true, GROUPS), /уже занято/)
  }
  assert.throws(() => saveLibraryLevel(root, initial, createRequest(), true, GROUPS), /EEXIST/)
  assert.throws(() => saveLibraryLevel(root, data, createRequest(), false, GROUPS), /не найден/)
})

test('Запись разрешена только в существующий раздел и под безопасным именем', (context) => {
  const root = createFixture(context)
  const data = readLibraryData(root, new Set())
  for (const directory of ['../escape', 'custom/missing', 'custom', 'platforms/test']) {
    assert.throws(() => saveLibraryLevel(root, data, createRequest({directory}), true, GROUPS), /существующий раздел/)
  }
  for (const name of ['../escape', 'a/b', 'CON', 'a.xsb', 'a\n; id: injected']) {
    assert.throws(() => saveLibraryLevel(root, data, createRequest({name}), true, GROUPS), /Имя:/)
  }
  assert.deepEqual(fs.readdirSync(path.join(root, 'custom/hard')), [])
})

test('Некорректная карта или оформление не создают файл', (context) => {
  const root = createFixture(context)
  const data = readLibraryData(root, new Set())
  for (const map of [[], ['#@#'], ['#####', '#$. #', '#####'], [null]]) {
    assert.throws(() => saveLibraryLevel(root, data, createRequest({map}), true, GROUPS))
  }
  for (const appearance of [null, [], {wall: {'0:0': 'unknown'}}, {wall: {'1:1': 'wall-test'}}, {wall: {'99:0': 'wall-test'}}]) {
    assert.throws(() => saveLibraryLevel(root, data, createRequest({appearance}), true, GROUPS), /оформлен/)
  }
  assert.deepEqual(fs.readdirSync(path.join(root, 'custom/hard')), [])
})

test('Перезапись сохраняет сторонние метаданные XSB', (context) => {
  const root = createFixture(context)
  const filePath = path.join(root, 'custom/hard/custom-001.xsb')
  fs.writeFileSync(filePath, serializeXsb([{metadata: {id: 'custom-001', title: 'Тестовая карта'}, map: MAP}]))
  saveLibraryLevel(root, readLibraryData(root, new Set()), createRequest(), false, GROUPS)
  assert.equal(parseXsb(fs.readFileSync(filePath, 'utf8'))[0].metadata.title, 'Тестовая карта')
})

test('Ошибка записи восстанавливает прежний файл и удаляет незавершённый новый', (context) => {
  const root = createFixture(context)
  saveLibraryLevel(root, readLibraryData(root, new Set()), createRequest(), true, GROUPS)
  const filePath = path.join(root, 'custom/hard/custom-001.xsb')
  const previous = fs.readFileSync(filePath, 'utf8')
  const data = readLibraryData(root, new Set())
  context.mock.method(fs, 'writeFileSync', (descriptor: number) => {
    fs.writeSync(descriptor, 'partial write')
    throw new Error('Simulated disk error')
  })
  assert.throws(() => saveLibraryLevel(root, data, createRequest(), false, GROUPS), /Simulated disk error/)
  assert.equal(fs.readFileSync(filePath, 'utf8'), previous)
  assert.throws(() => saveLibraryLevel(root, data, createRequest({name: 'custom-002'}), true, GROUPS), /Simulated disk error/)
  assert.equal(fs.existsSync(path.join(root, 'custom/hard/custom-002.xsb')), false)
})
