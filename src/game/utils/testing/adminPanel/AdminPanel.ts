import i18next from 'i18next'
import {promoTooltipFromAdminPanel} from '@/game/features/promotionCards/PromoManager.js'
import LiveOpsController from '../../../components/liveOpsController/LiveOpsController.js'
import Locator from '../../../engine/Locator.ts'
import SdkManager from '../../../engine/SdkManager.js'
import {STORAGE_KEYS} from '../../../engine/storage/defaultData.js'
import LocalStorage from '../../../engine/storage/LocalStorage.js'
import type Storage from '../../../engine/storage/Storage.js'
import LevelConfig from '../../../gameConfig/levels/LevelConfig.js'
import LevelProgress from '../../../gameConfig/levels/LevelProgress.js'
import {getLevelEntries, getLevelEntryByIndex, getLocations} from '../../../gameConfig/levels/locationCatalog.js'
import GameUtils from '../../gameUtils/GameUtils.js'
import {
  createButton,
  createCheckboxItem,
  createCheckboxRow,
  createFieldsetCheckbox,
  createFieldsetGrid,
  createNumberItem,
  createNumberRow,
  createSelectRow,
} from './templates.js'

// Создаёт DOM-панель разработчика для изменения тестового профиля и перехода между уровнями.

const DEBUG_KEY = 'isDebug' // Ключ общего режима отладки
const LEARNING_TOGGLE_KEY = 'completeLearning' // Ключ группового переключателя обучения

// todo переусложнённая генерация. Изначально было пара параметров и разрослось.
export default class AdminPanel {
  #state: Record<string, any> = {}
  #config: any
  #panel!: HTMLElement
  #footer!: HTMLElement
  #adminPanelWindow!: HTMLDivElement
  #storage!: Storage

  #learningKeys: string[] = [
    STORAGE_KEYS.isTutorial_shadows,
    STORAGE_KEYS.isTutorial_words,
    STORAGE_KEYS.isTutorial_anagrams,
    STORAGE_KEYS.isTutorial_generator,
    STORAGE_KEYS.isTutorial_identical,

    STORAGE_KEYS.hintDartsIsAvailable,
    STORAGE_KEYS.hintCompassIsAvailable,
  ]

  #storeKeys: string[] = [
    STORAGE_KEYS.hints,
    STORAGE_KEYS.hintDarts,
    STORAGE_KEYS.hintCompass,
    STORAGE_KEYS.hasAdPass,
    STORAGE_KEYS.eventPurchasedNewYear,
    STORAGE_KEYS.coins,
  ]

  // Создаёт панель; переданные устаревшие аргументы намеренно не используются.
  constructor(..._legacyArguments: unknown[]) {
    this.#init()
  }

  // Загружает зависимости, состояние и DOM-представление панели.
  #init() {
    this.#storage = Locator.storage
    this.#config = this.#getConfig()

    this.#initState()
    this.#renderPanel()
    this.#renderComponents()
  }

  // Собирает описание редактируемых полей панели.
  #getConfig = () => {
    const {playerData} = this.#storage

    return {
      checkboxes: [
        {
          key: DEBUG_KEY,
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

      numberInputs: [
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

  // Заполняет временное состояние текущими значениями.
  #initState() {
    this.#config.checkboxes.forEach((checkbox: any) => (this.#state[checkbox.key] = checkbox.value))
    this.#config.numberInputs.forEach((input: any) => (this.#state[input.key] = input.value))
    this.#state[STORAGE_KEYS.levelIndex] = this.#storage.playerData.levelIndex
    this.#state.adminLocationId = getLevelEntryByIndex(this.#state[STORAGE_KEYS.levelIndex]).location.id
  }

  // Создаёт оболочку панели и добавляет её в документ.
  #renderPanel = () => {
    this.#adminPanelWindow = document.createElement('div')
    this.#adminPanelWindow.className = 'admin-panel__bg'
    this.#adminPanelWindow.innerHTML = `
      <section class="admin-panel__window" role="dialog" aria-modal="true" aria-label="Панель разработчика">
        <header class="admin-panel__header">
          <h2>Панель разработчика</h2>
          <button class="admin-panel__close" type="button" aria-label="Закрыть">&times;</button>
        </header>
        <div class="admin-panel__content"></div>
        <footer class="admin-panel__footer"></footer>
      </section>`
    document.body.append(this.#adminPanelWindow)

    this.#panel = this.#adminPanelWindow.querySelector<HTMLElement>('.admin-panel__content')!
    this.#footer = this.#adminPanelWindow.querySelector<HTMLElement>('.admin-panel__footer')!
    this.#adminPanelWindow.querySelector('.admin-panel__close')?.addEventListener('click', this.#destroy)
  }

  // Последовательно создаёт разделы панели.
  #renderComponents = () => {
    this.#renderLevelNavigation()
    this.#renderDebugGroup()
    this.#renderLearningGroup()
    this.#renderStoreGroup()
    this.#renderPlayerGroup()
    this.#renderButtons()
    this.#renderInfoSection()
  }

  // Создаёт группу общих отладочных настроек.
  #renderDebugGroup() {
    const grid = createFieldsetGrid(this.#panel, 'Debug')
    const debugCheckboxes = this.#getDebugCheckboxes()
    const debugToggle = debugCheckboxes.find(({key}: {key: string}) => key === DEBUG_KEY)

    createFieldsetCheckbox(grid, {...debugToggle, ariaLabel: 'Включить режим отладки'}, this.#onCheckboxChange)
    debugCheckboxes
      .filter(({key}: {key: string}) => key !== DEBUG_KEY)
      .forEach((checkbox: any) => grid.append(createCheckboxRow(checkbox, this.#onCheckboxChange)))

    this.#updateDebugInputsAvailability()
  }

  // Возвращает поля общей отладки без обучения и магазина.
  #getDebugCheckboxes(): any[] {
    return this.#config.checkboxes.filter(({key}: {key: string}) => !this.#learningKeys.includes(key) && !this.#storeKeys.includes(key))
  }

  // Обновляет доступность полей согласно общему режиму отладки.
  #updateDebugInputsAvailability() {
    const isDebugEnabled = !!this.#state[DEBUG_KEY]

    this.#getDebugCheckboxes()
      .filter(({key}: {key: string}) => key !== DEBUG_KEY)
      .forEach(({key, disabled}: {key: string; disabled?: boolean}) => {
        const input = this.#panel.querySelector<HTMLInputElement>(`input[data-key="${key}"]`)
        if (input) input.disabled = !isDebugEnabled || !!disabled
      })
  }

  // Создаёт выбор локации и уровня.
  #renderLevelNavigation() {
    const grid = createFieldsetGrid(this.#panel, `Уровни (${LevelConfig.getMaxLevels() + 1})`)
    grid.classList.add('admin-panel__fieldset-container--levels')

    const locationData = {key: 'adminLocationId', label: 'Локация', value: this.#state.adminLocationId}
    const locationOptions = getLocations().map(({id, titleKey}) => ({label: i18next.t(titleKey), value: id}))
    grid.append(createSelectRow(locationData, locationOptions, this.#onSelectChange))

    const levelData = {key: STORAGE_KEYS.levelIndex, label: 'Уровень', value: this.#state[STORAGE_KEYS.levelIndex]}
    grid.append(createSelectRow(levelData, this.#getLevelOptions(), this.#onSelectChange))
  }

  // Возвращает уровни выбранной в панели локации.
  #getLevelOptions() {
    return getLevelEntries()
      .map((entry, globalIndex) => ({...entry, globalIndex}))
      .filter(({location}) => location.id === this.#state.adminLocationId)
      .map(({globalIndex, level, locationLevelIndex}) => ({
        label: `${globalIndex + 1}. ${i18next.t('level')} ${locationLevelIndex + 1} · ${level.id}`,
        value: globalIndex,
      }))
  }

  // Создаёт группу флагов обучения.
  #renderLearningGroup() {
    const grid = createFieldsetGrid(this.#panel, 'Learning')
    createFieldsetCheckbox(
      grid,
      {
        key: LEARNING_TOGGLE_KEY,
        value: false,
        ariaLabel: 'Отметить всё обучение выполненным',
        tooltip: 'Отметить все этапы обучения выполненными',
      },
      this.#onLearningToggle,
    )

    this.#config.checkboxes
      .filter((checkbox: any) => this.#learningKeys.includes(checkbox.key))
      .forEach((checkbox: any) => {
        grid.append(createCheckboxItem(checkbox, this.#onCheckboxChange))
      })
  }

  // Одновременно меняет все флаги обучения.
  #setLearningValues(checked: boolean) {
    this.#learningKeys.forEach((key) => {
      this.#state[key] = checked

      const input = this.#panel.querySelector<HTMLInputElement>(`input[data-key="${key}"]`)
      if (input) input.checked = checked
    })
  }

  // Обрабатывает групповой переключатель обучения.
  #onLearningToggle = (event: Event) => {
    this.#setLearningValues((event.target as HTMLInputElement).checked)
  }

  // Синхронизирует состояние группового переключателя обучения.
  #updateLearningToggle() {
    const input = this.#panel.querySelector<HTMLInputElement>(`input[data-key="${LEARNING_TOGGLE_KEY}"]`)
    if (input) input.checked = this.#learningKeys.every((key) => !!this.#state[key])
  }

  // Создаёт группу тестовых значений магазина.
  #renderStoreGroup() {
    const grid = createFieldsetGrid(this.#panel, 'Store')

    // ЧЕКБОКСЫ Store
    this.#config.checkboxes
      .filter((checkbox: any) => this.#storeKeys.includes(checkbox.key))
      .forEach((checkbox: any) => {
        grid.append(createCheckboxItem(checkbox, this.#onCheckboxChange))
      })

    // NUMBER INPUTS Store
    this.#config.numberInputs
      .filter((input: any) => this.#storeKeys.includes(input.key))
      .forEach((input: any) => {
        grid.append(createNumberItem(input, this.#onNumberChange))
      })
  }

  // Создаёт группу значений профиля игрока.
  #renderPlayerGroup() {
    const grid = createFieldsetGrid(this.#panel, 'Игрок')

    this.#config.numberInputs
      .filter((input: any) => !this.#storeKeys.includes(input.key))
      .forEach((input: any) => {
        grid.append(createNumberRow(input, this.#onNumberChange))
      })
  }

  // Создаёт кнопки сохранения и сброса.
  #renderButtons() {
    const row = document.createElement('div')
    row.className = 'admin-panel__row'

    const saveBtn = createButton('Save', 'admin-panel__btn admin-panel__btn--save', this.#onSave)
    const resetBtn = createButton('Hard Reset', 'admin-panel__btn admin-panel__btn--reset', this.#onHardReset)
    const resetSkins = createButton('Reset Skins', 'admin-panel__btn', this.#resetSkins)

    row.append(saveBtn, resetSkins, resetBtn)
    this.#footer.append(row)
  }

  // Обрабатывает изменение одиночного переключателя.
  #onCheckboxChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const key = target.dataset.key!
    const checked = target.checked

    this.#state[key] = checked

    if (key === DEBUG_KEY) {
      LocalStorage.isDebug = checked
      this.#updateDebugInputsAvailability()
    }
    if (this.#learningKeys.includes(key)) this.#updateLearningToggle()
    if (key === 'isLog') LocalStorage.isLog = checked
    if (key === 'forceNewYear') LocalStorage.forceNewYear = checked
    if (key === 'isItemRects') LocalStorage.isItemRects = checked
    if (key === 'testPromo') LocalStorage.testPromo = checked
    if (key === 'testLoad') LocalStorage.testLoad = checked
  }

  // Обрабатывает выбор локации или уровня.
  #onSelectChange = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const key = target.dataset.key!
    this.#state[key] = key === 'adminLocationId' ? target.value : Number(target.value)
    if (key === 'adminLocationId') this.#updateLevelSelect()
  }

  // Перестраивает список уровней выбранной локации.
  #updateLevelSelect() {
    const select = this.#panel.querySelector<HTMLSelectElement>(`select[data-key="${STORAGE_KEYS.levelIndex}"]`)!
    const options = this.#getLevelOptions()
    select.replaceChildren(...options.map(this.#createOption))
    this.#state[STORAGE_KEYS.levelIndex] = Number(select.value)
  }

  // Создаёт DOM-элемент варианта уровня.
  #createOption = ({label, value}: {label: string; value: string | number}) => {
    const option = document.createElement('option')
    option.value = String(value)
    option.textContent = label
    return option
  }

  // Обрабатывает изменение числового поля.
  #onNumberChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const key = target.dataset.key!
    const v = target.value.trim()
    const data = this.#config.numberInputs.find((input: any) => input.key === key)

    const min = data.min ?? 0
    const max = data.max ?? 9999

    this.#state[key] = v === '' ? 0 : Math.max(min, Math.min(max, Number(v)))
  }

  // Применяет временные значения панели.
  #onSave = () => {
    this.#applySettings({...this.#state})
  }

  // Переносит настройки в профиль и сохраняет его.
  #applySettings = (data: Record<string, any>) => {
    const exclude = ['isDebug', 'isItemRects', 'isLog', 'forceNewYear', 'testPromo', 'testLoad']
    exclude.forEach((key) => delete data[key])
    delete data.adminLocationId

    const playerData = this.#storage.playerData
    const levelIndex = data[STORAGE_KEYS.levelIndex]
    delete data[STORAGE_KEYS.levelIndex]
    Object.assign(playerData, data)
    this.#applyLevelSelection(levelIndex)

    this.#destroy()

    SdkManager.leaderboard.setScore(playerData.userLevel).catch((err: unknown) => {
      console.log('[leaderboard.setScore]', err)
    })

    this.#storage.save(true)

    Locator.game.app.stage.visible = false
    setTimeout(() => location.reload(), 500)
  }

  // Разблокирует путь к выбранному уровню и делает его текущим.
  #applyLevelSelection = (levelIndex: number) => {
    const entry = getLevelEntryByIndex(levelIndex)
    const unlockedIds = getLocations()
      .slice(0, entry.locationIndex + 1)
      .map(({id}) => id)
    this.#storage.playerData.unlockedLocationIds = [...new Set([...this.#storage.playerData.unlockedLocationIds, ...unlockedIds])]
    this.#storage.playerData.lastPlayedLevelId = entry.level.id
    new LevelProgress(this.#storage).selectLevel(entry.level.id, {ignoreLock: true, save: false})
  }

  // Полностью сбрасывает профиль игрока.
  #onHardReset = () => {
    this.#storage.resetAllData()
    this.#destroy()
  }

  // Сбрасывает открытые облики к стандартному.
  #resetSkins = () => {
    Locator.storage.playerData.currentSkin = 'standard'
    Locator.storage.playerData.skins = ['standard']
    Locator.storage.save()
    GameUtils.showPopUp('Reset skins!')
  }

  // Добавляет справку по горячим клавишам.
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

  // Удаляет панель из документа.
  #destroy = () => {
    this.#adminPanelWindow?.remove()
  }
}
