import i18next from 'i18next'
import Locator from '../engine/Locator.ts'
import SdkManager from '../engine/SdkManager.js'
import type {Locales} from '../gameConfig/GameConfig.js'

// Инициализирует i18next и выбирает поддерживаемую локаль игры.

export default class LocaleManager {
  static locale = ''

  // Возвращает список доступных локалей.
  static get supportedLocales() {
    const locales = Locator.gameConfig.locales
    return locales ? Object.keys(locales) : []
  }

  // Запускает инициализацию локализации.
  static init = async () => {
    await LocaleManager.initializeI18n()
  }

  // Подготавливает ресурсы i18next и выбирает язык платформы.
  static initializeI18n = async () => {
    const gameConfig = Locator.gameConfig
    const locales = gameConfig.locales ?? {}

    const resources = Object.fromEntries(Object.entries(locales).map(([localeKey, translation]) => [localeKey, {translation}]))

    const locale = await SdkManager.getLang()
    const validatedLocale = LocaleManager.validate(locale, locales)

    LocaleManager.locale = validatedLocale

    await i18next.init({
      lng: validatedLocale,
      fallbackLng: 'en',
      resources,
    })
  }

  // Возвращает поддерживаемую локаль или безопасный резервный вариант.
  static validate(locale: string | null | undefined, locales: Locales) {
    const normLocale = (locale || '').toLowerCase().split('-')[0]
    const supportedLocales = Object.keys(locales)

    if (supportedLocales.includes(normLocale)) {
      return normLocale
    }

    if (supportedLocales.includes('en')) {
      console.error(`[LocaleManager]: locale ${normLocale} is not supported, using en`)
      return 'en'
    }

    const [firstLocale] = supportedLocales

    console.error(`[LocaleManager]: locale ${normLocale} is not supported, using ${firstLocale}`)
    return firstLocale
  }
}
