/******/ var __webpack_modules__ = ({

/***/ 817:
/***/ (function(__unused_webpack_module, exports) {

!function (e, n) {
   true ? n(exports) : 0;
}(this, function (e) {
  "use strict";

  var n = function () {
    return n = Object.assign || function (e) {
      for (var n, t = 1, r = arguments.length; t < r; t++) for (var o in n = arguments[t]) Object.prototype.hasOwnProperty.call(n, o) && (e[o] = n[o]);
      return e;
    }, n.apply(this, arguments);
  };
  function t(e, n, t, r) {
    return new (t || (t = Promise))(function (o, a) {
      function i(e) {
        try {
          s(r.next(e));
        } catch (e) {
          a(e);
        }
      }
      function p(e) {
        try {
          s(r.throw(e));
        } catch (e) {
          a(e);
        }
      }
      function s(e) {
        var n;
        e.done ? o(e.value) : (n = e.value, n instanceof t ? n : new t(function (e) {
          e(n);
        })).then(i, p);
      }
      s((r = r.apply(e, n || [])).next());
    });
  }
  function r(e, n) {
    var t,
      r,
      o,
      a,
      i = {
        label: 0,
        sent: function () {
          if (1 & o[0]) throw o[1];
          return o[1];
        },
        trys: [],
        ops: []
      };
    return a = {
      next: p(0),
      throw: p(1),
      return: p(2)
    }, "function" == typeof Symbol && (a[Symbol.iterator] = function () {
      return this;
    }), a;
    function p(p) {
      return function (s) {
        return function (p) {
          if (t) throw new TypeError("Generator is already executing.");
          for (; a && (a = 0, p[0] && (i = 0)), i;) try {
            if (t = 1, r && (o = 2 & p[0] ? r.return : p[0] ? r.throw || ((o = r.return) && o.call(r), 0) : r.next) && !(o = o.call(r, p[1])).done) return o;
            switch (r = 0, o && (p = [2 & p[0], o.value]), p[0]) {
              case 0:
              case 1:
                o = p;
                break;
              case 4:
                return i.label++, {
                  value: p[1],
                  done: !1
                };
              case 5:
                i.label++, r = p[1], p = [0];
                continue;
              case 7:
                p = i.ops.pop(), i.trys.pop();
                continue;
              default:
                if (!(o = i.trys, (o = o.length > 0 && o[o.length - 1]) || 6 !== p[0] && 2 !== p[0])) {
                  i = 0;
                  continue;
                }
                if (3 === p[0] && (!o || p[1] > o[0] && p[1] < o[3])) {
                  i.label = p[1];
                  break;
                }
                if (6 === p[0] && i.label < o[1]) {
                  i.label = o[1], o = p;
                  break;
                }
                if (o && i.label < o[2]) {
                  i.label = o[2], i.ops.push(p);
                  break;
                }
                o[2] && i.ops.pop(), i.trys.pop();
                continue;
            }
            p = n.call(e, i);
          } catch (e) {
            p = [6, e], r = 0;
          } finally {
            t = o = 0;
          }
          if (5 & p[0]) throw p[1];
          return {
            value: p[0] ? p[1] : void 0,
            done: !0
          };
        }([p, s]);
      };
    }
  }
  function o(e, n, t) {
    if (t || 2 === arguments.length) for (var r, o = 0, a = n.length; o < a; o++) !r && o in n || (r || (r = Array.prototype.slice.call(n, 0, o)), r[o] = n[o]);
    return e.concat(r || Array.prototype.slice.call(n));
  }
  function a(e, t, r) {
    var o = function (e) {
      var n = {
          current: 0,
          next: function () {
            return ++this.current;
          }
        },
        t = {};
      return {
        add: function (r, o) {
          var a = null != o ? o : "".concat(n.next(), "_").concat(e);
          return t[a] = r, a;
        },
        resolve: function (e, n, r) {
          var o = t[e];
          o && (r(n) ? o.resolve(n) : o.reject(n), t[e] = null);
        }
      };
    }(r);
    return t(function (e) {
      if (e.detail && e.detail.data && "object" == typeof e.detail.data && "request_id" in e.detail.data) {
        var n = e.detail.data,
          t = n.request_id,
          r = function (e, n) {
            var t = {};
            for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && n.indexOf(r) < 0 && (t[r] = e[r]);
            if (null != e && "function" == typeof Object.getOwnPropertySymbols) {
              var o = 0;
              for (r = Object.getOwnPropertySymbols(e); o < r.length; o++) n.indexOf(r[o]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[o]) && (t[r[o]] = e[r[o]]);
            }
            return t;
          }(n, ["request_id"]);
        t && o.resolve(t, r, function (e) {
          return !("error_type" in e);
        });
      }
    }), function (t, r) {
      return void 0 === r && (r = {}), new Promise(function (a, i) {
        var p = o.add({
          resolve: a,
          reject: i
        }, r.request_id);
        e(t, n(n({}, r), {
          request_id: p
        }));
      });
    };
  }
  var i,
    p = "undefined" != typeof window,
    s = Boolean(p && window.AndroidBridge),
    u = Boolean(p && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.VKWebAppClose),
    c = Boolean(p && window.ReactNativeWebView && "function" == typeof window.ReactNativeWebView.postMessage),
    d = p && !s && !u,
    l = d && /(^\?|&)vk_platform=mobile_web(&|$)/.test(location.search),
    f = d ? "message" : "VKWebAppEvent",
    b = o(["VKWebAppInit", "VKWebAppGetCommunityAuthToken", "VKWebAppAddToCommunity", "VKWebAppAddToHomeScreenInfo", "VKWebAppClose", "VKWebAppCopyText", "VKWebAppCreateHash", "VKWebAppGetUserInfo", "VKWebAppSetLocation", "VKWebAppSendToClient", "VKWebAppGetClientVersion", "VKWebAppGetPhoneNumber", "VKWebAppGetEmail", "VKWebAppGetGroupInfo", "VKWebAppGetGeodata", "VKWebAppGetCommunityToken", "VKWebAppGetConfig", "VKWebAppGetLaunchParams", "VKWebAppSetTitle", "VKWebAppGetAuthToken", "VKWebAppCallAPIMethod", "VKWebAppJoinGroup", "VKWebAppLeaveGroup", "VKWebAppAllowMessagesFromGroup", "VKWebAppDenyNotifications", "VKWebAppAllowNotifications", "VKWebAppOpenPayForm", "VKWebAppOpenApp", "VKWebAppShare", "VKWebAppShowWallPostBox", "VKWebAppScroll", "VKWebAppShowOrderBox", "VKWebAppShowLeaderBoardBox", "VKWebAppShowInviteBox", "VKWebAppShowRequestBox", "VKWebAppAddToFavorites", "VKWebAppShowStoryBox", "VKWebAppStorageGet", "VKWebAppStorageGetKeys", "VKWebAppStorageSet", "VKWebAppFlashGetInfo", "VKWebAppSubscribeStoryApp", "VKWebAppOpenWallPost", "VKWebAppCheckAllowedScopes", "VKWebAppCheckBannerAd", "VKWebAppHideBannerAd", "VKWebAppShowBannerAd", "VKWebAppCheckNativeAds", "VKWebAppShowNativeAds", "VKWebAppRetargetingPixel", "VKWebAppConversionHit", "VKWebAppShowSubscriptionBox", "VKWebAppCheckSurvey", "VKWebAppShowSurvey", "VKWebAppScrollTop", "VKWebAppScrollTopStart", "VKWebAppScrollTopStop", "VKWebAppShowSlidesSheet", "VKWebAppTranslate", "VKWebAppRecommend", "VKWebAppAddToProfile", "VKWebAppGetFriends"], d && !l ? ["VKWebAppResizeWindow", "VKWebAppAddToMenu", "VKWebAppShowInstallPushBox", "VKWebAppShowCommunityWidgetPreviewBox", "VKWebAppCallStart", "VKWebAppCallJoin", "VKWebAppCallGetStatus"] : ["VKWebAppShowImages"], !0),
    A = p ? window.AndroidBridge : void 0,
    v = u ? window.webkit.messageHandlers : void 0,
    h = d ? parent : void 0;
  var m, w, W, y, V, K, _, g, S, E;
  e.EAdsFormats = void 0, (m = e.EAdsFormats || (e.EAdsFormats = {})).REWARD = "reward", m.INTERSTITIAL = "interstitial", e.BannerAdLayoutType = void 0, (w = e.BannerAdLayoutType || (e.BannerAdLayoutType = {})).RESIZE = "resize", w.OVERLAY = "overlay", e.BannerAdLocation = void 0, (W = e.BannerAdLocation || (e.BannerAdLocation = {})).TOP = "top", W.BOTTOM = "bottom", e.BannerAdAlign = void 0, (y = e.BannerAdAlign || (e.BannerAdAlign = {})).LEFT = "left", y.RIGHT = "right", y.CENTER = "center", e.BannerAdHeightType = void 0, (V = e.BannerAdHeightType || (e.BannerAdHeightType = {})).COMPACT = "compact", V.REGULAR = "regular", e.BannerAdOrientation = void 0, (K = e.BannerAdOrientation || (e.BannerAdOrientation = {})).HORIZONTAL = "horizontal", K.VERTICAL = "vertical", e.EGrantedPermission = void 0, (_ = e.EGrantedPermission || (e.EGrantedPermission = {})).CAMERA = "camera", _.LOCATION = "location", _.PHOTO = "photo", e.EGetLaunchParamsResponseLanguages = void 0, (g = e.EGetLaunchParamsResponseLanguages || (e.EGetLaunchParamsResponseLanguages = {})).RU = "ru", g.UK = "uk", g.UA = "ua", g.EN = "en", g.BE = "be", g.KZ = "kz", g.PT = "pt", g.ES = "es", e.EGetLaunchParamsResponseGroupRole = void 0, (S = e.EGetLaunchParamsResponseGroupRole || (e.EGetLaunchParamsResponseGroupRole = {})).ADMIN = "admin", S.EDITOR = "editor", S.MEMBER = "member", S.MODER = "moder", S.NONE = "none", e.EGetLaunchParamsResponsePlatforms = void 0, (E = e.EGetLaunchParamsResponsePlatforms || (e.EGetLaunchParamsResponsePlatforms = {})).DESKTOP_WEB = "desktop_web", E.DESKTOP_WEB_MESSENGER = "desktop_web_messenger", E.DESKTOP_APP_MESSENGER = "desktop_app_messenger", E.MOBILE_WEB = "mobile_web", E.MOBILE_ANDROID = "mobile_android", E.MOBILE_ANDROID_MESSENGER = "mobile_android_messenger", E.MOBILE_IPHONE = "mobile_iphone", E.MOBILE_IPHONE_MESSENGER = "mobile_iphone_messenger", E.MOBILE_IPAD = "mobile_ipad";
  var O = function (e) {
    var n = void 0,
      p = [],
      l = Math.random().toString(36).substring(2, 5);
    function m(e) {
      p.push(e);
    }
    function w(e) {
      return s ? !(!A || "function" != typeof A[e]) : u ? !(!v || !v[e] || "function" != typeof v[e].postMessage) : !!d && b.includes(e);
    }
    function W() {
      return u || s;
    }
    function y() {
      return d && window.parent !== window;
    }
    function V() {
      return W() || y();
    }
    function K(e) {
      if (u || s) return o([], p, !0).map(function (n) {
        return n.call(null, e);
      });
      var t = null == e ? void 0 : e.data;
      if (d && t) {
        if (c && "string" == typeof t) try {
          t = JSON.parse(t);
        } catch (e) {}
        var r = t.type,
          a = t.data,
          i = t.frameId;
        r && ("VKWebAppSettings" !== r ? o([], p, !0).map(function (e) {
          return e({
            detail: {
              type: r,
              data: a
            }
          });
        }) : n = i);
      }
    }
    c && /(android)/i.test(navigator.userAgent) ? document.addEventListener(f, K) : "undefined" != typeof window && "addEventListener" in window && window.addEventListener(f, K);
    var _ = a(function (t, r) {
      A && A[t] ? A[t](JSON.stringify(r)) : v && v[t] && "function" == typeof v[t].postMessage ? v[t].postMessage(r) : c ? window.ReactNativeWebView.postMessage(JSON.stringify({
        handler: t,
        params: r
      })) : h && "function" == typeof h.postMessage && h.postMessage({
        handler: t,
        params: r,
        type: "vk-connect",
        webFrameId: n,
        connectVersion: e
      }, "*");
    }, m, l);
    return m(function (e) {
      if (e.detail && "SetSupportedHandlers" === e.detail.type) i = new Set(e.detail.data.supportedHandlers);
    }), {
      send: _,
      sendPromise: _,
      subscribe: m,
      unsubscribe: function (e) {
        var n = p.indexOf(e);
        n > -1 && p.splice(n, 1);
      },
      supports: function (e) {
        return console.warn("bridge.supports method is deprecated. Use bridge.supportsAsync instead."), w(e);
      },
      supportsAsync: function (e) {
        return t(this, void 0, void 0, function () {
          var n;
          return r(this, function (t) {
            switch (t.label) {
              case 0:
                if (s || u) return [2, w(e)];
                if (i) return [2, i.has(e)];
                t.label = 1;
              case 1:
                return t.trys.push([1, 3,, 4]), [4, _("SetSupportedHandlers")];
              case 2:
                return n = t.sent(), i = new Set(n.supportedHandlers), [3, 4];
              case 3:
                return t.sent(), i = new Set(["VKWebAppInit"]), [3, 4];
              case 4:
                return [2, i.has(e)];
            }
          });
        });
      },
      isWebView: W,
      isIframe: y,
      isEmbedded: V,
      isStandalone: function () {
        return !V();
      }
    };
  }("2.15.11");
  e.applyMiddleware = function e() {
    for (var t = [], r = 0; r < arguments.length; r++) t[r] = arguments[r];
    return t.includes(void 0) || t.includes(null) ? e.apply(void 0, t.filter(function (e) {
      return "function" == typeof e;
    })) : function (e) {
      if (0 === t.length) return e;
      var r,
        o = {
          subscribe: e.subscribe,
          send: function () {
            for (var n = [], t = 0; t < arguments.length; t++) n[t] = arguments[t];
            return e.send.apply(e, n);
          }
        },
        a = t.filter(function (e) {
          return "function" == typeof e;
        }).map(function (e) {
          return e(o);
        }).reduce(function (e, n) {
          return function (t) {
            return e(n(t));
          };
        });
      return r = a(e.send), n(n({}, e), {
        send: r
      });
    };
  }, e.default = O, e.parseURLSearchParamsForGetLaunchParams = function (n) {
    var t = {};
    try {
      var r = new URLSearchParams(n);
      r.forEach(function (n, r) {
        switch (r) {
          case "vk_ts":
          case "vk_is_recommended":
          case "vk_profile_id":
          case "vk_has_profile_button":
          case "vk_testing_group_id":
          case "vk_user_id":
          case "vk_app_id":
          case "vk_group_id":
            t[r] = Number(n);
            break;
          case "sign":
          case "vk_chat_id":
          case "vk_ref":
          case "vk_access_token_settings":
            t[r] = n;
            break;
          case "odr_enabled":
            t.odr_enabled = "1" === n ? 1 : void 0;
            break;
          case "vk_is_app_user":
          case "vk_are_notifications_enabled":
          case "vk_is_favorite":
            t[r] = function (e) {
              switch (e) {
                case "0":
                  return 0;
                case "1":
                  return 1;
                default:
                  return;
              }
            }(n);
            break;
          case "vk_language":
            t.vk_language = function (n) {
              return Object.values(e.EGetLaunchParamsResponseLanguages).some(function (e) {
                return e === n;
              });
            }(n) ? n : void 0;
            break;
          case "vk_viewer_group_role":
            t.vk_viewer_group_role = function (n) {
              return Object.values(e.EGetLaunchParamsResponseGroupRole).some(function (e) {
                return e === n;
              });
            }(n) ? n : void 0;
            break;
          case "vk_platform":
            t.vk_platform = function (n) {
              return Object.values(e.EGetLaunchParamsResponsePlatforms).some(function (e) {
                return e === n;
              });
            }(n) ? n : void 0;
        }
      });
    } catch (e) {
      console.warn(e);
    }
    return t;
  }, Object.defineProperty(e, "__esModule", {
    value: !0
  });
});

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/compat get default export */
/******/ (() => {
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = (module) => {
/******/ 		var getter = module && module.__esModule ?
/******/ 			() => (module['default']) :
/******/ 			() => (module);
/******/ 		__webpack_require__.d(getter, { a: getter });
/******/ 		return getter;
/******/ 	};
/******/ })();
/******/ 
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
  A: () => (/* binding */ VkAdapter)
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
const VK_PURCHASE_URL = `${COMMON_PURCHASE_URL}/vk`;
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
class AsyncObject_AsyncObject {
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
    Purchase_defineProperty(this, "catalog", new AsyncObject_AsyncObject(() => this.loadCatalog()));
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
    console.log("Adapter: " + "Vk");
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
// EXTERNAL MODULE: ../node_modules/@vkontakte/vk-bridge/dist/index.umd.js
var index_umd = __webpack_require__(817);
var index_umd_default = /*#__PURE__*/__webpack_require__.n(index_umd);
;// ./adapters/Vk/VkAdvertising.ts


class VkAdvertising extends Advertising {
  showPreroll() {
    return Promise.resolve();
  }
  _showInterstitial() {
    return this.showNativeAds(index_umd.EAdsFormats.INTERSTITIAL);
  }
  showRewarded() {
    return this.showNativeAds(index_umd.EAdsFormats.REWARD);
  }
  isRewardedAvailableNow() {
    return true;
  }
  showNativeAds(format) {
    return index_umd_default().send('VKWebAppShowNativeAds', {
      ad_format: format
    }).then(data => data.result).catch(error => {
      console.error(`VK ${format} ads error:`, error);
      return Promise.reject();
    });
  }
  showBanner() {
    return index_umd_default().send('VKWebAppShowBannerAd', {
      banner_location: index_umd.BannerAdLocation.BOTTOM
    }).then(() => {}).catch(error => {
      console.error("VK banner error:", error);
      return Promise.reject();
    });
  }
}
;// ./adapters/Vk/VkParams.ts
function VkParams_defineProperty(e, r, t) { return (r = VkParams_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function VkParams_toPropertyKey(t) { var i = VkParams_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function VkParams_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


const MAX_AGE = MINUTE * 10;
class VkParams {
  constructor() {
    VkParams_defineProperty(this, "params", null);
    VkParams_defineProperty(this, "lastUpdate", 0);
    VkParams_defineProperty(this, "resolves", []);
  }
  get() {
    if (this.isFresh()) return Promise.resolve(this.params);
    return this.loadNewParams();
  }
  getSync() {
    return this.params;
  }
  isFresh() {
    return !!this.params && this.lastUpdate > Date.now() - MAX_AGE;
  }
  loadNewParams() {
    const prom = this.newPromise();
    this.update();
    return prom;
  }
  newPromise() {
    return new Promise(resolve => {
      this.resolves.push(resolve);
    });
  }
  update() {
    index_umd_default().send('VKWebAppGetLaunchParams').then(data => {
      this.lastUpdate = Date.now();
      this.params = data;
    }).catch(error => {
      console.error("Failed to get VK params:", error);
      if (error?.error_data?.error_code === 15) return this.loadFromLocationSearch();
    }).finally(() => {
      this.callResolves();
    });
  }
  loadFromLocationSearch() {
    const search = window.location.search,
      params = new URLSearchParams(search),
      keys = ["is_favorite", "user_id", "ok_user_id", "app_id", "ok_app_id", "is_app_user", "are_notifications_enabled", "language", "platform", "ref", "ok_ref", "ts"];
    this.params = keys.reduce((acc, key) => {
      const value = params.get(key);
      if (value) acc["vk_" + key] = value;
      return acc;
    }, {});
    console.log("Loaded params from location search:", this.params);
    this.lastUpdate = Date.now();
    return Promise.resolve(this.params);
  }
  callResolves() {
    this.resolves.splice(0, this.resolves.length).forEach(resolve => {
      resolve(this.params);
    });
  }
}
;
;// ./adapters/Vk/vkHelpingFunctiouns.ts

const vkParams = new VkParams();
function getVkParams() {
  return vkParams.get();
}
;
function getUserId() {
  const params = vkParams.getSync(),
    keys = ["vk_user_id", "vk_ok_user_id"];
  if (isOK()) keys.reverse();
  return String(params?.[keys[0]] || params?.[keys[1]] || "");
}
;
function isOK() {
  return (vkParams.getSync()?.vk_platform || "").toLowerCase().includes("_ok");
}
;
;// ./adapters/Vk/VkPlayer.ts
function VkPlayer_defineProperty(e, r, t) { return (r = VkPlayer_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function VkPlayer_toPropertyKey(t) { var i = VkPlayer_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function VkPlayer_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



class VkPlayer extends Player {
  constructor() {
    super(...arguments);
    VkPlayer_defineProperty(this, "userInfo", {});
  }
  init() {
    return this.initUserData().then(() => super.init());
  }
  initUserData() {
    return index_umd_default().send('VKWebAppGetUserInfo').then(user => {
      this.userInfo = user;
    }).catch(error => {
      console.error("Failed to get VK user info:", error);
    });
  }
  getId() {
    return getUserId();
  }
  getName() {
    return (this.userInfo.first_name + " " + this.userInfo.last_name).trim();
  }
  getAvatar() {
    return this.userInfo.photo_100;
  }
  isAuth() {
    return true;
  }
  auth() {
    return Promise.resolve();
  }
}
;// ./adapters/Vk/VkPurchase.ts
function VkPurchase_defineProperty(e, r, t) { return (r = VkPurchase_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function VkPurchase_toPropertyKey(t) { var i = VkPurchase_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function VkPurchase_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }




class VkPurchase extends Purchase {
  constructor() {
    super(...arguments);
    VkPurchase_defineProperty(this, "available", true);
    VkPurchase_defineProperty(this, "purchaseUrl", VK_PURCHASE_URL);
    VkPurchase_defineProperty(this, "sign", void 0);
    VkPurchase_defineProperty(this, "currency", {
      "ru": {
        11: "голосов",
        12: "голосов",
        13: "голосов",
        14: "голосов",
        "*": "голосов",
        "*1": "голос",
        "*2": "голоса",
        "*3": "голоса",
        "*4": "голоса"
      },
      "en": "votes"
    });
  }
  init() {
    if (isOK()) {
      this.purchaseUrl = OK_PURCHASE_URL;
    }
    return Promise.all([this.loadParams(), super.init()]);
  }
  getCurrency() {
    let v = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    if (isOK()) {
      return "OK";
    }
    const obj = this.currency[this.adapter.getLang()] || this.currency["ru"];
    if (!obj) return "VK";
    if (typeof obj === "string") return obj;
    return obj[v] || obj["*" + v % 10] || obj["*"] || obj[Object.keys(obj)[0]];
  }
  buyOnPlatform(id) {
    return index_umd_default().send('VKWebAppShowOrderBox', {
      type: 'item',
      item: id
    }).then(data => {
      if (data.success) return id;
      return Promise.reject();
    }).catch(error => {
      console.error("VkPurchase: buyOnPlatform", error);
      return Promise.reject(error);
    });
  }
  formatPurchase(purchase) {
    return {
      "purchaseToken": purchase["transaction_id"],
      "productID": purchase["data"]["item_id"] || purchase["data"]["item"] || purchase["data"]["product_code"]
    };
  }
  getSign() {
    return this.sign;
  }
  loadParams() {
    return getVkParams().then(data => {
      if (!data) return;
      this.sign = data;
    });
  }
  getCatalogUrl() {
    return this.adapter.options[isOK() ? "ok_catalog_url" : "catalog_url"] || "";
  }
  getAppId() {
    return String(isOK() ? this.sign?.vk_ok_app_id || "" : this.sign?.vk_app_id || "");
  }
}
;// ./adapters/Vk/submodules/VkJoinGroup.ts
function VkJoinGroup_defineProperty(e, r, t) { return (r = VkJoinGroup_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function VkJoinGroup_toPropertyKey(t) { var i = VkJoinGroup_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function VkJoinGroup_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



class VkJoinGroup extends SubModule {
  constructor() {
    super(...arguments);
    VkJoinGroup_defineProperty(this, "available", true);
  }
  init() {
    if (!this.getGroupId()) {
      this.available = false;
      return Promise.resolve(false);
    }
    return index_umd_default().send('VKWebAppGetGroupInfo', {
      group_id: this.getGroupId()
    }).then(data => {
      this.status = !!data.is_member;
      return this.status;
    }).catch(error => {
      console.error("Get group status failed:", error);
      return false;
    });
  }
  act() {
    if (!this.available) {
      return Promise.reject();
    }
    return index_umd_default().send('VKWebAppJoinGroup', {
      group_id: this.getGroupId()
    }).then(result => {
      this.status = result.success;
    }).catch(error => {
      console.error("Join group failed:", error);
      return Promise.reject();
    }).finally(() => {
      this.init();
    });
  }
  getGroupId() {
    return this.adapter.options[isOK() ? 'ok_group_id' : 'group_id'] || 0;
  }
}
;// ./adapters/Vk/submodules/VkAddToFavorites.ts
function VkAddToFavorites_defineProperty(e, r, t) { return (r = VkAddToFavorites_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function VkAddToFavorites_toPropertyKey(t) { var i = VkAddToFavorites_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function VkAddToFavorites_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



class VkAddToFavorites extends SubModule {
  constructor() {
    super(...arguments);
    VkAddToFavorites_defineProperty(this, "available", true);
  }
  init() {
    if (isOK()) {
      this.available = false;
      return Promise.resolve(false);
    }
    return getVkParams().then(data => {
      if (data) this.status = !!data.vk_is_favorite;
      return this.status;
    });
  }
  act() {
    if (isOK()) {
      return Promise.reject();
    }
    return index_umd_default().send('VKWebAppAddToFavorites').then(result => {
      this.status = result.result;
    }).catch(error => {
      console.error("Add to favorites failed:", error);
      return Promise.reject();
    }).finally(() => {
      this.init();
    });
  }
}
;// ./adapters/Vk/submodules/VkInviteFriends.ts
function VkInviteFriends_defineProperty(e, r, t) { return (r = VkInviteFriends_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function VkInviteFriends_toPropertyKey(t) { var i = VkInviteFriends_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function VkInviteFriends_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


class VkInviteFriends extends SubModule {
  constructor() {
    super(...arguments);
    VkInviteFriends_defineProperty(this, "available", true);
  }
  act() {
    return index_umd_default().send('VKWebAppShowInviteBox', {}).then(e => {
      if (!e.success) return Promise.reject("Invite friends failed");
    }).catch(error => {
      console.error("Invite friends failed:", error);
      return Promise.reject(error);
    });
  }
}
;// ./adapters/Vk/submodules/VkSubscribeToEvents.ts
function VkSubscribeToEvents_defineProperty(e, r, t) { return (r = VkSubscribeToEvents_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function VkSubscribeToEvents_toPropertyKey(t) { var i = VkSubscribeToEvents_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function VkSubscribeToEvents_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



class VkSubscribeToEvents extends SubModule {
  constructor() {
    super(...arguments);
    VkSubscribeToEvents_defineProperty(this, "available", true);
  }
  init() {
    return getVkParams().then(data => {
      if (data) this.status = !!data.vk_are_notifications_enabled;
      return this.status;
    });
  }
  act() {
    return index_umd_default().send('VKWebAppAllowNotifications').then(data => {
      this.status = !!data.result;
    }).catch(error => {
      console.error("Subscribe to events failed:", error);
      return Promise.reject();
    }).finally(() => {
      this.init();
    });
  }
}
;// ./adapters/Vk/submodules/VkSetShortcut.ts
function VkSetShortcut_defineProperty(e, r, t) { return (r = VkSetShortcut_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function VkSetShortcut_toPropertyKey(t) { var i = VkSetShortcut_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function VkSetShortcut_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }




class VkSetShortcut extends SubModule {
  constructor() {
    super(...arguments);
    VkSetShortcut_defineProperty(this, "available", IS_ANDROID);
  }
  init() {
    if (isOK()) {
      this.available = false;
      return Promise.resolve(false);
    }
    if (!IS_ANDROID) return Promise.resolve(false);
    return index_umd_default().send('VKWebAppAddToHomeScreenInfo').then(data => {
      this.status = !!data.is_added_to_home_screen;
      return this.status;
    }).catch(error => {
      console.error("Check shortcut status failed:", error);
      return false;
    });
  }
  act() {
    if (isOK()) {
      return Promise.reject();
    }
    return index_umd_default().send('VKWebAppAddToHomeScreen').then(data => {
      this.status = !!data.result;
    }).catch(error => {
      console.error("Set shortcut failed:", error);
      return Promise.reject();
    }).finally(() => {
      this.init();
    });
  }
}
;// ./adapters/Vk/submodules/VkMakeStory.ts
function VkMakeStory_defineProperty(e, r, t) { return (r = VkMakeStory_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function VkMakeStory_toPropertyKey(t) { var i = VkMakeStory_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function VkMakeStory_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


class VkMakeStory extends SubModule {
  constructor() {
    super(...arguments);
    VkMakeStory_defineProperty(this, "available", false);
  }
  act(data) {
    return index_umd_default().send('VKWebAppShowStoryBox', {
      background_type: 'image',
      attachment: {
        type: 'url',
        url: data.href,
        text: data.text
      }
    }).catch(error => {
      console.error("Make story failed:", error);
      return Promise.reject();
    });
  }
}
;// ./adapters/Vk/VkLeaderboard.ts


class VkLeaderboard extends Leaderboard {
  formatEntries(serverEntries) {
    const ids = serverEntries.map(data => data.player_id);
    return this.getUsersInfo(ids).then(usersInfo => {
      return serverEntries.map(data => {
        const info = this.findUserInfo(data.player_id, usersInfo),
          firstName = (info?.first_name || "").trim(),
          lastName = (info?.last_name || "").trim();
        return {
          id: String(data.player_id),
          avatar: info?.photo_100,
          title: (firstName + " " + lastName).trim(),
          score: data.score,
          rank: data.rank
        };
      });
    });
  }
  findUserInfo(id, arr) {
    return arr.find(info => String(info.id) == id);
  }
  getUsersInfo(ids) {
    return index_umd_default().send('VKWebAppGetUserInfo', {
      user_ids: ids.join(","),
      use_local: true
    }).then(e => {
      console.log("VKWebAppGetUserInfo", e);
      return e.result || [e];
    }).catch(error => {
      console.log(error);
      return [];
    });
  }
}
;// ./adapters/Vk/VkStorage.ts
function VkStorage_defineProperty(e, r, t) { return (r = VkStorage_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function VkStorage_toPropertyKey(t) { var i = VkStorage_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function VkStorage_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



class VkStorage extends Storage {
  constructor() {
    super(...arguments);
    VkStorage_defineProperty(this, "storageCache", {});
  }
  getFromPlatform(keys) {
    console.log("VK getFromPlatform keys = ", keys);
    return index_umd_default().send('VKWebAppStorageGet', {
      keys
    }).then(data => {
      console.log("VK getFromPlatform dataResult = ", data);
      const result = data.keys?.reduce((acc, item) => {
        const value = this.unpuckValue(item.value);
        acc[item.key] = value;
        this.storageCache[item.key] = value;
        return acc;
      }, {});
      if (Object.values(result).every(value => value === undefined)) return null;
      return result;
    }).catch(error => {
      console.error("VK getFromPlatform error:", error);
      return null;
    });
  }
  setToPlatform(data) {
    const changedData = this.filterChangedData(data);
    return Promise.all(changedData.map(_ref => {
      let [key, value] = _ref;
      return index_umd_default().send('VKWebAppStorageSet', {
        key,
        value: this.puckValue(value)
      }).then(data => {
        console.log("Vk setToPlatform dataResult= ", data);
        if (data.result) this.storageCache[key] = value;
        return data.result;
      }).catch(error => {
        console.error("VK setToPlatform " + key + " error:", error);
        return false;
      });
    }));
  }
  puckValue(value) {
    return stringifyJSON(value);
  }
  unpuckValue(value) {
    return parseJSON(value, undefined);
  }
  filterChangedData(data) {
    return Object.entries(data).filter(_ref2 => {
      let [key, value] = _ref2;
      return this.storageCache[key] !== value;
    });
  }
}
;// ./adapters/Vk/submodules/VkShare.ts
function VkShare_defineProperty(e, r, t) { return (r = VkShare_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function VkShare_toPropertyKey(t) { var i = VkShare_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function VkShare_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


class VkShare extends SubModule {
  constructor() {
    super(...arguments);
    VkShare_defineProperty(this, "available", true);
  }
  act(text) {
    return index_umd_default().send('VKWebAppShare', {
      //@ts-ignore
      text: text
    }).then(data => {
      if (!data.result) return Promise.reject();
    }).catch(e => {
      console.error(e);
      return Promise.reject();
    });
  }
}
;
;// ./adapters/Vk/submodules/VkRecommend.ts
function VkRecommend_defineProperty(e, r, t) { return (r = VkRecommend_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function VkRecommend_toPropertyKey(t) { var i = VkRecommend_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function VkRecommend_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



class VkRecommend extends SubModule {
  constructor() {
    super(...arguments);
    VkRecommend_defineProperty(this, "available", true);
  }
  init() {
    if (isOK()) {
      this.available = false;
      return Promise.resolve(false);
    }
    return Promise.resolve();
  }
  act() {
    if (isOK()) {
      return Promise.reject();
    }
    return index_umd_default().send('VKWebAppRecommend').then(data => {
      if (!data.result) return Promise.reject();
      return Promise.resolve();
    }).catch(error => {
      console.error(error);
      return Promise.reject();
    });
  }
}
;// ./adapters/Vk/VkLeaderboards.ts


class VkLeaderboards extends Leaderboards {
  formatEntries(serverEntries) {
    return this.getUsersInfo(serverEntries.map(data => data.player_id)).then(usersInfo => {
      return serverEntries.map((data, index) => {
        const info = usersInfo[index],
          firstName = (info?.first_name || "").trim(),
          lastName = (info?.last_name || "").trim();
        return {
          id: data.player_id,
          avatar: info?.photo_100,
          title: (firstName + " " + lastName).trim(),
          score: data.score,
          rank: data.rank
        };
      });
    });
  }
  getUsersInfo(ids) {
    return index_umd_default().send('VKWebAppGetUserInfo', {
      user_ids: ids.join(",")
    }).then(e => {
      console.log("VKWebAppGetUserInfo", e);
      return e.result || [e];
    }).catch(error => {
      console.log(error);
      return [];
    });
  }
}
;// ./adapters/Vk/VkAdapter.ts
function VkAdapter_defineProperty(e, r, t) { return (r = VkAdapter_toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function VkAdapter_toPropertyKey(t) { var i = VkAdapter_toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function VkAdapter_toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


















class VkAdapter extends Adapter {
  constructor() {
    super(...arguments);
    VkAdapter_defineProperty(this, "platform_prefix", "VK");
    VkAdapter_defineProperty(this, "params", {
      sign: '',
      vk_access_token_settings: '',
      vk_app_id: '',
      vk_ok_app_id: '',
      vk_are_notifications_enabled: 0,
      vk_is_favorite: 0,
      vk_language: '',
      vk_platform: '',
      vk_ref: '',
      vk_ok_ref: '',
      vk_ts: 0,
      vk_user_id: 0,
      vk_ok_user_id: 0,
      vk_client: ''
    });
  }
  getPlatformId() {
    return isOK() ? "OK" : "VK";
  }
  getGameCode() {
    return (isOK() ? this.options.ok_game_code : undefined) || super.getGameCode();
  }
  getLang() {
    return "ru"; //this.params.vk_language;
  }
  initApi() {
    return index_umd_default().send('VKWebAppInit', {}).then(data => {
      if (!data.result) return Promise.reject(new Error('VKWebAppInit returned false'));
      return data;
    }).then(() => this.initParams()).catch(error => {
      console.error("VK adapter initialization failed:", error);
    });
  }
  initParams() {
    return getVkParams().then(data => {
      if (data) Object.assign(this.params, data);
      console.log("VkAdapter params:", this.params);
      console.log("VkAdapter isOK:", isOK());
    });
  }
  createAdvertising() {
    return new VkAdvertising(this);
  }
  createPlayer() {
    return new VkPlayer(this);
  }
  createLeaderboard() {
    return new VkLeaderboard(this);
  }
  createLeaderboards() {
    return new VkLeaderboards(this);
  }
  createStorage() {
    return new VkStorage(this);
  }
  createPurchase() {
    return new VkPurchase(this);
  }
  createSession() {
    return new Session(this);
  }
  createJoinGroup() {
    return new VkJoinGroup(this);
  }
  createAddToFavorites() {
    return new VkAddToFavorites(this);
  }
  createInviteFriends() {
    return new VkInviteFriends(this);
  }
  createSubscribeToEvents() {
    return new VkSubscribeToEvents(this);
  }
  createSetShortcut() {
    return new VkSetShortcut(this);
  }
  createMakeStories() {
    return new VkMakeStory(this);
  }
  createShare() {
    return new VkShare(this);
  }
  createRecommend() {
    return new VkRecommend(this);
  }
}
;
var __webpack_exports__default = __webpack_exports__.A;
export { __webpack_exports__default as default };
