import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import prettier from 'prettier'
import {getSokobanTileCatalog} from './getSokobanTileCatalog.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..', '..')
const outputPath = path.resolve(projectRoot, 'src', 'game', 'generatedAssets', 'sokobanTileCatalog.js')

const createSource = (catalog) => {
  return `/** Автоматически созданный каталог тайлов Sokoban. Не редактировать вручную. */
const SOKOBAN_TILE_CATALOG = Object.freeze(${JSON.stringify(catalog)})

export {
  SOKOBAN_TILE_CATALOG,
}
`
}

const expandExportBlock = (source) => {
  return source.replace(
    'export {SOKOBAN_TILE_CATALOG}',
    `export {
  SOKOBAN_TILE_CATALOG,
}`,
  )
}

const generateSokobanTileCatalog = async () => {
  const catalog = getSokobanTileCatalog(projectRoot)
  const prettierConfig = await prettier.resolveConfig(outputPath)
  const formattedSource = await prettier.format(createSource(catalog), {...prettierConfig, parser: 'babel'})
  const source = expandExportBlock(formattedSource)

  fs.mkdirSync(path.dirname(outputPath), {recursive: true})
  fs.writeFileSync(outputPath, source)
}

export {
  generateSokobanTileCatalog,
}
