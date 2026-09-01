/**
 * Открывает редактор для выбранного уровня в отдельной вкладке.
 */

// Открывает редактор с идентификатором выбранного уровня.
const openSokobanLevelEditor = (levelId) => {
  const editorUrl = new URL('/tools/sokoban-level-editor/', window.location.origin)
  editorUrl.searchParams.set('level', levelId)
  window.open(editorUrl, '_blank', 'noopener')
}

export {openSokobanLevelEditor}
