/**
 * Управляет неизменяемым состоянием визуальных переопределений тайлов.
 */

// Выполняет отдельную операцию `cloneAppearance`.
const cloneAppearance = (appearance) => structuredClone(appearance)

// Возвращает данные, за которые отвечает операция `getLevelAppearance`.
const getLevelAppearance = (appearance, levelId) => {
  return appearance.levels[levelId] ?? {}
}

// Удаляет или очищает состояние через операцию `removeEmptyObjects`.
const removeEmptyObjects = (appearance, levelId, role) => {
  if (!appearance.levels[levelId]?.[role]) return
  if (Object.keys(appearance.levels[levelId][role]).length === 0) delete appearance.levels[levelId][role]
  if (Object.keys(appearance.levels[levelId]).length === 0) delete appearance.levels[levelId]
}

// Обновляет состояние через операцию `setTileAppearance`.
const setTileAppearance = (appearance, levelId, brush, positionKey, defaults) => {
  const nextAppearance = cloneAppearance(appearance)
  const levelAppearance = (nextAppearance.levels[levelId] ??= {})
  const roleAppearance = (levelAppearance[brush.role] ??= {})

  if (brush.texture === defaults[brush.role]) delete roleAppearance[positionKey]
  else roleAppearance[positionKey] = brush.texture
  removeEmptyObjects(nextAppearance, levelId, brush.role)
  return nextAppearance
}

// Удаляет или очищает состояние через операцию `removeTileAppearances`.
const removeTileAppearances = (appearance, levelId, positionKey, roles) => {
  const nextAppearance = cloneAppearance(appearance)
  roles.forEach((role) => {
    delete nextAppearance.levels[levelId]?.[role]?.[positionKey]
    removeEmptyObjects(nextAppearance, levelId, role)
  })
  return nextAppearance
}

export {
  getLevelAppearance,
  removeTileAppearances,
  setTileAppearance,
}
