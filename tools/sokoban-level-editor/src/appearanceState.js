/**
 * Управляет неизменяемым состоянием визуальных переопределений тайлов.
 */

// Выполняет отдельную операцию `cloneAppearance`.
const cloneAppearance = (appearance) => structuredClone(appearance)

// Возвращает оформление выбранного уровня из общего каталога.
const getLevelAppearance = (appearance, levelId) => {
  return appearance.levels[levelId] ?? {}
}

// Удаляет опустевший визуальный слой из оформления уровня.
const removeEmptyRole = (appearance, role) => {
  if (appearance[role] && Object.keys(appearance[role]).length === 0) delete appearance[role]
}

// Назначает выбранную текстуру клетке или убирает избыточное значение по умолчанию.
const setTileAppearance = (appearance, brush, positionKey, defaults) => {
  const nextAppearance = cloneAppearance(appearance)
  const roleAppearance = (nextAppearance[brush.role] ??= {})

  if (brush.texture === defaults[brush.role]) delete roleAppearance[positionKey]
  else roleAppearance[positionKey] = brush.texture
  removeEmptyRole(nextAppearance, brush.role)
  return nextAppearance
}

// Удаляет визуальные переопределения указанных слоёв в одной клетке.
const removeTileAppearances = (appearance, positionKey, roles) => {
  const nextAppearance = cloneAppearance(appearance)
  roles.forEach((role) => {
    delete nextAppearance[role]?.[positionKey]
    removeEmptyRole(nextAppearance, role)
  })
  return nextAppearance
}

export {getLevelAppearance, removeTileAppearances, setTileAppearance}
