import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container, Text} from 'pixi.js'
import type SoundManager from '@/game/engine/audio/SoundManager.js'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import type Storage from '@/game/engine/storage/Storage.js'
import PromoManager from '@/game/features/promotionCards/PromoManager.js'
import RateUs from '@/game/features/rateUs/RateUs.ts'
import Store from '@/game/features/store/Store.js'
import StoreView from '@/game/features/store/StoreView.js'
import {GAME_STATES} from '@/game/gameConfig/constants.js'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import LevelConfig from '@/game/gameConfig/levels/LevelConfig.js'
import type {LocationDefinition} from '@/game/gameConfig/levels/levelTypes.js'
import {rewardsCatalog} from '@/game/gameConfig/rewardsCatalog.js'
import YaMetrika from '@/game/modules/metrika/YaMetrika.js'
import type Level from '@/game/states/stateLevel/Level.js'
import type StateLevel from '@/game/states/stateLevel/StateLevel.js'
import ButtonAnimator from '@/game/utils/animations/ButtonAnimator.js'
import {clearTimeLine} from '@/game/utils/animations/gsapUtils.js'
import GrayscaleFilter from '@/game/utils/filters/GrayscaleFilter.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import BtnBadge from './BtnBadge.js'
import type CompleteLevelView from './CompleteLevelView.js'

// Управляет экраном завершения, наградами, рекламой и дальнейшей навигацией.

type CompletionResult = {
  unlockedLocation?: LocationDefinition | null
}

export default class CompleteLevel {
  #game = Locator.game
  #refs = this.#game.refs
  #view!: CompleteLevelView
  #storage!: Storage
  #soundManager!: SoundManager
  #btnNext!: Container
  #showTimeline: gsap.core.Timeline | null = null
  #canPlaySounds = true // Разрешает звуки экрана завершения
  #levelType: string | null = null
  levelEntity: Level
  state: StateLevel
  btnBuyLoupe: Container | null = null
  btnBackToLevels!: Container
  btnHome!: Container
  btnByeAd: Container | null = null
  btns: Array<Container | null> = []

  // Сохраняет уровень и его состояние.
  constructor(levelEntity: Level) {
    this.levelEntity = levelEntity
    this.state = levelEntity.state
  }

  // Подготавливает данные, события и анимацию экрана завершения.
  init = async (completionResult: CompletionResult = {}) => {
    try {
      this.#storage = Locator.storage
      this.#soundManager = Locator.soundManager

      this.#initViewElements()
      this.#setEvents(true)

      this.#sendCompleteLvlMetrika()
      await this.#showPromoIfAvailable()
      await this.#setPriceTextForBtnAd()

      this.#createBtnBadge()
      this.#setBtnNextValue()
      this.#checkAdPassPurchased()
      await RateUs.checkAndShowRateUs(this.#storage, this.levelEntity)

      await this.#showAndAnimate()
      this.#view.showLocationUnlock(completionResult.unlockedLocation ?? null)
      SdkManager.gameplayStop()
    } catch (err) {
      console.error('[CompleteLevel]: initialization failed', err)
    }
  }

  // Находит созданное представление и его интерактивные элементы.
  #initViewElements = () => {
    this.#view = this.#refs.completeLevelView
    this.#btnNext = this.#view.getChildByLabel('btnNext', true)!

    this.btnBuyLoupe = this.#view.getChildByLabel('btnBuyLoupe', true)
    this.btnBackToLevels = this.#view.getChildByLabel('btnBackToLevels', true)!
    this.btnHome = this.#view.getChildByLabel('btnHome', true)!
    this.btnByeAd = this.#view.getChildByLabel('btnByeAd', true)
    this.btns = [this.#btnNext, this.btnBuyLoupe, this.btnBackToLevels, this.btnHome, this.btnByeAd]

    ButtonAnimator.initOverHandler(this.btns)
  }

  // Включает или отключает события кнопок и сервисов.
  #setEvents = (bool: boolean) => {
    const status = bool ? 'on' : 'off'
    const statusOnce = bool ? 'once' : 'off'

    this.#btnNext[statusOnce]('pointerdown', this.#btnNextHandler)
    this.btnBackToLevels[statusOnce]('pointerdown', this.#btnBackToLevelsHandler)
    this.btnHome[statusOnce]('pointerdown', this.#btnHomeHandler)

    this.#game[status](GAME_EVENTS.clearLevel, this.#setEvents.bind(this, false))
    this.#game[status](GAME_EVENTS.STORE.hide, this.#unHideInterface)
    this.#game[status](GAME_EVENTS.paymentManager.hasNoAdsPass, this.#checkAdPassPurchased)

    if (this.btnBuyLoupe) this.btnBuyLoupe[status]('pointertap', this.#btnStoreHandler)
    if (this.btnByeAd) this.btnByeAd[status]('pointertap', this.#btnByeAd)
  }

  // Показывает доступную промокарточку магазина.
  #showPromoIfAvailable = async () => {
    if (!SdkManager.adapter.purchase.isAvailable()) return
    if (SdkManager.flags?.noStore) return

    const promoData = PromoManager.getPromoDataForLevel(this.#storage)
    if (!promoData) return

    const promoManager = new PromoManager()
    await promoManager.createPromoCard(promoData)
  }

  // 1 ------------- level result
  // Показывает экран и последовательно анимирует кнопку продолжения.
  #showAndAnimate = async () => {
    const btnNext = this.#view.getChildByLabel('btnNext', true)!
    this.#view.visible = true

    try {
      const btnNextArrow = btnNext.getChildByLabel('btnNextArrow')
      const btnBadge = btnNext.getChildByLabel('btnBadge')

      this.#showTimeline = gsap
        .timeline()
        .call(async () => {
          await this.#soundManager.stopAll()
          await this.#soundManager.play('sfx_victory')
          this.#soundManager.play('m_victory')
        })
        .fromTo(this.#view, {alpha: 0}, {alpha: 1})

      this.#showTimeline
        .set(btnNext, {eventMode: 'none'})
        .fromTo(btnNext.scale, {x: 0, y: 0}, {x: 1, y: 1, ease: 'back.out(2.5)'})
        .from(btnNextArrow, {x: '-=150', alpha: 0, duration: 0.3, delay: 0.2, ease: 'elastic.out(0.5, 0.3)'}, '<')

      if (btnBadge) {
        this.#showTimeline.set(btnBadge, {visible: true}).fromTo(btnBadge.scale, {x: 0, y: 1}, {x: 1, y: 1, ease: 'back.out(2.5)'})
      }

      this.#showTimeline.set(btnNext, {eventMode: 'static'})
    } catch (err) {
      btnNext.eventMode = 'static'
      console.error('[CompleteLevel]: show animation failed', err)
    }
  }

  // Обновляет подпись кнопки следующего уровня.
  #setBtnNextValue = () => {
    const btnNextArrow = this.#btnNext.getChildByLabel('btnNextArrow')!
    const arrowText = btnNextArrow.getChildByLabel('arrowText') as Text
    const levelText = this.#btnNext.getChildByLabel('btnNextLevelText') as Text

    const nextLevel = LevelConfig.getGameLevelData(this.#storage.playerData.levelIndex)
    arrowText.text = i18next.t(nextLevel.locationTitleKey)
    levelText.text = `${i18next.t('level')} ${nextLevel.locationLevelNumber}`
  }

  // Добавляет метку сложности следующего уровня.
  #createBtnBadge = () => {
    // 1 определить какой следующий уровень
    const nextLevel = LevelConfig.getGameLevelData(this.#storage.playerData.levelIndex)
    const {levelType} = GameUtils.extractLevelSuffix(nextLevel.levelName)
    // ничего не делаем если тип уровня не определен
    if (!levelType) return
    this.#levelType = levelType

    const badge = new BtnBadge({type: levelType})
    this.#btnNext.addChild(badge)
  }

  // Скрывает интерфейс завершения перед открытием магазина.
  #hideInterface = () => {
    this.#view.interactiveChildren = false

    return gsap.timeline().to([this.#view, this.#refs.skinContainerView], {alpha: 0, visible: false})
  }

  // Возвращает интерфейс после закрытия магазина.
  #unHideInterface = () => {
    this.#view.interactiveChildren = true

    return gsap.timeline().to([this.#view, this.#refs.skinContainerView], {alpha: 1, visible: true})
  }

  // Запускает следующий уровень.
  #btnNextHandler = async () => {
    this.#canPlaySounds = false

    YaMetrika.finalScreenBtnNext()
    this.#setEvents(false)
    clearTimeLine(this.#showTimeline, true, 1)

    await this.state.runNextLevel()
  }

  // Возвращает игрока на главный экран.
  #btnHomeHandler = async () => {
    YaMetrika.finalScreenBtnHome()

    this.#setEvents(false)
    this.#soundManager.play('sfx_btnClick')
    await ButtonAnimator.click(this.btnHome)
    this.state.checkoutState(GAME_STATES.gameState)
  }

  // Возвращает игрока к списку локаций.
  #btnBackToLevelsHandler = async () => {
    this.#setEvents(false)
    this.#soundManager.play('sfx_btnClick')
    await ButtonAnimator.click(this.btnBackToLevels)
    this.#game.requestSelectedLocationOnStart()
    this.state.checkoutState(GAME_STATES.gameState)
  }

  // Скрывает экран завершения и открывает магазин.
  #btnStoreHandler = () => {
    YaMetrika.finalScreenBtnStore()

    this.#soundManager.play('sfx_btnClick')
    this.#hideInterface()
    this.#createStore()
  }

  // todo дублирование
  // Создаёт представление и контроллер магазина.
  #createStore = () => {
    const view = new StoreView()
    new Store(view)
  }

  // Запускает покупку отключения рекламы.
  #btnByeAd = () => {
    YaMetrika.finalScreenBtnDisableAd()
    const id = rewardsCatalog.store.noAdPack.id

    const paymentManager = Locator.paymentManager
    paymentManager.onPurchase(id)
  }

  // Загружает и выводит цену отключения рекламы.
  #setPriceTextForBtnAd = async () => {
    if (!this.btnByeAd) return

    const btnByeAdText = this.btnByeAd.getChildByLabel('btnByeAdText') as Text | null
    if (!btnByeAdText) return

    try {
      const catalog = await SdkManager.purchase.getCatalog()
      if (!catalog || catalog?.length) return

      const adPackId = rewardsCatalog.store.noAdPack.id
      const data = catalog[adPackId]

      const currency = SdkManager.purchase.getCurrency()

      btnByeAdText.text = `${data?.price ?? ''}\n${currency}`
    } catch (err) {
      console.log('[setPriceTextForBtnAd]', err)
      btnByeAdText.text = ''
    }
  }

  // Отключает кнопку рекламы после покупки пропуска.
  #checkAdPassPurchased = () => {
    if (this.#storage.playerData.hasAdPass && this.btnByeAd) {
      const card = this.btnByeAd
      card.eventMode = 'none'

      const grayscale = new GrayscaleFilter(1)
      card.filters = [grayscale]

      const btnByeAdText = this.btnByeAd.getChildByLabel('btnByeAdText')
      if (btnByeAdText) btnByeAdText.visible = false
    }
  }

  // ---------- other
  // Отправляет метрику завершения с временем прохождения.
  #sendCompleteLvlMetrika = () => {
    const stopwatch = this.levelEntity.modulesInitializer.getMod('stopwatch')
    const levelPlayTime = stopwatch?.seconds ?? 0
    YaMetrika.completeLevel(this.levelEntity.config, this.#storage, levelPlayTime)
  }
}
