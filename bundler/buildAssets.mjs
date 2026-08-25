/**
 * Запускает AssetPack и защищает локальную разработку от повреждённого кэша.
 *
 * `public/assets` и `.assetpack` не хранятся в Git: первый каталог является
 * результатом обработки `raw-assets`, второй ускоряет повторные запуски.
 * Wrapper удаляет только незавершённый кэш, запускает штатный AssetPack CLI
 * и создаёт marker лишь после полностью успешной сборки.
 */
import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

// Абсолютный корень делает запуск независимым от терминала или WebStorm.
const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const cachePath = path.join(projectRoot, '.assetpack')
const completeMarker = path.join(cachePath, 'build-complete')
const sourcePath = path.join(projectRoot, 'raw-assets')
const outputPath = path.join(projectRoot, 'public', 'assets')

const listFiles = (rootPath, currentPath = rootPath) => {
  if (!existsSync(currentPath)) return []

  return readdirSync(currentPath, {withFileTypes: true}).flatMap((entry) => {
    const entryPath = path.join(currentPath, entry.name)

    if (entry.isDirectory()) return listFiles(rootPath, entryPath)
    return [path.relative(rootPath, entryPath).replaceAll('\\', '/')]
  })
}

const readBuildState = () => {
  if (!existsSync(completeMarker)) return null

  try {
    return JSON.parse(readFileSync(completeMarker, 'utf8'))
  } catch {
    return null
  }
}

const hasMissingFiles = (rootPath, relativePaths = []) => relativePaths.some(
  (relativePath) => !existsSync(path.join(rootPath, relativePath)),
)

const buildState = readBuildState()
const cacheIsIncomplete = existsSync(cachePath) && (
  !buildState
  || hasMissingFiles(sourcePath, buildState.sourceFiles)
  || hasMissingFiles(outputPath, buildState.outputFiles)
)

// raw-assets не затрагивается: удаляется только генерируемый `.assetpack`.
if (cacheIsIncomplete) {
  console.warn('[assets] Incomplete AssetPack cache found. Rebuilding assets from scratch.')
  rmSync(cachePath, {recursive: true, force: true})
}

const assetpackBin = path.join(
  projectRoot,
  'node_modules',
  '@assetpack',
  'core',
  'bin',
  'index.js',
)

// Запускаем CLI тем же Node.js и передаём его вывод в текущую консоль.
const result = spawnSync(
  process.execPath,
  [assetpackBin, '--config', '.assetpack.mjs'],
  {cwd: projectRoot, stdio: 'inherit'},
)

if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)

// Marker хранит успешно собранные входы и выходы для поиска удалённых файлов.
mkdirSync(cachePath, {recursive: true})
writeFileSync(completeMarker, JSON.stringify({
  completedAt: new Date().toISOString(),
  sourceFiles: listFiles(sourcePath),
  outputFiles: listFiles(outputPath),
}, null, 2))
