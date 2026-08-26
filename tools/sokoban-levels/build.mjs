import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import prettier from 'prettier'

/**
 * Собирает канонические XSB-паки в игровой JSON и единый файл для решателя.
 * Внешние пробелы карт превращаются во внутренний символ пустоты `_`.
 */

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..', '..')
const levelsDirectory = path.resolve(projectRoot, 'levels')
const catalogPath = path.resolve(levelsDirectory, 'catalog.json')
const gameOutputPath = path.resolve(projectRoot, 'src', 'game', 'gameConfig', 'levels.json')
const solverOutputPath = path.resolve(levelsDirectory, 'solver', 'all-levels.xsb')
const isCheckMode = process.argv.includes('--check')
const standardRowPattern = /^[ #.$@*+]+$/
const metadataKeys = Object.freeze({id: 'id', 'source-level': 'sourceLevel'})
const themes = Object.freeze([
  Object.freeze({back: 'garden', amb: 'amb_garden', music: 'm_garden'}),
  Object.freeze({back: 'antarctica', amb: 'amb_antarctica', music: 'm_antarctica'}),
  Object.freeze({back: 'forest', amb: 'amb_forest', music: 'm_forest'}),
])
const lurdDirections = Object.freeze({
  u: Object.freeze({x: 0, y: -1}),
  d: Object.freeze({x: 0, y: 1}),
  l: Object.freeze({x: -1, y: 0}),
  r: Object.freeze({x: 1, y: 0}),
})

const readText = (filePath) => fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n')

const readJson = (filePath) => JSON.parse(readText(filePath))

const resolveLevelsPath = (relativePath) => path.resolve(levelsDirectory, relativePath)

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

const parseXsb = (text, packId) => {
  const levels = []
  const rows = []
  const metadata = {}

  text.split('\n').forEach((line) => parseXsbLine(line, packId, levels, rows, metadata))
  addParsedLevel(levels, rows, metadata)
  return levels
}

const parseXsbLine = (line, packId, levels, rows, metadata) => {
  if (!line.trim()) return addParsedLevel(levels, rows, metadata)
  if (line.trimStart().startsWith(';')) return parseMetadata(line.trimStart(), metadata)
  if (!standardRowPattern.test(line)) throw new Error(`Недопустимая строка XSB в пакете ${packId}: ${line}`)

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

const getStatsByLevel = (pack) => {
  if (!pack.statsFile) return {solver: null, levels: new Map()}

  const stats = readJson(resolveLevelsPath(pack.statsFile))
  return {
    solver: stats.solver,
    levels: new Map(stats.levels.map((level) => [level.sourceLevel, level])),
  }
}

const createLevelId = (pack, sourceLevel, metadata) => {
  if (metadata.id) return metadata.id

  return `${pack.idPrefix}-${String(sourceLevel).padStart(3, '0')}`
}

const calculateDifficultyScore = (stats) => {
  const timeWeight = Math.log2(stats.timeSeconds + 1) * 20
  const score = stats.pushes + stats.moves * 0.15 + stats.boxCount * 4 + timeWeight

  return Number(score.toFixed(2))
}

const createPackLevel = (pack, parsedLevel, index, statsData) => {
  const sourceLevel = Number(parsedLevel.metadata.sourceLevel || index + 1)
  const stats = statsData.levels.get(sourceLevel) || null

  return {
    id: createLevelId(pack, sourceLevel, parsedLevel.metadata),
    source: pack.id,
    sourceLevel,
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

const loadPackLevels = (pack) => {
  const source = readText(resolveLevelsPath(pack.file))
  const parsedLevels = parseXsb(source, pack.id)
  const statsData = getStatsByLevel(pack)
  const levels = parsedLevels.map((level, index) => createPackLevel(pack, level, index, statsData))

  if (levels.length !== pack.expectedLevels) throw new Error(`${pack.id}: ожидалось ${pack.expectedLevels} карт, найдено ${levels.length}`)
  levels.forEach((level) => validateStats(level, validateStandardMap(level)))
  if (pack.statsFile && levels.some((level) => !level.stats)) throw new Error(`${pack.id}: не для всех карт найдена статистика`)

  return sortPackLevels(pack, levels)
}

const sortPackLevels = (pack, levels) => {
  if (pack.order !== 'difficulty') return levels

  return [...levels].sort((first, second) => first.difficultyScore - second.difficultyScore || first.sourceLevel - second.sourceLevel)
}

const getDifficulty = (rank, total) => {
  if (rank <= total / 3) return 'easy'
  if (rank <= (total * 2) / 3) return 'medium'
  return 'hard'
}

const assignPackDifficulty = (pack, levels) => {
  if (pack.order !== 'difficulty') return levels.map((level) => ({...level, difficulty: pack.difficulty}))

  return levels.map((level, index) => ({
    ...level,
    difficulty: getDifficulty(index + 1, levels.length),
    difficultyRank: index + 1,
  }))
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

const createRuntimeLevel = (level, index) => {
  const solver = createSolverMetadata(level)
  const pushRecord = getProvenPushRecord(level)

  return {
    id: level.id,
    levelName: `level${index}`,
    source: level.source,
    sourceLevel: level.sourceLevel,
    difficulty: level.difficulty,
    ...(level.difficultyRank && {difficultyRank: level.difficultyRank}),
    ...(level.difficultyScore && {difficultyScore: level.difficultyScore}),
    ...(solver && {solver}),
    ...(pushRecord && {pushRecord}),
    ...themes[index % themes.length],
    map: toRuntimeMap(level.map),
  }
}

const createRuntimeCatalog = (levels) => {
  return Object.fromEntries(levels.map((level, index) => [`level${index}`, createRuntimeLevel(level, index)]))
}

const getSolverComment = (level) => {
  if (!level.stats) return '; solver: not-verified'

  return `; solver: ${level.solver.name} ${level.solver.version}, moves ${level.stats.moves}, pushes ${level.stats.pushes}`
}

const createSolverLevel = (level) => {
  const difficulty = level.difficultyRank
    ? `${level.difficulty}, rank ${level.difficultyRank}, score ${level.difficultyScore}`
    : level.difficulty
  const header = [
    `; id: ${level.id}`,
    `; source: ${level.source}, level ${level.sourceLevel}`,
    `; difficulty: ${difficulty}`,
    getSolverComment(level),
  ]

  return [...header, ...level.map].join('\n')
}

const createSolverExport = (levels) => `${levels.map(createSolverLevel).join('\n\n')}\n`

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

const buildLevels = async () => {
  const catalog = readJson(catalogPath)
  const levels = catalog.packs.flatMap((pack) => assignPackDifficulty(pack, loadPackLevels(pack)))
  validateUniqueIds(levels)

  const gameCatalog = createRuntimeCatalog(levels)
  const prettierConfig = await prettier.resolveConfig(gameOutputPath)
  const gameJson = await prettier.format(JSON.stringify(gameCatalog), {...prettierConfig, parser: 'json'})
  writeOutput(gameOutputPath, gameJson)
  writeOutput(solverOutputPath, createSolverExport(levels))
  console.log(`Уровни собраны: ${levels.length}; игровой JSON и XSB для решателя готовы.`)
}

await buildLevels()
