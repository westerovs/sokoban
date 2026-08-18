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
  A: () => (/* binding */ OkAdapter)
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
const OK_PURCHASE_URL = `${COMMON_PURCHASE_URL}/ok`;
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
class Leaderboard {
  constructor(adapter) {
    this.adapter = adapter;
    Leaderboard_defineProperty(this, "available", true);
    Leaderboard_defineProperty(this, "extra_data", void 0);
    Leaderboard_defineProperty(this, "extra_data_init", false);
  }
  init() {
    return Promise.resolve(null);
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
    this.adapter.server.setScore(score);
    return this.tryInitExtraData().then(() => this.adapter.server.save(force));
  }
  addScore(v) {
    v = Number(v) || 0;
    return this.getScore().then(score => {
      return this.setScore(score + v);
    });
  }
  setExtraData(data) {
    let force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    this.setSelfExtraData(data);
    this.adapter.server.setExtraData(this.extra_data);
    return this.adapter.server.save(force);
  }
  getEntries() {
    let top_limit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
    let nearby_limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 6;
    return this.adapter.server.getLb(top_limit, nearby_limit).then(data => this.formatEntries(this.sortServerEntries(data, top_limit))).catch(() => []);
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
  tryInitExtraData() {
    if (this.extra_data_init) return Promise.resolve();
    return this.initExtraData();
  }
  initExtraData() {
    return this.adapter.leaderboard.getEntry().then(entry => {
      this.setSelfExtraData(entry.extra_data);
    }).catch(err => {
      console.error("Leaderboard.initExtraData error", err);
    });
  }
  setSelfExtraData(data) {
    this.extra_data = {
      ...this.getDefaultExtraData(),
      ...data
    };
    this.extra_data_init = true;
  }
  getDefaultExtraData() {
    return {
      title: this.adapter.player.getName() || undefined,
      avatar: this.adapter.player.getAvatar() || undefined
    };
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
    console.log("Adapter: " + "Ok");
    console.log("build time: " + "2026-04-28T10:09:39.925Z");
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
;// ./adapters/Ok/FapiUI.ts

class UI {
  constructor(fapi) {
    this.fapi = fapi;
  }
  showPayment(name, description, code, price, options, attributes, currency, callback) {
    return this.callForNativeWithPromise("showPayment", name, description, code, price, options, attributes, currency, callback);
  }
  showAd() {
    return this.waitAd("showAd", 10 * SECOND);
  }
  loadAd() {
    return this.callForNativeWithPromise("loadAd");
  }
  showLoadedAd() {
    return this.waitAd("showLoadedAd");
  }
  showBannerAds(side) {
    return this.callForNativeWithPromise("showBannerAds", side);
  }
  hideBannerAds() {
    return this.callForNativeWithPromise("hideBannerAds");
  }
  requestBannerAds() {
    return this.callForNativeWithPromise("requestBannerAds");
  }
  setBannerFormat(format) {
    return this.callForNativeWithPromise("setBannerFormat", format);
  }
  getBannerFormats() {
    return this.callForNativeWithPromise("getBannerFormats");
  }
  isBannerAdsVisible() {
    return this.callForNativeWithPromise("isBannerAdsVisible");
  }
  joinGroup(groupId) {
    return this.callForNativeWithPromise("joinGroup", groupId, true);
  }
  showInvite(message) {
    return this.callForNativeWithPromise("showInvite", message);
  }
  postMediatopic(data) {
    return this.callForNativeWithPromise("postMediatopic", data);
  }
  showRatingDialog() {
    return this.callForNativeWithPromise("showRatingDialog");
  }
  postMoment(data) {
    return this.callForNativeWithPromise("postMoment", data);
  }
  waitAd(funcName) {
    let waitTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;
    return new Promise((resolve, reject) => {
      let startedQueue = 1,
        queue = 1,
        timeout;
      const onEvent = data => {
        if (data.includes("ads_queue_size=")) {
          queue = startedQueue = parseInt(data.split("=")[1]);
        } else if (data.includes("ad_started")) {
          startedQueue--;
          rerunTimeout();
        }
        console.log("onEvent", {
          data,
          queue,
          startedQueue
        });
      };
      const listen = () => {
          this.fapi.apiEventToPromise(funcName, onEvent).then(data => {
            if (data === "ad_prepared") {
              listen();
            } else {
              queue--;
              if (queue === 0) {
                resolve();
              } else {
                listen();
                rerunTimeout();
              }
            }
          }).catch(e => {
            console.error(`OkAd error ${funcName}`, e);
            reject(e);
          });
        },
        rerunTimeout = () => {
          if (timeout) clearTimeout(timeout);
          timeout = 0;
          if (waitTime < 0) return;
          timeout = setTimeout(() => {
            console.log("waitAd timeout", {
              startedQueue,
              queue
            });
            //if(startedQueue >= queue)reject();
            reject("timeout");
          }, waitTime);
        };
      listen();
      rerunTimeout();
      this.fapi.nativeFapi.UI[funcName]?.();
    });
  }
  callForNativeWithPromise(funcName) {
    const promise = this.fapi.apiEventToPromise(funcName);
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    console.log("callForNativeWithPromise", funcName, args);
    this.fapi.nativeFapi.UI[funcName]?.(...args);
    return promise;
  }
}
;
;// ./adapters/Ok/okConstans.ts
const API_NAME = "FAPI";
const okConstans_API_URL = "https://api.ok.ru/js/fapi5.js";
const OK_DEFAULT_AVATAR_DIR_URL = "https://dravk.ru/slova_ok/avatars/";
const OK_DEFAULT_AVATAR_URL_FEMALE = OK_DEFAULT_AVATAR_DIR_URL + "f.png";
const OK_DEFAULT_AVATAR_URL_MALE = OK_DEFAULT_AVATAR_DIR_URL + "m.png";
;// ./adapters/Ok/FapiWithPromises.ts
function FapiWithPromises_defineProperty(e, r, t) { return (r = FapiWithPromises_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function FapiWithPromises_toPropertyKey(t) { var i = FapiWithPromises_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function FapiWithPromises_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



;
class FapiWithPromises {
  constructor() {
    FapiWithPromises_defineProperty(this, "events", new EventsCore());
    FapiWithPromises_defineProperty(this, "UI", new UI(this));
    FapiWithPromises_defineProperty(this, "Client", new Client(this));
    this.initEvents();
  }
  get nativeFapi() {
    return window[API_NAME];
  }
  initEvents() {
    window["API_callback"] = (method, result, data) => {
      this.events.emit(method + "_" + result, data);
      console.log(method + "_" + result, data);
    };
  }
  apiEventToPromise(key, eventCb) {
    const listeners = [],
      clear = () => {
        listeners.forEach(f => this.events.off(f));
      };
    return new Promise((resolve, reject) => {
      const error = function () {
        for (var _len = arguments.length, arr = new Array(_len), _key = 0; _key < _len; _key++) {
          arr[_key] = arguments[_key];
        }
        reject(arr);
      };
      listeners.push(this.events.on(key + "_event", data => {
        if (eventCb) eventCb(data);
      }));
      listeners.push(this.events.once(key + "_ok", data => {
        resolve(data);
      }));
      listeners.push(this.events.once(key + "_error", error));
      listeners.push(this.events.once(key + "_cancel", error));
    }).then(data => {
      clear();
      return Promise.resolve(data);
    }).catch(e => {
      clear();
      return Promise.reject(e);
    });
  }
  getPlayersData(ids) {
    return new Promise(resolve => {
      this.Client.call({
        "method": "users.getInfo",
        "fields": "first_name,last_name,pic128x128,uid,gender",
        "uids": ids,
        emptyPictures: true
      }).then(data => {
        resolve(data);
      }).catch(e => {
        console.error(e);
        resolve([]);
      });
    });
  }
}
;
class Client {
  constructor(fapi) {
    this.fapi = fapi;
  }
  call(data) {
    return new Promise((resolve, reject) => {
      this.fapi.nativeFapi.Client.call(data, (result, data, error) => {
        console.log("Client.call", {
          input: data,
          output: {
            result,
            data,
            error
          }
        });
        if (result === "ok") {
          resolve(data);
        } else {
          reject(error || data);
        }
      });
    });
  }
}
;
const fapiWithPromises = new FapiWithPromises();
/* harmony default export */ const Ok_FapiWithPromises = (fapiWithPromises);
;// ./adapters/Ok/submodules/OkBanner.ts
function OkBanner_defineProperty(e, r, t) { return (r = OkBanner_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function OkBanner_toPropertyKey(t) { var i = OkBanner_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function OkBanner_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



class OkBanner extends SubModule {
  constructor() {
    super(...arguments);
    OkBanner_defineProperty(this, "available", true);
    OkBanner_defineProperty(this, "ready", false);
    OkBanner_defineProperty(this, "side", "bottom");
    OkBanner_defineProperty(this, "block", false);
  }
  init() {
    const fapi = Ok_FapiWithPromises;
    return fapi.UI.getBannerFormats().then(json => {
      let bannerFormat = "";
      const data = JSON.parse(json),
        supported = data.supported;
      if (IS_MOBILE) {
        bannerFormat = "bar_outer";
        this.side = "bottom";
      } else {
        bannerFormat = "vertical_outer";
        this.side = "right";
      }
      if (!supported.includes(bannerFormat)) {
        this.block = true;
        return;
      }
      return fapi.UI.setBannerFormat(bannerFormat);
    }).then(res => {
      this.check();
    }).catch(e => {
      this.block = true;
    });
  }
  act(show) {
    show ? this.show() : this.hide();
    return Promise.resolve(this.getStatus());
  }
  show() {
    this.status = true;
    if (!this.ready) {
      this.search().then(() => {
        this.show();
      });
    } else {
      Ok_FapiWithPromises.UI.showBannerAds(this.side);
      this.ready = false;
    }
  }
  hide() {
    if (!this.status) return;
    this.status = false;
    Ok_FapiWithPromises.UI.hideBannerAds();
  }
  search() {
    if (this.block) return Promise.reject("blocked");
    return Ok_FapiWithPromises.UI.requestBannerAds().then(res => {
      this.ready = true;
      return true;
    }).catch(e => {
      return e;
    });
  }
  update() {
    if (this.block || !this.status) return;
    this.show();
  }
  check() {
    Ok_FapiWithPromises.UI.isBannerAdsVisible().then(data => {
      if (Boolean(data) && !this.status) {
        this.hide();
      } else if (!Boolean(data) && this.status) {
        this.show();
      }
    }).catch(e => {
      return false;
    });
  }
}
;
;// ./adapters/Ok/submodules/OkInterstitial.ts
function OkInterstitial_defineProperty(e, r, t) { return (r = OkInterstitial_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function OkInterstitial_toPropertyKey(t) { var i = OkInterstitial_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function OkInterstitial_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


class OkInterstitial extends SubModule {
  constructor() {
    super(...arguments);
    OkInterstitial_defineProperty(this, "available", true);
  }
  act() {
    const fapi = Ok_FapiWithPromises;
    if (!fapi) {
      console.error("OkInterstitial error", "fapi is not defined");
      return Promise.reject();
    }
    return Ok_FapiWithPromises.UI.showAd();
  }
}
;
;// ./adapters/Ok/submodules/OkRewarded.ts
function OkRewarded_defineProperty(e, r, t) { return (r = OkRewarded_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function OkRewarded_toPropertyKey(t) { var i = OkRewarded_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function OkRewarded_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



class OkRewarded extends SubModule {
  constructor() {
    super(...arguments);
    OkRewarded_defineProperty(this, "available", true);
    OkRewarded_defineProperty(this, "ready", false);
    OkRewarded_defineProperty(this, "loading", false);
  }
  act() {
    const fapi = Ok_FapiWithPromises;
    if (!fapi) {
      console.error("OkRewarded error", "fapi is not defined");
      return Promise.reject();
    }

    //if(!this.ready)return Promise.reject();

    return fapi.UI.showLoadedAd().finally(() => {
      this.ready = false;
      setTimeout(() => this.update(), SECOND);
    });
  }
  isReady() {
    return this.ready;
  }
  init() {
    setInterval(() => this.update(), MINUTE * 2);
    this.update();
    return Promise.resolve();
  }
  update() {
    if (!this.adapter || this.ready || this.loading) return;
    this.load();
  }
  load() {
    if (!this.adapter || this.ready || this.loading) return;
    this.loading = true;
    Ok_FapiWithPromises.UI.loadAd().then(() => {
      this.ready = true;
    }).catch(() => {}).finally(() => {
      this.loading = false;
    });
  }
}
;
;// ./adapters/Ok/OkAdvertising.ts
function OkAdvertising_defineProperty(e, r, t) { return (r = OkAdvertising_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function OkAdvertising_toPropertyKey(t) { var i = OkAdvertising_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function OkAdvertising_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }




class OkAdvertising extends Advertising {
  constructor() {
    super(...arguments);
    OkAdvertising_defineProperty(this, "interstitial", new OkInterstitial(this.adapter));
    OkAdvertising_defineProperty(this, "rewarded", new OkRewarded(this.adapter));
    OkAdvertising_defineProperty(this, "banner", new OkBanner(this.adapter));
  }
  init() {
    this.rewarded.init();
    this.banner.init();
    return Promise.resolve(true);
  }
  showPreroll() {
    return Promise.resolve();
  }
  _showInterstitial() {
    return this.interstitial.act();
  }
  isRewardedAvailableNow() {
    return this.rewarded.isReady();
  }
  showRewarded() {
    return this.rewarded.act();
  }
  showBanner() {
    return this.banner.act(true);
  }
  hideBanner() {
    return this.banner.act(false);
  }
}
;
;// ./adapters/Ok/okHelpingFunctiouns.ts

function getOkParams() {
  const fapi = window[API_NAME],
    params = fapi.Util.getRequestParameters();
  return params;
}
;
;// ./adapters/Ok/OkPlayer.ts
function OkPlayer_defineProperty(e, r, t) { return (r = OkPlayer_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function OkPlayer_toPropertyKey(t) { var i = OkPlayer_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function OkPlayer_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }




class OkPlayer extends Player {
  constructor() {
    super(...arguments);
    OkPlayer_defineProperty(this, "player", null);
  }
  init() {
    return this.initUserData().then(() => super.init());
  }
  isAuth() {
    return true;
  }
  auth() {
    return Promise.resolve();
  }
  getName() {
    return (this.getFirstName() + " " + this.getLastName()).trim();
  }
  getId() {
    return getOkParams()["logged_user_id"];
  }
  getAvatar() {
    return this.player?.pic128x128 || (this.player?.gender === "female" ? OK_DEFAULT_AVATAR_URL_FEMALE : OK_DEFAULT_AVATAR_URL_MALE);
  }
  initUserData() {
    return Ok_FapiWithPromises.getPlayersData([this.getId()]).then(data => {
      this.player = data[0];
    });
  }
  getFirstName() {
    return (this.player?.first_name || "").trim();
  }
  getLastName() {
    return (this.player?.last_name || "").trim();
  }
}
;
;// ./adapters/Ok/OkPurchase.ts
function OkPurchase_defineProperty(e, r, t) { return (r = OkPurchase_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function OkPurchase_toPropertyKey(t) { var i = OkPurchase_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function OkPurchase_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }




class OkPurchase extends Purchase {
  constructor() {
    super(...arguments);
    OkPurchase_defineProperty(this, "available", true);
    OkPurchase_defineProperty(this, "purchaseUrl", OK_PURCHASE_URL);
  }
  getCurrency() {
    let v = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    return "OK";
  }
  buyOnPlatform(id) {
    return this.getCatalog().then(catalog => {
      const data = catalog[id] || {};
      if (!data) return Promise.reject(new Error(`Product ${id} not found`));
      return Ok_FapiWithPromises.UI.showPayment(data.title || "",
      //name
      data.descr || "descr",
      //description
      id,
      //code
      data.price || 1,
      //price
      null,
      //options
      JSON.stringify({
        app_id: this.adapter.options["app_id"]
      }),
      //attributes
      "ok",
      //currency
      "true" //callback
      );
    }).then(() => id);
  }
  getSign() {
    return getOkParams();
  }
}
;
;// ./adapters/Ok/submodules/OkJoinGroup.ts
function OkJoinGroup_defineProperty(e, r, t) { return (r = OkJoinGroup_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function OkJoinGroup_toPropertyKey(t) { var i = OkJoinGroup_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function OkJoinGroup_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


class OkJoinGroup extends SubModule {
  constructor() {
    super(...arguments);
    OkJoinGroup_defineProperty(this, "available", true);
  }
  init() {
    if (!this.getGroupId()) {
      this.available = false;
      return Promise.resolve(false);
    }
    return Ok_FapiWithPromises.Client.call({
      "method": "group.getUserGroupsByIds",
      "uids": this.adapter.player.getId(),
      "group_id": this.getGroupId()
    }).then(data => {
      this.status = data.length ? ["active", "admin", "moderator"].includes(data[0].status.toLowerCase()) : false;
      return this.status;
    }).catch(() => {
      return false;
    });
  }
  act() {
    if (!this.available) {
      return Promise.reject();
    }
    return Ok_FapiWithPromises.UI.joinGroup(this.getGroupId()).finally(() => {
      this.init();
    });
  }
  getGroupId() {
    return this.adapter.options.group_id || 0;
  }
}
;// ./adapters/Ok/submodules/OkInviteFriends.ts
function OkInviteFriends_defineProperty(e, r, t) { return (r = OkInviteFriends_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function OkInviteFriends_toPropertyKey(t) { var i = OkInviteFriends_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function OkInviteFriends_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


class OkInviteFriends extends SubModule {
  constructor() {
    super(...arguments);
    OkInviteFriends_defineProperty(this, "available", true);
  }
  act() {
    let message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "invite";
    return Ok_FapiWithPromises.UI.showInvite(message);
  }
}
;// ./adapters/Ok/submodules/OkMakePost.ts
function OkMakePost_defineProperty(e, r, t) { return (r = OkMakePost_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function OkMakePost_toPropertyKey(t) { var i = OkMakePost_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function OkMakePost_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


class OkMakePost extends SubModule {
  constructor() {
    super(...arguments);
    OkMakePost_defineProperty(this, "available", true);
  }
  act(text) {
    return Ok_FapiWithPromises.UI.postMediatopic({
      "media": [{
        "type": "text",
        "text": text
      }, {
        "type": "link",
        "url": "https://ok.ru/game/" + this.adapter.options.app_id
      }]
    });
  }
}
;// ./adapters/Ok/submodules/OkMakeReview.ts
function OkMakeReview_defineProperty(e, r, t) { return (r = OkMakeReview_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function OkMakeReview_toPropertyKey(t) { var i = OkMakeReview_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function OkMakeReview_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


class OkMakeReview extends SubModule {
  constructor() {
    super(...arguments);
    OkMakeReview_defineProperty(this, "available", true);
  }
  init() {
    return Ok_FapiWithPromises.Client.call({
      "method": "apps.getAppUserRating",
      "app_id": this.adapter.options.app_id
    }).then(data => {
      this.status = data.success && data.rating > 0;
      return this.status;
    }).catch(() => {
      return false;
    });
  }
  act() {
    return Ok_FapiWithPromises.UI.showRatingDialog().then(() => {
      this.status = true;
    }).finally(() => {
      this.init();
    });
  }
}
;// ./adapters/Ok/submodules/OkMakeStories.ts
function OkMakeStories_defineProperty(e, r, t) { return (r = OkMakeStories_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function OkMakeStories_toPropertyKey(t) { var i = OkMakeStories_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function OkMakeStories_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


class OkMakeStories extends SubModule {
  constructor() {
    super(...arguments);
    OkMakeStories_defineProperty(this, "available", false);
  }
  act(data) {
    return Ok_FapiWithPromises.UI.postMoment(JSON.stringify({
      mediaId: data.mediaId,
      blocks: [{
        href: data.href,
        text: data.text,
        type: 10,
        style: 'LIGHT'
      }]
    }));
  }
}
;// ./adapters/Ok/OkLeaderboard.ts



class OkLeaderboard extends Leaderboard {
  formatEntries(serverEntries) {
    if (!serverEntries.length) return Promise.resolve([]);
    return Ok_FapiWithPromises.getPlayersData(serverEntries.map(data => data.player_id)).then(playersData => {
      return serverEntries.map(data => {
        const player = playersData.find(player => player.uid == data.player_id),
          firstName = player?.first_name || "",
          lastName = player?.last_name || "";
        return {
          id: data.player_id,
          score: data.score,
          rank: data.rank,
          avatar: player?.pic128x128 || (player?.gender === "female" ? OK_DEFAULT_AVATAR_URL_FEMALE : OK_DEFAULT_AVATAR_URL_MALE),
          title: (firstName + (lastName ? " " + lastName : "")).trim() || ""
        };
      });
    });
  }
}
;// ./adapters/Ok/OkStorage.ts
function OkStorage_defineProperty(e, r, t) { return (r = OkStorage_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function OkStorage_toPropertyKey(t) { var i = OkStorage_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function OkStorage_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



class OkStorage extends Storage {
  constructor() {
    super(...arguments);
    OkStorage_defineProperty(this, "storageCache", {});
  }
  getFromPlatform(keys) {
    return Ok_FapiWithPromises.Client.call({
      "method": "storage.get",
      "keys": keys
    }).then(e => {
      if (e.error) return Promise.reject(e.error);
      if (e.data) Object.assign(this.storageCache, e.data);
      console.log("okGetItem", keys, e.data);
      return this.unpuckSave(e.data);
    }).catch(e => {
      console.error("okGetItem error", keys, e);
      return null;
    });
  }
  setToPlatform(data) {
    if (!data) return Promise.resolve(null);
    return Promise.all(Object.keys(data).map(key => {
      return this.okSetItem(key, data[key]);
    }));
  }
  okSetItem(key, value) {
    if (this.storageCache[key] == value) return Promise.resolve(null);
    this.storageCache[key] = value;
    return Ok_FapiWithPromises.Client.call({
      "method": "storage.set",
      "key": key,
      "value": this.puckValue(value)
    }).then(e => {
      if (e.error) return Promise.reject(e.error);
      console.log("okSetItem", key, value);
      return e.data || null;
    }).catch(e => {
      console.error("okSetItem error", key, value, e);
      return null;
    });
  }
  puckValue(value) {
    return stringifyJSON(value);
  }
  unpuckValue(value) {
    return parseJSON(value);
  }
  unpuckSave(save) {
    if (!save) return null;
    return Object.entries(save).reduce((acc, _ref) => {
      let [key, value] = _ref;
      acc[key] = this.unpuckValue(value);
      return acc;
    }, {});
  }
}
;// ./adapters/Ok/OkLeaderboards.ts



class OkLeaderboards extends Leaderboards {
  formatEntries(serverEntries) {
    if (!serverEntries.length) return Promise.resolve([]);
    return Ok_FapiWithPromises.getPlayersData(serverEntries.map(data => data.player_id)).then(playersData => {
      return serverEntries.map(data => {
        const player = playersData.find(player => player.uid == data.player_id),
          firstName = player?.first_name || "",
          lastName = player?.last_name || "";
        return {
          id: data.player_id,
          score: data.score,
          rank: data.rank,
          avatar: player?.pic128x128 || (player?.gender === "female" ? OK_DEFAULT_AVATAR_URL_FEMALE : OK_DEFAULT_AVATAR_URL_MALE),
          title: (firstName + (lastName ? " " + lastName : "")).trim() || ""
        };
      });
    });
  }
}
;// ./adapters/Ok/OkAdapter.ts
function OkAdapter_defineProperty(e, r, t) { return (r = OkAdapter_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function OkAdapter_toPropertyKey(t) { var i = OkAdapter_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function OkAdapter_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
















;
includeScript(okConstans_API_URL);
class OkAdapter extends Adapter {
  constructor() {
    super(...arguments);
    OkAdapter_defineProperty(this, "platform_prefix", "OK");
  }
  getLang() {
    return "ru";
  }
  createAdvertising() {
    return new OkAdvertising(this);
  }
  createPlayer() {
    return new OkPlayer(this);
  }
  createLeaderboard() {
    return new OkLeaderboard(this);
  }
  createLeaderboards() {
    return new OkLeaderboards(this);
  }
  createStorage() {
    return new OkStorage(this);
  }
  createPurchase() {
    return new OkPurchase(this);
  }
  createSession() {
    return new Session(this);
  }
  createJoinGroup() {
    return new OkJoinGroup(this);
  }
  createInviteFriends() {
    return new OkInviteFriends(this);
  }
  createMakePost() {
    return new OkMakePost(this);
  }
  createMakeReview() {
    return new OkMakeReview(this);
  }
  createMakeStories() {
    return new OkMakeStories(this);
  }
  initApi() {
    console.log("initApi()");
    return this.waitApi().then(() => new Promise((resolve, reject) => {
      const fapi = window[API_NAME],
        params = getOkParams();
      fapi.init(params["api_server"], params["apiconnection"], () => {
        console.log("fapi init");
        this.api = window[API_NAME];
        resolve();
      }, error => {
        console.error("fapi init error", error);
        //reject(error);
      });
    }));
  }
  waitApi() {
    console.log("waitApi()");
    return new Promise(resolve => {
      const checkApi = () => {
        if (window[API_NAME]) {
          console.log("fapi loaded");
          resolve();
        } else {
          setTimeout(checkApi, 50);
        }
      };
      checkApi();
    });
  }
}
var __webpack_exports__default = __webpack_exports__.A;
export { __webpack_exports__default as default };
