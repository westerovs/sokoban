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
 * Если платформа описана в assetsCopyConfig, копирование работает по правилам:
 * - общие ассеты копируются в assets без папки levels и без audio/speech
 * - levels наполняется динамически по public/assets/gameConfig/levels.json
 * - уровни с isRemote: false копируются в assets/levels
 * - уровни с isRemote: true копируются в remote-assets/assets/levels
 * - audio/speech наполняется по языковому конфигу платформы
 * - speech.local копируется в assets/audio/speech
 * - speech.remote копируется в remote-assets/assets/audio/speech
 *
 * Структура исходников при копировании сохраняется.
 * Если speech-папка указанного языка отсутствует, сборка не падает, язык просто пропускается.
 * Если remote-ассетов нет, папка remote-assets удаляется после копирования.
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..', '..')
const assetsSourceDir = path.resolve(projectRoot, 'public', 'assets')
const distDir = path.resolve(projectRoot, 'dist')

const levelsConfigPath = path.resolve(assetsSourceDir, 'gameConfig', 'levels.json')
const levelsSourceDir = path.resolve(assetsSourceDir, 'levels')
const remoteAssetsDirName = 'remote-assets'

// Описывает платформы, для которых ассеты делятся на local и remote.
const assetsCopyConfig = {
  yandex: {
    speech: {
      local: ['ru'],
      remote: ['en']
    }
  },
  
  crazyGames: {
    speech: {
      local: ['en'],
      remote: []
    }
  }
}

// Проверяет, нужно ли применять remote-логику для платформы.
const shouldUseRemoteAssets = (platformName) => !!assetsCopyConfig[platformName]

// Получает конфиг копирования ассетов для платформы.
const getPlatformConfig = (platformName) => assetsCopyConfig[platformName] || null

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

// Копирует папку конкретного языка speech в указанный assets output.
const copySpeechLanguage = (language, outputAssetsDir) => {
  const speechLanguageSourceDir = path.resolve(assetsSourceDir, 'audio', 'speech', language)
  
  if (!fs.existsSync(speechLanguageSourceDir)) {
    console.log(`assetsCopy speech skipped: ${language} / folder not found`)
    return false
  }
  
  copyDir(
    speechLanguageSourceDir,
    path.resolve(outputAssetsDir, 'audio', 'speech', language)
  )
  
  return true
}

// Копирует speech-языки по правилам платформы.
const copyDynamicSpeech = (platformConfig, assetsOutputDir, remoteAssetsOutputDir) => {
  const speechConfig = platformConfig.speech || {}
  const localLanguages = speechConfig.local || []
  const remoteLanguages = speechConfig.remote || []
  
  let remoteLanguagesCount = 0
  
  // Local-языки попадают в обычную папку assets/audio/speech.
  for (const language of localLanguages) {
    const isCopied = copySpeechLanguage(language, assetsOutputDir)
    
    if (isCopied) {
      console.log(`assetsCopy local speech copied: ${language}`)
    }
  }
  
  // Remote-языки попадают в remote-assets/assets/audio/speech.
  for (const language of remoteLanguages) {
    const isCopied = copySpeechLanguage(language, remoteAssetsOutputDir)
    
    if (isCopied) {
      remoteLanguagesCount++
      console.log(`assetsCopy remote speech copied: ${language}`)
    }
  }
  
  return remoteLanguagesCount
}

// Копирует audio без speech, потому что speech наполняется отдельно по языкам.
const copyAudioWithoutSpeech = (audioOutputDir) => {
  const audioSourceDir = path.resolve(assetsSourceDir, 'audio')
  
  if (!fs.existsSync(audioSourceDir)) {
    return
  }
  
  const entries = fs.readdirSync(audioSourceDir, {withFileTypes: true})
  
  for (const entry of entries) {
    if (entry.name === 'speech') {
      continue
    }
    
    const sourcePath = path.join(audioSourceDir, entry.name)
    const targetPath = path.join(audioOutputDir, entry.name)
    
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath)
      continue
    }
    
    copyFile(sourcePath, targetPath)
  }
}

// Копирует assets без levels и без audio/speech.
const copyAssetsWithoutLevels = (assetsOutputDir) => {
  const entries = fs.readdirSync(assetsSourceDir, {withFileTypes: true})
  
  for (const entry of entries) {
    // levels собирается отдельно по levels.json, чтобы разделить local и remote уровни.
    if (entry.name === 'levels') {
      continue
    }
    
    const sourcePath = path.join(assetsSourceDir, entry.name)
    const targetPath = path.join(assetsOutputDir, entry.name)
    
    // audio копируется отдельно, потому что speech зависит от языкового конфига платформы.
    if (entry.name === 'audio') {
      copyAudioWithoutSpeech(targetPath)
      continue
    }
    
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath)
      continue
    }
    
    copyFile(sourcePath, targetPath)
  }
}

// Получает числовой индекс уровня из имени spine вида level125_anagrams.
const getSpineLevelIndex = (spineName) => {
  const match = spineName.match(/^level(\d+)/)
  
  if (!match) {
    throw new Error(`Invalid spine name: ${spineName}`)
  }
  
  return match[1]
}

// Копирует все файлы одного уровня в указанную папку levels.
const copyLevelAssets = (levelName, levelData, levelsOutputDir) => {
  const {spineName} = levelData
  
  if (!spineName) {
    throw new Error(`Missing spineName in ${levelName}`)
  }
  
  const levelIndex = getSpineLevelIndex(spineName)
  
  copyFile(
    path.resolve(levelsSourceDir, 'backgrounds', `back_lv${levelIndex}.webp`),
    path.resolve(levelsOutputDir, 'backgrounds', `back_lv${levelIndex}.webp`)
  )
  
  copyFile(
    path.resolve(levelsSourceDir, 'gameLevels', `${spineName}.atlas`),
    path.resolve(levelsOutputDir, 'gameLevels', `${spineName}.atlas`)
  )
  
  copyFile(
    path.resolve(levelsSourceDir, 'gameLevels', `${spineName}.json`),
    path.resolve(levelsOutputDir, 'gameLevels', `${spineName}.json`)
  )
  
  copyFile(
    path.resolve(levelsSourceDir, 'gameLevels', `${spineName}.webp`),
    path.resolve(levelsOutputDir, 'gameLevels', `${spineName}.webp`)
  )
  
  copyFile(
    path.resolve(levelsSourceDir, 'hud', `hudData-${levelIndex}.json`),
    path.resolve(levelsOutputDir, 'hud', `hudData-${levelIndex}.json`)
  )
  
  copyFile(
    path.resolve(levelsSourceDir, 'hud', `hudData-${levelIndex}.png`),
    path.resolve(levelsOutputDir, 'hud', `hudData-${levelIndex}.png`)
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
  fs.mkdirSync(path.resolve(levelsOutputDir, 'gameLevels'), {recursive: true})
  fs.mkdirSync(path.resolve(levelsOutputDir, 'hud'), {recursive: true})
  
  let remoteLevelsCount = 0
  
  for (const levelName in levelsConfig) {
    const levelData = levelsConfig[levelName]
    
    // isRemote: true выносит уровень в remote-assets, чтобы не класть его в основной билд.
    if (levelData.isRemote) {
      copyLevelAssets(levelName, levelData, remoteLevelsOutputDir)
      remoteLevelsCount++
      console.log(`assetsCopy remote level copied: ${levelName} / ${levelData.spineName}`)
      continue
    }
    
    // isRemote: false оставляет уровень внутри обычной папки assets.
    copyLevelAssets(levelName, levelData, levelsOutputDir)
    console.log(`assetsCopy level copied: ${levelName} / ${levelData.spineName}`)
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
  
  const platformConfig = getPlatformConfig(platformName)
  
  console.log(`assetsCopy remote filter enabled: ${platformName}`)
  
  // При включённой remote-логике сначала копирует общие ассеты без динамических папок.
  copyAssetsWithoutLevels(assetsOutputDir)
  
  // Динамические папки наполняются отдельно, чтобы local попал в assets, а remote в remote-assets.
  const remoteLevelsCount = copyDynamicLevels(assetsOutputDir, remoteAssetsOutputDir)
  const remoteLanguagesCount = copyDynamicSpeech(platformConfig, assetsOutputDir, remoteAssetsOutputDir)
  const remoteAssetsCount = remoteLevelsCount + remoteLanguagesCount
  
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
