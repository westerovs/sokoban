import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import prettier from 'prettier'
import {getSokobanTileCatalog} from '../../bundler/utils/getSokobanTileCatalog.mjs'
import {LEVEL_DIFFICULTIES} from '../../src/game/gameConfig/levels/levelDifficulty.ts'
import {SOKOBAN_SETTINGS} from '../../src/game/sokoban/config/settings.ts'
import {parseXsb, toRuntimeMap} from './xsbFormat.mjs'

/**
 * Собирает библиотеку XSB-карт с ручной сложностью в отдельные игровые JSON локаций.
 * Внешние пробелы карт превращаются во внутренний символ пустоты `_`.
 */

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..', '..')
const levelsDirectory = path.resolve(projectRoot, 'levels')
const levelLibraryDirectory = path.resolve(levelsDirectory, 'library')
const locationsSourcePath = path.resolve(levelsDirectory, 'locations.json')
const appearanceSourceDirectory = path.resolve(levelsDirectory, 'appearance')
const gameLevelsDirectory = path.resolve(projectRoot, 'src', 'game', 'gameConfig', 'levels')
const gameLocationsDirectory = path.resolve(gameLevelsDirectory, 'generated')
const obsoleteGameOutputPath = path.resolve(gameLevelsDirectory, 'levels.json')
const isCheckMode = process.argv.includes('--check')
const appearanceRoles = Object.freeze(['wall', 'decor', 'ground', 'box', 'target'])
const difficultyDirectories = Object.freeze({
  easy: 'easy', // Каталог лёгких карт
  medium: 'medium', // Каталог средних карт
  hard: 'hard', // Каталог тяжёлых карт
  'very-hard': 'veryHard', // Каталог очень тяжёлых карт
})
const positionKeyPattern = /^(0|[1-9]\d*):(0|[1-9]\d*)$/

// Возвращает данные, за которые отвечает операция `readText`.
const readText = (filePath) => fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n')

// Возвращает данные, за которые отвечает операция `readJson`.
const readJson = (filePath) => JSON.parse(readText(filePath))

// Возвращает данные, за которые отвечает операция `getStandardMetrics`.
const getStandardMetrics = (map) => {
  const symbols = map.join('')

  return {
    width: Math.max(...map.map((row) => row.length)),
    height: map.length,
    boxCount: (symbols.match(/[$*]/g) || []).length,
    targetCount: (symbols.match(/[.*+]/g) || []).length,
    playerCount: (symbols.match(/[@+]/g) || []).length,
  }
}

// Проверяет условие, описанное операцией `validateStandardMap`.
const validateStandardMap = (level) => {
  const metrics = getStandardMetrics(level.map)
  if (metrics.playerCount !== 1) throw new Error(`${level.id}: требуется ровно один игрок`)
  if (metrics.boxCount === 0) throw new Error(`${level.id}: требуется хотя бы один ящик`)
  if (metrics.boxCount !== metrics.targetCount) throw new Error(`${level.id}: число ящиков и целей не совпадает`)
  if (metrics.width > SOKOBAN_SETTINGS.maxBoardColumns || metrics.height > SOKOBAN_SETTINGS.maxBoardRows) {
    throw new Error(`${level.id}: карта превышает ограничение ${SOKOBAN_SETTINGS.maxBoardColumns}×${SOKOBAN_SETTINGS.maxBoardRows}`)
  }

  return metrics
}

// Создаёт данные или представление для операции `createLevel`.
const createLevel = (parsedLevel, difficulty, author) => {
  return {
    id: parsedLevel.metadata.id,
    map: parsedLevel.map,
    difficulty,
    authorId: author.authorId,
    authorName: author.authorName,
  }
}

// Возвращает данные, за которые отвечает операция `loadLocationDefinitions`.
const loadLocationDefinitions = () => {
  const {locations} = readJson(locationsSourcePath)
  if (!Array.isArray(locations) || locations.length === 0) throw new Error('Файл levels/locations.json не содержит локаций')
  return locations
}

// Читает сведения об авторе одной группы уровней.
const loadAuthor = (directoryPath) => {
  const metadataPath = path.resolve(directoryPath, 'author.json')
  if (!fs.existsSync(metadataPath)) throw new Error(`${path.relative(projectRoot, directoryPath)}: отсутствует author.json`)
  const author = readJson(metadataPath)
  if (!author.authorId || !author.authorName) throw new Error(`${path.relative(projectRoot, metadataPath)}: автор заполнен не полностью`)
  return {...author, directoryPath}
}

// Находит все группы уровней без списка заранее известных авторов.
const loadAuthors = () => {
  return fs
    .readdirSync(levelLibraryDirectory, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .sort((first, second) => first.name.localeCompare(second.name))
    .map((entry) => loadAuthor(path.resolve(levelLibraryDirectory, entry.name)))
}

// Возвращает XSB-файлы одной категории сложности указанного автора.
const getDifficultyFiles = (author, directoryName) => {
  const directoryPath = path.resolve(author.directoryPath, directoryName)
  if (!fs.existsSync(directoryPath)) throw new Error(`Папка сложности не найдена: ${path.relative(projectRoot, directoryPath)}`)

  return fs
    .readdirSync(directoryPath, {withFileTypes: true})
    .filter((entry) => entry.isFile() && entry.name.endsWith('.xsb'))
    .sort((first, second) => first.name.localeCompare(second.name))
    .map((entry) => path.resolve(directoryPath, entry.name))
}

// Читает единственную карту из отдельного файла библиотеки.
const loadLibraryLevel = (filePath, difficulty, author) => {
  const sourceLabel = path.relative(projectRoot, filePath)
  const parsedLevels = parseXsb(readText(filePath), sourceLabel)
  if (parsedLevels.length !== 1) throw new Error(`${sourceLabel}: файл должен содержать ровно один уровень`)

  const parsedLevel = parsedLevels[0]
  const id = parsedLevel.metadata.id
  if (!id) throw new Error(`${sourceLabel}: не указан id уровня`)
  if (path.basename(filePath, '.xsb') !== id) throw new Error(`${sourceLabel}: имя файла должно совпадать с id ${id}`)
  return createLevel(parsedLevel, difficulty, author)
}

// Загружает уровни одного автора и получает сложность из имени папки.
const loadAuthorLevels = (author) => {
  return Object.entries(difficultyDirectories).flatMap(([directoryName, difficulty]) => {
    if (!LEVEL_DIFFICULTIES.includes(difficulty)) throw new Error(`Неизвестная сложность ${difficulty}`)
    return getDifficultyFiles(author, directoryName).map((filePath) => loadLibraryLevel(filePath, difficulty, author))
  })
}

// Загружает библиотеку уровней из всех найденных групп авторов.
const loadLibraryLevels = () => {
  const authors = loadAuthors()
  const authorIds = new Set(authors.map(({authorId}) => authorId))
  if (authorIds.size !== authors.length) throw new Error('Идентификаторы авторов в levels/library должны быть уникальны')
  return authors.flatMap((author) => loadAuthorLevels(author))
}

// Возвращает данные, за которые отвечает операция `loadLevels`.
const loadLevels = () => {
  const levels = loadLibraryLevels()

  if (levels.length === 0) throw new Error('Папка levels/library не содержит карт')
  levels.forEach(validateStandardMap)

  return levels
}

// Возвращает данные, за которые отвечает операция `getLocationLevels`.
const getLocationLevels = (location, levelsById, assignedIds) => {
  if (!Array.isArray(location.levelIds) || location.levelIds.length === 0) throw new Error(`${location.id}: в локации нет уровней`)

  return location.levelIds.map((levelId) => {
    if (assignedIds.has(levelId)) throw new Error(`${levelId}: уровень добавлен более чем в одну локацию`)
    const level = levelsById.get(levelId)
    if (!level) throw new Error(`${location.id}: уровень ${levelId} не найден в levels/library`)
    assignedIds.add(levelId)
    return level
  })
}

// Создаёт данные или представление для операции `createLocation`.
const createLocation = (location, index, levelsById, assignedIds) => {
  const requiredKeys = ['id', 'titleKey', 'cardTexture', 'background', 'ambience', 'music']
  requiredKeys.forEach((key) => {
    if (!location[key]) throw new Error(`Локация ${index + 1}: не заполнено поле ${key}`)
  })

  return {...location, levels: getLocationLevels(location, levelsById, assignedIds)}
}

// Возвращает данные, за которые отвечает операция `loadLocations`.
const loadLocations = (levels, sourceLocations) => {
  const levelsById = new Map(levels.map((level) => [level.id, level]))
  const assignedIds = new Set()
  const locations = sourceLocations.map((location, index) => createLocation(location, index, levelsById, assignedIds))
  if (assignedIds.size !== levels.length) throw new Error('Не все карты из levels/library распределены по локациям')

  return locations
}

// Проверяет условие, описанное операцией `isAppearanceRoleCell`.
const isAppearanceRoleCell = (role, symbol) => {
  if (role === 'wall' || role === 'decor') return symbol === '#'
  if (role === 'ground') return Boolean(symbol) && symbol !== '_'
  if (role === 'box') return '$-'.includes(symbol)
  if (role === 'target') return '.-*'.includes(symbol)
  return false
}

// Проверяет условие, описанное операцией `validateAppearancePosition`.
const validateAppearancePosition = (level, role, positionKey) => {
  if (!positionKeyPattern.test(positionKey)) throw new Error(`${level.id}: недопустимая координата оформления ${positionKey}`)

  const [x, y] = positionKey.split(':').map(Number)
  const symbol = toRuntimeMap(level.map)[y]?.[x]
  if (!isAppearanceRoleCell(role, symbol)) {
    throw new Error(`${level.id}: оформление ${role} нельзя применить к клетке ${positionKey}`)
  }
}

// Проверяет условие, описанное операцией `validateAppearanceRole`.
const validateAppearanceRole = (level, role, overrides, tileCatalog) => {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error(`${level.id}: оформление ${role} должно быть объектом`)
  }

  Object.entries(overrides).forEach(([positionKey, texture]) => {
    validateAppearancePosition(level, role, positionKey)
    if (!tileCatalog.groups[role].includes(texture)) {
      throw new Error(`${level.id}: текстура ${texture} не входит в каталог ${role}`)
    }
  })
}

// Проверяет условие, описанное операцией `validateLevelAppearance`.
const validateLevelAppearance = (level, appearance, tileCatalog) => {
  if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) {
    throw new Error(`${level.id}: оформление уровня должно быть объектом`)
  }

  const unknownRoles = Object.keys(appearance).filter((role) => !appearanceRoles.includes(role))
  if (unknownRoles.length > 0) throw new Error(`${level.id}: неизвестный слой оформления ${unknownRoles[0]}`)
  appearanceRoles.forEach((role) => {
    if (appearance[role] !== undefined) validateAppearanceRole(level, role, appearance[role], tileCatalog)
  })
}

// Возвращает данные, за которые отвечает операция `readLocationAppearance`.
const readLocationAppearance = (location) => {
  const filePath = path.resolve(appearanceSourceDirectory, `${location.id}.json`)
  const source = readJson(filePath)
  if (source.version !== 1 || !source.levels || typeof source.levels !== 'object' || Array.isArray(source.levels)) {
    throw new Error(`Файл levels/appearance/${location.id}.json имеет неподдерживаемый формат`)
  }
  return source.levels
}

// Добавляет данные или представление через операцию `addLocationAppearances`.
const addLocationAppearances = (result, location, levelsById, tileCatalog) => {
  const assignedLevelIds = new Set(location.levels.map((level) => level.id))
  Object.entries(readLocationAppearance(location)).forEach(([levelId, appearance]) => {
    if (!assignedLevelIds.has(levelId)) return

    const level = levelsById.get(levelId)
    if (!level) throw new Error(`${levelId}: оформление ссылается на неизвестный уровень`)

    validateLevelAppearance(level, appearance, tileCatalog)
    result.set(levelId, appearance)
  })
}

// Возвращает данные, за которые отвечает операция `loadAppearances`.
const loadAppearances = (levels, locations) => {
  const result = new Map()
  const levelsById = new Map(levels.map((level) => [level.id, level]))
  const tileCatalog = getSokobanTileCatalog(projectRoot)
  locations.forEach((location) => addLocationAppearances(result, location, levelsById, tileCatalog))

  return result
}

// Создаёт данные или представление для операции `createRuntimeLevel`.
const createRuntimeLevel = (level, index, appearance) => {
  return {
    id: level.id,
    levelName: `level${index}`,
    difficulty: level.difficulty,
    authorId: level.authorId,
    authorName: level.authorName,
    ...(appearance && {appearance}),
    map: toRuntimeMap(level.map),
  }
}

// Создаёт данные или представление для операции `createRuntimeLocation`.
const createRuntimeLocation = (location, levelIndexes, appearances) => {
  return {
    id: location.id,
    titleKey: location.titleKey,
    cardTexture: location.cardTexture,
    background: location.background,
    ambience: location.ambience,
    music: location.music,
    levels: location.levels.map((level) => createRuntimeLevel(level, levelIndexes.get(level.id), appearances.get(level.id))),
  }
}

// Создаёт данные или представление для операции `createRuntimeCatalog`.
const createRuntimeCatalog = (locations, appearances) => {
  const orderedLevels = locations.flatMap((location) => location.levels)
  const levelIndexes = new Map(orderedLevels.map((level, index) => [level.id, index]))
  return {locations: locations.map((location) => createRuntimeLocation(location, levelIndexes, appearances))}
}

// Проверяет условие, описанное операцией `validateUniqueIds`.
const validateUniqueIds = (levels) => {
  const ids = new Set()

  levels.forEach((level) => {
    if (ids.has(level.id)) throw new Error(`Повторяющийся id уровня: ${level.id}`)
    ids.add(level.id)
  })
}

// Записывает данные через операцию `writeOutput`.
const writeOutput = (filePath, content) => {
  const current = fs.existsSync(filePath) ? readText(filePath) : null
  if (current === content) return false
  if (isCheckMode) throw new Error(`Требуется обновить сгенерированный файл: ${path.relative(projectRoot, filePath)}`)

  fs.mkdirSync(path.dirname(filePath), {recursive: true})
  fs.writeFileSync(filePath, content)
  return true
}

// Удаляет или очищает состояние через операцию `removeGeneratedFile`.
const removeGeneratedFile = (filePath) => {
  if (!fs.existsSync(filePath)) return
  if (isCheckMode) throw new Error(`Требуется удалить устаревший файл: ${path.relative(projectRoot, filePath)}`)

  fs.unlinkSync(filePath)
}

// Удаляет или очищает состояние через операцию `removeStaleLocationFiles`.
const removeStaleLocationFiles = (locations) => {
  if (!fs.existsSync(gameLocationsDirectory)) return

  const expectedNames = new Set(locations.map((location) => `${location.id}.json`))
  fs.readdirSync(gameLocationsDirectory, {withFileTypes: true})
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && !expectedNames.has(entry.name))
    .forEach((entry) => removeGeneratedFile(path.resolve(gameLocationsDirectory, entry.name)))
}

// Записывает данные через операцию `writeLocationFiles`.
const writeLocationFiles = async (locations, prettierConfig) => {
  for (const location of locations) {
    const filePath = path.resolve(gameLocationsDirectory, `${location.id}.json`)
    const content = await prettier.format(JSON.stringify(location), {...prettierConfig, parser: 'json'})
    writeOutput(filePath, content)
  }
}

// Собирает и записывает все игровые файлы уровней.
const buildLevels = async () => {
  const sourceLocations = loadLocationDefinitions()
  const levels = loadLevels()
  validateUniqueIds(levels)
  const locations = loadLocations(levels, sourceLocations)
  const appearances = loadAppearances(levels, locations)

  const gameCatalog = createRuntimeCatalog(locations, appearances)
  const prettierConfig = await prettier.resolveConfig(path.resolve(projectRoot, 'package.json'))
  await writeLocationFiles(gameCatalog.locations, prettierConfig)
  removeStaleLocationFiles(gameCatalog.locations)
  removeGeneratedFile(obsoleteGameOutputPath)
  console.log(`Уровни собраны: ${levels.length} карт в ${locations.length} отдельных файлах локаций.`)
}

await buildLevels()
