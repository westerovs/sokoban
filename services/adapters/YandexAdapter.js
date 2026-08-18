/******/ // The require scope
/******/ var __webpack_require__ = {};
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  A: () => (/* binding */ YandexAdapter)
});

;// ./adapters/constants.ts
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const IS_ANDROID = /Android/i.test(navigator.userAgent);
const PAUSE_EVENT = "pause";
const RESUME_EVENT = "resume";
const AUDIO_ON_EVENT = "audio_on";
const AUDIO_OFF_EVENT = "audio_off";
;// ./adapters/AsyncObject.ts
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
class AsyncObject {
  constructor(initFunction) {
    this.initFunction = initFunction;
    _defineProperty(this, "waiters", []);
    _defineProperty(this, "isStarted", false);
    _defineProperty(this, "object", void 0);
    _defineProperty(this, "isInitialized", false);
  }
  get() {
    this.init(...arguments);
    if (this.isInitialized) return Promise.resolve(this.object);
    return this.newWaiter();
  }
  init() {
    if (this.isStarted) return Promise.resolve();
    this.isStarted = true;
    return this.initFunction(...arguments).then(_object => {
      this.object = _object;
      this.callWaiters(true);
    }).catch(err => {
      this.isStarted = false;
      console.error("AsyncObject.init error", err);
      this.callWaiters(false, err);
    });
  }
  newWaiter() {
    const promise = new Promise((resolve, reject) => {
      this.waiters.push({
        resolve,
        reject
      });
    });
    return promise;
  }
  callWaiters(isSuccess) {
    let error = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    this.isInitialized = true;
    this.waiters.forEach(waiter => {
      if (isSuccess) waiter.resolve(this.object);else waiter.reject(error);
    });
  }
}
;// ./adapters/helpingFunctiouns.ts

const scripts = {};
function includeScript(src, tagId) {
  if (scripts[src]) return scripts[src].get();
  if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
  const asyncObject = new AsyncObject(() => {
    let resolve, reject;
    const script = document.createElement("script"),
      promise = new Promise((r, j) => {
        resolve = r;
        reject = j;
      });
    script.onload = () => {
      console.log(`script ${src} loaded`);
      resolve();
    };
    script.onerror = e => {
      console.error(`script ${src} error`, e);
      reject(e);
    };
    script.src = src;
    if (tagId) script.id = tagId;
    document.head.appendChild(script);
    console.log("includeScript()", src);
    return promise;
  });
  scripts[src] = asyncObject;
  return asyncObject.get();
}
;
function parseJSON(json) {
  let defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
  try {
    return JSON.parse(json);
  } catch (e) {
    console.warn("parseJSON()", e);
    //if(typeof json === "string" && json.length > 0)return json.split(",");
    return defaultValue;
  }
}
;
function stringifyJSON(data) {
  try {
    return JSON.stringify(data);
  } catch (e) {
    console.error("stringifyJSON()", e);
    return "";
  }
}
;
function getQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const params = {};
  urlParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
;
function getQueryParam(key) {
  const params = getQueryParams();
  return params[key];
}
;
function getNewPromise() {
  let resolve, reject;
  const promise = new Promise((r, j) => {
    resolve = r;
    reject = j;
  });
  return {
    promise,
    resolve,
    reject
  };
}
;
function setPromiseTimeout(timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timeout);
  });
}
;
;// ./adapters/Base/api.ts


const WAIT_REQUEST_TIMEOUT = SECOND * 5;
const TIMEOUT_ERROR_MESSAGE = "Request timeout";
const MAIN_DOMAIN = "bbb.dra.games";
const SUB_DOMAIN = "bbbb.dravk.ru";
const PORTS = [];
const SUB_PORTS = [8443, 17321, 12854, 7543].sort(() => Math.random() - 0.5);
SUB_PORTS.push(443);
let portIndex = 0;
let DOMAIN = MAIN_DOMAIN;
;
const API_COMMAND = "/api";
const GET_DATA_API_COMMAND = API_COMMAND + "/get-data";
const SAVE_DATA_API_COMMAND = API_COMMAND + "/save-data";
const PLAYERS_API_COMMAND = API_COMMAND + "/players";
const GET_LEADERBOARD_API_COMMAND = PLAYERS_API_COMMAND + "/get-leaderboard";
const SAVE_SCORE_API_COMMAND = PLAYERS_API_COMMAND + "/save-score";
const PURCHASE_API_COMMAND = API_COMMAND + "/purchase";
const OK_PURCHASE_API_COMMAND = PURCHASE_API_COMMAND + "/ok";
const VK_PURCHASE_API_COMMAND = PURCHASE_API_COMMAND + "/vk";
const YANDEX_PURCHASE_API_COMMAND = PURCHASE_API_COMMAND + "/ya";
function switchToSubDomain() {
  setDomain(SUB_DOMAIN);
  PORTS.splice(0, PORTS.length, ...SUB_PORTS);
}
;
function setDomain(domain) {
  DOMAIN = domain;
}
;
function apiRequest(pathData, data) {
  return tryApiRequest(pathData, data, PORTS.length);
}
;
function tryApiRequest(pathData, data, retries) {
  const canChangePort = retries > 0 && pathData.port === undefined,
    tryFetchPromise = tryFetch(pathData, data);
  if (canChangePort) {
    return Promise.race([tryFetchPromise, setPromiseTimeout(WAIT_REQUEST_TIMEOUT).then(() => Promise.reject(TIMEOUT_ERROR_MESSAGE))]).catch(e => {
      if (e === TIMEOUT_ERROR_MESSAGE) return tryNextPort(pathData, data, retries - 1);
      return Promise.reject(e);
    });
  }
  return tryFetchPromise;
}
;
function tryFetch(pathData, data) {
  return fetch(getPath(pathData), data).then(e => e.json());
}
;
function getPath(pathData) {
  return `${pathData.protocol || "https"}://${pathData.domain || DOMAIN}:${pathData.port || getPort()}${pathData.command}`;
}
;
function tryNextPort(pathData, data, retries) {
  nextPort();
  return tryApiRequest(pathData, data, retries);
}
;
function getPort() {
  if (!PORTS.length) return 443;
  return PORTS[portIndex % PORTS.length];
}
;
function nextPort() {
  portIndex++;
}
;
;// ./adapters/Base/Advertising.ts
function Advertising_defineProperty(e, r, t) { return (r = Advertising_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function Advertising_toPropertyKey(t) { var i = Advertising_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function Advertising_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

const ADVERTISING_SOUND_STATUS_KEY = "advertising";
;
class Advertising {
  constructor(adapter) {
    this.adapter = adapter;
    Advertising_defineProperty(this, "lastInterstitialTime", 0);
    Advertising_defineProperty(this, "interstitialInterval", MINUTE);
    Advertising_defineProperty(this, "rules", {
      preroll: false,
      pause: false,
      tutorial: false
    });
  }
  init() {
    return Promise.resolve(false);
  }
  showPreroll() {
    return this.showInterstitial();
  }
  showRewarded() {
    this.mute();
    return this._showRewarded().finally(() => {
      this.unmute();
    });
  }
  _showRewarded() {
    return Promise.reject();
  }
  isRewardedAvailableNow() {
    return false;
  }
  showInterstitial() {
    const t = Date.now();
    if (Math.abs(t - this.lastInterstitialTime) < this.interstitialInterval) return Promise.reject("frequency limit");
    this.mute();
    return this._showInterstitial().finally(() => {
      this.unmute();
    }).then(e => {
      this.lastInterstitialTime = Date.now();
      return Promise.resolve(e);
    });
  }
  _showInterstitial() {
    return Promise.reject();
  }
  showBanner() {
    return Promise.reject();
  }
  hideBanner() {
    return Promise.resolve();
  }
  getRules() {
    return Object.assign({}, this.rules);
  }
  isAdaptiveBannerAvailable() {
    return this.isAdaptiveBannersAvailable();
  }
  isAdaptiveBannersAvailable() {
    return false;
  }
  setAdaptiveBannersAreas(areas) {}
  showAllAdaptiveBanners() {}
  hideAllAdaptiveBanners() {}
  setAdaptiveBannersVisibility(array) {}
  debugAdaptiveBanners() {}
  preloadAdaptiveBanners(mask) {}
  mute() {
    this.adapter.soundStatus.mute(ADVERTISING_SOUND_STATUS_KEY);
  }
  unmute() {
    this.adapter.soundStatus.unmute(ADVERTISING_SOUND_STATUS_KEY);
  }
}
;
;// ./adapters/Base/Player.ts
class Player {
  constructor(adapter) {
    this.adapter = adapter;
  }
  init() {
    return Promise.resolve(null);
  }
  isAuthAvailable() {
    return false;
  }
  isAuth() {
    return false;
  }
  auth() {
    return Promise.reject();
  }
  getId() {
    return "";
  }
  getName() {
    return "";
  }
  getAvatar() {
    return "";
  }
}
;
;// ./adapters/Base/Purchase.ts
function Purchase_defineProperty(e, r, t) { return (r = Purchase_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function Purchase_toPropertyKey(t) { var i = Purchase_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function Purchase_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


const PURCHASE_SOUND_STATUS_KEY = "purchase";
class Purchase {
  constructor(adapter) {
    this.adapter = adapter;
    Purchase_defineProperty(this, "purchaseCommand", "");
    Purchase_defineProperty(this, "available", false);
    Purchase_defineProperty(this, "catalog", new AsyncObject(() => this.loadCatalog()));
  } //
  init() {
    return Promise.resolve();
  }
  isAvailable() {
    return this.available;
  }
  getCurrency() {
    let v = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    return "";
  }
  getCatalog() {
    return this.catalog.get();
  }
  buy(id) {
    if (!this.isAvailable()) return Promise.reject("Purchase is not available");
    this.mute();
    return this.buyOnPlatform(id).then(() => this.tryGetPurchases()).finally(() => {
      this.unmute();
    }).then(arr => {
      const purchase = arr.find(el1 => el1.productID === id) || null;
      if (!purchase) return Promise.reject();
      return purchase;
    });
  }
  getPurchases() {
    if (!this.isAvailable()) return Promise.reject("Purchase is not available");
    return this.adapter.server.request({
      command: this.purchaseCommand + "/get-transactions",
      data: {
        "app_id": this.getAppId(),
        "user_id": this.adapter.player.getId()
      }
    }).then(e => {
      if (e.error || !e.data) return Promise.reject(e.error);
      return e.data.filter(el => {
        return el["status"] !== "closed";
      }).map(el => {
        return this.formatPurchase(el);
      }) || [];
    });
  }
  consumePurchase(purchaseToken) {
    if (!this.isAvailable()) return Promise.reject("Purchase is not available");
    console.log("consumePurchase", {
      "transaction_id": purchaseToken,
      "app_id": this.getAppId(),
      "user_id": this.adapter.player.getId(),
      "sign": this.getSign()
    });
    return this.adapter.server.request({
      command: this.purchaseCommand + "/close-transaction",
      data: {
        "transaction_id": purchaseToken,
        "app_id": this.getAppId(),
        "user_id": this.adapter.player.getId(),
        "sign": this.getSign()
      },
      retries: 3
    }).then(e => {
      if (e.error) return Promise.reject(e.error);
      return true;
    });
  }
  registerPurchase(data) {
    if (!this.isAvailable()) return Promise.reject("Purchase is not available");
    if (!data) return Promise.reject("registerPurchase: data is not set");
    console.log("registerPurchase", {
      "app_id": this.getAppId(),
      "user_id": this.adapter.player.getId(),
      data
    });
    return this.adapter.server.request({
      command: this.purchaseCommand + "/register-transaction",
      data: {
        "app_id": this.getAppId(),
        "user_id": this.adapter.player.getId(),
        data
      },
      retries: 3
    }).then(e => {
      if (e.error) return Promise.reject(e.error);
      return true;
    });
  }
  formatPurchase(purchase) {
    return {
      "purchaseToken": purchase["transaction_id"],
      "productID": purchase["data"]["product_code"]
    };
  }
  getAppId() {
    return this.adapter.options["app_id"] || "";
  }
  getSign() {
    return "";
  }
  buyOnPlatform(id) {
    return Promise.reject();
  }
  tryGetPurchases() {
    const maxAttempts = 5;
    let attempts = maxAttempts;
    return new Promise((resolve, reject) => {
      const f = () => {
        if (attempts <= 0) return reject("no purchases");
        attempts -= 1;
        this.timeoutGetPurchases((1 + Math.pow(maxAttempts - attempts, 2) * .3) * SECOND).then(arr => {
          if (arr.length) {
            resolve(arr);
          } else {
            f();
          }
        }).catch(e => {
          console.error(e);
          f();
        });
      };
      f();
    });
  }
  timeoutGetPurchases() {
    let time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : SECOND;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.getPurchases().then(resolve).catch(reject);
      }, time);
    });
  }
  getCatalogUrl() {
    return this.adapter.options["catalog_url"] || "";
  }
  loadCatalog() {
    const url = this.getCatalogUrl();
    if (!url) {
      console.warn("catalog_url is not set");
      return Promise.resolve(null);
    }
    return fetch(url + "?t=" + Date.now()).then(response => response.json()).catch(e => {
      console.error("loadCatalog", e);
      return null;
    });
  }
  mute() {
    this.adapter.soundStatus.mute(PURCHASE_SOUND_STATUS_KEY);
  }
  unmute() {
    this.adapter.soundStatus.unmute(PURCHASE_SOUND_STATUS_KEY);
  }
}
;
;// ./adapters/Base/CommonServer.ts
function CommonServer_defineProperty(e, r, t) { return (r = CommonServer_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function CommonServer_toPropertyKey(t) { var i = CommonServer_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function CommonServer_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



const IS_NOT_READY_ERR = "CommonServer error: game code or player id is not set";
;
class CommonServer {
  constructor(adapter) {
    this.adapter = adapter;
    CommonServer_defineProperty(this, "lastSnapshot", "");
    CommonServer_defineProperty(this, "lastSaveTime", 0);
    CommonServer_defineProperty(this, "timer", null);
    CommonServer_defineProperty(this, "saveStep", SECOND);
    CommonServer_defineProperty(this, "score", void 0);
    CommonServer_defineProperty(this, "extra_data", void 0);
    CommonServer_defineProperty(this, "game_data", void 0);
    CommonServer_defineProperty(this, "saveCallbacks", []);
  }
  init() {
    return Promise.resolve();
  }
  setExtraData(data) {
    this.extra_data = stringifyJSON(data);
  }
  getExtraData() {
    return parseJSON(this.extra_data || "{}");
  }
  setScore(score) {
    this.score = score;
  }
  setGameData(data) {
    this.game_data = stringifyJSON(data);
  }
  load() {
    if (!this.isReady()) return Promise.reject(IS_NOT_READY_ERR);
    return this.request({
      command: GET_DATA_API_COMMAND,
      data: {
        game_code: this.getGameCode(),
        player_id: this.getPlayerId()
      },
      retries: 2
    }).then(e => {
      if (!e?.data) return Promise.reject();
      this.actualizeData(e.data);
      return Promise.resolve(parseJSON(this.game_data || ""));
    });
  }
  save() {
    let force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    if (!this.isReady()) return Promise.reject(IS_NOT_READY_ERR);
    const promise = this.createSaveResolve();
    if (force) {
      this.imidiateSave();
    } else {
      this.timeoutSave();
    }
    return promise;
  }
  api() {
    return this.request({
      command: API_COMMAND,
      data: {}
    });
  }
  time() {
    return this.api().then(e => e.timestamp);
  }
  actualizeData(data) {
    if (!data) return;
    console.log("actualizeData", data);
    if (data.game_data) this.game_data = data.game_data;
    if (data.score) this.score = data.score;
    if (data.extra_data) this.extra_data = data.extra_data;
    this.lastSnapshot = this.captureDataSnapshot();
  }
  createSaveResolve() {
    return new Promise((resolve, reject) => {
      this.saveCallbacks.push({
        resolve,
        reject
      });
    });
  }
  imidiateSave() {
    console.log("imidiateSave");
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.saveAllData();
  }
  timeoutSave() {
    console.log("timeoutSave");
    const now = Date.now(),
      lastSaveTime = this.lastSaveTime,
      saveStep = this.saveStep,
      lastSaveTimeDiff = now - lastSaveTime;
    if (lastSaveTimeDiff >= saveStep) {
      this.imidiateSave();
    } else if (!this.timer) {
      this.timer = setTimeout(() => {
        this.imidiateSave();
      }, Math.max(0, saveStep - lastSaveTimeDiff));
    }
  }
  saveAllData() {
    console.log("saveAllData");
    const lastSnapshot = this.lastSnapshot,
      snapshot = this.captureDataSnapshot();
    if (lastSnapshot === snapshot) {
      this.callSaveResolves({
        success: true,
        data: null
      });
      return;
    }
    console.log("saveAllData snapshot changed");
    const changedData = this.getChangedData();
    console.log("saveAllData changedData", changedData);
    if (!changedData || Object.keys(changedData).length === 0) {
      this.callSaveResolves({
        success: true
      });
      return;
    }
    this.lastSnapshot = snapshot;
    this.lastSaveTime = Date.now();
    this.request({
      command: SAVE_DATA_API_COMMAND,
      data: {
        game_code: this.getGameCode(),
        player_id: this.getPlayerId(),
        ...changedData
      },
      retries: 2
    }).then(e => {
      this.lastSnapshot = snapshot;
      this.callSaveResolves({
        success: true,
        data: e
      });
    }).catch(e => {
      this.lastSnapshot = lastSnapshot;
      this.callSaveRejects(e);
    });
  }
  captureDataSnapshot() {
    return stringifyJSON({
      game_code: this.getGameCode(),
      player_id: this.getPlayerId(),
      game_data: this.game_data,
      score: this.score,
      extra_data: this.extra_data
    });
  }
  snapshotToSave(snapshot) {
    return parseJSON(snapshot);
  }
  getChangedData() {
    const currentSave = {
      game_data: this.game_data,
      score: this.score,
      extra_data: this.extra_data
    };
    if (!this.lastSnapshot) return currentSave;
    const lastSave = this.snapshotToSave(this.lastSnapshot),
      changedData = {};
    console.log("changedData", {
      lastSave,
      currentSave
    });
    Object.keys(currentSave).forEach(key => {
      if (lastSave[key] != currentSave[key]) changedData[key] = currentSave[key];
    });
    return changedData;
  }
  callSaveResolves(res) {
    this.saveCallbacks.forEach(callback => {
      callback.resolve(res);
    });
    this.saveCallbacks = [];
  }
  callSaveRejects(err) {
    this.saveCallbacks.forEach(callback => {
      callback.reject(err);
    });
    this.saveCallbacks = [];
  }
  getLb() {
    let top_limit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
    let nearby_limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 6;
    if (!this.isReady()) return Promise.reject(IS_NOT_READY_ERR);
    return this.request({
      command: GET_LEADERBOARD_API_COMMAND,
      data: {
        game_code: this.getGameCode(),
        player_id: this.getPlayerId(),
        top_limit,
        nearby_limit
      },
      retries: 1
    }).then(e => {
      return Promise.resolve(e?.data || {});
    }).catch(e => {
      return Promise.resolve(null);
    });
  }
  request(data) {
    const defaultRequest = {
      command: "",
      contentType: "application/json",
      retries: 0,
      data: null,
      method: "POST"
    };
    data = {
      ...defaultRequest,
      ...data
    };
    let retries = data.retries || 0;
    return new Promise((resolve, reject) => {
      const attempt = () => {
        this.requestAttempt(data).then(e => {
          resolve(e);
        }).catch(e => {
          if (retries > 0) {
            retries--;
            attempt();
          } else {
            reject(e);
          }
        });
      };
      attempt();
    });
  }
  requestAttempt(data) {
    console.log("requestAttempt", data);
    return apiRequest({
      command: GET_DATA_API_COMMAND //
    }, {
      method: data.method,
      headers: {
        "Content-Type": data.contentType || "application/json"
      },
      body: JSON.stringify(data.data)
    }).then(e => {
      console.log("SERVER request success", {
        ...data,
        response: e
      });
      return e;
    }).catch(e => {
      console.error("SERVER request error", {
        ...data,
        response: e
      });
      return Promise.reject(e);
    });
  }
  isReady() {
    return !!(this.getGameCode() && this.getPlayerId());
  }
  getGameCode() {
    return this.adapter.getGameCode();
  }
  getPlayerId() {
    return this.adapter.player.getId();
  }
}
;
;// ./adapters/Base/submodules/SubModule.ts
function SubModule_defineProperty(e, r, t) { return (r = SubModule_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function SubModule_toPropertyKey(t) { var i = SubModule_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function SubModule_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
class SubModule {
  constructor(adapter) {
    this.adapter = adapter;
    SubModule_defineProperty(this, "status", false);
    SubModule_defineProperty(this, "available", false);
  }
  init() {
    return Promise.resolve();
  }
  isAvailable() {
    return this.available;
  }
  act(options) {
    console.log("base act", options);
    return Promise.reject();
  }
  getStatus() {
    return this.status;
  }
  shouldAct() {
    console.log("shouldAct");
    return this.isAvailable() && !this.getStatus();
  }
}
;
;// ./adapters/Base/Storage.ts
class Storage {
  constructor(adapter) {
    this.adapter = adapter;
  }
  init() {
    return Promise.resolve(null);
  }
  getLocalStorage() {
    return window.localStorage || window.sessionStorage;
  }
  set(data) {
    let force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    this.adapter.server.setGameData(data);
    this.setToPlatform(data, force);
    return this.adapter.server.save(force);
  }
  get(keys) {
    return Promise.all([this.getFromServer(), this.getFromPlatform(keys)]).then(saves => {
      console.log("saves", saves);
      return saves.filter(data => !!data);
    });
  }
  setToPlatform(data, force) {
    return Promise.resolve(null);
  }
  getFromPlatform(keys) {
    return Promise.resolve(null);
  }
  getFromServer() {
    return this.adapter.server.load().catch(() => null);
  }
}
;// ./adapters/Base/Leaderboard.ts
function Leaderboard_defineProperty(e, r, t) { return (r = Leaderboard_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function Leaderboard_toPropertyKey(t) { var i = Leaderboard_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function Leaderboard_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const DEFAULT_LEADERBOARD_ID = "default";
class Leaderboard {
  constructor(adapter) {
    this.adapter = adapter;
    Leaderboard_defineProperty(this, "available", true);
  }
  init() {
    return Promise.resolve();
  }
  isAvailable() {
    return this.available;
  }
  getScore() {
    return this.getEntry().then(entry => {
      return entry?.score || 0;
    }).catch(() => 0);
  }
  setScore(score) {
    let force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    return this.adapter.leaderboards.setScore(DEFAULT_LEADERBOARD_ID, score);
  }
  addScore(v) {
    v = Number(v) || 0;
    return this.getScore().then(score => {
      return this.setScore(score + v);
    });
  }
  setExtraData(data) {
    return this.adapter.leaderboards.setExtraData(DEFAULT_LEADERBOARD_ID, data);
  }
  getEntries() {
    let top_limit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
    let nearby_limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 6;
    return this.adapter.leaderboards.getEntries(DEFAULT_LEADERBOARD_ID, top_limit, nearby_limit);
  }
  getEntry() {
    return this.getEntries(0, 0).then(entries => {
      if (!entries.length) return Promise.reject();
      return entries[0];
    });
  }
  sortServerEntries(data) {
    let max = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    const top = data.top || [],
      nearby = data.nearby || [],
      player = data.player,
      res = [],
      add = el => {
        if (!el || res.find(el0 => el0["player_id"] === el["player_id"])) return;
        res.push(el);
      };
    add(player);
    nearby.forEach(add);
    top.forEach(add);
    res.length = Math.min(res.length, Math.max(max, 1));
    res.sort((a, b) => {
      return a.rank - b.rank;
    });
    return res;
  }
  formatEntries(serverEntries) {
    return Promise.all(serverEntries.map(el => {
      const extra = JSON.parse(el.extra_data || "{}");
      return {
        id: el.player_id,
        score: Number(el.score) || 0,
        rank: Number(el.rank) || 0,
        avatar: extra.avatar || "",
        title: extra.title || "",
        extra_data: extra
      };
    }));
  }
}
;
;// ./adapters/Base/EmptyLeaderboard.ts
function EmptyLeaderboard_defineProperty(e, r, t) { return (r = EmptyLeaderboard_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function EmptyLeaderboard_toPropertyKey(t) { var i = EmptyLeaderboard_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function EmptyLeaderboard_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

class EmptyLeaderboard extends Leaderboard {
  constructor() {
    super(...arguments);
    EmptyLeaderboard_defineProperty(this, "available", false);
  }
  getScore() {
    return Promise.resolve(0);
  }
  setScore(score) {
    let force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    return Promise.reject();
  }
  setExtraData(data, force) {
    return Promise.reject();
  }
  getEntries() {
    let top_limit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
    let nearby_limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 6;
    return Promise.resolve([]);
  }
}
;// ./adapters/Base/Session.ts
function Session_defineProperty(e, r, t) { return (r = Session_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function Session_toPropertyKey(t) { var i = Session_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function Session_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


function getHost() {
  return getPath({
    protocol: "wss",
    command: ""
  });
}
;
const MESSAGE_SESSION_IS_EXPIRED = "Session is expired";
const EXPIRED_CODE = 4000;
;
;
const LOCALIZATION = {
  "en": {
    "title": "Your session has ended",
    "description": "You started the game on another device or in a new tab. Only one active session is allowed at a time to protect your data. Refresh the page to continue playing here."
  },
  "ru": {
    "title": "Ваша сессия завершена",
    "description": "Вы запустили игру на другом устройстве или в новой вкладке. Одновременно может быть только одна активная сессия, чтобы защитить ваши данные. Обновите страницу, чтобы продолжить игру здесь."
  }
};
class Session {
  constructor(adapter) {
    this.adapter = adapter;
    Session_defineProperty(this, "websocket", null);
    Session_defineProperty(this, "popup", new Popup());
    Session_defineProperty(this, "promiseCallbaks", []);
    Session_defineProperty(this, "pingsInterval", null);
    Session_defineProperty(this, "isOpen", false);
  }
  init() {
    return Promise.resolve();
  }
  getSessionId() {
    return this.adapter.getGameCode() + "_" + this.adapter.player.getId();
  }
  open() {
    console.log("OPEN SESSION");
    const promise = this.newPromise();
    if (!this.isOpen) {
      this.isOpen = true;
      this.adapter.init().then(() => {
        this.openWebsocket();
      });
    }
    return promise;
  }
  close() {
    this.closeWebsocket();
  }
  showPopup(data) {
    this.popup?.show(data || LOCALIZATION[this.adapter.getLang()] || LOCALIZATION["en"]);
  }
  hidePopup() {
    this.popup?.hide();
  }
  openWebsocket() {
    const websocket = new WebSocket(getHost() + "?session_id=" + this.getSessionId());
    websocket.onopen = () => {
      console.log("Session websocket opened");
      this.runPingsInterval();
    };
    websocket.onmessage = event => {
      console.log("Session websocket message", event);
    };
    websocket.onclose = event => {
      console.log("Session websocket closed", event);
      this.onClose(event?.code === EXPIRED_CODE);
    };
    websocket.onerror = event => {
      console.error("Session websocket error", event);
      this.closeWebsocket();
    };
    this.websocket = websocket;
  }
  closeWebsocket() {
    if (!this.websocket) return;
    this.websocket.close();
    this.websocket = null;
  }
  onClose(isExpired) {
    this.websocket = null;
    this.clearPingsInterval();
    if (isExpired) {
      this.closePromise({
        expired: true,
        type: MESSAGE_SESSION_IS_EXPIRED
      });
    } else {
      setTimeout(() => {
        this.openWebsocket();
      }, SECOND);
    }
  }
  newPromise() {
    return new Promise((resolve, reject) => {
      this.promiseCallbaks.push({
        resolve,
        reject
      });
    });
  }
  closePromise(message) {
    if (!this.promiseCallbaks.length) return;
    this.promiseCallbaks.forEach(callback => {
      callback.reject(message);
    });
    this.promiseCallbaks = [];
    this.isOpen = false;
  }
  runPingsInterval() {
    this.clearPingsInterval();
    this.pingsInterval = setInterval(() => {
      if (!this.websocket) return;
      this.websocket.send('{"type":"ping"}');
    }, SECOND * 30);
  }
  clearPingsInterval() {
    if (this.pingsInterval) clearInterval(this.pingsInterval);
    this.pingsInterval = null;
  }
}
;
class Popup {
  constructor() {
    Session_defineProperty(this, "mainDiv", null);
    Session_defineProperty(this, "title", null);
    Session_defineProperty(this, "description", null);
    Session_defineProperty(this, "button", null);
  }
  create() {
    if (this.mainDiv) return;
    this.mainDiv = this.createMainDiv();
    this.title = this.createTitle();
    this.description = this.createDescription();
    this.button = this.createButton();
    const centerDiv = this.createCenterDiv(),
      contentDiv = this.createContentDiv();
    contentDiv.appendChild(this.title);
    contentDiv.appendChild(this.description);
    contentDiv.appendChild(this.button);
    centerDiv.appendChild(contentDiv);
    this.mainDiv.appendChild(centerDiv);
  }
  createMainDiv() {
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "0";
    div.style.left = "0";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.backgroundColor = "rgb(58, 58, 58)";
    div.style.zIndex = "99999";
    return div;
  }
  createCenterDiv() {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.height = "100%";
    div.style.width = "100%";
    return div;
  }
  createContentDiv() {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.gap = "20px";
    div.style.maxWidth = "500px";
    div.style.padding = "20px";
    return div;
  }
  createTitle() {
    const div = document.createElement("h6");
    div.style.color = "white";
    div.style.fontSize = "28px";
    div.style.fontWeight = "bold";
    div.style.fontFamily = "Arial, sans-serif";
    div.style.textAlign = "center";
    return div;
  }
  createDescription() {
    const div = document.createElement("p");
    div.style.color = "white";
    div.style.fontSize = "16px";
    div.style.color = "rgb(187, 187, 187)";
    div.style.fontFamily = "Arial, sans-serif";
    div.style.textAlign = "center";
    return div;
  }
  createButton() {
    const div = document.createElement("a");
    div.style.color = "white";
    div.style.fontSize = "50px";
    div.style.cursor = "pointer";
    div.style.textDecoration = "none";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.innerHTML = "🔄";
    div.style.fontFamily = "Arial, sans-serif";
    div.onclick = () => {
      window.location.reload();
    };
    return div;
  }
  show(data) {
    this.create();
    if (!this.mainDiv) return;
    if (this.title) this.title.innerHTML = data.title;
    if (this.description) this.description.innerHTML = data.description;
    if (this.button) this.button.onclick = data.button || (() => {
      window.location.reload();
    });
    document.body.appendChild(this.mainDiv);
  }
  hide() {
    if (!this.mainDiv) return;
    document.body.removeChild(this.mainDiv);
  }
}
;
;// ./adapters/Base/SessionEmptyPlug.ts

class SessionEmptyPlug extends Session {
  constructor(adapter) {
    super(adapter);
  }
  open() {
    return new Promise(() => {
      //
    });
  }
}
;// ./adapters/Base/Leaderboards.ts
function Leaderboards_defineProperty(e, r, t) { return (r = Leaderboards_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function Leaderboards_toPropertyKey(t) { var i = Leaderboards_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function Leaderboards_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

class Leaderboards {
  constructor(adapter) {
    this.adapter = adapter;
    Leaderboards_defineProperty(this, "available", true);
  }
  init() {
    return Promise.resolve(null);
  }
  isAvailable() {
    return this.available;
  }
  validateLeaderboardId(leaderboard_id) {
    if (!leaderboard_id) return "default";
    return leaderboard_id;
  }
  getScore(board_id) {
    return this.getEntry(board_id).then(entry => {
      return entry?.score || 0;
    }).catch(() => 0);
  }
  setScore(board_id, score) {
    board_id = this.validateLeaderboardId(board_id);
    return this.request({
      command: SAVE_SCORE_API_COMMAND,
      data: {
        ...this.getDefaultData(),
        board_id,
        score
      }
    });
  }
  addScore(board_id, v) {
    v = Number(v) || 0;
    return this.getScore(board_id).then(score => {
      return this.setScore(board_id, score + v);
    });
  }
  setExtraData(board_id, data) {
    board_id = this.validateLeaderboardId(board_id);
    return this.request({
      command: SAVE_SCORE_API_COMMAND,
      data: {
        ...this.getDefaultData(),
        board_id,
        extra_data: data
      }
    });
  }
  getEntries(board_id) {
    let top_limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    let nearby_limit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 6;
    board_id = this.validateLeaderboardId(board_id);
    return this.request({
      command: GET_LEADERBOARD_API_COMMAND,
      data: {
        ...this.getDefaultData(),
        board_id,
        top_limit,
        nearby_limit
      }
    }).then(e => {
      const data = e?.data || {};
      return this.formatEntries(this.sortServerEntries(data, top_limit));
    }).catch(error => {
      return [];
    });
  }
  getEntry(board_id) {
    return this.getEntries(board_id, 0, 0).then(entries => {
      if (!entries.length) return Promise.reject();
      return entries[0];
    });
  }
  sortServerEntries(data) {
    let max = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    const top = data.top || [],
      nearby = data.nearby || [],
      player = data.player,
      res = [],
      add = el => {
        if (!el || res.find(el0 => el0["player_id"] === el["player_id"])) return;
        res.push(el);
      };
    add(player);
    nearby.forEach(add);
    top.forEach(add);
    res.length = Math.min(res.length, Math.max(max, 1));
    res.sort((a, b) => {
      return a.rank - b.rank;
    });
    return res;
  }
  formatEntries(serverEntries) {
    return Promise.all(serverEntries.map(el => {
      const extra = JSON.parse(el.extra_data || "{}");
      return {
        id: el.player_id,
        score: Number(el.score) || 0,
        rank: Number(el.rank) || 0,
        avatar: extra.avatar || "",
        title: extra.title || "",
        extra_data: extra
      };
    }));
  }
  getDefaultData() {
    return {
      game_code: this.adapter.getGameCode(),
      player_id: this.adapter.player.getId()
    };
  }
  request(request) {
    return this.adapter.server.request(request);
  }
}
;
;// ./adapters/Base/EmptyLeaderboards.ts
function EmptyLeaderboards_defineProperty(e, r, t) { return (r = EmptyLeaderboards_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function EmptyLeaderboards_toPropertyKey(t) { var i = EmptyLeaderboards_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function EmptyLeaderboards_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

class EmptyLeaderboards extends Leaderboards {
  constructor() {
    super(...arguments);
    EmptyLeaderboards_defineProperty(this, "available", false);
  }
  getScore() {
    return Promise.resolve(0);
  }
  setScore(leaderboard_id, score) {
    return Promise.reject();
  }
  setExtraData(leaderboard_id, data) {
    return Promise.reject();
  }
  getEntries(leaderboard_id) {
    let top_limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    let nearby_limit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 6;
    return Promise.resolve([]);
  }
}
;// ./adapters/EventsCore.ts
function EventsCore_defineProperty(e, r, t) { return (r = EventsCore_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function EventsCore_toPropertyKey(t) { var i = EventsCore_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function EventsCore_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
class EventsCore {
  constructor() {
    EventsCore_defineProperty(this, "pull", {});
  }
  addEvent(key) {
    if (!this.pull[key]) this.pull[key] = [];
  }
  on(key, f) {
    this.addEvent(key);
    this.getListenersFor(key)?.push(f);
    return f;
  }
  once(key, f) {
    var _this = this;
    this.addEvent(key);
    const sub = function () {
      _this.offForEvent(key, sub);
      if (f) f(...arguments);
    };
    this.getListenersFor(key)?.push(sub);
    return sub;
  }
  offEvent(key) {
    if (!this.pull[key]) return;
    delete this.pull[key];
  }
  off(f) {
    Object.keys(this.pull).forEach(key => {
      this.offForEvent(key, f);
    });
  }
  offForEvent(key, f) {
    const arr = this.getListenersFor(key);
    if (!arr || !arr.length) return;
    const n = arr.indexOf(f);
    if (n !== -1) arr.splice(n, 1);
  }
  emit(key) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    const arr = this.pull[key];
    if (arr) arr.slice().forEach(f => f.apply(f, args));
  }
  getListenersFor(key) {
    return this.pull[key];
  }
  clear() {
    this.pull = {};
  }
  waiter(event) {
    return new Promise(resolve => {
      this.once(event, resolve);
    });
  }
  waiters() {
    for (var _len2 = arguments.length, events = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      events[_key2] = arguments[_key2];
    }
    return Promise.all(events.map(key => {
      return this.waiter(key);
    }));
  }
}
;
;// ./adapters/Base/SoundStatus.ts
function SoundStatus_defineProperty(e, r, t) { return (r = SoundStatus_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function SoundStatus_toPropertyKey(t) { var i = SoundStatus_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function SoundStatus_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const DEFAULT_MUTE_KEY = "default";
class SoundStatus {
  constructor() {
    SoundStatus_defineProperty(this, "muteKeys", []);
    SoundStatus_defineProperty(this, "lastStatus", true);
    SoundStatus_defineProperty(this, "callback", void 0);
  }
  setCallback(callback) {
    this.callback = callback;
    this.callCallback();
  }
  get() {
    return !this.muteKeys.length;
  }
  mute() {
    let key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_MUTE_KEY;
    if (this.muteKeys.includes(key)) return;
    this.muteKeys.push(key);
    this.check();
  }
  unmute() {
    let key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_MUTE_KEY;
    this.muteKeys = this.muteKeys.filter(k => k !== key);
    this.check();
  }
  check() {
    const actualStatus = this.get();
    if (actualStatus === this.lastStatus) return;
    this.lastStatus = actualStatus;
    this.callCallback();
  }
  callCallback() {
    this.callback?.(this.get());
  }
}
;
;// ./adapters/Base/Adapter.ts
function Adapter_defineProperty(e, r, t) { return (r = Adapter_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function Adapter_toPropertyKey(t) { var i = Adapter_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function Adapter_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }












class Adapter {
  constructor() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.options = options;
    Adapter_defineProperty(this, "events", new EventsCore());
    Adapter_defineProperty(this, "platform_prefix", "");
    Adapter_defineProperty(this, "_isReady", false);
    Adapter_defineProperty(this, "initWaiters", []);
    Adapter_defineProperty(this, "api", void 0);
    Adapter_defineProperty(this, "_paused", false);
    Adapter_defineProperty(this, "advertising", void 0);
    Adapter_defineProperty(this, "player", void 0);
    Adapter_defineProperty(this, "purchase", void 0);
    Adapter_defineProperty(this, "server", void 0);
    /**
     * @deprecated use leaderboards instead
     */
    Adapter_defineProperty(this, "leaderboard", void 0);
    Adapter_defineProperty(this, "leaderboards", void 0);
    Adapter_defineProperty(this, "storage", void 0);
    Adapter_defineProperty(this, "session", void 0);
    Adapter_defineProperty(this, "modules", []);
    Adapter_defineProperty(this, "joinGroup", void 0);
    Adapter_defineProperty(this, "inviteFriends", void 0);
    Adapter_defineProperty(this, "makePost", void 0);
    Adapter_defineProperty(this, "subscribeToEvents", void 0);
    Adapter_defineProperty(this, "makeReview", void 0);
    Adapter_defineProperty(this, "setShortcut", void 0);
    Adapter_defineProperty(this, "addToFavorites", void 0);
    Adapter_defineProperty(this, "makeStories", void 0);
    Adapter_defineProperty(this, "share", void 0);
    Adapter_defineProperty(this, "recommend", void 0);
    Adapter_defineProperty(this, "setRecord", void 0);
    Adapter_defineProperty(this, "subModules", []);
    Adapter_defineProperty(this, "soundStatus", new SoundStatus());
    this.outputInfo();
    this.advertising = this.createAdvertising();
    this.player = this.createPlayer();
    this.purchase = this.createPurchase();
    this.server = this.createServer();
    this.leaderboard = this.createLeaderboard();
    this.leaderboards = this.createLeaderboards();
    this.storage = this.createStorage();
    this.session = this.createSession();
    this.modules.push(this.advertising, this.player, this.purchase, this.server, this.leaderboard, this.leaderboards, this.storage, this.session);
    this.joinGroup = this.createJoinGroup();
    this.inviteFriends = this.createInviteFriends();
    this.makePost = this.createMakePost();
    this.subscribeToEvents = this.createSubscribeToEvents();
    this.makeReview = this.createMakeReview();
    this.setShortcut = this.createSetShortcut();
    this.addToFavorites = this.createAddToFavorites();
    this.makeStories = this.createMakeStories();
    this.share = this.createShare();
    this.recommend = this.createRecommend();
    this.setRecord = this.createSetRecord();
    this.subModules.push(this.joinGroup, this.inviteFriends, this.makePost, this.subscribeToEvents, this.makeReview, this.setShortcut, this.addToFavorites, this.makeStories, this.share, this.recommend, this.setRecord);
    this.initSoundStatus();
    this.initSelf();
  }
  outputInfo() {
    console.log("Adapter: " + "Yandex");
    console.log("build time: " + "2026-06-11T09:39:31.116Z");
  }
  get isReady() {
    return this._isReady;
  }
  isSoundEnabled() {
    return this.soundStatus.get();
  }
  isPaused() {
    return this._paused;
  }
  initListeners() {
    this.initPauseListeners();
  }
  initPauseListeners() {
    this.events.on(PAUSE_EVENT, () => {
      this._paused = true;
      this.soundStatus.mute("pause");
    });
    this.events.on(RESUME_EVENT, () => {
      this._paused = false;
      this.soundStatus.unmute("pause");
    });
  }
  initEvents() {
    this.initMuteLogic();
  }
  initSoundStatus() {
    this.soundStatus.setCallback(status => {
      console.log("soundStatus", status);
      if (status) {
        this.events.emit(AUDIO_ON_EVENT);
      } else {
        this.events.emit(AUDIO_OFF_EVENT);
      }
    });
  }
  initMuteLogic() {
    const update = () => {
      const shouldMute = document.visibilityState !== "visible" || !document.hasFocus();
      if (shouldMute) {
        this.soundStatus.mute();
      } else {
        this.soundStatus.unmute();
      }
    };
    document.addEventListener("visibilitychange", update);
    window.addEventListener("blur", update);
    window.addEventListener("focus", update);
    window.addEventListener("pagehide", update);
    window.addEventListener("pageshow", update);
    update();
  }
  on(eventName, callback) {
    this.events.on(eventName, callback);
    this.checkEvent(eventName, callback);
  }
  checkEvent(event, callback) {
    switch (event) {
      case AUDIO_ON_EVENT:
        if (this.isSoundEnabled()) callback();
        break;
      case AUDIO_OFF_EVENT:
        if (!this.isSoundEnabled()) callback();
        break;
      case PAUSE_EVENT:
        if (this.isPaused()) callback();
        break;
      case RESUME_EVENT:
        if (!this.isPaused()) callback();
        break;
      default:
        break;
    }
  }
  off(eventName, callback) {
    this.events.offForEvent(eventName, callback);
  }
  getPlatformId() {
    return this.platform_prefix;
  }
  getFlag(key) {
    return this.options.flags?.[key];
  }
  getGameCode() {
    return this.options.game_code || this.getDefaultGameCode();
  }
  init() {
    return this.isReady ? Promise.resolve() : this.getInitPromise();
  }
  gameReady() {
    this.loading(1);
  }
  happytime() {
    //
  }
  gameplayStart() {
    //
  }
  gameplayStop() {
    //
  }
  loading() {
    let v = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  } //
  getLang() {
    return "en";
  }
  getLangAsync() {
    return Promise.resolve(this.getLang());
  }
  getServerTime() {
    return this.server.time().catch(() => Date.now());
  }
  getPayload() {
    return null;
  }
  domainlock(url) {
    const currentDomain = window.location.hostname;
    if (currentDomain.includes(url)) return;
    setTimeout(() => {
      this.redirect(url);
    }, SECOND * (Math.random() * 10 + 10));
  }
  redirect(url) {
    window.location.href = url;
  }
  createServer() {
    return new CommonServer(this);
  }
  createAdvertising() {
    return new Advertising(this);
  }
  createPlayer() {
    return new Player(this);
  }
  createLeaderboard() {
    return new EmptyLeaderboard(this);
  }
  createLeaderboards() {
    return new EmptyLeaderboards(this);
  }
  createStorage() {
    return new Storage(this);
  }
  createPurchase() {
    return new Purchase(this);
  }
  createSession() {
    return new SessionEmptyPlug(this);
  }
  createJoinGroup() {
    return new SubModule(this);
  }
  createInviteFriends() {
    return new SubModule(this);
  }
  createMakePost() {
    return new SubModule(this);
  }
  createSubscribeToEvents() {
    return new SubModule(this);
  }
  createMakeReview() {
    return new SubModule(this);
  }
  createSetShortcut() {
    return new SubModule(this);
  }
  createAddToFavorites() {
    return new SubModule(this);
  }
  createMakeStories() {
    return new SubModule(this);
  }
  createShare() {
    return new SubModule(this);
  }
  createRecommend() {
    return new SubModule(this);
  }
  createSetRecord() {
    return new SubModule(this);
  }
  initSelf() {
    let isRunning = false;
    const startInit = () => {
      if (isRunning) return;
      isRunning = true;
      this.initApi().then(() => {
        this.initListeners();
        this.initEvents();
        return this.initModules();
      }).then(() => {
        console.log("Adapter init success");
        this._isReady = true;
        this.loading(0);
        this.callInitWaiters(true);
      }).catch(error => {
        console.error("Adapter init error", error);
        this.callInitWaiters(false, error);
      });
    };
    window.addEventListener('load', startInit);
    if (document.readyState === 'complete') {
      startInit();
    }
  }
  initApi() {
    return Promise.resolve();
  }
  initModules() {
    const allModules = [...this.modules, ...this.subModules];
    return Promise.all(allModules.map(module => module.init()));
  }
  getInitPromise() {
    return new Promise((resolve, reject) => {
      this.initWaiters.push({
        resolve,
        reject
      });
    });
  }
  callInitWaiters(isSuccess) {
    let error = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    this.initWaiters.forEach(waiter => {
      if (isSuccess) waiter.resolve();else waiter.reject(error);
    });
    this.initWaiters = [];
  }
  getDefaultGameCode() {
    return this.getPlatformId() + "_" + this.options.app_id;
  }
}
;
;// ./adapters/Yandex/yandexConstants.ts
const OLD_SDK_URL_CHAR_CODE = [104, 116, 116, 112, 115, 58, 47, 47, 121, 97, 110, 100, 101, 120, 46, 114, 117, 47, 103, 97, 109, 101, 115, 47, 115, 100, 107, 47, 118, 50];
const SDK_URL_CHAR_CODE = [104, 116, 116, 112, 115, 58, 47, 47, 115, 100, 107, 46, 103, 97, 109, 101, 115, 46, 115, 51, 46, 121, 97, 110, 100, 101, 120, 46, 110, 101, 116, 47, 115, 100, 107, 46, 106, 115];
const IS_LOCAL_HOSTED = window.location.href.includes('localhost');
const SDK_URL = String.fromCharCode(...(IS_LOCAL_HOSTED ? OLD_SDK_URL_CHAR_CODE : SDK_URL_CHAR_CODE));
const SDK_URL_LOCAL = "/sdk.js";
const YANDEX_GAME_URL_CHAR_CODE = [104, 116, 116, 112, 115, 58, 47, 47, 121, 97, 110, 100, 101, 120, 46, 114, 117, 47, 103, 97, 109, 101, 115, 47, 97, 112, 112, 47];
const YANDEX_GAME_URL = String.fromCharCode(...YANDEX_GAME_URL_CHAR_CODE);
;// ./adapters/Yandex/ysdk.ts



let _ysdk;
const ysdk = new AsyncObject(() => {
  return includeYandexSdk().then(() => {
    console.log("Yandex SDK included");
    return getApi().init();
  }).then(e => {
    console.log("Yandex SDK initialized", e);
    _ysdk = e;
    return e;
  }).catch(error => {
    console.error("Yandex SDK error", error);
    return Promise.reject(error);
  });
});
const player = new AsyncObject(() => {
  return initYsdk().then(ysdk => {
    return ysdk.getPlayer({
      scopes: true
    });
  });
});
const payments = new AsyncObject(() => {
  return initYsdk().then(ysdk => {
    return ysdk.payments;
  });
});
function isYandexEnvironment() {
  const isYandexHosted = window.location.hostname.includes('yandex');
  //const isYandexSDK = typeof window.Ya !== 'undefined';
  return isYandexHosted; // || isYandexSDK;
}
function initYsdk() {
  return ysdk.get();
}
function getYsdk() {
  return _ysdk;
}
function loadPlayer() {
  return player.get();
}
function loadLeaderboards() {
  return initYsdk().then(ysdk => {
    return ysdk.leaderboards;
  });
}
function loadPayments() {
  return payments.get();
}
function includeYandexSdk() {
  return includeScript(isYandexEnvironment() ? SDK_URL_LOCAL : SDK_URL);
}
function getApi() {
  return window.YaGames;
}
;// ./adapters/Yandex/submodules/YandexMakeReview.ts


class YandexMakeReview extends SubModule {
  init() {
    return getYsdk().feedback.canReview().then(_ref => {
      let {
        value,
        reason
      } = _ref;
      if (value) {
        this.available = true;
        this.status = false;
      } else {
        console.log("YandexMakeReview init: reason", reason);
        this.available = false;
        this.status = this.isAlreadyRatedReason(reason) ? true : false;
      }
    }).catch(error => {
      this.available = false;
      console.error("YandexMakeReview init: error", error);
    });
  }
  act() {
    return getYsdk().feedback.requestReview().then(_ref2 => {
      let {
        feedbackSent
      } = _ref2;
      this.status = feedbackSent;
      if (!feedbackSent) return Promise.reject("YandexMakeReview act: feedback not sent");
    }).catch(error => {
      console.error("YandexMakeReview act: error", error);
      return Promise.reject(error);
    }).finally(() => {
      this.available = false;
    });
  }
  isAlreadyRatedReason(reason) {
    return reason === "GAME_RATED" || reason === "REVIEW_WAS_REQUESTED";
  }
}
;// ./adapters/Yandex/submodules/YandexSetShortcut.ts


class YandexSetShortcut extends SubModule {
  init() {
    return getYsdk().shortcut.canShowPrompt().then(_ref => {
      let {
        canShow
      } = _ref;
      console.log("YandexSetShortcut init: canShow", canShow);
      this.available = canShow;
    }).catch(error => {
      console.error("YandexSetShortcut init: error", error);
      this.available = false;
    });
  }
  act() {
    return getYsdk().shortcut.showPrompt().then(_ref2 => {
      let {
        outcome
      } = _ref2;
      if (outcome === "accepted") {
        this.status = true;
      } else {
        this.status = false;
        return Promise.reject("YandexSetShortcut act: shortcut not added");
      }
    }).catch(error => {
      console.error("YandexSetShortcut act: error", error);
      return Promise.reject(error);
    }).finally(() => {
      this.available = false;
      this.init();
    });
  }
}
;// ./adapters/Yandex/submodules/YandexInterstitial.ts
function YandexInterstitial_defineProperty(e, r, t) { return (r = YandexInterstitial_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function YandexInterstitial_toPropertyKey(t) { var i = YandexInterstitial_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function YandexInterstitial_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

class YandexInterstitial {
  constructor() {
    YandexInterstitial_defineProperty(this, "last", 0);
    YandexInterstitial_defineProperty(this, "min", 30000);
  }
  show() {
    return new Promise((resolve, reject) => {
      try {
        const ysdk = getYsdk(),
          t = Date.now();
        if (Math.abs(t - this.last) < this.min) {
          return resolve(false);
        }
        this.last = t;
        let isOpened = false;
        ysdk.adv.showFullscreenAdv({
          callbacks: {
            onClose: resolve,
            onError: e => {
              console.error(e);
              reject(e);
            },
            onOpen: () => {
              isOpened = true;
            }
          }
        });
        setTimeout(() => {
          if (!isOpened) reject(new Error("Interstitial not opened"));
        }, 10000);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  }
}
;
;// ./adapters/Yandex/submodules/YandexRewarded.ts

class YandexRewarded {
  show() {
    return new Promise((resolve, reject) => {
      try {
        const ysdk = getYsdk();
        let isOpened = false,
          isRewarded = false;
        ysdk.adv.showRewardedVideo({
          callbacks: {
            onError: e => {
              console.error(e);
              reject(e);
            },
            onRewarded: () => {
              isRewarded = true;
            },
            onClose: () => {
              if (!isRewarded) reject(new Error("Rewarded video not opened"));
              resolve();
            },
            onOpen: () => {
              isOpened = true;
            }
          }
        });
        setTimeout(() => {
          if (!isOpened) reject(new Error("Rewarded video not opened"));
        }, 20000);
      } catch (e) {
        reject(e);
      }
    });
  }
}
;
;// ./adapters/Yandex/submodules/YandexBanner.ts
function YandexBanner_defineProperty(e, r, t) { return (r = YandexBanner_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function YandexBanner_toPropertyKey(t) { var i = YandexBanner_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function YandexBanner_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

class YandexBanner {
  constructor() {
    YandexBanner_defineProperty(this, "visible", false);
  }
  updateStatus() {
    const ysdk = getYsdk();
    if (!ysdk) return;
    ysdk.adv.getBannerAdvStatus().then(_ref => {
      let {
        stickyAdvIsShowing,
        reason
      } = _ref;
      if (stickyAdvIsShowing) {
        this.visible = true;
      } else {
        this.visible = false;
      }
    });
  }
  show() {
    const ysdk = getYsdk();
    if (!ysdk) return;
    this.visible = true;
    ysdk.adv.showBannerAdv();
  }
  hide() {
    const ysdk = getYsdk();
    if (!ysdk) return;
    this.visible = false;
    ysdk.adv.hideBannerAdv();
  }
}
;
;// ./adapters/Yandex/YandexAdvertising.ts
function YandexAdvertising_defineProperty(e, r, t) { return (r = YandexAdvertising_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function YandexAdvertising_toPropertyKey(t) { var i = YandexAdvertising_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function YandexAdvertising_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }




class YandexAdvertising extends Advertising {
  constructor() {
    super(...arguments);
    YandexAdvertising_defineProperty(this, "rules", {
      preroll: true,
      pause: true,
      tutorial: true
    });
    YandexAdvertising_defineProperty(this, "interstitial", new YandexInterstitial());
    YandexAdvertising_defineProperty(this, "rewarded", new YandexRewarded());
    YandexAdvertising_defineProperty(this, "banner", new YandexBanner());
  }
  _showInterstitial() {
    return this.interstitial.show();
  }
  isRewardedAvailableNow() {
    return true;
  }
  _showRewarded() {
    return this.rewarded.show();
  }
  async showBanner() {
    this.banner.show();
  }
  async hideBanner() {
    this.banner.hide();
  }
}
;// ./adapters/Yandex/YandexLeaderboard.ts



;
;
class YandexLeaderboard extends Leaderboard {
  isAvailable() {
    return true;
  }
  setScore(score, force) {
    return this.isItPossibleToUse().then(() => loadLeaderboards()).then(leaderboards => leaderboards.setScore(this.getLeaderboardName(), Number(score))).catch(err => {
      console.error(err);
    });
  }
  getEntries() {
    let top_limit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
    let nearby_limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 6;
    return loadLeaderboards().then(leaderboards => {
      const isAuth = this.adapter.player.isAuth();
      return leaderboards.getEntries(this.getLeaderboardName(), {
        includeUser: isAuth,
        quantityAround: isAuth ? nearby_limit : 0,
        quantityTop: top_limit
      });
    }).then(data => {
      return this.formatAndSortYandexEntries(data.entries, top_limit, nearby_limit);
    }).catch(err => {
      console.error(err);
      return Promise.reject(err);
    });
  }
  formatAndSortYandexEntries(entries) {
    let top_limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    let nearby_limit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 6;
    const formattedEntries = entries.map(entry => {
      return this.formatEntry(entry);
    });
    return this.sortEntries(formattedEntries, top_limit, nearby_limit);
  }
  sortEntries(entries) {
    let top_limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    let nearby_limit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 6;
    const top = this.findTopEntries(entries, top_limit) || [],
      nearby = this.findNearbyEntries(entries, nearby_limit) || [],
      player = this.findPlayerEntry(entries),
      res = [],
      add = el => {
        if (!el || res.find(el0 => el0.id === el.id)) return;
        res.push(el);
      };
    add(player);
    nearby.forEach(add);
    top.forEach(add);
    res.length = Math.min(res.length, Math.max(top_limit, 1));
    return this.sortEntriesByRank(res);
  }
  sortEntriesByRank(entries) {
    return entries.slice(0).sort((a, b) => {
      return a.rank - b.rank;
    });
  }
  findPlayerEntry(entries) {
    return entries.find(entry => entry.id === this.adapter.player.getId());
  }
  findNearbyEntries(entries) {
    let max = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 6;
    const playerRank = this.findPlayerEntry(entries)?.rank || 0,
      entriesWithoutPlayer = entries.filter(entry => entry.id !== this.adapter.player.getId()),
      sortedEntries = entriesWithoutPlayer.sort((a, b) => {
        return Math.abs(a.rank - playerRank) - Math.abs(b.rank - playerRank);
      });
    sortedEntries.length = Math.min(sortedEntries.length, max);
    return this.sortEntriesByRank(sortedEntries);
  }
  findTopEntries(entries) {
    let max = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    return this.sortEntriesByRank(entries).slice(0, max);
  }
  formatEntry(entry) {
    return {
      id: entry.player.uniqueID,
      title: entry.player.publicName,
      avatar: entry.player.getAvatarSrc("small"),
      score: entry.score,
      rank: entry.rank,
      extra_data: entry.extraData ? parseJSON(entry.extraData) || entry.extraData : undefined
    };
  }
  getEntry() {
    return this.isItPossibleToUse().then(() => loadLeaderboards()).then(leaderboards => leaderboards.getPlayerEntry(this.getLeaderboardName())).then(entry => {
      return this.formatEntry(entry);
    }).catch(err => {
      console.error(err);
      return Promise.reject(err);
    });
  }
  setExtraData(data, force) {
    let leaderboards;
    return this.isItPossibleToUse().then(() => loadLeaderboards()).then(_leaderboards => {
      leaderboards = _leaderboards;
      return leaderboards.getPlayerEntry(this.getLeaderboardName());
    }).then(entry => {
      return leaderboards.setScore(this.getLeaderboardName(), entry.score, stringifyJSON(data));
    }).catch(err => {
      console.error(err);
      return Promise.reject(err);
    });
  }
  getLeaderboardName() {
    return this.adapter.options.leaderboard_name || "main";
  }
  isItPossibleToUse() {
    if (!this.adapter.player.isAuth()) return Promise.reject("Player is not authenticated");
    return Promise.resolve();
  }
}
;// ./adapters/Yandex/YandexLeaderboards.ts



;
;
class YandexLeaderboards extends Leaderboards {
  isAvailable() {
    return true;
  }
  validateLeaderboardId(leaderboard_id) {
    if (!leaderboard_id) return this.adapter.options.leaderboard_name || "main";
    return leaderboard_id;
  }
  setScore(leaderboard_id, score) {
    leaderboard_id = this.validateLeaderboardId(leaderboard_id);
    return this.isItPossibleToUse().then(() => loadLeaderboards()).then(leaderboards => leaderboards.setScore(leaderboard_id, Number(score))).catch(err => {
      console.error(err);
    });
  }
  getEntries(leaderboard_id) {
    let top_limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    let nearby_limit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 6;
    leaderboard_id = this.validateLeaderboardId(leaderboard_id);
    return loadLeaderboards().then(leaderboards => {
      const isAuth = this.adapter.player.isAuth();
      return leaderboards.getEntries(leaderboard_id, {
        includeUser: isAuth,
        quantityAround: isAuth ? nearby_limit : 0,
        quantityTop: top_limit
      });
    }).then(data => {
      return this.formatAndSortYandexEntries(data.entries, top_limit, nearby_limit);
    }).catch(err => {
      console.error(err);
      return Promise.reject(err);
    });
  }
  formatAndSortYandexEntries(entries) {
    let top_limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    let nearby_limit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 6;
    const formattedEntries = entries.map(entry => {
      return this.formatEntry(entry);
    });
    return this.sortEntries(formattedEntries, top_limit, nearby_limit);
  }
  sortEntries(entries) {
    let top_limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    let nearby_limit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 6;
    const top = this.findTopEntries(entries, top_limit) || [],
      nearby = this.findNearbyEntries(entries, nearby_limit) || [],
      player = this.findPlayerEntry(entries),
      res = [],
      add = el => {
        if (!el || res.find(el0 => el0.id === el.id)) return;
        res.push(el);
      };
    add(player);
    nearby.forEach(add);
    top.forEach(add);
    res.length = Math.min(res.length, Math.max(top_limit, 1));
    return this.sortEntriesByRank(res);
  }
  sortEntriesByRank(entries) {
    return entries.slice(0).sort((a, b) => {
      return a.rank - b.rank;
    });
  }
  findPlayerEntry(entries) {
    return entries.find(entry => entry.id === this.adapter.player.getId());
  }
  findNearbyEntries(entries) {
    let max = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 6;
    const playerRank = this.findPlayerEntry(entries)?.rank || 0,
      entriesWithoutPlayer = entries.filter(entry => entry.id !== this.adapter.player.getId()),
      sortedEntries = entriesWithoutPlayer.sort((a, b) => {
        return Math.abs(a.rank - playerRank) - Math.abs(b.rank - playerRank);
      });
    sortedEntries.length = Math.min(sortedEntries.length, max);
    return this.sortEntriesByRank(sortedEntries);
  }
  findTopEntries(entries) {
    let max = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    return this.sortEntriesByRank(entries).slice(0, max);
  }
  formatEntry(entry) {
    return {
      id: entry.player.uniqueID,
      title: entry.player.publicName,
      avatar: entry.player.getAvatarSrc("small"),
      score: entry.score,
      rank: entry.rank,
      extra_data: entry.extraData ? parseJSON(entry.extraData) || entry.extraData : undefined
    };
  }
  getEntry(leaderboard_id) {
    leaderboard_id = this.validateLeaderboardId(leaderboard_id);
    return this.isItPossibleToUse().then(() => loadLeaderboards()).then(leaderboards => leaderboards.getPlayerEntry(leaderboard_id)).then(entry => {
      return this.formatEntry(entry);
    }).catch(err => {
      console.error(err);
      return Promise.reject(err);
    });
  }
  setExtraData(leaderboard_id, data) {
    leaderboard_id = this.validateLeaderboardId(leaderboard_id);
    let leaderboards;
    return this.isItPossibleToUse().then(() => loadLeaderboards()).then(_leaderboards => {
      leaderboards = _leaderboards;
      return leaderboards.getPlayerEntry(leaderboard_id);
    }).then(entry => {
      return leaderboards.setScore(leaderboard_id, entry.score, stringifyJSON(data));
    }).catch(err => {
      console.error(err);
      return Promise.reject(err);
    });
  }
  isItPossibleToUse() {
    if (!this.adapter.player.isAuth()) return Promise.reject("Player is not authenticated");
    return Promise.resolve();
  }
}
;// ./adapters/Yandex/YandexPlayer.ts
function YandexPlayer_defineProperty(e, r, t) { return (r = YandexPlayer_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function YandexPlayer_toPropertyKey(t) { var i = YandexPlayer_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function YandexPlayer_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


class YandexPlayer extends Player {
  constructor() {
    super(...arguments);
    YandexPlayer_defineProperty(this, "player", void 0);
  }
  init() {
    return loadPlayer().then(player => {
      console.log("YandexPlayer init", player);
      this.player = player;
    }).catch(error => {
      console.error("YandexPlayer init error", error);
    });
  }
  isAuthAvailable() {
    return true;
  }
  isAuth() {
    return this.player.isAuthorized();
  }
  auth() {
    return getYsdk().auth.openAuthDialog().then(() => this.init());
  }
  getId() {
    return this.player.getUniqueID();
  }
  getName() {
    return this.player.getName();
  }
  getAvatar() {
    return this.player.getPhoto("small");
  }
}
;// ./adapters/Yandex/YandexPurchase.ts
function YandexPurchase_defineProperty(e, r, t) { return (r = YandexPurchase_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function YandexPurchase_toPropertyKey(t) { var i = YandexPurchase_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function YandexPurchase_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



class YandexPurchase extends Purchase {
  constructor() {
    super(...arguments);
    YandexPurchase_defineProperty(this, "purchaseCommand", YANDEX_PURCHASE_API_COMMAND);
    YandexPurchase_defineProperty(this, "currency", "YAN");
    YandexPurchase_defineProperty(this, "purchasePool", {});
  }
  init() {
    this.available = true;
    return this.loadCatalog();
  }
  getCurrency() {
    let v = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    return this.currency;
  }
  buy(id) {
    this.mute();
    return loadPayments().then(payments => payments.purchase({
      id
    })).then(purchase => {
      this.purchasePool[purchase.purchaseToken] = {
        purchaseToken: purchase.purchaseToken,
        isLocal: false,
        data: purchase
      };
      return purchase;
    }).catch(err => {
      console.error("YandexPurchase.buy error", err);
      return Promise.reject(err);
    }).finally(() => {
      this.unmute();
    });
  }
  getPurchases() {
    return Promise.all([this.getPlatformPurchases(), this.getLocalPurchases()]).then(_ref => {
      let [platformPurchases, localPurchases] = _ref;
      return [...platformPurchases, ...localPurchases];
    });
  }
  consumePurchase(purchaseToken) {
    const purchaseData = this.purchasePool[purchaseToken];
    if (purchaseData && purchaseData.isLocal) {
      return this.consumeLocalPurchase(purchaseToken);
    } else {
      return this.consumePlatformPurchase(purchaseToken);
    }
  }
  getPlatformPurchases() {
    return loadPayments().then(payments => payments.getPurchases()).then(purchases => {
      console.log("YandexPurchase.getPurchases", purchases);
      return purchases.map(purchase => {
        return purchase.purchaseData || purchase;
      });
    }).then(purchases => {
      purchases.forEach(purchase => {
        this.purchasePool[purchase.purchaseToken] = {
          purchaseToken: purchase.purchaseToken,
          isLocal: false,
          data: purchase
        };
      });
      return purchases;
    }).catch(err => {
      console.error("YandexPurchase.getPurchases error", err);
      return [];
    });
  }
  getLocalPurchases() {
    return super.getPurchases().then(purchases => {
      purchases.forEach(purchase => {
        this.purchasePool[purchase.purchaseToken] = {
          purchaseToken: purchase.purchaseToken,
          isLocal: true,
          data: purchase
        };
      });
      return purchases;
    }).catch(() => {
      console.warn("YandexPurchase.getLocalPurchases error");
      return [];
    });
  }
  formatPurchase(purchase) {
    return {
      "purchaseToken": purchase["transaction_id"],
      "productID": purchase["data"]["productID"]
    };
  }
  consumePlatformPurchase(purchaseToken) {
    return loadPayments().then(payments => payments.consumePurchase(purchaseToken)).then(res => {
      this.registerPurchase(this.purchasePool[purchaseToken]?.data);
      return res;
    }).catch(err => {
      console.error("YandexPurchase.consumePurchase error", err);
      return Promise.reject(err);
    });
  }
  registerPurchase(data) {
    const time = Date.now();
    return this.getCatalog().then(catalog => {
      return super.registerPurchase({
        ...data,
        time,
        productData: catalog[data.productID] || undefined
      });
    });
  }
  consumeLocalPurchase(purchaseToken) {
    return super.consumePurchase(purchaseToken);
  }
  loadCatalog() {
    return loadPayments().then(payments => payments.getCatalog()).then(yandexCatalog => {
      this.initCurrency(yandexCatalog);
      return this.formatCatalog(yandexCatalog);
    }).catch(e => {
      console.error("YandexPurchase.loadCatalog error", e);
      return Promise.reject(e);
    });
  }
  formatCatalog(yandexCatalog) {
    if (!yandexCatalog || !yandexCatalog.length) return {};
    return yandexCatalog.reduce((acc, item) => {
      acc[item.id] = {
        id: item.id,
        title: item.title,
        description: item.description,
        price: Number(item.priceValue),
        photo_url: item.imageURI
      };
      return acc;
    }, {});
  }
  initCurrency(yandexCatalog) {
    const currency = yandexCatalog?.[0]?.priceCurrencyCode;
    if (currency) this.currency = currency;
  }
}
;// ./adapters/Yandex/YandexStorage.ts
function YandexStorage_defineProperty(e, r, t) { return (r = YandexStorage_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function YandexStorage_toPropertyKey(t) { var i = YandexStorage_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function YandexStorage_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


class YandexStorage extends Storage {
  constructor() {
    super(...arguments);
    YandexStorage_defineProperty(this, "safeStorage", void 0);
    YandexStorage_defineProperty(this, "player", void 0);
  }
  init() {
    return Promise.all([this.initPlayer(), this.initStorage()]).then(() => {
      console.log("YandexStorage init", this.player, this.safeStorage);
    }).catch(error => {
      console.error("YandexStorage init error", error);
    });
  }
  initPlayer() {
    return loadPlayer().then(player => {
      this.player = player;
    }).catch(error => {
      console.error("YandexStorage initPlayer error", error);
    });
  }
  initStorage() {
    return getYsdk().getStorage().then(safeStorage => {
      this.safeStorage = safeStorage;
    }).catch(error => {
      console.error("YandexStorage init error", error);
    });
  }
  getLocalStorage() {
    return this.safeStorage || super.getLocalStorage();
  }
  get(keys) {
    return Promise.all([this.getFromPlatform(keys)]);
  }
  set(data, force) {
    return this.setToPlatform(data, force);
  }
  getFromPlatform(keys) {
    return this.player.getData(keys).catch(error => {
      console.error("YandexStorage getFromPlatform error", error);
      return [];
    });
  }
  setToPlatform(data, force) {
    return this.player.setData(data, force).catch(error => {
      console.error("YandexStorage setToPlatform error", error);
      return Promise.reject(error);
    });
  }
}
;// ./adapters/Yandex/YandexAdapter.ts
function YandexAdapter_defineProperty(e, r, t) { return (r = YandexAdapter_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function YandexAdapter_toPropertyKey(t) { var i = YandexAdapter_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function YandexAdapter_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

switchToSubDomain();












class YandexAdapter extends Adapter {
  constructor() {
    super(...arguments);
    YandexAdapter_defineProperty(this, "platform_prefix", "yandex");
  }
  on(eventName, callback) {
    getYsdk().on(this.formatEventName(eventName), callback);
    this.events.on(eventName, callback);
    this.checkEvent(eventName, callback);
  }
  off(eventName, callback) {
    getYsdk().off(this.formatEventName(eventName), callback);
  }
  formatEventName(eventName) {
    return "game_api_" + eventName;
  }
  gameReady() {
    getYsdk().features.LoadingAPI?.ready();
    super.gameReady();
  }
  gameplayStart() {
    getYsdk().features.GameplayAPI?.start();
  }
  gameplayStop() {
    getYsdk().features.GameplayAPI?.stop();
  }
  getLang() {
    return getYsdk().environment.i18n.lang || "en";
  }
  getLangAsync() {
    return initYsdk().then(() => this.getLang());
  }
  getServerTime() {
    return Promise.resolve(getYsdk().serverTime());
  }
  getPayload() {
    return getYsdk()?.environment?.payload || null;
  }
  domainlock(url) {
    if (isYandexEnvironment()) return;
    super.domainlock(url);
  }
  redirect(url) {
    super.redirect(YANDEX_GAME_URL + this.options.app_id);
  }
  initApi() {
    return initYsdk().then(ysdk => {
      console.log("YandexAdapter initApi", ysdk);
      this.api = ysdk;
      if (!this.options.app_id) this.options.app_id = ysdk.environment.app.id;
    });
  }
  initModules() {
    return Promise.all([this.initFlags(), super.initModules()]);
  }
  initFlags() {
    return getYsdk().getFlags().then(flags => {
      const oldFlags = this.options.flags;
      this.options.flags = {
        ...oldFlags,
        ...flags
      };
    });
  }
  createPlayer() {
    return new YandexPlayer(this);
  }
  createStorage() {
    return new YandexStorage(this);
  }
  createAdvertising() {
    return new YandexAdvertising(this);
  }
  createLeaderboard() {
    return new YandexLeaderboard(this);
  }
  createLeaderboards() {
    return new YandexLeaderboards(this);
  }
  createPurchase() {
    return new YandexPurchase(this);
  }
  createSession() {
    return new Session(this);
  }
  createMakeReview() {
    return new YandexMakeReview(this);
  }
  createSetShortcut() {
    return new YandexSetShortcut(this);
  }
}
;
var __webpack_exports__default = __webpack_exports__.A;
export { __webpack_exports__default as default };
