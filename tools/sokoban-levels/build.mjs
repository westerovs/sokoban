import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import prettier from 'prettier'
import {getSokobanTileCatalog} from '../../bundler/utils/getSokobanTileCatalog.mjs'

/**
 * Собирает единый канонический XSB-файл в отдельные игровые JSON по локациям.
 * Внешние пробелы карт превращаются во внутренний символ пустоты `_`.
 */

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..', '..')
const levelsDirectory = path.resolve(projectRoot, 'levels')
const levelsSourcePath = path.resolve(levelsDirectory, 'levels.xsb')
const locationsSourcePath = path.resolve(levelsDirectory, 'locations.json')
const appearanceSourcePath = path.resolve(levelsDirectory, 'appearance.json')
const solverStatsPath = path.resolve(levelsDirectory, 'metadata', 'solver-stats.json')
const gameLevelsDirectory = path.resolve(projectRoot, 'src', 'game', 'gameConfig', 'levels')
const gameLocationsDirectory = path.resolve(gameLevelsDirectory, 'generated')
const gameIndexOutputPath = path.resolve(gameLevelsDirectory, 'levels.js')
const obsoleteGameOutputPath = path.resolve(gameLevelsDirectory, 'levels.json')
const isCheckMode = process.argv.includes('--check')
const standardRowPattern = /^[ #.$@*+]+$/
const metadataKeys = Object.freeze({id: 'id'})
const appearanceRoles = Object.freeze(['wall', 'floor', 'box'])
const positionKeyPattern = /^(0|[1-9]\d*):(0|[1-9]\d*)$/
const lurdDirections = Object.freeze({
  u: Object.freeze({x: 0, y: -1}),
  d: Object.freeze({x: 0, y: 1}),
  l: Object.freeze({x: -1, y: 0}),
  r: Object.freeze({x: 1, y: 0}),
})

const readText = (filePath) => fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n')

const readJson = (filePath) => JSON.parse(readText(filePath))

const normalizeMapForHash = (map) => {
  const rows = map.map((row) => row.trimEnd()).filter((row) => row.trim())
  const indent = Math.min(...rows.map((row) => row.search(/\S/)))

  return rows.map((row) => row.slice(indent).trimEnd()).join('\n')
}

const createMapHash = (map) => crypto.createHash('sha256').update(normalizeMapForHash(map)).digest('hex')

const parseMetadata = (line, metadata) => {
  const match = /^;\s*([^:]+):\s*(.+)$/.exec(line)
  if (!match) return

  const key = metadataKeys[match[1].trim().toLowerCase()]
  if (key) metadata[key] = match[2].trim()
}

const addParsedLevel = (levels, rows, metadata) => {
  if (rows.length === 0) return

  levels.push({map: [...rows], metadata: {...metadata}})
  rows.length = 0
  Object.keys(metadata).forEach((key) => delete metadata[key])
}

const parseXsb = (text) => {
  const levels = []
  const rows = []
  const metadata = {}

  text.split('\n').forEach((line) => parseXsbLine(line, levels, rows, metadata))
  addParsedLevel(levels, rows, metadata)
  return levels
}

const parseXsbLine = (line, levels, rows, metadata) => {
  if (!line.trim()) return addParsedLevel(levels, rows, metadata)
  if (line.trimStart().startsWith(';')) return parseMetadata(line.trimStart(), metadata)
  if (!standardRowPattern.test(line)) throw new Error(`Недопустимая строка в levels/levels.xsb: ${line}`)

  rows.push(line.trimEnd())
}

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

const validateStandardMap = (level) => {
  const metrics = getStandardMetrics(level.map)
  if (metrics.playerCount !== 1) throw new Error(`${level.id}: требуется ровно один игрок`)
  if (metrics.boxCount === 0) throw new Error(`${level.id}: требуется хотя бы один ящик`)
  if (metrics.boxCount !== metrics.targetCount) throw new Error(`${level.id}: число ящиков и целей не совпадает`)
  if (metrics.width > 20 || metrics.height > 17) throw new Error(`${level.id}: карта превышает ограничение 20×17`)

  return metrics
}

const getStatsById = () => {
  const stats = readJson(solverStatsPath)
  return {
    solver: stats.solver,
    levels: new Map(stats.levels.map((level) => [level.id, level])),
  }
}

const calculateDifficultyScore = (stats) => {
  const timeWeight = Math.log2(stats.timeSeconds + 1) * 20
  const score = stats.pushes + stats.moves * 0.15 + stats.boxCount * 4 + timeWeight

  return Number(score.toFixed(2))
}

const createLevel = (parsedLevel, index, statsData) => {
  const id = parsedLevel.metadata.id || `sokoban-${String(index + 1).padStart(3, '0')}`
  const stats = statsData.levels.get(id) || null

  return {
    id,
    map: parsedLevel.map,
    stats,
    solver: stats ? {name: statsData.solver.name, version: stats.solverVersion} : null,
    difficultyScore: stats ? calculateDifficultyScore(stats) : null,
  }
}

const validateStats = (level, metrics) => {
  if (!level.stats) return
  if (createMapHash(level.map) !== level.stats.mapHash) throw new Error(`${level.id}: карта не совпадает с проверенной решателем`)

  const keys = ['width', 'height', 'boxCount']
  keys.forEach((key) => {
    if (metrics[key] !== level.stats[key]) throw new Error(`${level.id}: метрика ${key} не совпадает с таблицей решателя`)
  })
  validateLurdSolution(level)
}

const getPositionKey = (position) => `${position.x}:${position.y}`

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

const addSolutionSymbol = (symbol, position, boxes, targets, setPlayer) => {
  const key = getPositionKey(position)
  if ('$-'.includes(symbol)) boxes.add(key)
  if ('.-*'.includes(symbol)) targets.add(key)
  if ('@*'.includes(symbol)) setPlayer(position)
}

const isBlockedSolutionCell = (state, position) => {
  const symbol = state.map[position.y]?.[position.x]
  return !symbol || symbol === '_' || symbol === '#'
}

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

const validateLurdSolution = (level) => {
  if (!level.stats.solution) return

  const state = parseSolutionState(level.map)
  Array.from(level.stats.solution).forEach((move) => applyLurdMove(state, move, level.id))
  const isSolved = Array.from(state.boxes).every((box) => state.targets.has(box))
  if (!isSolved) throw new Error(`${level.id}: сохранённое решение не завершает карту`)
}

const loadLevels = () => {
  const parsedLevels = parseXsb(readText(levelsSourcePath))
  const statsData = getStatsById()
  const levels = parsedLevels.map((level, index) => createLevel(level, index, statsData))

  if (levels.length === 0) throw new Error('Файл levels/levels.xsb не содержит карт')
  levels.forEach((level) => validateStats(level, validateStandardMap(level)))
  if (levels.filter((level) => level.stats).length !== statsData.levels.size) throw new Error('Не все записи статистики связаны с картами')

  return assignDifficulty(levels)
}

const getLocationLevels = (location, levelsById, assignedIds) => {
  if (!Array.isArray(location.levelIds) || location.levelIds.length === 0) throw new Error(`${location.id}: в локации нет уровней`)

  return location.levelIds.map((levelId) => {
    if (assignedIds.has(levelId)) throw new Error(`${levelId}: уровень добавлен более чем в одну локацию`)
    const level = levelsById.get(levelId)
    if (!level) throw new Error(`${location.id}: уровень ${levelId} не найден в levels.xsb`)
    assignedIds.add(levelId)
    return level
  })
}

const createLocation = (location, index, levelsById, assignedIds) => {
  const requiredKeys = ['id', 'titleKey', 'cardTexture', 'background', 'ambience', 'music']
  requiredKeys.forEach((key) => {
    if (!location[key]) throw new Error(`Локация ${index + 1}: не заполнено поле ${key}`)
  })

  return {...location, levels: getLocationLevels(location, levelsById, assignedIds)}
}

const loadLocations = (levels) => {
  const {locations: sourceLocations} = readJson(locationsSourcePath)
  if (!Array.isArray(sourceLocations) || sourceLocations.length === 0) throw new Error('Файл levels/locations.json не содержит локаций')

  const levelsById = new Map(levels.map((level) => [level.id, level]))
  const assignedIds = new Set()
  const locations = sourceLocations.map((location, index) => createLocation(location, index, levelsById, assignedIds))
  if (assignedIds.size !== levels.length) throw new Error('Не все карты из levels.xsb распределены по локациям')

  return locations
}

const validateDifficultyOrder = (levels) => {
  const verifiedLevels = levels.filter((level) => level.stats)

  verifiedLevels.slice(1).forEach((level, index) => {
    if (verifiedLevels[index].difficultyScore > level.difficultyScore) throw new Error('Проверенные уровни расположены не по сложности')
  })
}

const getDifficulty = (rank, total) => {
  if (rank <= total / 3) return 'easy'
  if (rank <= (total * 2) / 3) return 'medium'
  return 'hard'
}

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

const getBoundaryPositions = (width, height) => {
  const horizontal = Array.from({length: width}, (_, x) => [x, 0, x, height - 1])
  const vertical = Array.from({length: height}, (_, y) => [0, y, width - 1, y])

  return [...horizontal, ...vertical].flatMap(([x1, y1, x2, y2]) => [
    {x: x1, y: y1},
    {x: x2, y: y2},
  ])
}

const tryAddExteriorSpace = (map, position, exterior, queue) => {
  const {x, y} = position
  if (y < 0 || y >= map.length || x < 0 || x >= map[0].length || map[y][x] !== ' ') return

  const key = `${x}:${y}`
  if (exterior.has(key)) return

  exterior.add(key)
  queue.push(position)
}

const findExteriorSpaces = (map) => {
  const exterior = new Set()
  const queue = []
  const boundary = getBoundaryPositions(map[0].length, map.length)
  boundary.forEach((position) => tryAddExteriorSpace(map, position, exterior, queue))

  for (let index = 0; index < queue.length; index++) {
    const {x, y} = queue[index]
    const neighbors = [
      {x: x - 1, y},
      {x: x + 1, y},
      {x, y: y - 1},
      {x, y: y + 1},
    ]
    neighbors.forEach((position) => tryAddExteriorSpace(map, position, exterior, queue))
  }

  return exterior
}

const toRuntimeSymbol = (symbol, positionKey, exterior) => {
  if (symbol === ' ' && exterior.has(positionKey)) return '_'
  if (symbol === '*') return '-'
  if (symbol === '+') return '*'
  return symbol
}

const toRuntimeMap = (standardMap) => {
  const width = Math.max(...standardMap.map((row) => row.length))
  const paddedMap = standardMap.map((row) => row.padEnd(width, ' '))
  const exterior = findExteriorSpaces(paddedMap)

  return paddedMap.map((row, y) => {
    return Array.from(row, (symbol, x) => toRuntimeSymbol(symbol, `${x}:${y}`, exterior)).join('')
  })
}

const isAppearanceRoleCell = (role, symbol) => {
  if (role === 'wall') return symbol === '#'
  if (role === 'floor') return Boolean(symbol) && symbol !== '_' && symbol !== '#'
  if (role === 'box') return '$-'.includes(symbol)
  return false
}

const validateAppearancePosition = (level, role, positionKey) => {
  if (!positionKeyPattern.test(positionKey)) throw new Error(`${level.id}: недопустимая координата оформления ${positionKey}`)

  const [x, y] = positionKey.split(':').map(Number)
  const symbol = toRuntimeMap(level.map)[y]?.[x]
  if (!isAppearanceRoleCell(role, symbol)) {
    throw new Error(`${level.id}: оформление ${role} нельзя применить к клетке ${positionKey}`)
  }
}

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

const loadAppearances = (levels) => {
  const source = readJson(appearanceSourcePath)
  if (source.version !== 1 || !source.levels || typeof source.levels !== 'object' || Array.isArray(source.levels)) {
    throw new Error('Файл levels/appearance.json имеет неподдерживаемый формат')
  }

  const levelsById = new Map(levels.map((level) => [level.id, level]))
  const tileCatalog = getSokobanTileCatalog(projectRoot)
  Object.entries(source.levels).forEach(([levelId, appearance]) => {
    const level = levelsById.get(levelId)
    if (!level) throw new Error(`Оформление ссылается на неизвестный уровень ${levelId}`)
    validateLevelAppearance(level, appearance, tileCatalog)
  })

  return new Map(Object.entries(source.levels))
}

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

const getProvenPushRecord = (level) => {
  if (!level.stats || level.stats.lowerBound === null) return null
  if (level.stats.lowerBound !== level.stats.bestPushes) return null

  return level.stats.bestPushes
}

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

const createRuntimeCatalog = (levels, locations, appearances) => {
  const levelIndexes = new Map(levels.map((level, index) => [level.id, index]))
  return {locations: locations.map((location) => createRuntimeLocation(location, levelIndexes, appearances))}
}

const validateUniqueIds = (levels) => {
  const ids = new Set()

  levels.forEach((level) => {
    if (ids.has(level.id)) throw new Error(`Повторяющийся id уровня: ${level.id}`)
    ids.add(level.id)
  })
}

const writeOutput = (filePath, content) => {
  const current = fs.existsSync(filePath) ? readText(filePath) : null
  if (current === content) return false
  if (isCheckMode) throw new Error(`Требуется обновить сгенерированный файл: ${path.relative(projectRoot, filePath)}`)

  fs.mkdirSync(path.dirname(filePath), {recursive: true})
  fs.writeFileSync(filePath, content)
  return true
}

const removeGeneratedFile = (filePath) => {
  if (!fs.existsSync(filePath)) return
  if (isCheckMode) throw new Error(`Требуется удалить устаревший файл: ${path.relative(projectRoot, filePath)}`)

  fs.unlinkSync(filePath)
}

const getLocationVariableName = (locationId) => {
  const camelCaseId = locationId.replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase())
  return `${camelCaseId}Location`
}

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

const removeStaleLocationFiles = (locations) => {
  if (!fs.existsSync(gameLocationsDirectory)) return

  const expectedNames = new Set(locations.map((location) => `${location.id}.json`))
  fs.readdirSync(gameLocationsDirectory, {withFileTypes: true})
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && !expectedNames.has(entry.name))
    .forEach((entry) => removeGeneratedFile(path.resolve(gameLocationsDirectory, entry.name)))
}

const writeLocationFiles = async (locations, prettierConfig) => {
  for (const location of locations) {
    const filePath = path.resolve(gameLocationsDirectory, `${location.id}.json`)
    const content = await prettier.format(JSON.stringify(location), {...prettierConfig, parser: 'json'})
    writeOutput(filePath, content)
  }
}

const writeGameIndex = async (locations, prettierConfig) => {
  const formattedContent = await prettier.format(createGameIndexSource(locations), {...prettierConfig, parser: 'babel'})
  const content = formattedContent.replace('export {levels}', 'export {\n  levels,\n}')
  writeOutput(gameIndexOutputPath, content)
}

const buildLevels = async () => {
  const levels = loadLevels()
  validateUniqueIds(levels)
  const locations = loadLocations(levels)
  const appearances = loadAppearances(levels)

  const gameCatalog = createRuntimeCatalog(levels, locations, appearances)
  const prettierConfig = await prettier.resolveConfig(gameIndexOutputPath)
  await writeLocationFiles(gameCatalog.locations, prettierConfig)
  await writeGameIndex(gameCatalog.locations, prettierConfig)
  removeStaleLocationFiles(gameCatalog.locations)
  removeGeneratedFile(obsoleteGameOutputPath)
  console.log(`Уровни собраны: ${levels.length} карт в ${locations.length} отдельных файлах локаций.`)
}

await buildLevels()
