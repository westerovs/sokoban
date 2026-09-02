// Описывает награды магазина, акций, обликов и системных действий.

// значения соответствуют карточкам в магазине
const store = {
  // others hints
  dartsHint: {
    id: 'dartsHint',
    amount: 3,
  },
  compassHint: {
    id: 'compassHint',
    amount: 3,
  },

  // money
  coinLarge: {
    id: 'coinLarge',
    amount: 5000,
  },
  coinXL: {
    id: 'coinXL',
    amount: 12000,
  },

  // magnifiers
  free: {
    id: 'free',
    amount: 3,
  },
  smallPack: {
    id: 'smallPack',
    amount: 5,
  },
  mediumPack: {
    id: 'mediumPack',
    amount: 15,
  },
  largePack: {
    id: 'largePack',
    amount: 50,
  },
  extraLargePack: {
    id: 'extraLargePack',
    amount: 100,
  },
  // AD
  noAdPack: {
    id: 'noAdPack',
  },
}

// значения соответствуют промо материалам по акции
const promo = {
  promoStartedPack: {
    id: 'promoStartedPack',
    amount: 30,
  },
  promoRemoveAdPack: {
    id: 'promoRemoveAdPack',
  },
  promoMegaHintsPack: {
    id: 'promoMegaHintsPack',
    amount: 50,
  },
}

// todo вложенные объекты, или по имени игры для избегания пересечения имён и цен
const skins = {
  // detective
  sherlock: {
    id: 'skinSherlock',
    amount: 5500,
  },
  winter: {
    id: 'skinWinter',
    amount: 5500,
  },
  christmas: {
    id: 'skinChristmas',
    amount: 7500,
  },
  santa: {
    id: 'skinSanta',
    amount: 9000,
  },

  // adventures
  greek: {
    id: 'skinBusiness',
    amount: 5500,
  },
  knight: {
    id: 'skinBusiness',
    amount: 5500,
  },
  samurai: {
    id: 'skinBusiness',
    amount: 7000,
  },
  viking: {
    id: 'skinBusiness',
    amount: 9000,
  },

  // detectiveGirl
  business: {
    id: 'skinBusiness',
    amount: 5500,
  },
  casual: {
    id: 'skinCasual',
    amount: 7500,
  },
  gala: {
    id: 'skinGala',
    amount: 9000,
  },
}

const seasonEvents = {
  newYear: {
    id: 'newYear',
    amount: 2500,
  },
}

const rewardsCatalog = {
  store,
  promo,
  skins,
  seasonEvents,
  // todo добавить анимацию
  rateUsHints: {
    id: 'rateUsHints',
    amount: 5,
  },
}

const MAGNIFIERS_IDS = [
  store.free.id,
  store.smallPack.id,
  store.mediumPack.id,
  store.largePack.id,
  store.extraLargePack.id,

  promo.promoStartedPack.id,
  promo.promoMegaHintsPack.id,
]

export {MAGNIFIERS_IDS, rewardsCatalog}
