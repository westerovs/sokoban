import {gsap} from 'gsap'
import {GAME_STATES} from '@/game/gameConfig/constants.js'
import type Game from '@/game/Game.js'
import type LevelPreload from '../LevelPreload.js'
import type PreloadView from '../../PreloadView.js'

// [STATE 4] Завершает предзагрузку и переводит игру в состояние уровня.

export default class Finalize {
  #levelEntity: LevelPreload
  #view: PreloadView
  #game: Game

  // Сохраняет состояние предзагрузки и его представление.
  constructor(levelEntity: LevelPreload) {
    this.#levelEntity = levelEntity
    this.#game = levelEntity.game
    this.#view = levelEntity.view!
  }

  // ---------------------------------------------------
  // [STATE] Завершение и переход к следующему игровому состоянию
  // Скрывает загрузку, очищает её и запускает уровень.
  startGame = async () => {
    await this.#hidePreload()
    await this.#levelEntity.terminate()
    this.#game.emit(GAME_STATES.levelState)
  }

  // Плавно скрывает представление загрузки.
  #hidePreload = async () => {
    await gsap.timeline().to(this.#view, {alpha: 0, delay: 0})
  }
}
