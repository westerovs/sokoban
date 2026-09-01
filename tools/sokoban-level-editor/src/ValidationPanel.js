/**
 * Отображает ошибки и предупреждения проверки редактируемого уровня.
 */

export default class ValidationPanel {
  #element

  // Создаёт экземпляр и сохраняет переданные зависимости.
  constructor(element) {
    this.#element = element
  }

  // Обновляет состояние через операцию `update`.
  update(validation) {
    if (validation.issues.length === 0) {
      this.#element.dataset.state = 'valid'
      this.#element.textContent = 'Структура уровня корректна'
      return
    }

    this.#element.dataset.state = validation.isValid ? 'warning' : 'error'
    const list = document.createElement('ul')
    list.append(...validation.issues.map((issue) => this.#createIssue(issue)))
    this.#element.replaceChildren(list)
  }

  // Создаёт данные или представление для операции `createIssue`.
  #createIssue(issue) {
    const item = document.createElement('li')
    item.dataset.type = issue.type
    item.textContent = issue.message
    return item
  }
}
