import {Container} from 'pixi.js'
import {GAME_NAMES, WORLD} from '@/game/gameConfig/constants.js'
import {primaryFontStyle} from '@/game/styles.js'
import SpineUtils from '@/game/utils/SpineUtils.js'
import {GAME_NAME} from '@/game/generatedAssets/buildMeta.js'
import {applyInteractive} from '@/game/components/buttons/buttons.js'
import Locator from '@/game/engine/Locator.ts'
import GameUtils from '@/game/utils/gameUtils/GameUtils.js'


export default class SkinContainerView extends Container {
  #refs

  constructor({refs} = {}) {
    super()

    this.#refs = refs
    this.label = 'skinContainerView'
    this.x = WORLD.HALF_W

    this.#init()
  }

  #init = () => {
    this.#refs.skinContainerView = this

    this.#createCharacterSpine()
    this.#createSpeechBubble()
    this.#createButtonSkin()
  }

  #createCharacterSpine() {
    const currentSkin = GAME_NAME === GAME_NAMES.hotel
      ? 'default'
      : Locator.storage.playerData.currentSkin
    const characterSpine = SpineUtils.createSpine({
      spineName: 'character',
      skinName: currentSkin,
      autorun: false,
    })

    this.#setCharacterStyle(characterSpine)
    this.#refs.characterSpine = characterSpine
    this.addChild(characterSpine)
  }

  #createSpeechBubble() {
    const speechBubble = new Container()
    speechBubble.label = 'speechBubble'
    speechBubble.angle = 10
    speechBubble.y = 500

    const background = GameUtils.createSprite('speech-bubble-outro')
    background.scale.set(1.35)

    const speechBubbleText = GameUtils.createText('', {
      name: 'speechBubbleText',
      style: {
        ...primaryFontStyle,
        fontFamily: 'secondaryFont',
        wordWrap: true,
        wordWrapWidth: 430,
        align: 'center',
        fontSize: 28,
        lineHeight: 28,
        fontWeight: 'normal'
      }
    })
    speechBubbleText.position.set(-12, 35)

    speechBubble.addChild(background, speechBubbleText)

    this.#refs.speechBubble = speechBubble
    this.#refs.speechBubbleText = speechBubbleText
    this.addChild(speechBubble)
  }

  #createButtonSkin() {
    const button = new Container()
    button.label = 'btnSkin'
    button.position.set(170, 70)
    button.visible = false
    applyInteractive(button, {isButton: true})

    const background = GameUtils.createSprite('btn-level-circle', {scale: 1.3})
    const icon = GameUtils.createSprite('icon-skin', {name: 'iconSkin'})

    button.addChild(background, icon)
    this.addChild(button)
  }

  #setCharacterStyle(characterSpine) {
    if (GAME_NAME === GAME_NAMES.detective) {
      characterSpine.scale.set(0.7)
      characterSpine.position.set(-250, 0)
      return
    }

    if (GAME_NAME === GAME_NAMES.hotel) {
      characterSpine.position.set(-280, 0)
      return
    }

    if (GAME_NAME === GAME_NAMES.adventure) {
      characterSpine.scale.set(0.7)
      characterSpine.position.set(-220, 40)
      return
    }

    if (GAME_NAME === GAME_NAMES.detectiveGirl) {
      characterSpine.scale.set(0.8)
      characterSpine.position.set(-285, -20)
      return
    }

    characterSpine.scale.set(0.7)
    characterSpine.position.set(-250, 0)
  }
}
