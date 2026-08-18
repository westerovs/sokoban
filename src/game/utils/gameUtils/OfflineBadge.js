import i18next from 'i18next'

export default class OfflineBadge {
  static #instance
  #badge = null
  
  static checkAndShow() {
    if (navigator.onLine) return false
    
    if (!OfflineBadge.#instance) {
      OfflineBadge.#instance = new OfflineBadge()
    }
    OfflineBadge.#instance.#showBadge()
    return true
  }
  
  #showBadge = () => {
    this.#removeBadge()
    this.#badge = this.#createBadge()
    document.body.appendChild(this.#badge)
    
    setTimeout(this.#removeBadge, 6000)
    window.addEventListener('online', this.#removeBadge, {once: true})
  }
  
  #createBadge = () => {
    const badge = document.createElement('div')
    badge.className = 'offline-badge'
    const p = document.createElement('p')
    p.textContent = i18next.t('saveError')
    badge.appendChild(p)
    return badge
  }
  
  #removeBadge = () => {
    if (this.#badge) {
      this.#badge.remove()
      this.#badge = null
    }
  }
}
