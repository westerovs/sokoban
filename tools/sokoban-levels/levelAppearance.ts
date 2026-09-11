import {toRuntimeMap} from './xsbFormat.mjs'

// Проверяет оформление XSB-карт общими правилами сборщика и редактора библиотеки.

const appearanceRoles = Object.freeze(['wall', 'decor', 'ground', 'box', 'target']) // Поддерживаемые слои оформления
const positionKeyPattern = /^(0|[1-9]\d*):(0|[1-9]\d*)$/ // Формат координат клетки без ведущих нулей
const missingDecorTexture = 'd_empty' // Текстура для отсутствующего декора

type AppearanceLevel = {id: string; map: string[]}
type TileCatalog = {groups: Record<string, string[]>}
type MissingDecorReplacement = {positionKey: string; texture: string}

// Проверяет соответствие слоя типу клетки карты.
const isAppearanceRoleCell = (role: string, symbol?: string) => {
  if (!symbol) return false
  if (role === 'wall' || role === 'decor') return symbol === '#'
  if (role === 'ground') return Boolean(symbol) && symbol !== '_'
  if (role === 'box') return '$-'.includes(symbol)
  if (role === 'target') return '.-*'.includes(symbol)
  return false
}

// Проверяет координаты оформления и соответствие клетки выбранному слою.
const validateAppearancePosition = (level: AppearanceLevel, role: string, positionKey: string) => {
  if (!positionKeyPattern.test(positionKey)) throw new Error(`${level.id}: недопустимая координата оформления ${positionKey}`)
  const [x, y] = positionKey.split(':').map(Number)
  const symbol = toRuntimeMap(level.map)[y]?.[x]
  if (!isAppearanceRoleCell(role, symbol)) {
    throw new Error(`${level.id}: оформление ${role} нельзя применить к клетке ${positionKey}`)
  }
}

// Проверяет координаты и текстуры одного слоя оформления.
const validateAppearanceRole = (level: AppearanceLevel, role: string, overrides: unknown, tileCatalog: TileCatalog) => {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error(`${level.id}: оформление ${role} должно быть объектом`)
  }
  Object.entries(overrides).forEach(([positionKey, texture]) => {
    validateAppearancePosition(level, role, positionKey)
    if (!tileCatalog.groups[role]?.includes(texture)) {
      throw new Error(`${level.id}: текстура оформления ${texture} не входит в каталог ${role}`)
    }
  })
}

// Проверяет формат оформления и все присутствующие слои карты.
const validateLevelAppearance = (level: AppearanceLevel, appearance: unknown, tileCatalog: TileCatalog) => {
  if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) {
    throw new Error(`${level.id}: оформление уровня должно быть объектом`)
  }
  const unknownRoles = Object.keys(appearance).filter((role) => role !== 'decorOffsets' && !appearanceRoles.includes(role))
  if (unknownRoles.length > 0) throw new Error(`${level.id}: неизвестный слой оформления ${unknownRoles[0]}`)
  appearanceRoles.forEach((role) => {
    const overrides = (appearance as Record<string, unknown>)[role]
    if (overrides !== undefined) validateAppearanceRole(level, role, overrides, tileCatalog)
  })
  validateDecorOffsets(level, appearance as Record<string, unknown>)
}

// Заменяет отсутствующие текстуры декора, не изменяя исходное оформление.
const replaceMissingDecorTextures = (appearance: unknown, tileCatalog: TileCatalog) => {
  if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) return {appearance, replacements: []}
  const decor = (appearance as Record<string, unknown>).decor
  if (!decor || typeof decor !== 'object' || Array.isArray(decor)) return {appearance, replacements: []}

  const availableTextures = tileCatalog.groups.decor ?? []
  const replacements: MissingDecorReplacement[] = Object.entries(decor).flatMap(([positionKey, texture]) => {
    return typeof texture === 'string' && !availableTextures.includes(texture) ? [{positionKey, texture}] : []
  })
  if (replacements.length === 0) return {appearance, replacements}

  const resolvedDecor: Record<string, unknown> = {...decor}
  replacements.forEach(({positionKey}) => (resolvedDecor[positionKey] = missingDecorTexture))
  return {appearance: {...appearance, decor: resolvedDecor}, replacements}
}

// Проверяет индивидуальные смещения существующего декора в логических пикселях.
const validateDecorOffsets = (level: AppearanceLevel, appearance: Record<string, unknown>) => {
  const offsets = appearance.decorOffsets
  if (offsets === undefined) return
  if (!offsets || typeof offsets !== 'object' || Array.isArray(offsets)) throw new Error(`${level.id}: неверные смещения декора`)
  Object.entries(offsets).forEach(([key, offset]) => {
    validateAppearancePosition(level, 'decor', key)
    if (!(appearance.decor as Record<string, string> | undefined)?.[key]) throw new Error(`${level.id}: нет декора в клетке ${key}`)
    if (
      !offset ||
      typeof offset !== 'object' ||
      Array.isArray(offset) ||
      Object.keys(offset).some((axis) => axis !== 'x' && axis !== 'y') ||
      !Number.isFinite(offset.x) ||
      !Number.isFinite(offset.y)
    ) {
      throw new Error(`${level.id}: смещение ${key} должно содержать числовые X и Y`)
    }
  })
}

export {
  replaceMissingDecorTextures,
  validateLevelAppearance,
}
