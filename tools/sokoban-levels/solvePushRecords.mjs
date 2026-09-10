import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import {solveSokoban} from '../sokoban-level-editor/solver.ts'
import {createMapHash} from './mapHash.mjs'
import {parseXsb, toRuntimeMap} from './xsbFormat.mjs'

// Вычисляет и кеширует только доказанные минимумы толчков для неизменившихся карт.

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..', '..')
const levelLibraryDirectory = path.resolve(projectRoot, 'levels', 'library')
const locationsPath = path.resolve(projectRoot, 'levels', 'locations.json')
const pushRecordsPath = path.resolve(projectRoot, 'levels', 'metadata', 'push-records.json')
const solverStatsPath = path.resolve(projectRoot, 'levels', 'metadata', 'solver-stats.json')
const difficultyDirectories = ['easy', 'medium', 'hard', 'very-hard'] // Папки библиотеки уровней
const defaultMaxStates = 5_000_000 // Максимальное число состояний на одну карту
const defaultMaxDurationMs = 300_000 // Максимальное время поиска одной карты

// Читает текстовый файл с единообразными переносами строк.
const readText = (filePath) => fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n')

// Читает JSON-файл либо возвращает запасное значение.
const readJson = (filePath, fallback) => (fs.existsSync(filePath) ? JSON.parse(readText(filePath)) : fallback)

// Возвращает значение именованного аргумента команды.
const getArgument = (name) => {
  const inlinePrefix = `--${name}=`
  const inline = process.argv.find((argument) => argument.startsWith(inlinePrefix))
  if (inline) return inline.slice(inlinePrefix.length)

  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}

// Разбирает положительный числовой аргумент команды.
const getPositiveArgument = (name, fallback) => {
  const value = Number(getArgument(name) ?? fallback)
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Argument --${name} must be a positive number`)
  return Math.floor(value)
}

// Загружает по одной карте из каждого файла библиотеки.
const loadLevels = () => {
  return difficultyDirectories.flatMap((directory) => {
    const directoryPath = path.resolve(levelLibraryDirectory, directory)
    return fs
      .readdirSync(directoryPath)
      .filter((fileName) => fileName.endsWith('.xsb'))
      .sort()
      .map((fileName) => loadLevel(path.resolve(directoryPath, fileName)))
  })
}

// Разбирает единственную карту файла библиотеки.
const loadLevel = (filePath) => {
  const parsed = parseXsb(readText(filePath), path.relative(projectRoot, filePath))
  if (parsed.length !== 1) throw new Error(`${filePath}: expected exactly one level`)

  return {
    id: parsed[0].metadata.id,
    map: parsed[0].map,
    runtimeMap: toRuntimeMap(parsed[0].map),
    mapHash: createMapHash(parsed[0].map),
  }
}

// Создаёт индекс уже сохранённых эталонов.
const createRecordIndex = () => {
  const source = readJson(pushRecordsPath, {version: 1, records: []})
  if (source.version !== 1 || !Array.isArray(source.records)) throw new Error('Unsupported push records format')
  return new Map(source.records.map((record) => [record.id, record]))
}

// Удаляет эталоны отсутствующих или изменившихся карт.
const removeStaleRecords = (records, levels) => {
  const hashesById = new Map(levels.map((level) => [level.id, level.mapHash]))
  Array.from(records.entries()).forEach(([levelId, record]) => {
    if (hashesById.get(levelId) !== record.mapHash) records.delete(levelId)
  })
}

// Создаёт индекс локаций по идентификаторам назначенных уровней.
const createLocationIndex = () => {
  const source = readJson(locationsPath, {locations: []})
  if (!Array.isArray(source.locations)) throw new Error('Unsupported locations format')

  return new Map(source.locations.flatMap((location) => location.levelIds.map((levelId) => [levelId, location.id])))
}

// Добавляет опубликованные результаты с доказанным нижним пределом.
const importProvenPublishedRecords = (records, levels) => {
  const levelsById = new Map(levels.map((level) => [level.id, level]))
  const stats = readJson(solverStatsPath, {levels: []})
  stats.levels.forEach((entry) => importPublishedRecord(records, levelsById.get(entry.id), entry))
}

// Импортирует один доказанный результат внешнего решателя.
const importPublishedRecord = (records, level, stats) => {
  const hasProvenMinimum = Number.isInteger(stats.lowerBound) && stats.lowerBound >= 0 && stats.lowerBound === stats.bestPushes
  if (!level || stats.mapHash !== level.mapHash || !hasProvenMinimum) return
  if (records.get(level.id)?.mapHash === level.mapHash) return

  records.set(level.id, {
    id: level.id,
    mapHash: level.mapHash,
    minimumPushes: stats.bestPushes,
    solver: 'Takaken',
    solverVersion: stats.solverVersion,
  })
}

// Записывает эталоны в стабильном порядке идентификаторов.
const writeRecords = (records) => {
  const sortedRecords = Array.from(records.values()).sort((first, second) => first.id.localeCompare(second.id))
  fs.writeFileSync(pushRecordsPath, JSON.stringify({version: 1, records: sortedRecords}, null, 2) + '\n')
}

// Проверяет, нужно ли вычислять эталон выбранной карты.
const shouldSolveLevel = (level, records, selectedIds, isForced) => {
  if (selectedIds.size > 0 && !selectedIds.has(level.id)) return false
  if (isForced) return true
  return records.get(level.id)?.mapHash !== level.mapHash
}

// Проверяет, что явно перечисленные идентификаторы существуют в библиотеке.
const validateSelectedIds = (selectedIds, levels) => {
  const availableIds = new Set(levels.map((level) => level.id))
  const unknownIds = Array.from(selectedIds).filter((levelId) => !availableIds.has(levelId))
  if (unknownIds.length > 0) throw new Error(`Unknown level ids: ${unknownIds.join(', ')}`)
}

// Запускает точный поиск для одной карты и сохраняет успешный результат.
const solveLevel = (level, records, limits) => {
  const result = solveSokoban(level.runtimeMap, limits)
  if (result.status !== 'solved') {
    console.warn(`[PushRecords]: ${level.id} was not proven (${result.status}, explored ${result.explored})`)
    return false
  }

  records.set(level.id, {
    id: level.id,
    mapHash: level.mapHash,
    minimumPushes: result.pushes,
    solver: 'internal-push-bfs',
    solverVersion: '1',
    exploredStates: result.explored,
  })
  console.log(`[PushRecords]: ${level.id} = ${result.pushes}, explored ${result.explored}`)
  writeRecords(records)
  return true
}

// Выполняет последовательное обновление отсутствующих или устаревших эталонов.
const solveMissingRecords = (levels, records, selectedIds, limits, isForced, locationsByLevelId) => {
  const pendingLevels = levels.filter((level) => shouldSolveLevel(level, records, selectedIds, isForced))
  let unresolvedCount = 0

  pendingLevels.forEach((level, index) => {
    const locationId = locationsByLevelId.get(level.id) ?? 'unknown-location'
    console.log(`[PushRecords]: [${index + 1}/${pendingLevels.length}] solving ${level.id} (${locationId})`)
    if (!solveLevel(level, records, limits)) unresolvedCount++
  })
  return unresolvedCount
}

// Возвращает уровни без эталона, сгруппированные по игровым локациям.
const getMissingRecordsByLocation = (records) => {
  const source = readJson(locationsPath, {locations: []})
  if (!Array.isArray(source.locations)) throw new Error('Unsupported locations format')

  return source.locations
    .map((location) => ({
      locationId: location.id,
      levelIds: location.levelIds.filter((levelId) => !records.has(levelId)),
    }))
    .filter(({levelIds}) => levelIds.length > 0)
}

// Печатает итоговый список уровней без доказанного минимума.
const printMissingRecordsByLocation = (records) => {
  const missingLocations = getMissingRecordsByLocation(records)
  if (missingLocations.length === 0) {
    console.log('[PushRecords]: all location levels have exact benchmarks')
    return
  }

  console.log('[PushRecords]: levels without exact benchmarks by location:')
  missingLocations.forEach(({locationId, levelIds}) => {
    console.log(`  ${locationId} (${levelIds.length}): ${levelIds.join(', ')}`)
  })
}

// Запускает команду вычисления эталонов.
const run = () => {
  const levels = loadLevels()
  const records = createRecordIndex()
  const locationsByLevelId = createLocationIndex()
  const selectedIds = new Set(
    (getArgument('level') ?? '')
      .split(',')
      .map((levelId) => levelId.trim())
      .filter(Boolean),
  )
  const limits = {
    maxStates: getPositiveArgument('max-states', defaultMaxStates),
    maxDurationMs: getPositiveArgument('max-duration-ms', defaultMaxDurationMs),
  }

  validateSelectedIds(selectedIds, levels)
  removeStaleRecords(records, levels)
  importProvenPublishedRecords(records, levels)
  writeRecords(records)
  const unresolvedCount = solveMissingRecords(levels, records, selectedIds, limits, process.argv.includes('--force'), locationsByLevelId)
  console.log(`[PushRecords]: cached ${records.size}/${levels.length}, unresolved in this run ${unresolvedCount}`)
  printMissingRecordsByLocation(records)
  if (unresolvedCount > 0) process.exitCode = 1
}

run()
