import {WORLD} from '../../gameConfig/constants.js'
import {Logger} from '../../utils/Logger.js'
import Locator from '../Locator.ts'
import SdkManager from '../SdkManager.js'
import type {AdvertisingArea} from '../sdkTypes.js'
import LocalStorage from '../storage/LocalStorage.js'

// Управляет адаптивными рекламными баннерами платформы CrazyGames.

export default class CrazyGames {
  static isInit = false

  // Отмечает интеграцию CrazyGames готовой к работе.
  static init = () => {
    CrazyGames.isInit = true
  }

  // Показывает и обновляет адаптивный баннер.
  static showCrazyGamesBanner = () => {
    if (!CrazyGames.isInit) return
    Logger.warn('', 'show CrazyGames Banner')

    CrazyGames.createCrazyGamesBanner()
    window.addEventListener('resize', CrazyGames.createCrazyGamesBanner)
  }

  // Скрывает все адаптивные баннеры.
  static hideAllAdaptiveBanners = () => {
    if (!CrazyGames.isInit) return
    Logger.warn('', 'hideAllAdaptiveBanners')

    window.removeEventListener('resize', CrazyGames.createCrazyGamesBanner)
    SdkManager.adapter.advertising.hideAllAdaptiveBanners()
  }

  // Передаёт платформе актуальную область баннера.
  static createCrazyGamesBanner = () => {
    if (LocalStorage.isDebug) SdkManager.adapter.advertising.debugAdaptiveBanners()

    const {x, y, width, height} = CrazyGames.resizeCGBanner()
    SdkManager.adapter.advertising.setAdaptiveBannersAreas([{x, y, width, height}])
    SdkManager.adapter.advertising.showAllAdaptiveBanners()
  }

  // Рассчитывает область баннера по текущему размеру окна.
  static resizeCGBanner = () => {
    const {scaleFactor} = Locator.gameResize.resizeData

    const width = Math.min(window.innerWidth / 4, (WORLD.WIDTH / 4) * scaleFactor)
    const height = window.innerHeight / 1.2
    const contentOffset = 350

    return {
      x: window.innerWidth / 2 + contentOffset * scaleFactor,
      y: window.innerHeight / 2 - height / 2,
      width,
      height,
    }
  }

  // Передаёт платформе произвольные области баннеров.
  static setAdaptiveBannersAreas = (areas: AdvertisingArea[] = []) => {
    SdkManager.adapter.advertising.setAdaptiveBannersAreas(areas)
  }

  // Показывает все ранее настроенные баннеры.
  static showAllAdaptiveBanners = () => {
    SdkManager.adapter.advertising.showAllAdaptiveBanners()
  }
}
