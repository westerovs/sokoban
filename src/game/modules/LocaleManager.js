import Locator from '../engine/Locator.ts'
import SdkManager from '../engine/SdkManager.js'
import i18next from 'i18next'


export default class LocaleManager {
  static locale
  
  static get supportedLocales() {
    const locales = Locator.gameConfig.locales
    return locales ? Object.keys(locales) : []
  }
  
  static init = async () => {
    await LocaleManager.initializeI18n()
  }
  
  static initializeI18n = async () => {
    const gameConfig = Locator.gameConfig
    const locales = await gameConfig.locales
    
    const resources = Object.fromEntries(
      Object.entries(locales).map(([localeKey, translation]) => [localeKey, {translation}])
    )
    
    const locale = await SdkManager.getLang()
    const validatedLocale = LocaleManager.validate(locale, locales)
    
    LocaleManager.locale = validatedLocale
    
    await i18next.init({
      lng: validatedLocale,
      fallbackLng: 'en',
      resources,
    })
  }
  
  static validate(locale, locales) {
    const normLocale = (locale || '').toLowerCase().split('-')[0]
    const supportedLocales = Object.keys(locales)
    
    if (supportedLocales.includes(normLocale)) {
      return normLocale
    }
    
    if (supportedLocales.includes('en')) {
      console.error('', `locale ${normLocale} is not supported, return en`)
      return 'en'
    }
    
    const [firstLocale] = supportedLocales
    
    console.error('', `locale ${normLocale} is not supported, return ${firstLocale}`)
    return firstLocale
  }
}
