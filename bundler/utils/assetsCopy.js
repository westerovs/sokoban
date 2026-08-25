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
 * - levels наполняется динамически по src/game/gameConfig/levels.json
 * - уровни с isRemote: false копируются в assets/levels
 * - уровни с isRemote: true копируются в remote-assets/assets/levels
 *
 * Структура исходников при копировании сохраняется.
 * Если remote-ассетов нет, папка remote-assets удаляется после копирования.
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')
const assetsSourceDir = path.resolve(projectRoot, 'public', 'assets')
const distDir = path.resolve(projectRoot, 'dist')

const levelsConfigPath = path.resolve(projectRoot, 'src', 'game', 'gameConfig', 'levels.json')
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
    // levels собирается отдельно по levels.json, чтобы разделить local и remote уровни.
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

// Получает числовой индекс уровня из имени вида level125_anagrams.
const getLevelIndex = (levelName) => {
  const match = levelName.match(/^level(\d+)/)
  
  if (!match) {
    throw new Error(`Invalid level name: ${levelName}`)
  }
  
  return match[1]
}

// Копирует фон одного уровня в указанную папку levels.
const copyLevelAssets = (levelName, levelData, levelsOutputDir) => {
  const sourceLevelName = levelData.levelName
  
  if (!sourceLevelName) {
    throw new Error(`Missing levelName in ${levelName}`)
  }
  
  const levelIndex = getLevelIndex(sourceLevelName)
  const backgroundName = levelData.back || `back_lv${levelIndex}`
  
  copyFile(
    path.resolve(levelsSourceDir, 'backgrounds', `${backgroundName}.webp`),
    path.resolve(levelsOutputDir, 'backgrounds', `${backgroundName}.webp`)
  )
}

// Копирует уровни по levels.json и разделяет их на local и remote.
const copyDynamicLevels = (assetsOutputDir, remoteAssetsOutputDir) => {
  if (!fs.existsSync(levelsConfigPath)) {
    throw new Error(`Levels config not found: ${levelsConfigPath}`)
  }
  
  const levelsConfig = JSON.parse(fs.readFileSync(levelsConfigPath, 'utf8'))
  const levelsOutputDir = path.resolve(assetsOutputDir, 'levels')
  const remoteLevelsOutputDir = path.resolve(remoteAssetsOutputDir, 'levels')
  
  fs.mkdirSync(path.resolve(levelsOutputDir, 'backgrounds'), {recursive: true})
  
  let remoteLevelsCount = 0
  
  for (const levelName in levelsConfig) {
    const levelData = levelsConfig[levelName]
    
    // isRemote: true выносит уровень в remote-assets, чтобы не класть его в основной билд.
    if (levelData.isRemote) {
      copyLevelAssets(levelName, levelData, remoteLevelsOutputDir)
      remoteLevelsCount++
      console.log(`assetsCopy remote level copied: ${levelName} / ${levelData.levelName}`)
      continue
    }
    
    // isRemote: false оставляет уровень внутри обычной папки assets.
    copyLevelAssets(levelName, levelData, levelsOutputDir)
    console.log(`assetsCopy level copied: ${levelName} / ${levelData.levelName}`)
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
  copyAssetsToBuild
}
