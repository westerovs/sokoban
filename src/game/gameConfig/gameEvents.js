/**
 * hit - ключевое событие. Эмитит HogItemComponent
 * На него подписаны:
 *  - LevelMechanicLearning
 *  - FoundItemsCounter
 *  - AdLvlTimer
 *  - FirstLevelLearning
 *  - ErrorCross
 *  - Hud
 *  - LevelSoundsSystem
 *
 * */

// todo - привести к единообразию, всё с большой буквы, т.к это ENUM
const GAME_EVENTS = {
  checkoutState: 'checkoutState',
  firstClick: 'firstClick',
  gameResize: 'gameResize',
  isDebug: 'isDebug', // сочетание горячих клавиш, посылает сигнал компоненту
  
  startHit: 'startHit',
  endHit: 'endHit',
  missClick: 'missClick',
  
  completePartLevel: 'completePartLevel', // common
  completeLevel: 'completeLevel', // common
  completeLevelWin: 'completeLevelWin',
  clearLevel: 'clearLevel', // посылает сигнал на который подписаны все модули, они самоочищаются
  botsWin: 'botsWin', // когда боты нашли раньше игрока
  
  updateTargets: 'updateTargets',
  allItemsFound: 'allItemsFound', // [LevelCounter] когда найдены все предметы на уровне
  lvCounterStat: 'lvCounterStat', // посылает статистику, сколько предметов осталось найти и сколько уже найдено
  AD: {
    onRewarded: 'ad:onRewarded',
  },
  LEVEL: {
    forceNextLevel: 'level:forceNextLevel',
  },
  paymentManager: {
    hasNoAdsPass: 'paymentManager:hasNoAdsPass',
    giveReward: 'paymentManager:giveReward',
  },
  CAMERA: {
    zoomIn: 'camera:zoomIn',
    zoomOut: 'camera:zoomOut',
  },
  Options: {
    toggleAudioVolume: 'options:toggleAudioVolume',
    checkboxZoom: 'options:checkboxZoom',
    btnCredits: 'options:btnCredits',
    hide: 'options:hide'
  },
  Timer: {
    tick: 'timer:timerTick',
    end: 'timer:timerEnd',
    kill: 'timer:kill',
  },
  Stopwatch: {
    tick: 'stopwatch:tick',
    end: 'stopwatch:end',
    kill: 'stopwatch:kill',
  },
  STORAGE: {
    // todo hintsUpdated некорректное название рудимент, так как срабатывает при любых покупках товаров
    hintsUpdated: 'storage:hintsUpdated', // срабатывает как при добавлении, так и трате хинтов todo логичнее переименовать и перенести в STORE
    usedHint: 'usedHint',
    levelUpdated: 'storage:levelUpdated',
  },
  UIManager: {
    closeModule: 'UIManager:closeModule',
  },
  // todo [PAYMENT / STORE / STORAGE] пересекается логика. Отрефакторить, переименовать!
  PAYMENT: {
    promoIsPurchased: 'store:promoIsPurchased',
  },
  STORE: {
    hide: 'store:hide',
  },
  HINTS: {
    startHint: 'hints.startHint',
    endHint: 'hints.endHint',
    COMPASS: {
      destroy: 'hints:compass:destroy',
    }
  },
  PROMO_CARD_CLICK: 'promoCardClick',
  HIDE_PROMO_CARD: 'hidePromoCard',
  DEBUG: {
    checkoutSkin: 'debug:checkoutSkin',
    
  },
}


const ADAPTER_EVENTS = {
  PAUSE_EVENT: 'pause',
  RESUME_EVENT: 'resume',
  AUDIO_ON_EVENT: 'audio_on',
  AUDIO_OFF_EVENT: 'audio_off',
}

export {
  GAME_EVENTS,
  ADAPTER_EVENTS,
}
