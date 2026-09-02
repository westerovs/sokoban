import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const formatDateRu = date => {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  
  return `${dd}.${mm}.${yyyy} ${hh}:${min}:${ss}`
}

const getPackageJson = () => {
  const packageJsonPath = path.resolve(__dirname, '../../package.json')
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
}

const generateBuildMeta = () => {
  const pkg = getPackageJson()
  const buildDate = formatDateRu(new Date())
  
  const buildMetaFile = path.resolve(__dirname, '../../src/game/generatedAssets/buildMeta.ts')
  
  fs.writeFileSync(
    buildMetaFile,
    `// АВТОГЕНЕРИРУЕМЫЙ ФАЙЛ. НЕ РЕДАКТИРОВАТЬ
const BUILD_VERSION = '${buildDate}'
const PACKAGE_VERSION = '${pkg.version}'
const CACHE_VERSION = '${pkg.version}-${Date.now()}'
const GAME_NAME = '${pkg.name}'

export {
  BUILD_VERSION,
  CACHE_VERSION,
  GAME_NAME,
  PACKAGE_VERSION,
}
`
  )
}

export {generateBuildMeta}
