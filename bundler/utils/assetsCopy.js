/**
 * Копирует игровые assets в уже созданную Vite папку конкретного билда.
 *
 * Основная задача файла - подготовить две версии ассетов:
 * 1. assets - локальные ассеты, которые должны попасть рядом с билдом игры
 * 2. remote-assets/assets - ассеты, которые нужно вынести отдельно и загружать удалённо
 *
 * Если платформа не описана в assetsCopyConfig, remote-логика не применяется.
 * В этом случае public/assets копируется полностью без фильтрации.
 *
 * Если платформа описана в remoteAssetsPlatforms, копирование работает по правилам:
 * - общие ассеты копируются в assets без папки levels
 * - levels наполняется динамически по JSON-файлам локаций из src/game/gameConfig/levels/generated
 * - фон локации копируется в assets/levels, если в ней есть локальные уровни
 * - фон локации копируется в remote-assets/assets/levels, если в ней есть удалённые уровни
 * - при смешанной локации общий фон присутствует в обеих папках
 *
 * Структура исходников при копировании сохраняется.
 * Если remote-ассетов нет, папка remote-assets удаляется после копирования.
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')
const assetsSourceDir = path.resolve(projectRoot, 'public', 'assets')
const distDir = path.resolve(projectRoot, 'dist')

const levelsConfigDirectory = path.resolve(projectRoot, 'src', 'game', 'gameConfig', 'levels', 'generated')
const levelsSourceDir = path.resolve(assetsSourceDir, 'levels')
const remoteAssetsDirName = 'remote-assets'

// Описывает платформы, для которых уровни делятся на local и remote.
const remoteAssetsPlatforms = new Set(['yandex', 'crazyGames'])

// Проверяет, нужно ли применять remote-логику для платформы.
const shouldUseRemoteAssets = (platformName) => remoteAssetsPlatforms.has(platformName)

// Рекурсивно копирует папку со всем содержимым.
const copyDir = (sourceDir, targetDir) => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, {recursive: true})
  }

  const entries = fs.readdirSync(sourceDir, {withFileTypes: true})

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath)
      continue
    }

    fs.copyFileSync(sourcePath, targetPath)
  }
}

// Копирует один файл и создаёт целевую папку при необходимости.
const copyFile = (sourcePath, targetPath) => {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`File not found: ${sourcePath}`)
  }

  fs.mkdirSync(path.dirname(targetPath), {recursive: true})
  fs.copyFileSync(sourcePath, targetPath)
}

// Копирует assets без levels.
const copyAssetsWithoutLevels = (assetsOutputDir) => {
  const entries = fs.readdirSync(assetsSourceDir, {withFileTypes: true})

  for (const entry of entries) {
    // levels собирается отдельно по файлам локаций, чтобы разделить local и remote уровни.
    if (entry.name === 'levels') {
      continue
    }

    const sourcePath = path.join(assetsSourceDir, entry.name)
    const targetPath = path.join(assetsOutputDir, entry.name)

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath)
      continue
    }

    copyFile(sourcePath, targetPath)
  }
}

// Копирует общий фон локации в указанную папку levels.
const copyLocationBackground = (location, levelsOutputDir) => {
  const backgroundName = location.background
  if (!backgroundName) throw new Error(`Missing background in location ${location.id}`)

  copyFile(
    path.resolve(levelsSourceDir, 'backgrounds', `${backgroundName}.webp`),
    path.resolve(levelsOutputDir, 'backgrounds', `${backgroundName}.webp`),
  )
}

// Загружает локации из отдельных сгенерированных JSON-файлов.
const readLocationConfigs = () => {
  if (!fs.existsSync(levelsConfigDirectory)) {
    throw new Error(`Levels config directory not found: ${levelsConfigDirectory}`)
  }

  return fs
    .readdirSync(levelsConfigDirectory, {withFileTypes: true})
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => {
      const location = JSON.parse(fs.readFileSync(path.resolve(levelsConfigDirectory, entry.name), 'utf8'))
      if (!Array.isArray(location.levels)) throw new Error(`Invalid location config: ${entry.name}`)
      return location
    })
}

// Копирует фон локации в локальную и удалённую части по типам её уровней.
const copyLocationAssets = (location, levelsOutputDir, remoteLevelsOutputDir) => {
  const hasLocalLevels = location.levels.some((level) => !level.isRemote)
  const hasRemoteLevels = location.levels.some((level) => level.isRemote)

  if (hasLocalLevels) copyLocationBackground(location, levelsOutputDir)
  if (hasRemoteLevels) copyLocationBackground(location, remoteLevelsOutputDir)

  return location.levels.filter((level) => level.isRemote).length
}

// Копирует уровни по файлам локаций и разделяет их на local и remote.
const copyDynamicLevels = (assetsOutputDir, remoteAssetsOutputDir) => {
  const locations = readLocationConfigs()
  const levelsOutputDir = path.resolve(assetsOutputDir, 'levels')
  const remoteLevelsOutputDir = path.resolve(remoteAssetsOutputDir, 'levels')

  fs.mkdirSync(path.resolve(levelsOutputDir, 'backgrounds'), {recursive: true})

  let remoteLevelsCount = 0

  for (const location of locations) {
    remoteLevelsCount += copyLocationAssets(location, levelsOutputDir, remoteLevelsOutputDir)
    console.log(`assetsCopy location copied: ${location.id} / ${location.background}`)
  }

  return remoteLevelsCount
}

// Копирует assets в билд с учётом правил конкретной платформы.
const copyAssetsToBuild = (platform) => {
  const {name: platformName, outputDir} = platform
  console.log(`assetsCopy platform: ${platformName}, output: ${outputDir}`)

  const buildDir = path.resolve(distDir, outputDir)
  const assetsOutputDir = path.resolve(buildDir, 'assets')
  const remoteRootOutputDir = path.resolve(buildDir, remoteAssetsDirName)
  const remoteAssetsOutputDir = path.resolve(remoteRootOutputDir, 'assets')

  if (!fs.existsSync(assetsSourceDir)) {
    throw new Error(`Assets folder not found: ${assetsSourceDir}`)
  }

  if (!fs.existsSync(buildDir)) {
    throw new Error(`Build folder not found: ${buildDir}`)
  }

  if (fs.existsSync(remoteRootOutputDir)) {
    fs.rmSync(remoteRootOutputDir, {recursive: true, force: true})
  }

  fs.mkdirSync(assetsOutputDir, {recursive: true})

  // Если платформы нет в assetsCopyConfig, копирует assets полностью без фильтрации.
  if (!shouldUseRemoteAssets(platformName)) {
    console.log(`assetsCopy remote filter disabled: ${platformName}`)
    copyDir(assetsSourceDir, assetsOutputDir)
    console.log('assets copied:', assetsOutputDir)
    return
  }

  console.log(`assetsCopy remote filter enabled: ${platformName}`)

  // При включённой remote-логике сначала копирует общие ассеты без динамических папок.
  copyAssetsWithoutLevels(assetsOutputDir)

  // Динамические папки наполняются отдельно, чтобы local попал в assets, а remote в remote-assets.
  const remoteLevelsCount = copyDynamicLevels(assetsOutputDir, remoteAssetsOutputDir)
  const remoteAssetsCount = remoteLevelsCount

  // Если remote-файлов не оказалось, удаляет пустую remote-assets.
  if (!remoteAssetsCount && fs.existsSync(remoteRootOutputDir)) {
    fs.rmSync(remoteRootOutputDir, {recursive: true, force: true})
  }

  console.log('assets copied:', assetsOutputDir)

  if (remoteAssetsCount) {
    console.log('remote assets copied:', remoteAssetsOutputDir)
  }
}

module.exports = {
  copyAssetsToBuild,
}
