/**
 * Запускает AssetPack и защищает локальную разработку от повреждённого кэша.
 *
 * `public/assets` и `.assetpack` не хранятся в Git: первый каталог является
 * результатом обработки `raw-assets`, второй ускоряет повторные запуски.
 * Wrapper удаляет только незавершённый кэш, запускает штатный AssetPack CLI
 * и создаёт marker лишь после полностью успешной сборки.
 */
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import path from 'node:path'

// Абсолютный корень делает запуск независимым от терминала или WebStorm.
const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const cachePath = path.join(projectRoot, '.assetpack')
const completeMarker = path.join(cachePath, 'build-complete')
// Обязательный `{copy}`-результат показывает, что public/assets не удалён
// отдельно от кэша после предыдущего успешного запуска.
const requiredOutput = path.join(
  projectRoot,
  'public',
  'assets',
  'levels',
  'gameLevels',
  'level0.atlas',
)

const cacheIsIncomplete = existsSync(cachePath)
  && (!existsSync(completeMarker) || !existsSync(requiredOutput))

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

// Marker создаётся только после exit code 0. Оборванный процесс его не оставит,
// поэтому следующий запуск автоматически выполнит полную пересборку.
mkdirSync(cachePath, {recursive: true})
writeFileSync(completeMarker, `${new Date().toISOString()}\n`)
