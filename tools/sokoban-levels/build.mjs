import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import prettier from 'prettier'
import {getSokobanTileCatalog} from '../../bundler/utils/getSokobanTileCatalog.mjs'
import {SOKOBAN_SETTINGS} from '../../src/game/sokoban/config/settings.ts'
import {parseXsb, toRuntimeMap} from './xsbFormat.mjs'

/**
 * Собирает канонические XSB-файлы локаций в отдельные игровые JSON.
 * Внешние пробелы карт превращаются во внутренний символ пустоты `_`.
 */

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..', '..')
const levelsDirectory = path.resolve(projectRoot, 'levels')
const mapsSourceDirectory = path.resolve(levelsDirectory, 'maps')
const locationsSourcePath = path.resolve(levelsDirectory, 'locations.json')
const appearanceSourceDirectory = path.resolve(levelsDirectory, 'appearance')
const solverStatsPath = path.resolve(levelsDirectory, 'metadata', 'solver-stats.json')
const gameLevelsDirectory = path.resolve(projectRoot, 'src', 'game', 'gameConfig', 'levels')
const gameLocationsDirectory = path.resolve(gameLevelsDirectory, 'generated')
const gameIndexOutputPath = path.resolve(gameLevelsDirectory, 'levels.ts')
const obsoleteGameOutputPath = path.resolve(gameLevelsDirectory, 'levels.json')
const isCheckMode = process.argv.includes('--check')
const appearanceRoles = Object.freeze(['wall', 'decor', 'floor', 'box', 'target'])
const positionKeyPattern = /^(0|[1-9]\d*):(0|[1-9]\d*)$/
const lurdDirections = Object.freeze({
  u: Object.freeze({x: 0, y: -1}),
  d: Object.freeze({x: 0, y: 1}),
  l: Object.freeze({x: -1, y: 0}),
  r: Object.freeze({x: 1, y: 0}),
})

// Возвращает данные, за которые отвечает операция `readText`.
const readText = (filePath) => fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n')

// Возвращает данные, за которые отвечает операция `readJson`.
const readJson = (filePath) => JSON.parse(readText(filePath))

// Выполняет отдельную операцию `normalizeMapForHash`.
const normalizeMapForHash = (map) => {
  const rows = map.map((row) => row.trimEnd()).filter((row) => row.trim())
  const indent = Math.min(...rows.map((row) => row.search(/\S/)))

  return rows.map((row) => row.slice(indent).trimEnd()).join('\n')
}

// Создаёт данные или представление для операции `createMapHash`.
const createMapHash = (map) => crypto.createHash('sha256').update(normalizeMapForHash(map)).digest('hex')

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

// Возвращает данные, за которые отвечает операция `getStatsById`.
const getStatsById = () => {
  const stats = readJson(solverStatsPath)
  return {
    solver: stats.solver,
    levels: new Map(stats.levels.map((level) => [level.id, level])),
  }
}

// Выполняет отдельную операцию `calculateDifficultyScore`.
const calculateDifficultyScore = (stats) => {
  const timeWeight = Math.log2(stats.timeSeconds + 1) * 20
  const score = stats.pushes + stats.moves * 0.15 + stats.boxCount * 4 + timeWeight

  return Number(score.toFixed(2))
}

// Создаёт данные или представление для операции `createLevel`.
const createLevel = (parsedLevel, index, statsData) => {
  const id = parsedLevel.metadata.id || `sokoban-${String(index + 1).padStart(3, '0')}`
  const isCustom = parsedLevel.metadata.custom === 'true'
  const stats = isCustom ? null : statsData.levels.get(id) || null

  return {
    id,
    map: parsedLevel.map,
    isCustom,
    stats,
    solver: stats ? {name: statsData.solver.name, version: stats.solverVersion} : null,
    difficultyScore: stats ? calculateDifficultyScore(stats) : null,
  }
}

// Проверяет условие, описанное операцией `validateStats`.
const validateStats = (level, metrics) => {
  if (!level.stats) return
  if (createMapHash(level.map) !== level.stats.mapHash) throw new Error(`${level.id}: карта не совпадает с проверенной решателем`)

  const keys = ['width', 'height', 'boxCount']
  keys.forEach((key) => {
    if (metrics[key] !== level.stats[key]) throw new Error(`${level.id}: метрика ${key} не совпадает с таблицей решателя`)
  })
  validateLurdSolution(level)
}

// Возвращает данные, за которые отвечает операция `getPositionKey`.
const getPositionKey = (position) => `${position.x}:${position.y}`

// Разбирает входные данные через операцию `parseSolutionState`.
const parseSolutionState = (standardMap) => {
  const map = toRuntimeMap(standardMap)
  const boxes = new Set()
  const targets = new Set()
  let player = null

  map.forEach((row, y) => {
    Array.from(row).forEach((symbol, x) => addSolutionSymbol(symbol, {x, y}, boxes, targets, (value) => (player = value)))
  })
  return {map, boxes, targets, player}
}

// Добавляет данные или представление через операцию `addSolutionSymbol`.
const addSolutionSymbol = (symbol, position, boxes, targets, setPlayer) => {
  const key = getPositionKey(position)
  if ('$-'.includes(symbol)) boxes.add(key)
  if ('.-*'.includes(symbol)) targets.add(key)
  if ('@*'.includes(symbol)) setPlayer(position)
}

// Проверяет условие, описанное операцией `isBlockedSolutionCell`.
const isBlockedSolutionCell = (state, position) => {
  const symbol = state.map[position.y]?.[position.x]
  return !symbol || symbol === '_' || symbol === '#'
}

// Обновляет состояние через операцию `applyLurdMove`.
const applyLurdMove = (state, move, levelId) => {
  const direction = lurdDirections[move.toLowerCase()]
  if (!direction) throw new Error(`${levelId}: недопустимый символ решения ${move}`)

  const next = {x: state.player.x + direction.x, y: state.player.y + direction.y}
  const nextKey = getPositionKey(next)
  const isPush = state.boxes.has(nextKey)
  if (isPush !== (move === move.toUpperCase())) throw new Error(`${levelId}: регистр LURD не совпадает с действием`)
  moveSolutionBox(state, next, direction, levelId)
  if (isBlockedSolutionCell(state, next)) throw new Error(`${levelId}: решение проходит сквозь стену`)
  state.player = next
}

// Выполняет отдельную операцию `moveSolutionBox`.
const moveSolutionBox = (state, box, direction, levelId) => {
  const boxKey = getPositionKey(box)
  if (!state.boxes.has(boxKey)) return

  const destination = {x: box.x + direction.x, y: box.y + direction.y}
  const destinationKey = getPositionKey(destination)
  if (isBlockedSolutionCell(state, destination) || state.boxes.has(destinationKey))
    throw new Error(`${levelId}: решение толкает ящик в препятствие`)
  state.boxes.delete(boxKey)
  state.boxes.add(destinationKey)
}

// Проверяет условие, описанное операцией `validateLurdSolution`.
const validateLurdSolution = (level) => {
  if (!level.stats.solution) return

  const state = parseSolutionState(level.map)
  Array.from(level.stats.solution).forEach((move) => applyLurdMove(state, move, level.id))
  const isSolved = Array.from(state.boxes).every((box) => state.targets.has(box))
  if (!isSolved) throw new Error(`${level.id}: сохранённое решение не завершает карту`)
}

// Возвращает данные, за которые отвечает операция `loadLocationDefinitions`.
const loadLocationDefinitions = () => {
  const {locations} = readJson(locationsSourcePath)
  if (!Array.isArray(locations) || locations.length === 0) throw new Error('Файл levels/locations.json не содержит локаций')
  return locations
}

// Возвращает данные, за которые отвечает операция `loadParsedLevels`.
const loadParsedLevels = (sourceLocations) => {
  return sourceLocations.flatMap((location) => {
    const filePath = path.resolve(mapsSourceDirectory, `${location.id}.xsb`)
    return parseXsb(readText(filePath), path.relative(projectRoot, filePath))
  })
}

// Проверяет условие, описанное операцией `validateStatsLinks`.
const validateStatsLinks = (levels, statsData) => {
  const levelIds = new Set(levels.map((level) => level.id))
  const unknownStatsIds = Array.from(statsData.levels.keys()).filter((levelId) => !levelIds.has(levelId))
  if (unknownStatsIds.length > 0) throw new Error(`Статистика ссылается на неизвестный уровень ${unknownStatsIds[0]}`)
}

// Возвращает данные, за которые отвечает операция `loadLevels`.
const loadLevels = (sourceLocations) => {
  const parsedLevels = loadParsedLevels(sourceLocations)
  const statsData = getStatsById()
  const levels = parsedLevels.map((level, index) => createLevel(level, index, statsData))

  if (levels.length === 0) throw new Error('Папка levels/maps не содержит карт')
  levels.forEach((level) => validateStats(level, validateStandardMap(level)))
  validateStatsLinks(levels, statsData)

  return assignDifficulty(levels)
}

// Возвращает данные, за которые отвечает операция `getLocationLevels`.
const getLocationLevels = (location, levelsById, assignedIds) => {
  if (!Array.isArray(location.levelIds) || location.levelIds.length === 0) throw new Error(`${location.id}: в локации нет уровней`)

  return location.levelIds.map((levelId) => {
    if (assignedIds.has(levelId)) throw new Error(`${levelId}: уровень добавлен более чем в одну локацию`)
    const level = levelsById.get(levelId)
    if (!level) throw new Error(`${location.id}: уровень ${levelId} не найден в levels/maps/${location.id}.xsb`)
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
  if (assignedIds.size !== levels.length) throw new Error('Не все карты из levels/maps распределены по локациям')

  return locations
}

// Проверяет условие, описанное операцией `validateDifficultyOrder`.
const validateDifficultyOrder = (levels) => {
  const verifiedLevels = levels.filter((level) => level.stats)

  verifiedLevels.slice(1).forEach((level, index) => {
    if (verifiedLevels[index].difficultyScore > level.difficultyScore) throw new Error('Проверенные уровни расположены не по сложности')
  })
}

// Возвращает данные, за которые отвечает операция `getDifficulty`.
const getDifficulty = (rank, total) => {
  if (rank <= total / 3) return 'easy'
  if (rank <= (total * 2) / 3) return 'medium'
  return 'hard'
}

// Выполняет отдельную операцию `assignDifficulty`.
const assignDifficulty = (levels) => {
  validateDifficultyOrder(levels)
  const verifiedCount = levels.filter((level) => level.stats).length
  let difficultyRank = 0

  return levels.map((level) => {
    if (!level.stats) return {...level, difficulty: 'custom'}
    difficultyRank++
    return {...level, difficulty: getDifficulty(difficultyRank, verifiedCount), difficultyRank}
  })
}

// Проверяет условие, описанное операцией `isAppearanceRoleCell`.
const isAppearanceRoleCell = (role, symbol, isDecor) => {
  if (role === 'wall' || role === 'decor') return symbol === '#'
  if (role === 'floor') return (Boolean(symbol) && symbol !== '_' && symbol !== '#') || isDecor
  if (role === 'box') return '$-'.includes(symbol)
  if (role === 'target') return '.-*'.includes(symbol)
  return false
}

// Проверяет условие, описанное операцией `validateAppearancePosition`.
const validateAppearancePosition = (level, appearance, role, positionKey) => {
  if (!positionKeyPattern.test(positionKey)) throw new Error(`${level.id}: недопустимая координата оформления ${positionKey}`)

  const [x, y] = positionKey.split(':').map(Number)
  const symbol = toRuntimeMap(level.map)[y]?.[x]
  const isDecor = Boolean(appearance.decor?.[positionKey])
  if (!isAppearanceRoleCell(role, symbol, isDecor)) {
    throw new Error(`${level.id}: оформление ${role} нельзя применить к клетке ${positionKey}`)
  }
}

// Проверяет условие, описанное операцией `validateAppearanceRole`.
const validateAppearanceRole = (level, appearance, role, overrides, tileCatalog) => {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error(`${level.id}: оформление ${role} должно быть объектом`)
  }

  Object.entries(overrides).forEach(([positionKey, texture]) => {
    validateAppearancePosition(level, appearance, role, positionKey)
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
    if (appearance[role] !== undefined) validateAppearanceRole(level, appearance, role, appearance[role], tileCatalog)
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
  const locationLevelIds = new Set(location.levels.map((level) => level.id))
  Object.entries(readLocationAppearance(location)).forEach(([levelId, appearance]) => {
    if (!locationLevelIds.has(levelId)) throw new Error(`${levelId}: оформление находится не в своей локации ${location.id}`)

    const level = levelsById.get(levelId)
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

// Создаёт данные или представление для операции `createSolverMetadata`.
const createSolverMetadata = (level) => {
  if (!level.stats) return undefined

  return {
    verified: true,
    name: level.solver.name,
    version: level.solver.version,
    moves: level.stats.moves,
    pushes: level.stats.pushes,
    bestPushes: level.stats.bestPushes,
    timeSeconds: level.stats.timeSeconds,
  }
}

// Возвращает данные, за которые отвечает операция `getProvenPushRecord`.
const getProvenPushRecord = (level) => {
  if (!level.stats || level.stats.lowerBound === null) return null
  if (level.stats.lowerBound !== level.stats.bestPushes) return null

  return level.stats.bestPushes
}

// Создаёт данные или представление для операции `createRuntimeLevel`.
const createRuntimeLevel = (level, index, appearance) => {
  const solver = createSolverMetadata(level)
  const pushRecord = getProvenPushRecord(level)

  return {
    id: level.id,
    levelName: `level${index}`,
    difficulty: level.difficulty,
    ...(level.difficultyRank && {difficultyRank: level.difficultyRank}),
    ...(level.difficultyScore && {difficultyScore: level.difficultyScore}),
    ...(solver && {solver}),
    ...(pushRecord && {pushRecord}),
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
const createRuntimeCatalog = (levels, locations, appearances) => {
  const levelIndexes = new Map(levels.map((level, index) => [level.id, index]))
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

// Возвращает данные, за которые отвечает операция `getLocationVariableName`.
const getLocationVariableName = (locationId) => {
  const camelCaseId = locationId.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase())
  return `${camelCaseId}Location`
}

// Создаёт данные или представление для операции `createGameIndexSource`.
const createGameIndexSource = (locations) => {
  const imports = [...locations]
    .sort((first, second) => first.id.localeCompare(second.id, 'en', {numeric: true}))
    .map((location) => `import ${getLocationVariableName(location.id)} from './generated/${location.id}.json'`)
    .join('\n')
  const locationNames = locations.map((location) => `    ${getLocationVariableName(location.id)},`).join('\n')

  return `${imports}

/** Автоматически созданный индекс игровых локаций. Не редактировать вручную. */
const levels = {
  locations: [
${locationNames}
  ],
}

export {
  levels,
}
`
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

// Записывает данные через операцию `writeGameIndex`.
const writeGameIndex = async (locations, prettierConfig) => {
  const content = await prettier.format(createGameIndexSource(locations), {...prettierConfig, parser: 'typescript'})
  const multilineExport = content.replace(
    'export {levels}',
    '// Формат именованного экспорта сохраняется единым во всём проекте.\n// prettier-ignore\nexport {\n  levels,\n}',
  )
  writeOutput(gameIndexOutputPath, multilineExport)
}

// Собирает и записывает все игровые файлы уровней.
const buildLevels = async () => {
  const sourceLocations = loadLocationDefinitions()
  const levels = loadLevels(sourceLocations)
  validateUniqueIds(levels)
  const locations = loadLocations(levels, sourceLocations)
  const appearances = loadAppearances(levels, locations)

  const gameCatalog = createRuntimeCatalog(levels, locations, appearances)
  const prettierConfig = await prettier.resolveConfig(gameIndexOutputPath)
  await writeLocationFiles(gameCatalog.locations, prettierConfig)
  await writeGameIndex(gameCatalog.locations, prettierConfig)
  removeStaleLocationFiles(gameCatalog.locations)
  removeGeneratedFile(obsoleteGameOutputPath)
  console.log(`Уровни собраны: ${levels.length} карт в ${locations.length} отдельных файлах локаций.`)
}

await buildLevels()
