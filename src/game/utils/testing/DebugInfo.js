import {
  AnimatedSprite,
  BitmapText,
  Container,
  Graphics,
  HTMLText,
  Mesh,
  NineSliceSprite,
  ParticleContainer,
  Rectangle,
  Sprite,
  Text,
  TilingSprite,
} from 'pixi.js'
import Locator from '@/game/engine/Locator.ts'
import LocalStorage from '@/game/engine/storage/LocalStorage.js'
import {GAME_STATES} from '@/game/gameConfig/constants.js'

const PANEL = {
  x: 10,
  y: 200,
  width: 350,
  padding: 14,
  updateInterval: 500,
  animationSpeed: 0.018,
  buttonSize: 48,
  handleWidth: 64,
  handleHeight: 88,
}

const TEXT_STYLE = {
  fontFamily: 'Arial',
  fontSize: 22,
  lineHeight: 27,
  fill: 0x29e51f,
  stroke: {color: 0x000000, width: 2},
  tagStyles: {
    section: {
      fontSize: 18,
      fontWeight: 'bold',
      letterSpacing: 1,
      fill: 0xffffff,
    },
  },
}

const DEBUG_TEXT_PLACEHOLDER = [
  '<section>PERFORMANCE</section>',
  'FPS: -',
  'Alive: -',
  '',
  '<section>GPU</section>',
  'TextureSources: -',
  'Memory: - MB',
  '',
  '<section>AUDIO</section>',
  'Files: -',
  'Music files: -',
  'Decoded: - MB',
  'Music decoded: - MB',
  '',
  '<section>SCENE</section>',
  'Total: -',
  'Containers: -',
  'Sprites: -',
  'Meshes: -',
  'Graphics: -',
  'Text: -',
].join('\n')

export default class DebugInfo {
  #game
  #panel
  #content
  #debugText
  #closeButton
  #handle
  #elapsed = 0
  #isOpened = false
  #isTickerActive = false
  #panelTargetX = this.#isOpened ? PANEL.x : -PANEL.width

  constructor(game) {
    this.#game = game
    this.#init()
  }

  #init() {
    if (!LocalStorage.isLog) return

    this.#createPanel()
    this.#bindEvents()

    Locator.uiLayer.globalUiLayer.addChild(this.#panel)
  }

  #createPanel() {
    this.#panel = new Container({label: 'debugInfo'})
    this.#content = new Container({
      label: 'debugInfoContent',
      visible: this.#isOpened,
    })

    this.#createDebugTexts()
    const panelHeight = this.#getPanelHeight()

    this.#createBackground(panelHeight)

    this.#createCloseButton()
    this.#handle = this.#createHandle(panelHeight)

    this.#panel.position.set(this.#panelTargetX, PANEL.y)

    this.#content.addChild(this.#debugText, this.#closeButton)
    this.#panel.addChild(this.#content, this.#handle)
  }

  #createDebugTexts = () => {
    this.#debugText = new Text({
      text: DEBUG_TEXT_PLACEHOLDER,
      style: TEXT_STYLE,
    })
    this.#debugText.position.set(PANEL.padding)
    this.#debugText.eventMode = 'none'
  }

  #getPanelHeight = () => {
    return Math.ceil(Math.max(this.#debugText.height + PANEL.padding * 2, PANEL.buttonSize + PANEL.padding * 2))
  }

  #createBackground = (panelHeight) => {
    const background = new Graphics({eventMode: 'none'}).roundRect(0, 0, PANEL.width, panelHeight, 8).fill({color: 0x000000, alpha: 0.6})

    // background.eventMode = 'none'

    this.#content.addChild(background)
  }

  #bindEvents() {
    this.#closeButton.on('pointertap', () => {
      this.#setOpened(false)
    })

    this.#handle.on('pointertap', () => {
      this.#setOpened(true)
    })
  }

  #setOpened(isOpened) {
    if (this.#isOpened === isOpened) return

    this.#isOpened = isOpened
    this.#handle.visible = !isOpened
    this.#panelTargetX = isOpened ? PANEL.x : -PANEL.width
    this.#elapsed = 0

    if (isOpened) {
      this.#content.visible = true
      this.#debugText.text = this.#getDebugText()
    }

    this.#setTickerActive(true)
  }

  #setTickerActive(isActive) {
    if (this.#isTickerActive === isActive) return

    this.#isTickerActive = isActive

    if (isActive) {
      this.#game.app.ticker.add(this.#update, this)
      return
    }

    this.#game.app.ticker.remove(this.#update, this)
  }

  #update(ticker) {
    const progress = Math.min(1, ticker.deltaMS * PANEL.animationSpeed)

    this.#panel.x += (this.#panelTargetX - this.#panel.x) * progress

    if (Math.abs(this.#panelTargetX - this.#panel.x) < 0.5) {
      this.#panel.x = this.#panelTargetX
    }

    if (!this.#isOpened) {
      if (this.#panel.x === this.#panelTargetX) {
        this.#content.visible = false
        this.#setTickerActive(false)
      }

      return
    }

    this.#elapsed += ticker.deltaMS
    if (this.#elapsed < PANEL.updateInterval) return

    this.#elapsed = 0
    this.#debugText.text = this.#getDebugText()
  }

  #createCloseButton() {
    const size = PANEL.buttonSize

    const button = new Graphics()
      .roundRect(0, 0, size, size, 8)
      .fill({color: 0x000000, alpha: 0.4})
      .moveTo(15, 15)
      .lineTo(33, 33)
      .moveTo(33, 15)
      .lineTo(15, 33)
      .stroke({
        color: 0xffffff,
        width: 4,
        cap: 'round',
      })

    button.position.set(PANEL.width - size - 8, 8)
    button.eventMode = 'static'
    button.cursor = 'pointer'
    button.hitArea = new Rectangle(0, 0, size, size)

    this.#closeButton = button
  }

  #createHandle(panelHeight) {
    const {handleWidth: width, handleHeight: height} = PANEL

    const handle = new Graphics()
      .roundRect(0, 0, width, height, 12)
      .fill({color: 0x000000, alpha: 0.6})
      .moveTo(23, 27)
      .lineTo(40, height / 2)
      .lineTo(23, height - 27)
      .stroke({
        color: 0xffffff,
        width: 5,
        cap: 'round',
        join: 'round',
      })

    handle.position.set(PANEL.width, (panelHeight - height) / 2)

    handle.eventMode = 'static'
    handle.cursor = 'pointer'
    handle.hitArea = new Rectangle(0, 0, width, height)
    handle.visible = !this.#isOpened

    return handle
  }

  #getDebugText() {
    const {texturesCount, totalBytes} = this.#calcTextures()
    const scene = this.#calcSceneObjects(this.#game.app.stage)

    const {totalFiles, musicFiles, totalDecodedBytes, musicDecodedBytes} = Locator.soundManager.getAudioDebugStats()

    return [
      '<section>PERFORMANCE</section>',
      `FPS: ${Math.round(this.#game.app.ticker.FPS)}`,
      `Alive: ${this.#getAliveItems()}`,
      '',
      '<section>GPU</section>',
      `TextureSources: ${texturesCount}`,
      `Memory: ${this.#formatMb(totalBytes)} MB`,
      '',
      '<section>AUDIO</section>',
      `Files: ${totalFiles}`,
      `Music files: ${musicFiles}`,
      `Decoded: ~${this.#formatMb(totalDecodedBytes)} MB`,
      `Music decoded: ~${this.#formatMb(musicDecodedBytes)} MB`,
      '',
      '<section>SCENE</section>',
      `Total: ${scene.total}`,
      `Containers: ${scene.container}`,
      `Sprites: ${scene.sprite}`,
      `Meshes: ${scene.mesh}`,
      `Graphics: ${scene.graphics}`,
      `Text: ${scene.text}`,
    ].join('\n')
  }

  #getAliveItems() {
    try {
      if (this.#game.stateName !== GAME_STATES.levelState) {
        return '-'
      }

      return this.#game.level.aliveTargets.length ?? '-'
    } catch {
      return '-'
    }
  }

  #formatMb(bytes) {
    return (bytes / 1024 / 1024).toFixed(1)
  }

  #calcTextures() {
    const sources = (this.#game.app.renderer.texture?.managedTextures ?? []).filter(Boolean)

    const totalBytes = sources.reduce((sum, source) => {
      return sum + source.pixelWidth * source.pixelHeight * 4
    }, 0)

    return {
      texturesCount: sources.length,
      totalBytes,
    }
  }

  #calcSceneObjects(stage) {
    const stats = {
      total: 0,
      container: 0,
      sprite: 0,
      mesh: 0,
      graphics: 0,
      text: 0,
    }

    const nodes = [stage]

    while (nodes.length > 0) {
      const node = nodes.pop()
      if (!node) continue

      stats.total += 1

      const type = this.#getPixiType(node)
      if (type in stats) stats[type] += 1

      if (node.children?.length) {
        nodes.push(...node.children)
      }
    }

    return stats
  }

  #getPixiType(node) {
    if (node instanceof BitmapText) return 'bitmapText'
    if (node instanceof HTMLText) return 'htmlText'
    if (node instanceof Text) return 'text'
    if (node instanceof Mesh) return 'mesh'
    if (node instanceof Graphics) return 'graphics'
    if (node instanceof AnimatedSprite) return 'animatedSprite'
    if (node instanceof NineSliceSprite) return 'nineSliceSprite'
    if (node instanceof TilingSprite) return 'tilingSprite'
    if (node instanceof Sprite) return 'sprite'
    if (node instanceof ParticleContainer) return 'particleContainer'
    if (node instanceof Container) return 'container'

    return 'unknown'
  }
}
