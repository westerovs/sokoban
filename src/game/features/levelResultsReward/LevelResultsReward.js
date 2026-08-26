import {gsap} from 'gsap'
import i18next from 'i18next'
import {Container, NineSliceSprite, Text, Texture} from 'pixi.js'
import ButtonContainer from '@/game/components/buttons/ButtonContainer.js'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import LevelRewardAnimator from '@/game/features/levelResultsReward/LevelRewardAnimator.js'
import {LEVEL_TYPES, WORLD} from '@/game/gameConfig/constants.js'
import LevelConfig from '@/game/gameConfig/levels/LevelConfig.js'
import {primaryFontStyle, rewardWindowStyles} from '@/game/styles.js'
import GameUtils, {eventToggle} from '@/game/utils/gameUtils/GameUtils.js'

const REWARD = {
  hard: 4,
  veryHard: 6,
  extreme: 10,
}

/**
 * Если реклама недоступна, то кнопки не показываются и панелька закрывается самостоятельно
 * */

export default class LevelResultsReward extends Container {
  #game = Locator.game
  #innerBody
  #header
  #rowBonus
  #rowReward
  #buttonsRow
  #buttonOk
  #buttonReward
  #rowTextStyle = {
    ...primaryFontStyle,
    fill: rewardWindowStyles.rowTextColor,
    fontSize: 20,
  }
  #btnsTextStyle = {
    ...primaryFontStyle,
    fontSize: 28,
  }
  #rewardAnimate
  #levelBonusValue = 10
  #resolve
  #isMultiple

  constructor() {
    super()

    this.visible = false
    this.position.set(WORLD.HALF_W, WORLD.HALF_H)
  }

  get rowBonus() {
    return this.#rowBonus
  }

  get rowReward() {
    return this.#rowReward
  }

  get levelBonusValue() {
    return this.#levelBonusValue
  }

  get difficultyData() {
    const levelType = LevelConfig.levelType

    if (levelType === LEVEL_TYPES.SHADOWS.name) return {levelType, textBonus: `${i18next.t('difficultyLevels.hard')}`, reward: REWARD.hard}
    if (levelType === LEVEL_TYPES.WORDS.name)
      return {levelType, textBonus: `${i18next.t('difficultyLevels.veryHard')}`, reward: REWARD.veryHard}
    if (levelType === LEVEL_TYPES.ANAGRAMS.name)
      return {levelType, textBonus: `${i18next.t('difficultyLevels.veryHard')}`, reward: REWARD.veryHard}
    if (levelType === LEVEL_TYPES.GENERATOR.name)
      return {levelType, textBonus: `${i18next.t('difficultyLevels.extreme')}`, reward: REWARD.extreme}

    return {levelType, textBonus: `${i18next.t('rewardWindow.bonus')}`, reward: 0}
  }

  init = async () => {
    this.#createBody()
    this.#createHeader()
    this.#createRowBonus()
    this.#createRowReward()
    this.#createButtons()
    this.#setEvents(true)
    this.scale.set(1.3)

    this.#game.view.addChild(this)
    this.sortableChildren = true

    await this.#show()
    await this.#animateRewarding()
    await this.#showButtons()

    if (!SdkManager.isRewardedAvailableNow()) {
      await gsap.to({}, {delay: 0.1})
      this.#onHandlerOkClick()
    }

    return new Promise((res) => {
      this.#resolve = res
    })
  }

  destroy(_options) {
    super.destroy({
      ..._options,
      children: true,
    })
    this.#setEvents(false)
  }

  #updatePlayerCoins = () => {
    const {reward} = this.difficultyData
    let totalSum = this.#levelBonusValue + reward

    if (this.#isMultiple) totalSum *= 2

    Locator.storage.addCoins(totalSum)
  }

  #show = async () => {
    await gsap
      .timeline()
      .set(this, {visible: true})
      .from(this, {alpha: 0})
      .fromTo(this.#header.scale, {x: 0}, {x: 1, duration: 2, ease: 'back.out(1.5)'}, '<')
      .timeScale(4)
  }

  #hide = async (delay = 0) => {
    await gsap.timeline().to(this, {alpha: 0, duration: 0.3, delay: delay, visible: false})
    this.destroy()
    this.#updatePlayerCoins()
    this.#resolve()
  }

  #showButtons = async () => {
    if (!SdkManager.isRewardedAvailableNow()) return

    await gsap
      .timeline()
      .set(this.#buttonsRow, {visible: true})
      .from(this.#buttonsRow, {alpha: 0})
      .to(this.#buttonsRow, {y: 120, ease: 'linear'}, '<')
      .set(this.#buttonsRow, {zIndex: 1})
      .to(this.#buttonsRow, {y: 97, ease: 'back.out'})
  }

  #animateRewarding = async () => {
    this.#rewardAnimate = new LevelRewardAnimator(this)
    await this.#rewardAnimate.animate()
  }

  #setEvents = (bool) => {
    const toggle = eventToggle(bool)

    this.#buttonOk[toggle.gameOnceOff]('pointerup', this.#onHandlerOkClick)
    this.#buttonReward[toggle.gameOnceOff]('pointerup', this.#onHandlerRewardClick)
  }

  #createBody = () => {
    const texture = Texture.from('frame-victory')
    const innerBody = new NineSliceSprite({
      texture,
      leftWidth: 50,
      topHeight: 50,
      rightWidth: 50,
      bottomHeight: 50,
    })
    this.#innerBody = innerBody

    innerBody.width = 330
    innerBody.height = 200
    innerBody.pivot.set(innerBody.width / 2, innerBody.height / 2)

    this.addChild(innerBody)
  }

  #createHeader = () => {
    const header = new Container()
    this.#header = header
    header.y = -105

    const sprite = GameUtils.createSprite('frame-victory-header')

    const text = new Text({
      text: i18next.t('rewardWindow.great'),
      style: {...primaryFontStyle, fontSize: 38, fill: rewardWindowStyles.headerTextColor},
    })
    text.y = rewardWindowStyles.headerTextOffsetY
    text.anchor.set(0.5)

    header.addChild(sprite, text)
    this.addChild(header)
  }

  #createRowBonus = () => {
    const row = new Container()
    this.#rowBonus = row
    row.y = -32

    const {textBonus} = this.difficultyData
    const textBonusName = GameUtils.createText(GameUtils.capitalize(textBonus), {
      style: this.#rowTextStyle,
      name: 'textBonusName',
      anchorX: 0,
    })
    textBonusName.x = -140

    const textBonusCoin = GameUtils.createText(0, {style: this.#rowTextStyle, name: 'textBonusCoin', anchorX: 1})
    textBonusCoin.x = +92

    const bonusCoin = this.#createCoin('bonusCoin')
    bonusCoin.x = +120

    row.addChild(textBonusName, textBonusCoin, bonusCoin)
    this.addChild(row)
  }

  #createRowReward = () => {
    const row = new Container()
    this.#rowReward = row
    row.y = 28

    const coins = Locator.storage.playerData.coins
    const textTotalCoins = GameUtils.createText(coins, {style: this.#rowTextStyle, name: 'textTotalCoins', anchorX: 0})
    textTotalCoins.x = -90

    const coinTotalCoins = this.#createCoin('coinTotalCoins')
    coinTotalCoins.x = -120

    const textSumReward = GameUtils.createText(`+${this.#levelBonusValue}`, {style: this.#rowTextStyle, name: 'textSumReward', anchorX: 1})
    textSumReward.x = +92

    const coinBonusSum = this.#createCoin('coinBonusSum')
    coinBonusSum.x = +120

    row.addChild(textTotalCoins, coinTotalCoins, textSumReward, coinBonusSum)
    this.addChild(row)
  }

  #createCoin = (name = 'coin') => {
    return GameUtils.createSprite('coin', {name, scale: 0.64})
  }

  #createButtons = () => {
    this.#buttonsRow = new Container()
    this.#buttonsRow.visible = false
    this.#buttonsRow.zIndex = -1

    this.#buttonOk = this.#createButtonOk()
    this.#buttonReward = this.#createButtonReward()

    this.#buttonsRow.addChild(this.#buttonOk, this.#buttonReward)
    this.addChild(this.#buttonsRow)
  }

  #createButtonOk = () => {
    const button = new ButtonContainer()
    button.position.set(-80, 0)

    const sprite = GameUtils.createSprite('btn-secondary')
    sprite.scale.set(0.5)

    const text = GameUtils.createText('OK', {style: this.#btnsTextStyle})

    button.addChild(sprite, text)
    return button
  }

  #createButtonReward = () => {
    const button = new ButtonContainer()
    button.position.set(80, 0)

    const sprite = GameUtils.createSprite('btn-primary')
    sprite.scale.set(0.5)

    const text = GameUtils.createText('x2', {style: this.#btnsTextStyle})

    const iconPlay = GameUtils.createSprite('icon-play')
    iconPlay.scale.set(0.7)
    iconPlay.position.set(-40, 0)

    const coin = this.#createCoin()
    coin.scale.set(0.5)
    coin.position.set(40, 0)

    button.addChild(sprite, text, iconPlay, coin)
    return button
  }

  #onHandlerOkClick = () => {
    this.#setEvents(false)
    this.#hide()
  }

  #onHandlerRewardClick = () => {
    this.#setEvents(false)
    gsap.to(this.#buttonsRow, {alpha: 0, visible: false})

    SdkManager.showRewarded({
      onRewarded: this.#onRewardedAction,
      onError: this.#onErrorAction,
    })
  }

  #onRewardedAction = async () => {
    this.#isMultiple = true
    await this.#rewardAnimate.multiplyReward()
    await this.#hide(0.5)
  }

  #onErrorAction = async () => {
    GameUtils.showError(null, {message: `${i18next.t('errors.ad')}`})

    await this.#hide()
  }
}
