import {loadEditorLibrary} from './editorApi.js'
import type {LibraryData} from './editorTypes.js'

// Управляет выбором самостоятельных уровней и диалогом сохранения нового XSB-файла.

// Возвращает обязательный элемент панели библиотеки.
const getElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id)
  if (!element) throw new Error(`[LevelLibraryPanel]: element ${id} is missing`)
  return element as T
}

export default class LevelLibraryPanel {
  #data: LibraryData = {directories: [], levels: [], usedIds: []}
  #selectedPath = ''
  #isSaving = false
  #dialog = getElement<HTMLDialogElement>('save-as-dialog')
  #form = getElement<HTMLFormElement>('save-as-form')
  #collection = getElement<HTMLSelectElement>('save-as-collection')
  #directory = getElement<HTMLSelectElement>('save-as-directory')
  #name = getElement<HTMLInputElement>('save-as-name')
  #error = getElement<HTMLParagraphElement>('save-as-error')
  #cancel = getElement<HTMLButtonElement>('save-as-cancel')
  #submit = getElement<HTMLButtonElement>('save-as-submit')
  #onSave: (directory: string, name: string) => Promise<void>

  // Сохраняет обработчики выбора, записи и уведомлений.
  constructor(onSave: (directory: string, name: string) => Promise<void>) {
    this.#onSave = onSave
    this.#init()
  }

  // Сообщает, открыт ли диалог для блокировки сочетаний редактора.
  get isOpen() {
    return this.#dialog.open
  }

  // Обновляет список после загрузки или успешного сохранения.
  setData(data: LibraryData) {
    this.#data = data
  }

  // Отмечает открытый файл или очищает выбор при переходе к игровому уровню.
  selectPath(libraryPath = '') {
    this.#selectedPath = libraryPath
    const output = getElement<HTMLOutputElement>('library-current-path')
    output.hidden = !libraryPath
    output.textContent = libraryPath ? `Библиотека: ${libraryPath}` : ''
  }

  // Загружает свежие папки и предлагает свободное имя в текущей коллекции.
  async openSaveAs() {
    if (this.#dialog.open) return
    this.#error.textContent = ''
    this.#dialog.showModal()
    this.#setSaving(true)
    try {
      this.setData(await loadEditorLibrary())
      this.#populateCollections()
    } catch (error) {
      this.#error.textContent = error instanceof Error ? error.message : String(error)
    } finally {
      this.#setSaving(false)
      this.#name.focus()
      this.#name.select()
    }
  }

  // Подключает действия библиотеки и формы сохранения.
  #init() {
    this.#collection.addEventListener('change', () => this.#populateDirectories())
    this.#directory.addEventListener('change', () => this.#updatePath())
    this.#name.addEventListener('input', () => this.#updatePath())
    this.#form.addEventListener('submit', (event) => {
      event.preventDefault()
      void this.#save()
    })
    this.#cancel.addEventListener('click', () => this.#dialog.close())
    this.#dialog.addEventListener('cancel', (event) => {
      if (this.#isSaving) event.preventDefault()
    })
  }

  // Заполняет коллекции из существующих разделов на диске.
  #populateCollections() {
    const collections = [...new Set(this.#data.directories.map((directory) => directory.collection))]
    this.#collection.replaceChildren(...collections.map((collection) => new Option(collection, collection)))
    const preferred = this.#selectedPath.split('/')[0] || 'custom'
    if (collections.includes(preferred)) this.#collection.value = preferred
    this.#populateDirectories()
  }

  // Заполняет разделы выбранной коллекции и предлагает очередной идентификатор автора.
  #populateDirectories() {
    const directories = this.#data.directories.filter((directory) => directory.collection === this.#collection.value)
    this.#directory.replaceChildren(...directories.map((directory) => new Option(directory.section, directory.path)))
    const selected = this.#selectedPath.slice(0, this.#selectedPath.lastIndexOf('/'))
    if (directories.some((directory) => directory.path === selected)) this.#directory.value = selected
    this.#suggestName(directories[0]?.authorId ?? 'level')
    this.#updatePath()
  }

  // Предлагает свободное имя, сохраняя регистр существующих идентификаторов автора.
  #suggestName(authorId: string) {
    const existingId = this.#data.usedIds.find((id) => id.toLowerCase().startsWith(`${authorId.toLowerCase()}-`))
    const prefix = existingId?.slice(0, authorId.length) ?? authorId
    const usedIds = new Set(this.#data.usedIds.map((id) => id.toLowerCase()))
    let index = 1
    while (usedIds.has(`${prefix}-${String(index).padStart(3, '0')}`.toLowerCase())) index++
    this.#name.value = `${prefix}-${String(index).padStart(3, '0')}`
  }

  // Показывает итоговый путь без интерпретации имени как HTML.
  #updatePath() {
    getElement('save-as-path').textContent = `levels/library/${this.#directory.value}/${this.#name.value}.xsb`
    this.#error.textContent = ''
  }

  // Блокирует повторную запись и закрытие формы во время запроса.
  #setSaving(value: boolean) {
    this.#isSaving = value
    for (const element of [this.#collection, this.#directory, this.#name, this.#cancel, this.#submit]) element.disabled = value
    this.#submit.disabled = value || !this.#data.directories.length
  }

  // Сохраняет новый файл, оставляя форму и карту при любой ошибке.
  async #save() {
    if (this.#isSaving) return
    this.#setSaving(true)
    try {
      await this.#onSave(this.#directory.value, this.#name.value)
      this.#dialog.close()
    } catch (error) {
      this.#error.textContent = error instanceof Error ? error.message : String(error)
    } finally {
      this.#setSaving(false)
    }
  }
}
