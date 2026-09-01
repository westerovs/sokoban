const cloneAppearance = (appearance) => structuredClone(appearance)

const getLevelAppearance = (appearance, levelId) => {
  return appearance.levels[levelId] ?? {}
}

const removeEmptyObjects = (appearance, levelId, role) => {
  if (Object.keys(appearance.levels[levelId][role]).length === 0) delete appearance.levels[levelId][role]
  if (Object.keys(appearance.levels[levelId]).length === 0) delete appearance.levels[levelId]
}

const setTileAppearance = (appearance, levelId, brush, positionKey, defaults) => {
  const nextAppearance = cloneAppearance(appearance)
  const levelAppearance = (nextAppearance.levels[levelId] ??= {})
  const roleAppearance = (levelAppearance[brush.role] ??= {})

  if (brush.texture === defaults[brush.role]) delete roleAppearance[positionKey]
  else roleAppearance[positionKey] = brush.texture
  removeEmptyObjects(nextAppearance, levelId, brush.role)
  return nextAppearance
}

export {
  getLevelAppearance,
  setTileAppearance,
}
