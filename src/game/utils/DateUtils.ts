import i18next from 'i18next'

// Форматирует игровое время для отображения в интерфейсе.

export default class DateUtils {
  // Форматирует длительность с явной подписью часов после первого часа.
  static formatDuration(timeSeconds: number | null) {
    if (timeSeconds === null || !Number.isFinite(timeSeconds) || timeSeconds < 0) return '—'
    const {h, m, s} = DateUtils.formatTime(Math.floor(timeSeconds))
    return timeSeconds >= 3600 ? `${h}:${m}:${s} ${i18next.t('sokoban.hoursShort')}` : `${m}:${s}`
  }

  // Разделяет количество секунд на часы, минуты и секунды.
  static formatTime = (timeSeconds: number) => {
    const hours = Math.floor(timeSeconds / 3600)
    const minutes = Math.floor((timeSeconds % 3600) / 60)
    const seconds = timeSeconds % 60

    return {
      h: String(hours).padStart(2, '0'),
      m: String(minutes).padStart(2, '0'),
      s: String(seconds).padStart(2, '0'),
    }
  }
}
