import type {AppearanceCatalog, EditorBrush, LevelAppearance} from './editorTypes.js'

/**
 * Управляет неизменяемым состоянием визуальных переопределений тайлов.
 */

// Выполняет отдельную операцию `cloneAppearance`.
const cloneAppearance = (appearance: LevelAppearance): LevelAppearance => structuredClone(appearance)

// Возвращает оформление выбранного уровня из общего каталога.
const getLevelAppearance = (appearance: AppearanceCatalog, levelId: string) => {
  return appearance.levels[levelId] ?? {}
}

// Удаляет опустевший визуальный слой из оформления уровня.
const removeEmptyRole = (appearance: LevelAppearance, role: keyof LevelAppearance) => {
  if (appearance[role] && Object.keys(appearance[role]).length === 0) delete appearance[role]
}

// Назначает выбранную текстуру клетке или убирает избыточное значение по умолчанию.
const setTileAppearance = (appearance: LevelAppearance, brush: EditorBrush, positionKey: string, defaults: Record<string, string>) => {
  const nextAppearance = cloneAppearance(appearance)
  const role = brush.role as Exclude<keyof LevelAppearance, 'decorOffsets'>
  const texture = brush.texture as string
  const roleAppearance = (nextAppearance[role] ??= {})

  if (texture === defaults[role] && role !== 'decor' && role !== 'ground') delete roleAppearance[positionKey]
  else roleAppearance[positionKey] = texture
  removeEmptyRole(nextAppearance, role)
  return nextAppearance
}

// Удаляет визуальные переопределения указанных слоёв в одной клетке.
const removeTileAppearances = (appearance: LevelAppearance, positionKey: string, roles: readonly string[]) => {
  const nextAppearance = cloneAppearance(appearance)
  const removedRoles = roles.includes('decor') ? [...roles, 'decorOffsets'] : roles
  removedRoles.forEach((value) => {
    const role = value as keyof LevelAppearance
    delete nextAppearance[role]?.[positionKey]
    removeEmptyRole(nextAppearance, role)
  })
  return nextAppearance
}

export {
  getLevelAppearance,
  removeTileAppearances,
  setTileAppearance,
}
