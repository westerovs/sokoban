// [STATE 2] Подготовка списка и данных для загрузки конкретного уровня
import i18next from 'i18next'

export default class PreparePreloadText {
  #levelEntity
  #game
  #storage
  #textPreloadData
  
  constructor(levelEntity) {
    this.#levelEntity = levelEntity
    this.#game = levelEntity.game
    this.#storage = levelEntity.storage
  }
  
  execute = async (levelIndex) => {
    await this.#initTextPreloadData(levelIndex)
  }
  
  get textPreloadData() {
    return this.#textPreloadData
  }
  
  #initTextPreloadData  = () => {
    // уровень
    const textLevel = i18next.t('level')
    const userLevel = this.#storage.userLevel
    // этап
    const textPart = i18next.t('textLoadingSkinPart')
    const partIndex =  this.#getPartIndex()
    // загрузка
    const textLoading = i18next.t('textLoading')

    this.#textPreloadData = {
      textLevel,
      userLevel,
      textPart,
      partIndex,
      textLoading,
    }
  }
  
  #getPartIndex = () => {
    const {skinIndex, partIndex} = this.#levelEntity.playerData

    if (partIndex < 5) {
      this.#levelEntity.playerData.partIndex = skinIndex
    }

    return this.#levelEntity.playerData.partIndex
  }
  

  
}
