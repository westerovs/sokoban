import i18next from 'i18next'
import type {DestroyOptions} from 'pixi.js'
import BaseModal from '@/game/ui/common/modal/BaseModal.js'
import ButtonContainer from '../../../components/buttons/ButtonContainer.js'
import Locator from '../../../engine/Locator.ts'
import SdkManager from '../../../engine/SdkManager.js'
import {primaryFontStyle} from '../../../styles.js'
import GameUtils from '../../../utils/gameUtils/GameUtils.js'

// Показывает окно входа в платформенный профиль игрока.

export default class Authorization extends BaseModal {
  #game = Locator.game
  #btnEnter!: ButtonContainer

  // Создаёт адаптивное окно авторизации.
  constructor() {
    super({h: 350, forceUpdateAdaptive: true})

    this.label = 'authorizationView'

    this.#init()
  }

  // Создаёт текст и кнопку входа.
  #init = () => {
    this.#createTexts()
    this.#createBtnEnter()

    Locator.uiLayer.stateUiLayer.addChild(this)
  }

  // Освобождает окно и обработчик кнопки входа.
  destroy(_options?: DestroyOptions) {
    super.destroy(_options)
    this.#btnEnter.off('pointerdown', this.#btnEnterAction)
  }

  // Создаёт поясняющие тексты окна.
  #createTexts = () => {
    const style = {
      ...primaryFontStyle,
      fontSize: 22,
    }

    const header = GameUtils.createText(`${i18next.t('authorizationHeader')}`, {style: {...style, fontSize: 36}})
    header.y = -120

    const p1 = GameUtils.createText(`${i18next.t('authorizationText1')}`, {anchorX: 0, style})
    p1.position.set(-this.rect.width / 2 + 25, -40)

    const p2 = GameUtils.createText(`${i18next.t('authorizationText2')}`, {anchorX: 0, style})
    p2.position.set(-this.rect.width / 2 + 25, 0)

    this.addChild(header, p1, p2)
  }

  // Создаёт кнопку входа.
  #createBtnEnter = () => {
    this.#btnEnter = new ButtonContainer({
      props: {name: 'btnEnter', x: 0, y: 100},
      initScale: 0.65,
      spriteKeys: ['btn-primary'],
    })
    this.#btnEnter.addCenterText({
      text: `${i18next.t('authorizationBtn')}`,
    })

    this.addChild(this.#btnEnter)
    this.#btnEnter.on('pointerdown', this.#btnEnterAction)
  }

  // Запускает платформенную авторизацию и обновляет страницу.
  #btnEnterAction = async () => {
    const auth = SdkManager.player.auth ?? SdkManager.player.authorize
    if (!auth) return

    auth
      .call(SdkManager.player)
      .then(() => {
        console.log('[Authorization] The player is successfully logged in, page reload!')
        location.reload()
      })
      .catch((err: unknown) => {
        console.error('[Authorization]: player login failed', err)
        GameUtils.showError(err, {message: `${i18next.t('errors.type1')}`})
      })
  }
}
