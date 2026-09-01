const EDITOR_API_URL = '/__sokoban-level-editor/data'

const parseResponse = async (response) => {
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`)
  return data
}

const loadEditorData = async () => {
  return await parseResponse(await fetch(EDITOR_API_URL, {cache: 'no-store'}))
}

const saveEditorAppearance = async (appearance) => {
  const response = await fetch(EDITOR_API_URL, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(appearance),
  })

  return await parseResponse(response)
}

const copyLevelAppearance = async (levelId, appearance) => {
  const data = {levelId, appearance: appearance.levels[levelId] ?? {}}
  const text = JSON.stringify(data, null, 2)
  if (navigator.clipboard?.writeText) return await navigator.clipboard.writeText(text)

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.append(textArea)
  textArea.select()
  document.execCommand('copy')
  textArea.remove()
}

export {
  copyLevelAppearance,
  loadEditorData,
  saveEditorAppearance,
}
