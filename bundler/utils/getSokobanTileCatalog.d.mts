/**
 * Описывает JavaScript-каталог исходных тайлов Sokoban для TypeScript-потребителей.
 */

type SokobanTileCatalog = {
  atlas: string
  groups: Record<string, string[]>
  sources: Record<string, Record<string, string>>
  defaults: Record<string, string>
}

// Возвращает каталог доступных тайлов Sokoban.
declare const getSokobanTileCatalog: (projectRoot: string) => SokobanTileCatalog

// Возвращает безопасный путь к исходному изображению тайла.
declare const getSokobanTileSourcePath: (projectRoot: string, role: string, texture: string) => string | null

// Возвращает группы декора по папкам исходных изображений.
declare const getSokobanDecorGroups: (projectRoot: string) => {name: string; textures: string[]}[]

export {
  getSokobanDecorGroups,
  getSokobanTileCatalog,
  getSokobanTileSourcePath,
}

export type {
  SokobanTileCatalog,
}
