import i18next from 'i18next'
import {promoTooltipFromAdminPanel} from '@/game/features/promotionCards/PromoManager.js'
import LiveOpsController from '../../../components/liveOpsController/LiveOpsController.js'
import Locator from '../../../engine/Locator.ts'
import SdkManager from '../../../engine/SdkManager.js'
import {STORAGE_KEYS} from '../../../engine/storage/defaultData.js'
import LocalStorage from '../../../engine/storage/LocalStorage.js'
import LevelConfig from '../../../gameConfig/levels/LevelConfig.js'
import LevelProgress from '../../../gameConfig/levels/LevelProgress.js'
import {getLevelEntries, getLevelEntryByIndex, getLocations} from '../../../gameConfig/levels/locationCatalog.js'
import GameUtils from '../../gameUtils/GameUtils.js'
import {
  createButton,
  createCheckboxItem,
  createCheckboxRow,
  createFieldsetGrid,
  createNumberItem,
  createNumberRow,
  createSelectRow,
} from './templates.js'

// todo переусложнённая генерация. Изначально было пара параметров и разрослось.
export default class AdminPanel {
  #state = {}
  #config
  #panel
  #footer
  #adminPanelWindow
  #storage

  #learningKeys = [
    STORAGE_KEYS.isTutorial_shadows,
    STORAGE_KEYS.isTutorial_words,
    STORAGE_KEYS.isTutorial_anagrams,
    STORAGE_KEYS.isTutorial_generator,
    STORAGE_KEYS.isTutorial_identical,

    STORAGE_KEYS.hintDartsIsAvailable,
    STORAGE_KEYS.hintCompassIsAvailable,
  ]

  #storeKeys = [
    STORAGE_KEYS.hints,
    STORAGE_KEYS.hintDarts,
    STORAGE_KEYS.hintCompass,
    STORAGE_KEYS.hasAdPass,
    STORAGE_KEYS.eventPurchasedNewYear,
    STORAGE_KEYS.coins,
  ]

  constructor() {
    this.#init()
  }

  #init() {
    this.#storage = Locator.storage
    this.#config = this.#getConfig()

    this.#initState()
    this.#renderPanel()
    this.#renderComponents()
  }

  #getConfig = () => {
    const {playerData} = this.#storage

    return {
      checkboxes: [
        {
          key: 'isDebug',
          label: 'debug:',
          value: LocalStorage.isDebug,
          tooltip: 'режим дебага, если он выключен то игнорируются остальные параметры дебага',
        },
        {key: 'isItemRects', label: 'itemRects:', value: LocalStorage.isItemRects, tooltip: 'включает рамку'},
        {key: 'isLog', label: 'logs:', value: LocalStorage.isLog, tooltip: 'включает логирование на экране'},
        {key: 'testPromo', label: 'testPromo:', value: LocalStorage.testPromo, tooltip: promoTooltipFromAdminPanel},

        {
          key: 'forceNewYear',
          label: 'force NewYear:',
          value: LocalStorage.forceNewYear,
          disabled: !LiveOpsController.isNewYearAvailable,
          tooltip: 'принудительно включает НГ уровни, если они доступны в конкретной игре',
        },
        {key: 'testLoad', label: 'testLoad:', value: LocalStorage.testLoad, tooltip: 'в консоли быстрый тест загрузки уровней'},

        {
          key: STORAGE_KEYS.hintDartsIsAvailable,
          label: 'darts',
          value: playerData.hintDartsIsAvailable,
          tooltip: 'Доступно ли обучение дартсу',
        },
        {
          key: STORAGE_KEYS.hintCompassIsAvailable,
          label: 'compass',
          value: playerData.hintCompassIsAvailable,
          tooltip: 'Доступно ли обучение компасу',
        },

        {
          key: STORAGE_KEYS.isTutorial_shadows,
          label: 'shadows',
          value: playerData.isTutorial_shadows,
          tooltip: '(hard) если включен - обучение было пройдено',
        },
        {
          key: STORAGE_KEYS.isTutorial_words,
          label: 'words',
          value: playerData.isTutorial_words,
          tooltip: '(veryHard) если включен - обучение было пройдено',
        },
        {
          key: STORAGE_KEYS.isTutorial_anagrams,
          label: 'anagrams',
          value: playerData.isTutorial_anagrams,
          tooltip: '(veryHard) если включен - обучение было пройдено',
        },
        {
          key: STORAGE_KEYS.isTutorial_generator,
          label: 'generator',
          value: playerData.isTutorial_generator,
          tooltip: '(extreme) если включен - обучение было пройдено',
        },
        {
          key: STORAGE_KEYS.isTutorial_identical,
          label: 'identical',
          value: playerData.isTutorial_identical,
          tooltip: '(hard) если включен - обучение было пройдено',
        },

        {key: STORAGE_KEYS.hasAdPass, label: 'AdPass:', value: playerData.hasAdPass, tooltip: 'куплен ли пропуск рекламы'},
        {
          key: STORAGE_KEYS.eventPurchasedNewYear,
          label: "New Year's Levels",
          value: playerData.eventPurchasedNewYear,
          disabled: !LiveOpsController.isNewYearAvailable,
          tooltip:
            'Купить нг уровни. Работает только в период с 1 декабря до 31 января ежегодно и если это событие не выключено для конкретной игры.',
        },
      ],

      selects: [{key: STORAGE_KEYS.skinIndex, label: 'skin', min: 1, max: 5, value: playerData.skinIndex, tooltip: 'выбор скина'}],

      numberInputs: [
        {
          key: STORAGE_KEYS.partIndex,
          label: 'part',
          min: 1,
          max: 99999,
          value: playerData.partIndex,
          tooltip:
            'выбор ни на что не влияет, нужен если хочется накрутить для экрана загрузки. Может быть выше skinIndex. Обновляется когда пройден круг уровней',
        },
        {
          key: STORAGE_KEYS.userLevel,
          label: 'userLevel',
          min: 1,
          max: 99999,
          value: playerData.userLevel,
          tooltip: 'установка уровня игрока',
        },

        {key: STORAGE_KEYS.hints, label: 'magnifiers', min: 0, max: 999, value: playerData.hints ?? 0, tooltip: 'лупы'},
        {key: STORAGE_KEYS.hintDarts, label: 'darts', min: 0, max: 999, value: playerData.hintDarts ?? 0, tooltip: 'дартс'},
        {key: STORAGE_KEYS.hintCompass, label: 'compass', min: 0, max: 999, value: playerData.hintCompass ?? 0, tooltip: 'компас'},
        {key: STORAGE_KEYS.coins, label: 'coins', min: 0, max: 99999, value: playerData.coins ?? 0, tooltip: 'игровая валюта'},
      ],
    }
  }

  #initState() {
    this.#config.checkboxes.forEach((cb) => (this.#state[cb.key] = cb.value))
    this.#config.selects.forEach((sel) => (this.#state[sel.key] = sel.value))
    this.#config.numberInputs.forEach((inp) => (this.#state[inp.key] = inp.value))
    this.#state[STORAGE_KEYS.levelIndex] = this.#storage.playerData.levelIndex
    this.#state.adminLocationId = getLevelEntryByIndex(this.#state[STORAGE_KEYS.levelIndex]).location.id
  }

  #renderPanel = () => {
    this.#adminPanelWindow = document.createElement('div')
    this.#adminPanelWindow.className = 'admin-panel__bg'
    this.#adminPanelWindow.innerHTML = `
      <section class="admin-panel__window" role="dialog" aria-modal="true" aria-label="Панель разработчика">
        <header class="admin-panel__header">
          <div><h2>Панель разработчика</h2><p>Локации, прогресс и тестовые параметры</p></div>
          <button class="admin-panel__close" type="button" aria-label="Закрыть">&times;</button>
        </header>
        <div class="admin-panel__content"></div>
        <footer class="admin-panel__footer"></footer>
      </section>`
    document.body.append(this.#adminPanelWindow)

    this.#panel = this.#adminPanelWindow.querySelector('.admin-panel__content')
    this.#footer = this.#adminPanelWindow.querySelector('.admin-panel__footer')
    this.#adminPanelWindow.querySelector('.admin-panel__close').addEventListener('click', this.#destroy)
  }

  #renderComponents = () => {
    this.#renderLevelNavigation()
    this.#renderCheckboxes()
    this.#renderLearningGroup()
    this.#renderStoreGroup()
    this.#renderSelects()
    this.#renderNumberInputs()
    this.#renderButtons()
    this.#renderInfoSection()
  }

  #renderCheckboxes() {
    const grid = createFieldsetGrid(this.#panel, 'Debug')
    this.#config.checkboxes
      .filter((cb) => !this.#learningKeys.includes(cb.key) && !this.#storeKeys.includes(cb.key))
      .forEach((cb) => {
        grid.append(createCheckboxRow(cb, this.#onCheckboxChange))
      })
  }

  #renderLevelNavigation() {
    const grid = createFieldsetGrid(this.#panel, `Уровни (${LevelConfig.getMaxLevels() + 1})`)
    grid.classList.add('admin-panel__fieldset-container--levels')

    const locationData = {key: 'adminLocationId', label: 'Локация', value: this.#state.adminLocationId}
    const locationOptions = getLocations().map(({id, titleKey}) => ({label: i18next.t(titleKey), value: id}))
    grid.append(createSelectRow(locationData, locationOptions, this.#onSelectChange))

    const levelData = {key: STORAGE_KEYS.levelIndex, label: 'Уровень', value: this.#state[STORAGE_KEYS.levelIndex]}
    grid.append(createSelectRow(levelData, this.#getLevelOptions(), this.#onSelectChange))
  }

  #getLevelOptions() {
    return getLevelEntries()
      .map((entry, globalIndex) => ({...entry, globalIndex}))
      .filter(({location}) => location.id === this.#state.adminLocationId)
      .map(({globalIndex, level, locationLevelIndex}) => ({
        label: `${globalIndex + 1}. ${i18next.t('level')} ${locationLevelIndex + 1} · ${level.id}`,
        value: globalIndex,
      }))
  }

  #renderLearningGroup() {
    const grid = createFieldsetGrid(this.#panel, 'Learning')

    const fieldset = grid.closest('fieldset')
    const legend = fieldset?.querySelector('legend')

    fieldset?.classList.add('admin-panel__fieldset--clickable')

    legend?.addEventListener('click', () => this.#toggleLearningGroup())

    this.#config.checkboxes
      .filter((cb) => this.#learningKeys.includes(cb.key))
      .forEach((cb) => {
        grid.append(createCheckboxItem(cb, this.#onCheckboxChange))
      })
  }

  #toggleLearningGroup() {
    const values = this.#learningKeys.map((k) => this.#state[k])
    const enable = !values.every(Boolean)

    this.#learningKeys.forEach((key) => {
      this.#state[key] = enable

      const input = this.#panel.querySelector(`input[data-key="${key}"]`)
      if (input) input.checked = enable
    })
  }

  #renderStoreGroup() {
    const grid = createFieldsetGrid(this.#panel, 'Store')

    // ЧЕКБОКСЫ Store
    this.#config.checkboxes
      .filter((cb) => this.#storeKeys.includes(cb.key))
      .forEach((cb) => {
        grid.append(createCheckboxItem(cb, this.#onCheckboxChange))
      })

    // NUMBER INPUTS Store
    this.#config.numberInputs
      .filter((inp) => this.#storeKeys.includes(inp.key))
      .forEach((inp) => {
        grid.append(createNumberItem(inp, this.#onNumberChange))
      })
  }

  #renderSelects() {
    this.#config.selects.forEach((data) => {
      const opts = []

      const min = data.min ?? 0
      for (let i = min; i <= data.max; i++) {
        let label = i

        opts.push({value: i, label})
      }

      this.#panel.append(createSelectRow(data, opts, this.#onSelectChange))
    })
  }

  #renderNumberInputs() {
    this.#config.numberInputs
      .filter((inp) => !this.#storeKeys.includes(inp.key))
      .forEach((inp) => {
        this.#panel.append(createNumberRow(inp, this.#onNumberChange))
      })
  }

  #renderButtons() {
    const row = document.createElement('div')
    row.className = 'admin-panel__row'

    const saveBtn = createButton('Save', 'admin-panel__btn admin-panel__btn--save', this.#onSave)
    const resetBtn = createButton('Hard Reset', 'admin-panel__btn admin-panel__btn--reset', this.#onHardReset)
    const resetSkins = createButton('Reset Skins', 'admin-panel__btn', this.#resetSkins)

    row.append(saveBtn, resetSkins, resetBtn)
    this.#footer.append(row)
  }

  #onCheckboxChange = (e) => {
    const key = e.target.dataset.key
    const checked = !!e.target.checked

    this.#state[key] = checked

    if (key === 'isDebug') LocalStorage.isDebug = checked
    if (key === 'isLog') LocalStorage.isLog = checked
    if (key === 'forceNewYear') LocalStorage.forceNewYear = checked
    if (key === 'isItemRects') LocalStorage.isItemRects = checked
    if (key === 'testPromo') LocalStorage.testPromo = checked
    if (key === 'testLoad') LocalStorage.testLoad = checked
  }

  #onSelectChange = (e) => {
    const key = e.target.dataset.key
    this.#state[key] = key === 'adminLocationId' ? e.target.value : Number(e.target.value)
    if (key === 'adminLocationId') this.#updateLevelSelect()
  }

  #updateLevelSelect() {
    const select = this.#panel.querySelector(`select[data-key="${STORAGE_KEYS.levelIndex}"]`)
    const options = this.#getLevelOptions()
    select.replaceChildren(...options.map(this.#createOption))
    this.#state[STORAGE_KEYS.levelIndex] = Number(select.value)
  }

  #createOption = ({label, value}) => {
    const option = document.createElement('option')
    option.value = value
    option.textContent = label
    return option
  }

  #onNumberChange = (e) => {
    const key = e.target.dataset.key
    const v = e.target.value.trim()
    const data = this.#config.numberInputs.find((n) => n.key === key)

    const min = data.min ?? 0
    const max = data.max ?? 9999

    this.#state[key] = v === '' ? 0 : Math.max(min, Math.min(max, Number(v)))
  }

  #onSave = () => {
    this.#applySettings({...this.#state})
  }

  #applySettings = (data) => {
    const exclude = ['isDebug', 'isItemRects', 'isLog', 'forceNewYear', 'testPromo', 'testLoad']
    exclude.forEach((key) => delete data[key])
    delete data.adminLocationId

    const playerData = this.#storage.playerData
    const levelIndex = data[STORAGE_KEYS.levelIndex]
    delete data[STORAGE_KEYS.levelIndex]
    Object.assign(playerData, data)
    this.#applyLevelSelection(levelIndex)

    this.#destroy()

    SdkManager.leaderboard.setScore(playerData.userLevel).catch((err) => {
      console.log('[leaderboard.setScore]', err)
    })

    this.#storage.save(true)

    Locator.game.app.stage.visible = false
    setTimeout(() => location.reload(), 500)
  }

  #applyLevelSelection = (levelIndex) => {
    const entry = getLevelEntryByIndex(levelIndex)
    const unlockedIds = getLocations().slice(0, entry.locationIndex + 1).map(({id}) => id)
    this.#storage.playerData.unlockedLocationIds = [...new Set([...this.#storage.playerData.unlockedLocationIds, ...unlockedIds])]
    this.#storage.playerData.lastPlayedLevelId = entry.level.id
    new LevelProgress(this.#storage).selectLevel(entry.level.id, {ignoreLock: true, save: false})
  }

  #onHardReset = () => {
    this.#storage.resetAllData()
    this.#destroy()
  }

  #resetSkins = () => {
    Locator.storage.playerData.currentSkin = 'standard'
    Locator.storage.playerData.skins = ['standard']
    Locator.storage.save()
    GameUtils.showPopUp('Reset skins!')
  }

  #renderInfoSection = () => {
    const wrap = document.createElement('div')
    wrap.className = 'admin-panel__hotkeys'

    const list = document.createElement('div')
    list.className = 'admin-panel__hotkeys-list'
    ;['showPanel: 0', 'checkoutSkin: 1–5', 'nextPart: 7', 'fastWin: 8', 'nextLevel: 9'].forEach((text) => {
      const p = document.createElement('p')
      p.className = 'admin-panel__hotkeys-item'
      p.textContent = text
      list.append(p)
    })

    wrap.append(list)
    this.#panel.append(wrap)
  }

  #destroy = () => {
    this.#adminPanelWindow?.remove()
  }
}
