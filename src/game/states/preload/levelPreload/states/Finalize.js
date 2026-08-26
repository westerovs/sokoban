// [STATE 4] Завершение и переход к следующему игровому состоянию
import {gsap} from 'gsap'
import {GAME_STATES} from '@/game/gameConfig/constants.js'

export default class Finalize {
  #levelEntity
  #view
  #game

  constructor(levelEntity) {
    this.#levelEntity = levelEntity
    this.#game = levelEntity.game
    this.#view = levelEntity.view
  }

  // ---------------------------------------------------
  // [STATE] Завершение и переход к следующему игровому состоянию
  startGame = async () => {
    await this.#hidePreload()
    await this.#levelEntity.terminate()
    this.#game.emit(GAME_STATES.levelState)
  }

  #hidePreload = async () => {
    await gsap.timeline().to(this.#view, {alpha: 0, delay: 0})
  }
}
