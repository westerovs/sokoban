import fs from 'node:fs'
import path from 'node:path'

/**
 * Собирает каталог настоящих тайлов Sokoban по структуре исходных папок ресурсов.
 */

const TILE_GROUP_DIRECTORIES = Object.freeze({
  wall: 'walls', // Папка вариантов стен
  decor: 'decor', // Папка декоративных стен
  ground: 'ground', // Папка вариантов пола
  box: 'boxes', // Папка вариантов ящиков
  target: 'targets', // Папка вариантов целей
})

const TILE_FILE_PATTERN = /\.png$/i
const TILE_SOURCE_ROUTE = '/__sokoban-level-editor/tile'

// Возвращает имя текстуры без расширения файла.
const getTextureName = (fileName) => path.basename(fileName, path.extname(fileName))

// Рекурсивно собирает PNG-текстуры из папки и всех её подпапок.
const readTextureFiles = (rootPath, currentPath = rootPath) => {
  if (!fs.existsSync(currentPath)) return []

  return fs.readdirSync(currentPath, {withFileTypes: true}).flatMap((entry) => {
    const entryPath = path.join(currentPath, entry.name)
    if (entry.isDirectory()) return readTextureFiles(rootPath, entryPath)
    if (!entry.isFile() || !TILE_FILE_PATTERN.test(entry.name)) return []

    return [
      {
        texture: getTextureName(entry.name),
        filePath: entryPath,
        relativePath: path.relative(rootPath, entryPath),
      },
    ]
  })
}

// Проверяет уникальность коротких имён, используемых TexturePacker в атласе.
const getTextureFiles = (directoryPath) => {
  const files = readTextureFiles(directoryPath)
  const fileByTexture = new Map()

  files.forEach((file) => {
    const existing = fileByTexture.get(file.texture)
    if (!existing) {
      fileByTexture.set(file.texture, file)
      return
    }

    throw new Error(
      `[SokobanTileCatalog]: duplicate texture '${file.texture}': ${existing.relativePath} and ${file.relativePath}`,
    )
  })

  return files.sort((first, second) => first.texture.localeCompare(second.texture, 'en', {numeric: true}))
}

// Возвращает отсортированные имена PNG-текстур из папки и её подпапок.
const getTextureNames = (directoryPath) => getTextureFiles(directoryPath).map(({texture}) => texture)

// Выбирает нумерованную первую текстуру роли или первый найденный вариант.
const getDefaultTexture = (role, textures) => {
  const numberedDefault = `${role}1`
  return textures.includes(numberedDefault) ? numberedDefault : textures[0]
}

// Проверяет, что для каждой поддерживаемой роли найден хотя бы один тайл.
const validateTileGroups = (groups) => {
  Object.entries(groups).forEach(([role, textures]) => {
    if (textures.length === 0) throw new Error(`[SokobanTileCatalog]: no textures found for ${role}`)
  })
}

// Формирует полный каталог тайлов для игры и редактора.
const getSokobanTileCatalog = (projectRoot) => {
  const tilesDirectory = path.resolve(projectRoot, 'raw-assets', 'ui', 'levelUi{m}{tps}', 'tiles')
  const groups = Object.fromEntries(
    Object.entries(TILE_GROUP_DIRECTORIES).map(([role, directory]) => {
      return [role, getTextureNames(path.join(tilesDirectory, directory))]
    }),
  )

  validateTileGroups(groups)
  return {
    atlas: '/assets/ui/levelUi.webp.json',
    groups,
    sources: Object.fromEntries(
      Object.entries(groups).map(([role, textures]) => {
        return [role, Object.fromEntries(textures.map((texture) => [texture, `${TILE_SOURCE_ROUTE}/${role}/${texture}.png`]))]
      }),
    ),
    defaults: Object.fromEntries(Object.entries(groups).map(([role, textures]) => [role, getDefaultTexture(role, textures)])),
  }
}

// Безопасно разрешает путь к исходному тайлу редактора, включая вложенные папки.
const getSokobanTileSourcePath = (projectRoot, role, texture) => {
  const directory = TILE_GROUP_DIRECTORIES[role]
  if (!directory || getTextureName(texture) !== texture) return null

  const directoryPath = path.resolve(projectRoot, 'raw-assets', 'ui', 'levelUi{m}{tps}', 'tiles', directory)
  const file = getTextureFiles(directoryPath).find((entry) => entry.texture === texture)
  return file?.filePath ?? null
}

export {getSokobanTileCatalog, getSokobanTileSourcePath}
