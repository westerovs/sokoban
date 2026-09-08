import {mkdirSync, renameSync} from 'node:fs'
import {findAssets, path, stripTags} from '@assetpack/core'

// Сохраняет исходные папки атласов в результатах AssetPack и его манифесте.

// Выбирает исходные папки, которые упаковщик преобразовал в атласы.
const isAtlasFolder = (asset) =>
  asset.isFolder && asset.metaData.tps && asset.transformChildren.length > 0 && asset.state !== 'deleted' && !asset.skip

// Перемещает готовый файл и обновляет путь в графе ресурсов для манифеста и кэша.
const moveAtlasFile = (asset, outputDirectory, movedPaths) => {
  const outputPath = path.join(outputDirectory, asset.filename)
  if (asset.path === outputPath) return

  if (!movedPaths.has(asset.path)) {
    mkdirSync(outputDirectory, {recursive: true})
    renameSync(asset.path, outputPath)
    movedPaths.add(asset.path)
  }
  asset.path = outputPath
}

// Размещает все форматы, разрешения и страницы атласа внутри его исходной папки.
const preserveAtlasFolder = (folder, pipeSystem, movedPaths) => {
  const relativeDirectory = stripTags(path.relative(pipeSystem.entryPath, folder.path))
  const outputDirectory = path.join(pipeSystem.outputPath, relativeDirectory)
  folder.getFinalTransformedChildren().forEach((asset) => moveAtlasFile(asset, outputDirectory, movedPaths))
}

const atlasFolders = {
  name: 'atlas-folders',
  defaultOptions: {},

  // Восстанавливает папки до формирования манифеста, включая повторные сборки из кэша.
  finish(rootAsset, _options, pipeSystem) {
    const movedPaths = new Set()
    findAssets(isAtlasFolder, rootAsset).forEach((folder) => preserveAtlasFolder(folder, pipeSystem, movedPaths))
  },
}

export {
  atlasFolders,
}
