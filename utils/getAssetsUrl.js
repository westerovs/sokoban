/**
* Файл содержит ссылки для загрузки. Игра в зависимости от платформы может грузить ресурсы с разных источников.
* ЕСЛИ ЧТО-ТО НЕ ГРУЗИТСЯ, ПРОВЕРЬ ПУТЬ ЗАГРУЗКИ. МОГЛИ БЫТЬ ПЕРЕМЕЩЕНЫ ПАПКИ НА ХОСТЕ, АССЕТЫ, ИЛИ ИЗМЕНЁН НЕЙМИНГ.
* */

// todo выбор папки в зависимости от игры автоматизировать.
const CLOUD_VERSION = 'v12' // необходима для яндекс облака. Необязательна с вводом сброса кеша в игре.
// const GIT_PATH = 'https://raw.githubusercontent.com/shulichkate/hybrid/refs/heads/master'
const GIT_PATH = 'https://raw.githubusercontent.com/westerovs/testServer/refs/heads/main'
const GIT_FOLDER_NAME = {
  DETECTIVE: 'game2_HOPA_Simple',
  MY_HOTEL: 'game3_myHotel',
}
const HOSTING_FOLDER_NAME = {
  adventure: 'adventure',
  detective: 'detective',
  hotel: 'hotel',
  detectiveGirl: 'street-of-secrets',
}

const URLS = {
  YA_CLOUD_SERVER: `https://storage.yandexcloud.net/dra/${HOSTING_FOLDER_NAME.detective}/${CLOUD_VERSION}/`,
  OK: 'https://dravk.ru/poisk_ok/',
  VK: `https://dravk.ru/hog/${HOSTING_FOLDER_NAME.detective}/vk/`,
  PLAYGAMA_REMOTE:    `https://cdn.dra.games/hog/${HOSTING_FOLDER_NAME.detective}/playgama/`,
  CRAZY_GAMES_REMOTE: `https://cdn.dra.games/hog/${HOSTING_FOLDER_NAME.detective}/crazyGames/`,
  
  GIT_TEST_LOCAL: `${GIT_PATH}/${GIT_FOLDER_NAME.DETECTIVE}/yandex-test/localeAssets/`,
  GIT_TEST_REMOTE: `${GIT_PATH}/${GIT_FOLDER_NAME.DETECTIVE}/yandex-test/remoteAssets/`,
  
  DRA_TEST_LOCAL: `https://test.dravk.ru/hog/${HOSTING_FOLDER_NAME.detective}/yandex-test/localeAssets/`,
  DRA_TEST_REMOTE: `https://test.dravk.ru/hog/${HOSTING_FOLDER_NAME.detective}/yandex-test/remoteAssets/`,
}

const URL_PRESET = {
  // подходит для самой обычной сборки. Все ресурсы грузятся из папки assets от корня игры
  LOCAL: {
    local: '',
    remote: '',
  },
  
  // тесты гибридной загрузки, когда часть уровней грузится с облака
  GIT_TEST: {
    local: URLS.GIT_TEST_LOCAL,
    remote: URLS.GIT_TEST_REMOTE,
  },
  DRA_TEST: {
    local: '',
    remote: URLS.DRA_TEST_REMOTE,
  },
  YANDEX_BUILD_TEST: {
    local: URLS.GIT_TEST_LOCAL,
    remote: URLS.YA_CLOUD_SERVER,
  },
  
  // включать только тогда, когда яндекс нужно собрать гибридно. Как например детектив
  YANDEX_BUILD: {
    local: '',
    remote: URLS.YA_CLOUD_SERVER,
  },
  // включать только тогда, когда cg нужно собрать гибридно. Как например детектив
  CRAZY_GAMES_BUILD: {
    local: '',
    remote: URLS.CRAZY_GAMES_REMOTE,
  },
}

export {
  URL_PRESET
}
