import {Buffer} from 'node:buffer'
import {spawnSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import prettier from 'prettier'
import {getSokobanTileSourcePath} from '../../bundler/utils/getSokobanTileCatalog.mjs'

const API_PATH = '/__sokoban-level-editor/data'
const TILE_PATH_PATTERN = /^\/__sokoban-level-editor\/tile\/(wall|floor|box)\/([^/]+)\.png$/
const MAX_BODY_SIZE = 1024 * 1024

const sendJson = (response, statusCode, data) => {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(data))
}

const readBody = (request) => {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0

    request.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_SIZE) return reject(new Error('Request body is too large'))
      chunks.push(chunk)
    })
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}

const createEditorLocations = (catalog) => {
  return catalog.locations.map((location) => ({
    id: location.id,
    titleKey: location.titleKey,
    levels: location.levels.map((level, index) => ({
      id: level.id,
      number: index + 1,
      map: level.map,
    })),
  }))
}

const readEditorData = (paths) => {
  const catalog = JSON.parse(fs.readFileSync(paths.levelsOutput, 'utf8'))
  const appearance = JSON.parse(fs.readFileSync(paths.appearance, 'utf8'))
  return {locations: createEditorLocations(catalog), appearance}
}

const validateAppearanceRoot = (appearance) => {
  const isObject = appearance && typeof appearance === 'object' && !Array.isArray(appearance)
  const hasLevels = appearance?.levels && typeof appearance.levels === 'object' && !Array.isArray(appearance.levels)
  if (!isObject || appearance.version !== 1 || !hasLevels) throw new Error('Unsupported appearance format')
}

const formatAppearance = async (appearance, filePath) => {
  const prettierConfig = await prettier.resolveConfig(filePath)
  return await prettier.format(JSON.stringify(appearance), {...prettierConfig, parser: 'json'})
}

const runLevelsBuild = (paths) => {
  const result = spawnSync(process.execPath, [paths.levelsBuild], {
    cwd: paths.projectRoot,
    encoding: 'utf8',
  })

  if (result.status === 0) return
  throw new Error(result.stderr.trim() || result.stdout.trim() || 'Level build failed')
}

const saveAppearance = async (request, paths) => {
  const appearance = JSON.parse(await readBody(request))
  validateAppearanceRoot(appearance)
  const content = await formatAppearance(appearance, paths.appearance)
  const previousContent = fs.readFileSync(paths.appearance, 'utf8')

  fs.writeFileSync(paths.appearance, content)
  try {
    runLevelsBuild(paths)
  } catch (error) {
    fs.writeFileSync(paths.appearance, previousContent)
    throw error
  }
}

const createPaths = (projectRoot) => ({
  projectRoot,
  appearance: path.resolve(projectRoot, 'levels', 'appearance.json'),
  levelsBuild: path.resolve(projectRoot, 'tools', 'sokoban-levels', 'build.mjs'),
  levelsOutput: path.resolve(projectRoot, 'src', 'game', 'gameConfig', 'levels', 'levels.json'),
})

const handleRequest = async (request, response, paths) => {
  if (request.method === 'GET') return sendJson(response, 200, readEditorData(paths))
  if (request.method !== 'PUT') return sendJson(response, 405, {error: 'Method not allowed'})

  await saveAppearance(request, paths)
  sendJson(response, 200, readEditorData(paths))
}

const tryServeTile = (request, response, projectRoot) => {
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

const createSokobanLevelEditorPlugin = (projectRoot) => {
  const paths = createPaths(projectRoot)

  return {
    name: 'sokoban-level-editor',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add([paths.appearance, paths.levelsOutput])
      server.middlewares.use(async (request, response, next) => {
        if (tryServeTile(request, response, projectRoot)) return
        if (request.url?.split('?')[0] !== API_PATH) return next()

        try {
          await handleRequest(request, response, paths)
        } catch (error) {
          console.error('[SokobanLevelEditor]: request failed', error)
          sendJson(response, 400, {error: error.message})
        }
      })
    },
  }
}

export {
  createSokobanLevelEditorPlugin,
}
