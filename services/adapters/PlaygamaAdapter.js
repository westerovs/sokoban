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
  A: () => (/* binding */ PlaygamaAdapter)
});

;// ./adapters/constants.ts
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const IS_ANDROID = /Android/i.test(navigator.userAgent);
const COMMON_PURCHASE_URL = "https://bbb.dra.games/api/purchase";
const OK_PURCHASE_URL = (/* unused pure expression or super */ null && (`${COMMON_PURCHASE_URL}/ok`));
const VK_PURCHASE_URL = (/* unused pure expression or super */ null && (`${COMMON_PURCHASE_URL}/vk`));
const YANDEX_PURCHASE_URL = (/* unused pure expression or super */ null && (`${COMMON_PURCHASE_URL}/ya`));
const PAUSE_EVENT = "pause";
const RESUME_EVENT = "resume";
const AUDIO_ON_EVENT = "audio_on";
const AUDIO_OFF_EVENT = "audio_off";
;// ./adapters/Base/Advertising.ts
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

;
class Advertising {
  constructor(adapter) {
    this.adapter = adapter;
    _defineProperty(this, "lastInterstitialTime", 0);
    _defineProperty(this, "interstitialInterval", MINUTE);
    _defineProperty(this, "rules", {
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
    return Promise.reject();
  }
  isRewardedAvailableNow() {
    return false;
  }
  showInterstitial() {
    const t = Date.now();
    if (Math.abs(t - this.lastInterstitialTime) < this.interstitialInterval) return Promise.reject("frequency limit");
    return this._showInterstitial().then(e => {
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
;// ./adapters/AsyncObject.ts
function AsyncObject_defineProperty(e, r, t) { return (r = AsyncObject_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function AsyncObject_toPropertyKey(t) { var i = AsyncObject_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function AsyncObject_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
class AsyncObject {
  constructor(initFunction) {
    this.initFunction = initFunction;
    AsyncObject_defineProperty(this, "waiters", []);
    AsyncObject_defineProperty(this, "isStarted", false);
    AsyncObject_defineProperty(this, "object", void 0);
    AsyncObject_defineProperty(this, "isInitialized", false);
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
;// ./adapters/Base/Purchase.ts
function Purchase_defineProperty(e, r, t) { return (r = Purchase_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function Purchase_toPropertyKey(t) { var i = Purchase_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function Purchase_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


class Purchase {
  constructor(adapter) {
    this.adapter = adapter;
    Purchase_defineProperty(this, "purchaseUrl", "");
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
    return this.buyOnPlatform(id).then(() => this.tryGetPurchases()).then(arr => {
      const purchase = arr.find(el1 => el1.productID === id) || null;
      if (!purchase) return Promise.reject();
      return purchase;
    });
  }
  getPurchases() {
    if (!this.isAvailable()) return Promise.reject("Purchase is not available");
    return this.adapter.server.request({
      url: this.purchaseUrl + "/get-transactions",
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
      url: this.purchaseUrl + "/close-transaction",
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
      url: this.purchaseUrl + "/register-transaction",
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
}
;
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
;// ./adapters/Base/CommonServer.ts
function CommonServer_defineProperty(e, r, t) { return (r = CommonServer_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function CommonServer_toPropertyKey(t) { var i = CommonServer_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function CommonServer_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


const API_URL = "https://bbb.dra.games/api";
const API_URL_GET_DATA = API_URL + "/get-data";
const API_URL_SAVE_DATA = API_URL + "/save-data";
const API_URL_PLAYERS = API_URL + "/players";
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
      url: API_URL_GET_DATA,
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
      url: API_URL,
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
      url: API_URL_SAVE_DATA,
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
      url: API_URL_PLAYERS + "/get-leaderboard",
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
      url: "",
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
    return fetch(data.url, {
      method: data.method,
      headers: {
        "Content-Type": data.contentType || "application/json"
      },
      body: JSON.stringify(data.data)
    }).then(e => e.json()).then(e => {
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

const HOST = "wss://bbb.dra.games/";
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
    //
    const websocket = new WebSocket(HOST + "?session_id=" + this.getSessionId());
    //new WebSocket(HOST, this.getSessionId());
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

const API_URL_PLAYERS_SAVE_SCORE = API_URL_PLAYERS + "/save-score";
const API_URL_PLAYERS_GET_LEADERBOARD = API_URL_PLAYERS + "/get-leaderboard";
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
      url: API_URL_PLAYERS_SAVE_SCORE,
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
      url: API_URL_PLAYERS_SAVE_SCORE,
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
      url: API_URL_PLAYERS_GET_LEADERBOARD,
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
    Adapter_defineProperty(this, "_muted", false);
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
    this.initSelf();
  }
  outputInfo() {
    console.log("Adapter: " + "Playgama");
    console.log("build time: " + "2026-05-18T09:09:30.016Z");
  }
  get isReady() {
    return this._isReady;
  }
  isSoundEnabled() {
    return !this._muted;
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
    });
    this.events.on(RESUME_EVENT, () => {
      this._paused = false;
    });
  }
  initEvents() {
    this.initMuteLogic();
  }
  initMuteLogic() {
    const update = () => {
      const shouldMute = document.visibilityState !== "visible" || !document.hasFocus();
      console.log("shouldMute", shouldMute);
      if (shouldMute && this.isSoundEnabled()) {
        this._muted = true;
        this.events.emit(AUDIO_OFF_EVENT);
      } else if (!shouldMute && !this.isSoundEnabled()) {
        this._muted = false;
        this.events.emit(AUDIO_ON_EVENT);
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
;// ./adapters/Playgama/pgConstants.ts
const API_NAME = "bridge";
;// ./adapters/Playgama/bridge.ts



;
const asyncIncludeBridge = new AsyncObject(() => {
  if (isBridgeIncluded()) return Promise.resolve();
  return includeScript("https://bridge.playgama.com/v1/stable/playgama-bridge.js");
});
asyncIncludeBridge.get();
function getBridge() {
  return window[API_NAME];
}
;
function waitBridge() {
  return asyncIncludeBridge.get();
}
;
function isBridgeIncluded() {
  return !!window[API_NAME];
}
;
;// ./adapters/Playgama/submodules/PgInterstitial.ts
function PgInterstitial_defineProperty(e, r, t) { return (r = PgInterstitial_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function PgInterstitial_toPropertyKey(t) { var i = PgInterstitial_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function PgInterstitial_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }

class PgInterstitial {
  constructor() {
    PgInterstitial_defineProperty(this, "resolve", null);
    PgInterstitial_defineProperty(this, "reject", null);
  }
  init() {
    console.log("init ads", this.getEventName());
    getBridge().advertisement.on(this.getEventName(), this.onStateChanged.bind(this));
  }
  show() {
    const promise = this.newPromise();
    this.act();
    return promise;
  }
  getEventName() {
    return getBridge().EVENT_NAME.INTERSTITIAL_STATE_CHANGED;
  }
  act() {
    getBridge().advertisement.showInterstitial();
  }
  newPromise() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
  onStateChanged(state) {
    console.log("Interstitial state: ", state);
    switch (state) {
      case "failed":
        this.callReject();
        break;
      case "closed":
        this.callResolve();
        break;
    }
  }
  callResolve() {
    if (this.resolve) this.resolve();
    this.clear();
  }
  callReject() {
    if (this.reject) this.reject();
    this.clear();
  }
  clear() {
    this.resolve = null;
    this.reject = null;
  }
}
;// ./adapters/Playgama/submodules/PgRewarded.ts
function PgRewarded_defineProperty(e, r, t) { return (r = PgRewarded_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function PgRewarded_toPropertyKey(t) { var i = PgRewarded_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function PgRewarded_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


class PgRewarded extends PgInterstitial {
  constructor() {
    super(...arguments);
    PgRewarded_defineProperty(this, "isRewarded", false);
  }
  getEventName() {
    return getBridge().EVENT_NAME.REWARDED_STATE_CHANGED;
  }
  act() {
    this.isRewarded = false;
    if (!getBridge().advertisement.isRewardedSupported) return this.callReject();
    getBridge().advertisement.showRewarded();
  }
  onStateChanged(state) {
    console.log("Rewarded state: ", state);
    switch (state) {
      case "failed":
        this.callReject();
        break;
      case "closed":
        if (this.isRewarded) {
          this.callResolve();
        } else {
          this.callReject();
        }
        break;
      case "rewarded":
        this.isRewarded = true;
        break;
    }
  }
}
;// ./adapters/Playgama/PgAdvertising.ts
function PgAdvertising_defineProperty(e, r, t) { return (r = PgAdvertising_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function PgAdvertising_toPropertyKey(t) { var i = PgAdvertising_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function PgAdvertising_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }




class PgAdvertising extends Advertising {
  constructor() {
    super(...arguments);
    PgAdvertising_defineProperty(this, "rules", {
      preroll: true,
      pause: false,
      tutorial: false
    });
    PgAdvertising_defineProperty(this, "interstitial", new PgInterstitial());
    PgAdvertising_defineProperty(this, "rewarded", new PgRewarded());
  }
  init() {
    this.interstitial.init();
    this.rewarded.init();
    return super.init();
  }
  _showInterstitial() {
    return this.interstitial.show();
  }
  isRewardedAvailableNow() {
    return getBridge().advertisement.isRewardedSupported;
  }
  showRewarded() {
    return this.rewarded.show();
  }
  showPreroll() {
    return Promise.reject();
  }
}
;// ./adapters/Playgama/PgPlayer.ts


class PgPlayer extends Player {
  getId() {
    return String(getBridge().player.id || "");
  }
  getName() {
    return String(getBridge().player.name || "");
  }
  getAvatar() {
    return String(getBridge().player.photos?.[0] || "");
  }
  isAuthAvailable() {
    return getBridge().player.isAuthorizationSupported;
  }
  isAuth() {
    return getBridge().player.isAuthorized;
  }
  auth() {
    return getBridge().player.authorize();
  }
}
;
;// ./adapters/Playgama/submodules/PgInviteFriends.ts


class PgInviteFriends extends SubModule {
  async init() {
    this.available = false; // getBridge().social.isInviteFriendsSupported || false;
  }
  async act(text) {
    if (!this.isAvailable()) return Promise.reject();
    return getBridge().social.inviteFriends({
      text
    });
  }
}
;// ./adapters/Playgama/submodules/PgAddToFavorites.ts


class PgAddToFavorites extends SubModule {
  async init() {
    this.available = false; // getBridge().social.isAddToFavoritesSupported || false;
  }
  async act() {
    if (!this.isAvailable()) return Promise.reject();
    return getBridge().social.addToFavorites().finally(() => {
      this.init();
    });
  }
}
;// ./adapters/Playgama/submodules/PgMakeReview.ts


class PgMakeReview extends SubModule {
  async init() {
    this.available = false; // getBridge().social.isRateSupported || false;
  }
  async act() {
    if (!this.isAvailable()) return Promise.reject();
    return getBridge().social.rate().finally(() => {
      this.init();
    });
  }
}
;// ./adapters/Playgama/submodules/PgSetShortcut.ts


class PgSetShortcut extends SubModule {
  async init() {
    this.available = false; // getBridge().social.isAddToHomeScreenSupported || false;
  }
  async act() {
    if (!this.isAvailable()) return Promise.reject();
    return getBridge().social.addToHomeScreen().finally(() => {
      this.init();
    });
  }
}
;// ./adapters/Playgama/PgStorage.ts


const LOCAL_STORAGE = "local_storage";
const PLATFORM_INTERNAL = "platform_internal";
class PgStorage extends Storage {
  getStorageType() {
    const cloudIsAvailable = getBridge().storage.isAvailable(PLATFORM_INTERNAL);
    return cloudIsAvailable ? PLATFORM_INTERNAL : LOCAL_STORAGE;
  }
  getFromPlatform(keys) {
    return getBridge().storage.get(keys, this.getStorageType()).then(values => {
      if (!values || !keys) return null;
      return keys.reduce((iter, key, index) => {
        iter[key] = values[index] || undefined;
        return iter;
      }, {});
    }).catch(error => {
      console.error("Storage get error:", error);
      return null;
    });
  }
  setToPlatform(data) {
    return getBridge().storage.set(Object.keys(data), Object.values(data), this.getStorageType()).catch(error => {
      console.error("Storage set error:", error);
    });
  }
}
;// ./adapters/Base/DisabledServer.ts

class DisabledServer extends CommonServer {
  isReady() {
    return true;
  }
  request(data) {
    return Promise.resolve(null);
  }
}
;// ./adapters/Playgama/PlaygamaAdapter.ts
function PlaygamaAdapter_defineProperty(e, r, t) { return (r = PlaygamaAdapter_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function PlaygamaAdapter_toPropertyKey(t) { var i = PlaygamaAdapter_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function PlaygamaAdapter_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }











class PlaygamaAdapter extends Adapter {
  constructor() {
    super(...arguments);
    PlaygamaAdapter_defineProperty(this, "platform_prefix", "playgama");
  }
  isSoundEnabled() {
    return getBridge().platform.isAudioEnabled;
  }
  initEvents() {
    const bridge = getBridge();
    bridge.platform.on(bridge.EVENT_NAME.AUDIO_STATE_CHANGED, this.onAudioStateChanged.bind(this));
    bridge.platform.on(bridge.EVENT_NAME.PAUSE_STATE_CHANGED, this.onPauseStateChanged.bind(this));
  }
  onAudioStateChanged(isEnabled) {
    if (isEnabled) {
      this.events.emit(AUDIO_ON_EVENT);
    } else {
      this.events.emit(AUDIO_OFF_EVENT);
    }
  }
  onPauseStateChanged(isPaused) {
    if (isPaused) {
      this.events.emit(PAUSE_EVENT);
    } else {
      this.events.emit(RESUME_EVENT);
    }
  }
  getPlatformId() {
    return getBridge().platform.id;
  }
  getGameCode() {
    return this.platform_prefix + "_" + getBridge().platform.id + "_" + this.options.game_name;
  }
  getLang() {
    return getBridge().platform.language || "en";
  }
  gameReady() {
    getBridge().platform.sendMessage("game_ready");
    super.gameReady();
  }
  gameplayStart() {
    getBridge().platform.sendMessage("gameplay_started");
  }
  gameplayStop() {
    getBridge().platform.sendMessage("gameplay_stopped");
  }
  getServerTime() {
    return getBridge().platform.getServerTime().catch(error => {
      console.log("PlaygamaAdapter getServerTime error", error);
      return super.getServerTime();
    });
  }
  initApi() {
    return waitBridge().then(() => getBridge().initialize()).then(() => {
      console.log("PlaygamaAdapter initApi success");
    }).catch(error => {
      console.error("PlaygamaAdapter initApi error", error);
    });
  }
  createPlayer() {
    return new PgPlayer(this);
  }
  createStorage() {
    return new PgStorage(this);
  }
  createAdvertising() {
    return new PgAdvertising(this);
  }
  createInviteFriends() {
    return new PgInviteFriends(this);
  }
  createAddToFavorites() {
    return new PgAddToFavorites(this);
  }
  createMakeReview() {
    return new PgMakeReview(this);
  }
  createSetShortcut() {
    return new PgSetShortcut(this);
  }
  createServer() {
    return new DisabledServer(this);
  }
  redirect(url) {
    return;
  }
}
;
var __webpack_exports__default = __webpack_exports__.A;
export { __webpack_exports__default as default };
