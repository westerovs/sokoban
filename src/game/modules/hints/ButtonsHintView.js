import {Container} from 'pixi.js'
import {applyInteractive} from '@/game/components/buttons/buttons.js'
import Locator from '@/game/engine/Locator.ts'
import SdkManager from '@/game/engine/SdkManager.js'
import {GAME_NAMES, PLATFORM_ID} from '@/game/gameConfig/constants.js'
import {GAME_NAME} from '@/game/generatedAssets/buildMeta.js'
import {primaryFontStyle} from '@/game/styles.js'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'

export default class ButtonsHintView extends Container {
  #refs
  #positionY
  #adaptiveWidth

  constructor({refs} = {}) {
    super()

    this.#refs = refs

    this.#init()
  }

  alignRight = () => {
    Locator.uiLayer.alignRight(this, {
      y: this.#positionY,
      viewWidth: this.#adaptiveWidth,
    })
  }

  #init = () => {
    this.eventMode = 'static'
    this.label = 'buttonsHintView'
    this.zIndex = 1
    this.#positionY = this.#getPositionY()

    this.#refs.buttonsHintView = this
    this.#createButtons()
    this.#adaptiveWidth = this.width
    this.alignRight()
  }

  #getPositionY() {
    const platformId = SdkManager.getPlatformId()
    return platformId === PLATFORM_ID.ok.toLowerCase() ? 120 : 60
  }

  #createButtons() {
    const btnHint = this.#createButton({
      name: 'hints',
      iconType: 'default',
      iconTexture: 'btn-hint-loupe',
      iconPos: {x: 15, y: -2},
    })
    this.#refs.btnHint = btnHint
    this.addChild(btnHint)

    if (GAME_NAME === GAME_NAMES.hotel) return

    const btnHintDarts = this.#createButton({
      name: 'hintDarts',
      y: 110,
      iconType: 'darts',
      iconTexture: 'btn-hint-darts',
      iconPos: {x: 15, y: -5},
    })
    this.#refs.btnHintDarts = btnHintDarts
    this.addChild(btnHintDarts)

    const btnHintCompass = this.#createButton({
      name: 'hintCompass',
      y: 220,
      iconType: 'compass',
      iconTexture: 'btn-hint-compass',
      iconPos: {x: 4, y: 0},
    })
    this.#refs.btnHintCompass = btnHintCompass
    this.addChild(btnHintCompass)
  }

  #createButton({name, y = 0, iconType, iconTexture, iconPos}) {
    const button = new Container()
    button.label = name
    button.y = y
    button.visible = true
    applyInteractive(button, {isButton: true})

    const circle = GameUtils.createSprite('btn-level-circle', {name: 'btnHintCircle'})
    const icon = this.#createIcon({iconType, iconTexture, iconPos})
    const label = this.#createButtonLabel()
    const plus = GameUtils.createSprite('icon-plus', {name: 'plus'})
    plus.position.set(-32, -22)
    plus.visible = false

    button.addChild(circle, icon, label, plus)
    return button
  }

  #createIcon({iconType, iconTexture, iconPos}) {
    if (iconType === 'darts') return this.#createDartsIcon(iconTexture, iconPos)
    if (iconType === 'compass') return this.#createCompassIcon(iconTexture, iconPos)

    return this.#createDefaultIcon(iconTexture, iconPos)
  }

  #createDefaultIcon(iconTexture, iconPos) {
    const icon = GameUtils.createSprite(iconTexture, {name: 'icon'})
    icon.position.copyFrom(iconPos)

    return icon
  }

  #createDartsIcon(iconTexture, iconPos) {
    const icon = new Container()
    icon.label = 'icon'

    const iconSprite = GameUtils.createSprite(iconTexture)
    iconSprite.position.copyFrom(iconPos)

    const dartsData = [
      {x: 8, y: -20, angle: 70},
      {x: 0, y: -17, angle: 40},
      {x: -5, y: -7, angle: 0},
    ]
    const darts = dartsData.map((data) => this.#createDart(data))

    icon.addChild(iconSprite, ...darts)
    return icon
  }

  #createDart({x, y, angle}) {
    const dart = GameUtils.createSprite('btn-hint-dart', {name: 'dart'})
    dart.position.set(x, y)
    dart.angle = angle
    dart.initPos = {x, y}

    return dart
  }

  #createCompassIcon(iconTexture, iconPos) {
    const icon = new Container()
    icon.label = 'icon'

    const iconCompass = GameUtils.createSprite(iconTexture, {name: 'iconCompass'})
    iconCompass.position.copyFrom(iconPos)

    const iconCompassArrow = GameUtils.createSprite('btn-hint-compass-arrow', {name: 'iconCompassArrow'})
    iconCompassArrow.position.set(2, -4)
    iconCompassArrow.angle = 14

    const iconCompassText = GameUtils.createText('', {
      name: 'iconCompassText',
      style: {
        ...primaryFontStyle,
        fill: '#FFFFFF',
        fontSize: 32,
      },
    })
    iconCompassText.position.set(2, -3)
    iconCompassText.alpha = 0

    icon.addChild(iconCompass, iconCompassArrow, iconCompassText)
    return icon
  }

  #createButtonLabel() {
    const label = new Container()
    label.label = 'btnLabel'
    label.y = 36

    const background = GameUtils.createSprite('btn-hint-label')

    const iconInfinity = GameUtils.createSprite('icon-infinity', {name: 'iconInfinity'})
    iconInfinity.y = -3
    iconInfinity.visible = false

    const valueText = GameUtils.createText('', {
      name: 'valueText',
      style: {
        ...primaryFontStyle,
        fontSize: 25,
      },
    })
    valueText.y = -2

    label.addChild(background, iconInfinity, valueText)
    return label
  }
}
