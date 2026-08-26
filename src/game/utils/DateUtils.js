export default class DateUtils {
  static formatTime = (timeSeconds) => {
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
