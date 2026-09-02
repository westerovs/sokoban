import {Buffer} from 'node:buffer'
import {spawnSync} from 'node:child_process'
import fs from 'node:fs'
import type {IncomingMessage, ServerResponse} from 'node:http'
import path from 'node:path'
import process from 'node:process'
import prettier from 'prettier'
import type {Plugin} from 'vite'
import {getSokobanTileSourcePath} from '../../bundler/utils/getSokobanTileCatalog.mjs'
import {parseXsb, serializeXsb, toRuntimeMap, toStandardMap} from '../sokoban-levels/xsbFormat.mjs'
import {generateSokobanLevel} from './generator/generateSokobanLevel.js'
import {solveSokoban} from './solver.js'

/**
 * Предоставляет Vite API редактора, доступ к тайлам и безопасное сохранение уровней.
 */

const DATA_API_PATH = '/__sokoban-level-editor/data' // Путь API чтения и сохранения уровней
const GENERATOR_API_PATH = '/__sokoban-level-editor/generate' // Путь API процедурной генерации
const SOLVER_API_PATH = '/__sokoban-level-editor/solve' // Путь API проверки решаемости
const TILE_PATH_PATTERN = /^\/__sokoban-level-editor\/tile\/(wall|floor|box|target)\/([^/]+)\.png$/ // Шаблон адреса исходного тайла
const MAX_BODY_SIZE = 1024 * 1024 // Максимальный размер запроса редактора в байтах

type EditorPaths = {
  projectRoot: string
  appearanceSourceDirectory: string
  levelsBuild: string
  locationsSource: string
  locationsOutputDirectory: string
  mapsSourceDirectory: string
}

type WritableFile = {
  path: string
  previousContent: string
  nextContent: string
}

// Выполняет отдельную операцию `sendJson`.
const sendJson = (response: ServerResponse, statusCode: number, data: unknown) => {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(data))
}

// Возвращает данные, за которые отвечает операция `readBody`.
const readBody = (request: IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    request.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_SIZE) return reject(new Error('Request body is too large'))
      chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}

// Возвращает данные, за которые отвечает операция `readJson`.
const readJson = (filePath: string): any => JSON.parse(fs.readFileSync(filePath, 'utf8'))

// Создаёт данные или представление для операции `createEditorLocations`.
const createEditorLocations = (catalog: any) => {
  return catalog.locations.map((location: any) => ({
    id: location.id,
    titleKey: location.titleKey,
    levels: location.levels.map((level: any, index: number) => ({
      id: level.id,
      number: index + 1,
      map: level.map,
      isVerified: Boolean(level.solver?.verified),
    })),
  }))
}

// Возвращает данные, за которые отвечает операция `readRuntimeCatalog`.
const readRuntimeCatalog = (paths: EditorPaths) => {
  const locationOrder = readJson(paths.locationsSource).locations
  const locations = locationOrder.map(({id}: {id: string}) => readJson(path.resolve(paths.locationsOutputDirectory, `${id}.json`)))
  return {locations}
}

// Создаёт данные или представление для операции `createAppearanceCatalog`.
const createAppearanceCatalog = (catalog: any) => {
  const levels: Record<string, any> = {}
  catalog.locations.forEach((location: any) => {
    location.levels.forEach((level: any) => {
      if (level.appearance) levels[level.id] = level.appearance
    })
  })
  return {version: 1, levels}
}

// Возвращает данные, за которые отвечает операция `readEditorData`.
const readEditorData = (paths: EditorPaths) => {
  const catalog = readRuntimeCatalog(paths)
  return {locations: createEditorLocations(catalog), appearance: createAppearanceCatalog(catalog)}
}

// Выполняет отдельную операцию `runLevelsBuild`.
const runLevelsBuild = (paths: EditorPaths) => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', paths.levelsBuild], {cwd: paths.projectRoot, encoding: 'utf8'})
  if (result.status === 0) return
  throw new Error(result.stderr.trim() || result.stdout.trim() || 'Level build failed')
}

// Возвращает данные, за которые отвечает операция `findLocationForLevel`.
const findLocationForLevel = (paths: EditorPaths, levelId: string) => {
  const locations = readJson(paths.locationsSource).locations
  return locations.find((location: any) => location.levelIds.includes(levelId)) ?? null
}

// Обновляет состояние через операцию `updateLocationMap`.
const updateLocationMap = (content: string, levelId: string, runtimeMap: string[], sourceLabel: string) => {
  const levels = parseXsb(content, sourceLabel)
  const level = levels.find((entry) => entry.metadata.id === levelId)
  if (!level) throw new Error(`Level ${levelId} is missing in ${sourceLabel}`)

  const isMapChanged = JSON.stringify(toRuntimeMap(level.map)) !== JSON.stringify(runtimeMap)
  level.map = toStandardMap(runtimeMap)
  if (isMapChanged) level.metadata.custom = 'true'
  return serializeXsb(levels)
}

// Обновляет состояние через операцию `updateLocationAppearance`.
const updateLocationAppearance = async (content: string, levelId: string, appearance: Record<string, any>, filePath: string) => {
  const source = JSON.parse(content)
  if (!source.levels || typeof source.levels !== 'object') throw new Error('Unsupported appearance format')
  if (Object.keys(appearance).length === 0) delete source.levels[levelId]
  else source.levels[levelId] = appearance

  const prettierConfig = await prettier.resolveConfig(filePath)
  return await prettier.format(JSON.stringify(source), {...prettierConfig, parser: 'json'})
}

// Записывает данные через операцию `writeAndBuild`.
const writeAndBuild = (paths: EditorPaths, files: WritableFile[]) => {
  files.forEach((file) => fs.writeFileSync(file.path, file.nextContent))
  try {
    runLevelsBuild(paths)
  } catch (error) {
    files.forEach((file) => fs.writeFileSync(file.path, file.previousContent))
    throw error
  }
}

// Выполняет отдельную операцию `saveLevel`.
const saveLevel = async (request: IncomingMessage, paths: EditorPaths) => {
  const {levelId, map, appearance} = JSON.parse(await readBody(request))
  const location = findLocationForLevel(paths, levelId)
  if (!location || !Array.isArray(map) || !appearance || typeof appearance !== 'object') throw new Error('Unsupported level data')

  const mapPath = path.resolve(paths.mapsSourceDirectory, `${location.id}.xsb`)
  const appearancePath = path.resolve(paths.appearanceSourceDirectory, `${location.id}.json`)
  const mapContent = fs.readFileSync(mapPath, 'utf8')
  const appearanceContent = fs.readFileSync(appearancePath, 'utf8')
  const files = [
    {
      path: mapPath,
      previousContent: mapContent,
      nextContent: updateLocationMap(mapContent, levelId, map, path.relative(paths.projectRoot, mapPath)),
    },
    {
      path: appearancePath,
      previousContent: appearanceContent,
      nextContent: await updateLocationAppearance(appearanceContent, levelId, appearance, appearancePath),
    },
  ]
  writeAndBuild(paths, files)
}

// Обрабатывает событие, за которое отвечает операция `handleDataRequest`.
const handleDataRequest = async (request: IncomingMessage, response: ServerResponse, paths: EditorPaths) => {
  if (request.method === 'GET') return sendJson(response, 200, readEditorData(paths))
  if (request.method !== 'PUT') return sendJson(response, 405, {error: 'Method not allowed'})
  await saveLevel(request, paths)
  sendJson(response, 200, readEditorData(paths))
}

// Обрабатывает событие, за которое отвечает операция `handleSolverRequest`.
const handleSolverRequest = async (request: IncomingMessage, response: ServerResponse) => {
  if (request.method !== 'POST') return sendJson(response, 405, {error: 'Method not allowed'})
  const {map} = JSON.parse(await readBody(request))
  if (!Array.isArray(map) || map.length === 0) throw new Error('Unsupported Sokoban map')
  sendJson(response, 200, solveSokoban(map))
}

// Обрабатывает запрос создания новой головоломки.
const handleGeneratorRequest = async (request: IncomingMessage, response: ServerResponse) => {
  if (request.method !== 'POST') return sendJson(response, 405, {error: 'Method not allowed'})
  const options = JSON.parse(await readBody(request))
  sendJson(response, 200, generateSokobanLevel(options))
}

// Создаёт данные или представление для операции `createPaths`.
const createPaths = (projectRoot: string): EditorPaths => ({
  projectRoot,
  appearanceSourceDirectory: path.resolve(projectRoot, 'levels', 'appearance'),
  levelsBuild: path.resolve(projectRoot, 'tools', 'sokoban-levels', 'build.mjs'),
  locationsSource: path.resolve(projectRoot, 'levels', 'locations.json'),
  locationsOutputDirectory: path.resolve(projectRoot, 'src', 'game', 'gameConfig', 'levels', 'generated'),
  mapsSourceDirectory: path.resolve(projectRoot, 'levels', 'maps'),
})

// Пытается выполнить операцию `tryServeTile` и сообщает результат.
const tryServeTile = (request: IncomingMessage, response: ServerResponse, projectRoot: string) => {
  const match = TILE_PATH_PATTERN.exec(request.url?.split('?')[0] ?? '')
  if (!match) return false
  const filePath = getSokobanTileSourcePath(projectRoot, match[1], decodeURIComponent(match[2]))
  if (!filePath) {
    sendJson(response, 404, {error: 'Tile not found'})
    return true
  }
  response.statusCode = 200
  response.setHeader('Content-Type', 'image/png')
  fs.createReadStream(filePath).pipe(response)
  return true
}

// Обрабатывает событие, за которое отвечает операция `handleEditorApi`.
const handleEditorApi = async (request: IncomingMessage, response: ServerResponse, next: () => void, paths: EditorPaths) => {
  const requestPath = request.url?.split('?')[0]
  if (!requestPath || ![DATA_API_PATH, GENERATOR_API_PATH, SOLVER_API_PATH].includes(requestPath)) return next()
  try {
    if (requestPath === DATA_API_PATH) await handleDataRequest(request, response, paths)
    else if (requestPath === GENERATOR_API_PATH) await handleGeneratorRequest(request, response)
    else await handleSolverRequest(request, response)
  } catch (error) {
    console.error('[SokobanLevelEditor]: request failed', error)
    sendJson(response, 400, {error: error instanceof Error ? error.message : String(error)})
  }
}

// Создаёт данные или представление для операции `createSokobanLevelEditorPlugin`.
const createSokobanLevelEditorPlugin = (projectRoot: string): Plugin => {
  const paths = createPaths(projectRoot)
  return {
    name: 'sokoban-level-editor',
    apply: 'serve',
    // Подключает наблюдение за файлами уровней и HTTP-маршруты редактора.
    configureServer(server) {
      server.watcher.add([
        paths.appearanceSourceDirectory,
        paths.locationsSource,
        paths.locationsOutputDirectory,
        paths.mapsSourceDirectory,
      ])
      server.middlewares.use(async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
        if (tryServeTile(request, response, projectRoot)) return
        await handleEditorApi(request, response, next, paths)
      })
    },
  }
}

export {
  createSokobanLevelEditorPlugin, // Подключение API редактора к Vite
}
