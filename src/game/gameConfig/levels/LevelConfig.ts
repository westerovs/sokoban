import Locator from '@/game/engine/Locator.ts'
import YaMetrika from '@/game/modules/metrika/YaMetrika.js'
import LoadUtils from '@/game/utils/gameUtils/LoadUtils.js'
import {Logger, MODULES} from '@/game/utils/Logger.js'
import type Storage from '@/game/engine/storage/Storage.js'
import {ASSETS_URL} from '../constants.js'
import LevelProgress from './LevelProgress.js'
import {getLevelEntries, getLevelEntryByIndex} from './locationCatalog.js'
import type {LevelEntry, RuntimeLevelConfig} from './levelTypes.js'

/**
 * Собирает конфигурацию выбранного уровня для загрузки ресурсов, запуска Sokoban и записи результата.
 * Преобразует запись каталога в общий формат, который ожидают состояние уровня и аналитика.
 */

type LevelData = Omit<RuntimeLevelConfig, 'bgTexture' | 'currentSkinName'>

export default class LevelConfig {
  #storage: Storage = Locator.storage
  #config: RuntimeLevelConfig | null = null
  static maxLevels = 0 // Последний допустимый глобальный индекс уровня для совместимости со старым API

  // Возвращает последний допустимый индекс уровня.
  static getMaxLevels() {
    return Math.max(getLevelEntries().length - 1, 0)
  }

  // Собирает данные уровня по безопасному глобальному индексу.
  static getGameLevelData(levelIndex: number): LevelData {
    const maxLevels = LevelConfig.getMaxLevels()
    const safeLevelIndex = Math.min(Math.max(levelIndex, 0), maxLevels)
    const entry = getLevelEntryByIndex(safeLevelIndex)

    LevelConfig.maxLevels = maxLevels
    if (!entry) throw new Error('Sokoban level ' + safeLevelIndex + ' not found')
    if (safeLevelIndex !== levelIndex) Locator.storage.playerData.levelIndex = safeLevelIndex

    return LevelConfig.#createLevelData(entry)
  }

  static get levelType() {
    return 'sokoban'
  }

  // Создаёт текущую конфигурацию уровня.
  getConfig() {
    const {levelIndex} = this.#storage.playerData
    const levelData = LevelConfig.getGameLevelData(levelIndex)

    this.#config = {
      ...levelData,
      bgTexture: levelData.backgroundName, // Поле ожидает общий загрузчик фоновых сущностей
      currentSkinName: 'sokoban', // Стабильное имя режима для общей аналитики игры
    }

    this.#log()
    return this.#config
  }

  // Записывает прохождение текущего уровня.
  updateSavedLevel() {
    const progress = new LevelProgress(this.#storage)
    const result = progress.completeLevel(this.#config!.id)

    if (result.isGameCompleted && result.isFirstCompletion) this.#completeGame()
    return result
  }

  // Преобразует запись каталога в формат загрузчика уровня.
  static #createLevelData(entry: LevelEntry): LevelData {
    const {globalIndex, level, location, locationIndex, locationLevelIndex} = entry
    const hybridPath = level.isRemote ? ASSETS_URL.remote : ASSETS_URL.local

    return {
      ...level,
      levelData: level,
      levelIndex: globalIndex,
      locationId: location.id,
      locationIndex,
      locationLevelIndex,
      locationLevelNumber: locationLevelIndex + 1,
      locationTitleKey: location.titleKey,
      levelType: 'sokoban',
      amb: location.ambience,
      music: location.music,
      backgroundName: location.background,
      background: {
        alias: location.background,
        src: LoadUtils.forceFreshCache(hybridPath + 'assets/levels/backgrounds/' + location.background + '.webp'),
      },
    }
  }

  // Сообщает системам игры о полном прохождении каталога.
  #completeGame() {
    Logger.log(MODULES.Config, 'все уровни Sokoban пройдены')
    YaMetrika.completeGame()
  }

  // Выводит и отправляет аналитику текущего уровня.
  #log() {
    const {levelIndex} = this.#storage.playerData

    Logger.log(
      MODULES.Config,
      '\n      level: ' +
        this.#config!.id +
        '\n      levelType: ' +
        this.#config!.levelType +
        '\n      level index in levels: ' +
        levelIndex +
        '\n    ',
    )

    YaMetrika.startLevel(this.#config!, this.#storage)
  }
}
