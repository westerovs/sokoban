import {Buffer} from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import {validateLevelAppearance} from '../sokoban-levels/levelAppearance.js'
import {parseXsb, serializeXsb, toRuntimeMap, toStandardMap} from '../sokoban-levels/xsbFormat.mjs'
import type {EditorState, LibraryData, LibraryDirectory, LibraryLevel} from './src/editorTypes.js'
import {validateLevelMap} from './src/levelValidation.js'

// Читает и сохраняет самостоятельные XSB-уровни в существующих разделах библиотеки.

const SECTION_NAMES = ['easy', 'medium', 'hard', 'very-hard'] // Разделы сложности, поддерживаемые сборщиком
const LEVEL_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/ // Безопасное имя файла без расширения

// Возвращает обычные каталоги, исключая ссылки и служебные папки.
const readDirectories = (directory: string) =>
  fs.readdirSync(directory, {withFileTypes: true}).filter((entry) => entry.isDirectory() && entry.name !== 'platforms')

// Находит существующие разделы коллекций с описанным автором.
const readLibraryDirectories = (root: string): LibraryDirectory[] => {
  return readDirectories(root).flatMap((collection) => {
    const collectionPath = path.join(root, collection.name)
    const authorPath = path.join(collectionPath, 'author.json')
    if (!fs.existsSync(authorPath) || fs.lstatSync(authorPath).isSymbolicLink()) return []
    const {authorId} = JSON.parse(fs.readFileSync(authorPath, 'utf8'))
    if (typeof authorId !== 'string' || !authorId) return []
    return readDirectories(collectionPath)
      .filter((section) => SECTION_NAMES.includes(section.name))
      .map((section) => ({path: `${collection.name}/${section.name}`, collection: collection.name, section: section.name, authorId}))
  })
}

// Читает карту и её оформление из единственного XSB-блока.
const readLibraryLevel = (root: string, directory: LibraryDirectory, filename: string): LibraryLevel => {
  const libraryPath = `${directory.path}/${filename}`
  const parsed = parseXsb(fs.readFileSync(path.join(root, libraryPath), 'utf8'), libraryPath)
  if (parsed.length !== 1 || parsed[0].metadata.id !== filename.slice(0, -4)) {
    throw new Error(`${libraryPath}: имя файла и id единственного уровня должны совпадать`)
  }
  const {map, metadata} = parsed[0]
  return {
    id: metadata.id,
    map: toRuntimeMap(map),
    authorId: directory.authorId,
    libraryPath,
    appearance: metadata.appearance ? JSON.parse(metadata.appearance) : {},
  }
}

// Загружает самостоятельные уровни и резервирует имена всех игровых карт.
const readLibraryData = (root: string, assignedIds: Set<string>): LibraryData => {
  const directories = readLibraryDirectories(root)
  const levels = directories.flatMap((directory) =>
    fs
      .readdirSync(path.join(root, directory.path), {withFileTypes: true})
      .filter((entry) => entry.isFile() && entry.name.endsWith('.xsb'))
      .map((entry) => readLibraryLevel(root, directory, entry.name)),
  )
  return {directories, levels: levels.filter((level) => !assignedIds.has(level.id)), usedIds: levels.map((level) => level.id)}
}

// Проверяет структуру карты до записи исходника.
const validateLibraryMap = (state: EditorState) => {
  if (!Array.isArray(state.map) || !state.map.every((row) => typeof row === 'string')) throw new Error('Некорректная карта уровня')
  const validation = validateLevelMap(state.map)
  if (!validation.isValid) throw new Error(validation.issues.map((issue) => issue.message).join('. '))
}

// Проверяет выбранную папку и глобальную уникальность имени.
const resolveLibraryTarget = (root: string, data: LibraryData, directory: string, name: string, create: boolean) => {
  if (!data.directories.some((entry) => entry.path === directory)) throw new Error('Выберите существующий раздел библиотеки')
  if (typeof name !== 'string' || !LEVEL_ID_PATTERN.test(name) || /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(name)) {
    throw new Error('Имя: до 80 латинских букв, цифр, дефисов или подчёркиваний')
  }
  const libraryPath = `${directory}/${name}.xsb`
  if (create && data.usedIds.some((id) => id.toLowerCase() === name.toLowerCase()))
    throw new Error('Это имя уже занято. Укажите другое имя')
  if (!create && !data.levels.some((level) => level.libraryPath === libraryPath))
    throw new Error('Самостоятельный уровень не найден. Обновите библиотеку')
  const filePath = path.join(root, libraryPath)
  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isSymbolicLink()) throw new Error('Сохранение через ссылку запрещено')
  return {filePath, libraryPath}
}

// Формирует XSB, сохраняя метаданные существующего самостоятельного уровня.
const createLibraryContent = (filePath: string, state: EditorState, create: boolean) => {
  const metadata = create ? {} : parseXsb(fs.readFileSync(filePath, 'utf8'), filePath)[0].metadata
  metadata.id = state.levelId
  delete metadata.custom
  delete metadata.appearance
  if (Object.keys(state.appearance).length) metadata.appearance = JSON.stringify(state.appearance)
  return serializeXsb([{metadata, map: toStandardMap(state.map)}])
}

// Записывает один исходник и восстанавливает прежнее содержимое при ошибке записи.
const writeLibraryFile = (filePath: string, content: string, create: boolean) => {
  const previous = create ? null : fs.readFileSync(filePath)
  const descriptor = fs.openSync(filePath, create ? 'wx' : 'r+')
  let completed = false
  try {
    fs.writeFileSync(descriptor, content)
    fs.ftruncateSync(descriptor, Buffer.byteLength(content))
    completed = true
  } catch (error) {
    if (previous) {
      fs.writeSync(descriptor, previous, 0, previous.length, 0)
      fs.ftruncateSync(descriptor, previous.length)
    }
    throw error
  } finally {
    fs.closeSync(descriptor)
    if (create && !completed) fs.unlinkSync(filePath)
  }
}

// Сохраняет карту без добавления в игровые локации и возвращает её путь.
const saveLibraryLevel = (root: string, data: LibraryData, request: any, create: boolean, groups: Record<string, string[]>) => {
  const {directory, name, map, appearance} = request
  const target = resolveLibraryTarget(root, data, directory, name, create)
  const state = {levelId: name, map, appearance}
  validateLibraryMap(state)
  validateLevelAppearance({id: name, map: toStandardMap(map)}, appearance, {groups})
  writeLibraryFile(target.filePath, createLibraryContent(target.filePath, state, create), create)
  return target.libraryPath
}

export {
  readLibraryData,
  saveLibraryLevel,
}
