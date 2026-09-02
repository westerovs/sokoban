import fs from 'node:fs'
import path from 'node:path'

/**
 * Собирает каталог настоящих тайлов Sokoban по структуре исходных папок ресурсов.
 */

const TILE_GROUP_DIRECTORIES = Object.freeze({
  wall: 'walls', // Папка вариантов стен
  floor: 'floors', // Папка вариантов пола
  box: 'boxes', // Папка вариантов ящиков
  target: 'targets', // Папка вариантов целей
})

const TILE_FILE_PATTERN = /\.png$/i
const TILE_SOURCE_ROUTE = '/__sokoban-level-editor/tile'

// Возвращает имя текстуры без расширения файла.
const getTextureName = (fileName) => path.basename(fileName, path.extname(fileName))

// Возвращает отсортированные имена PNG-текстур из папки.
const getTextureNames = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) return []

  return fs
    .readdirSync(directoryPath, {withFileTypes: true})
    .filter((entry) => entry.isFile() && TILE_FILE_PATTERN.test(entry.name))
    .map((entry) => getTextureName(entry.name))
    .sort((first, second) => first.localeCompare(second, 'en', {numeric: true}))
}

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

// Безопасно разрешает путь к исходному тайлу редактора.
const getSokobanTileSourcePath = (projectRoot, role, texture) => {
  const directory = TILE_GROUP_DIRECTORIES[role]
  if (!directory || getTextureName(texture) !== texture) return null

  const catalog = getSokobanTileCatalog(projectRoot)
  if (!catalog.groups[role].includes(texture)) return null
  return path.resolve(projectRoot, 'raw-assets', 'ui', 'levelUi{m}{tps}', 'tiles', directory, `${texture}.png`)
}

export {getSokobanTileCatalog, getSokobanTileSourcePath}
