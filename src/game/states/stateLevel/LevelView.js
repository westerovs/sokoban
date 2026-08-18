import {Container, Text, Texture} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import {WORLD} from '@/game/gameConfig/constants.js'
import {FONT_COLORS, primaryFontStyle} from '@/game/styles.js'
import CompleteLevelView from '@/game/ui/level/completeLevelScreen/CompleteLevelView.js'
import GameUtils, {viewResize} from '@/game/utils/gameUtils/GameUtils.js'


export default class LevelView extends Container {
  #game

  constructor(game) {
    super()

    this.#game = game
    this.refs = {}
    this.sortableChildren = true
    this.label = 'levelView'

    this.#init()
  }

  resize() {
    return viewResize(this.refs)
  }

  #init = () => {
    this.#createIntroSpeechBubble()
    this.#createHud()
    this.#createCompleteLevelView()
    this.#createFade()
  }

  #createIntroSpeechBubble() {
    const introSpeechBubble = new Container({
      label: 'introSpeechBubble',
      visible: false,
    })
    introSpeechBubble._initScale = 1.2
    introSpeechBubble.updateAdaptive = () => Locator.uiLayer.resizeAdaptive(introSpeechBubble)

    const leftPart = GameUtils.createSprite('intro-text-bubble', {scale: 1.2})
    leftPart.x = -135

    const rightPart = GameUtils.createSprite('intro-text-bubble')
    rightPart.x = 134
    rightPart.scale.set(-1.2, 1.2)

    const speechBubbleText = new Text({
      text: '',
      label: 'speechBubbleText',
      anchor: 0.5,
      style: {
        ...primaryFontStyle,
        fontFamily: 'secondaryFont',
        wordWrap: true,
        wordWrapWidth: 380,
        align: 'center',
        fontSize: 28,
        lineHeight: 30,
        fill: FONT_COLORS.getIntroSpeechBubbleColor(),
        fontWeight: 'normal'
      }
    })

    introSpeechBubble.addChild(leftPart, rightPart, speechBubbleText)

    this.refs.introSpeechBubble = introSpeechBubble
    this.refs.speechBubbleText = speechBubbleText
    Locator.uiLayer.stateUiLayer.addChild(introSpeechBubble)
    introSpeechBubble.updateAdaptive()
  }

  #createHud() {

  }

  #createCompleteLevelView() {
    const completeLevelView = new CompleteLevelView({
      refs: this.refs
    })
    completeLevelView.game = this.#game
    completeLevelView.refs = this.refs
    completeLevelView.visible = false

    this.refs.completeLevelView = completeLevelView
    this.addChild(completeLevelView)
  }

  #createFade() {
    const fade = GameUtils.createSprite(Texture.WHITE, {anchorX: 0, anchorY: 0})
    fade.label = 'fade'
    fade.visible = true
    fade.alpha = 0
    fade.width = WORLD.WIDTH + 1
    fade.height = WORLD.HEIGHT
    fade.tint = 0x000000

    this.refs.fade = fade
    this.addChild(fade)
  }
}
