import i18next from 'i18next'

// Показывает временное уведомление об отсутствии сетевого подключения.

export default class OfflineBadge {
  static #instance: OfflineBadge | null = null
  #badge: HTMLDivElement | null = null

  // Проверяет подключение и показывает уведомление в офлайн-режиме.
  static checkAndShow() {
    if (navigator.onLine) return false

    if (!OfflineBadge.#instance) {
      OfflineBadge.#instance = new OfflineBadge()
    }
    OfflineBadge.#instance.#showBadge()
    return true
  }

  // Создаёт и показывает уведомление, затем планирует его удаление.
  #showBadge = () => {
    this.#removeBadge()
    this.#badge = this.#createBadge()
    document.body.appendChild(this.#badge)

    setTimeout(this.#removeBadge, 6000)
    window.addEventListener('online', this.#removeBadge, {once: true})
  }

  // Создаёт DOM-элемент уведомления.
  #createBadge = () => {
    const badge = document.createElement('div')
    badge.className = 'offline-badge'
    const p = document.createElement('p')
    p.textContent = i18next.t('saveError')
    badge.appendChild(p)
    return badge
  }

  // Удаляет текущее уведомление со страницы.
  #removeBadge = () => {
    if (this.#badge) {
      this.#badge.remove()
      this.#badge = null
    }
  }
}
