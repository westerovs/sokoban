// Форматирует игровое время для отображения в интерфейсе.

export default class DateUtils {
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
