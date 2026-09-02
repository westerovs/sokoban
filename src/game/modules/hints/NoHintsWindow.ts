import {gsap} from 'gsap'
import i18next from 'i18next'
import type {DestroyOptions} from 'pixi.js'
import {Container, Text} from 'pixi.js'
import ButtonContainer from '@/game/components/buttons/ButtonContainer.js'
import BtnRewardTimer from '@/game/components/rewardTimer/BtnRewardTimer.js'
import Locator from '@/game/engine/Locator.ts'
import {GAME_EVENTS} from '@/game/gameConfig/gameEvents.js'
import {primaryFontStyle} from '@/game/styles.js'
import BaseModal from '@/game/ui/common/modal/BaseModal.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'
import LoadUtils from '@/game/utils/gameUtils/LoadUtils.js'
import type {HintButton, HintButtonName} from './hintTypes.js'

// Показывает получение подсказки за рекламу при нулевом остатке.

export default class NoHintsWindow extends BaseModal {
  #buttonReward!: ButtonContainer
  #btnTimer: BtnRewardTimer | null = null
  #btnHintName: HintButtonName
  #header!: Text
  #icon!: Container

  // Создаёт окно для выбранного типа подсказки.
  constructor(btnHintName: HintButtonName) {
    super({label: 'noHintsWindow', h: 350})

    this.#btnHintName = btnHintName
  }

  // Загружает ресурсы, создаёт содержимое и показывает окно.
  async init() {
    const showPromise = this.show()
    const spriteSheetLoaded = await this.#loadSpritesheet()
    if (!spriteSheetLoaded || this.destroyed) return

    this.#create()
    const isShown = await showPromise
    if (!isShown) this.destroy()
  }

  // Загружает спрайтшит окна с обработкой ошибки.
  #loadSpritesheet = async () => {
    this.animateLoadingStart()

    try {
      await LoadUtils.loadSpriteSheet({spriteSheetName: 'purchases'})
      return true
    } catch (error) {
      console.error('[NoHintsWindow]: failed to load modal assets', error)
      if (!this.destroyed) this.destroy()
      return false
    } finally {
      if (!this.destroyed) this.animateLoadingEnd()
    }
  }

  // Создаёт содержимое окна и подключает рекламную награду.
  #create = () => {
    this.#createTextHeader()
    this.#createHintIcon()
    this.#createButtonReward()

    this.#btnTimer = new BtnRewardTimer()
    this.#btnTimer.init(this.#buttonReward as HintButton, 'noHintsWindow', this.#btnHintName)

    Locator.game.on(GAME_EVENTS.AD.onRewarded, this.#animateAndDestroy)
  }

  // Отключает таймер и игровые события перед уничтожением.
  destroy(_options?: DestroyOptions) {
    if (this.destroyed) return

    this.#btnTimer?.destroy()
    Locator.game.off(GAME_EVENTS.AD.onRewarded, this.#animateAndDestroy)
    super.destroy(_options)
  }

  // Проигрывает финальную анимацию и закрывает окно.
  #animateAndDestroy = async () => {
    await this.#finalAnimation()
    this.destroy()
  }

  // Показывает анимацию полученной подсказки.
  #finalAnimation = async () => {
    const shine = GameUtils.createSprite('glow-type1')
    shine.scale.set(0)
    this.#icon.addChild(shine)

    const textRewardCounter = this.#createRewardCounter()

    await gsap
      .timeline()
      .set([this.btnClose, this.#buttonReward, this.#header, this], {visible: false})
      .to(this.#icon.scale, {x: 2, y: 2, yoyo: true, repeat: 8, ease: 'back.out(2.5)'}, '<')

      .to(textRewardCounter, {alpha: 1, delay: 0.4}, '<')
      .to(textRewardCounter, {y: '-=140', duration: 3, delay: 0.4}, '<')

      .to(shine.scale, {x: 1.2, y: 1.2, duration: 1}, '<')
      .to(shine, {angle: 360, repeat: 2, duration: 1.5, ease: 'linear'}, '<')
      .to([shine.scale, this.#icon.scale], {x: 0, y: 0, ease: 'back.inOut(2.5)'})
      .to([this.#icon, textRewardCounter], {alpha: 0}, '<')
  }

  // Создаёт счётчик полученной награды.
  #createRewardCounter = () => {
    const {width, height} = this

    const textRewardCounter = new Text({
      label: 'no-hints-reward-counter',
      text: '+1',
      style: {
        ...primaryFontStyle,
        fontSize: 100,
        fill: 0xffffff,
        dropShadow: {color: 0x000000},
        stroke: {color: 0x000000, width: 1},
      },
    })
    textRewardCounter.anchor.set(0.5)
    textRewardCounter.position.set(width / 2, height / 2)
    textRewardCounter.alpha = 0

    this.addChild(textRewardCounter)

    return textRewardCounter
  }

  // Создаёт заголовок окна.
  #createTextHeader = () => {
    this.#header = GameUtils.createText(`${i18next.t('notEnoughHints')}`)
    this.#header.style.fontSize = 30
    this.#header.y = -140

    this.addChild(this.#header)
  }

  // Создаёт иконку запрошенного типа подсказки.
  #createHintIcon = () => {
    const textureKey = this.#getIconTexture()
    if (!textureKey) return

    const icon = new Container({label: 'noHintsIcon'})
    icon.sortableChildren = true
    icon.scale.set(1.5)
    icon.position.set(0, -30)
    this.#icon = icon

    const iconSprite = GameUtils.createSprite(textureKey)
    iconSprite.zIndex = 1
    this.#icon.addChild(iconSprite)

    this.addChild(icon)
  }

  // Возвращает текстуру выбранного типа подсказки.
  #getIconTexture = () => {
    if (this.#btnHintName === 'hints') return 'store-loupe-big'
    if (this.#btnHintName === 'hintDarts') return 'store-darts-big'
    if (this.#btnHintName === 'hintCompass') return 'store-compass-big'
  }

  // Создаёт кнопку просмотра рекламы.
  #createButtonReward = () => {
    const button = new ButtonContainer({
      props: {label: 'noHintsRewardButton'},
      initScale: 1.3,
    })
    button.position.set(0, 100)

    this.#buttonReward = button

    const sprite = GameUtils.createSprite('btn-primary')
    sprite.scale.set(0.5)

    const iconPlay = GameUtils.createSprite('icon-play', {name: 'iconPlay'})
    iconPlay.scale.set(0.7)
    iconPlay.x = -20

    const text = GameUtils.createText('+1', {
      style: {
        ...primaryFontStyle,
        fontSize: 28,
      },
    })
    text.label = 'priceText'
    text.x = 20

    button.addChild(sprite, text, iconPlay)

    this.addChild(button)
    return button
  }
}
