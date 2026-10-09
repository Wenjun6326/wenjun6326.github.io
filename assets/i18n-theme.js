/* =========================================================
   语言与主题模块
   - 暗色模式：跟随系统 + 手动切换（localStorage 记忆），带丝滑过渡
   - 中英双语：data-i18n-key / data-i18n-html-key / data-i18n-attr 标记 + 字典替换
   暴露 window.DSH_I18N.t() 供 app.js 拼接动态文案
   ========================================================= */
(function () {
  "use strict";

  var LS_LANG = "wenjun.lang";
  var LS_THEME = "wenjun.theme";
  var root = document.documentElement;

  /* ================= 主题 ================= */
  function systemDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function resolveTheme(pref) {
    return (pref === "light" || pref === "dark") ? pref : (systemDark() ? "dark" : "light");
  }
  function readThemePref() {
    try { return localStorage.getItem(LS_THEME) || "auto"; } catch (e) { return "auto"; }
  }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* 首帧之后再开启过渡，避免页面加载时也做动画 */
  function enableAnim() {
    if (!reducedMotion()) root.classList.add("theme-anim");
  }
  if (document.readyState === "complete") requestAnimationFrame(enableAnim);
  else window.addEventListener("load", function () { requestAnimationFrame(enableAnim); });

  function syncThemeChrome(t) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#000000" : "#f5f5f7");
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.classList.toggle("is-dark", t === "dark");
      var label = t === "dark" ? "切换到浅色模式 / Light mode" : "切换到深色模式 / Dark mode";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    }
  }

  function applyTheme(pref) {
    var t = resolveTheme(pref);
    root.setAttribute("data-theme", t);
    syncThemeChrome(t);
  }

  /* ---------------------------------------------------------
     无 View Transitions 时的降级：用 Web Animations API 只补一层
     颜色过渡。绝不动 CSS 的 transition（否则会覆盖元素原有的
     入场/悬停过渡，这是之前踩过的坑）。
     --------------------------------------------------------- */
  var COLOR_PROPS = ["background-color", "border-color", "color", "fill"];
  var COLOR_SEL = "#nav, #nav .brand, #nav .links a, .tool-btn, .p-nav, .p-nav a, body, " +
    ".card, .card .bar, .card .bar span, .bubble, .stat, .model, .model li, " +
    ".summary-band, .s-card, .tile, .art, .hero-badge, .c-card, .lang-toggle .lg, " +
    ".foot-links a, footer, section, h1, h2, h3, p, a, span, li, .facts .fk, .facts .fv";

  function fallbackThemeAnim(next) {
    var els;
    try { els = document.querySelectorAll(COLOR_SEL); } catch (e) { els = []; }
    var list = Array.prototype.slice.call(els);

    /* 1. 记录切换前的颜色 */
    list.forEach(function (el) {
      var cs = getComputedStyle(el);
      var from = {};
      COLOR_PROPS.forEach(function (p) {
        var v = cs.getPropertyValue(p);
        if (v && v !== "rgba(0, 0, 0, 0)") from[p] = v;
      });
      el.__wjFrom = Object.keys(from).length ? from : null;
    });

    /* 2. 真正切换主题 */
    applyTheme(next);

    /* 3. 从旧色过渡到新色（只动颜色，不碰 transform/opacity） */
    list.forEach(function (el) {
      var from = el.__wjFrom;
      delete el.__wjFrom;
      if (!from || !el.animate) return;
      var cs = getComputedStyle(el);
      var to = {};
      Object.keys(from).forEach(function (p) {
        var v = cs.getPropertyValue(p);
        if (v) to[p] = v;
      });
      try { el.animate([from, to], { duration: 420, easing: "cubic-bezier(.22,.61,.36,1)" }); } catch (e) {}
    });
  }

  /* 手动切换：优先「从按钮扩散」的圆形揭示，其次颜色过渡，最后直接切换 */
  function switchTheme(next) {
    try { localStorage.setItem(LS_THEME, next); } catch (e) {}
    var btn = document.getElementById("themeToggle");
    if (reducedMotion()) { applyTheme(next); return; }

    var supportsVT = typeof document.startViewTransition === "function";
    if (!btn || !supportsVT) { fallbackThemeAnim(next); return; }

    var r = btn.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var far = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
    var anim = null;

    document.documentElement.classList.add("theme-vt");
    var vt = document.startViewTransition(function () { applyTheme(next); });
    if (vt && vt.ready && vt.ready.then) {
      vt.ready.then(function () {
        anim = root.animate(
          { clipPath: ["circle(0px at " + cx + "px " + cy + "px)", "circle(" + far + "px at " + cx + "px " + cy + "px)"] },
          { duration: 520, easing: "cubic-bezier(.22,.61,.36,1)", pseudoTree: "::view-transition-new(root)" }
        );
      }).catch(function () {});
    }
    if (vt && vt.finished && vt.finished.finally) {
      vt.finished.finally(function () {
        if (anim) anim.cancel();
        document.documentElement.classList.remove("theme-vt");
      });
    } else {
      document.documentElement.classList.remove("theme-vt");
    }
  }

  window.__WJ_APPLY_THEME__ = applyTheme;
  window.__WJ_SWITCH_THEME__ = switchTheme;
  applyTheme(readThemePref());

  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onSchemeChange = function () { if (readThemePref() === "auto") applyTheme("auto"); };
    if (mq.addEventListener) mq.addEventListener("change", onSchemeChange);
    else if (mq.addListener) mq.addListener(onSchemeChange);
  }

  /* ================= 语言 ================= */
  var DICT = window.WJ_I18N || {};
  var ZH = { text: {}, html: {}, attr: {}, title: null, desc: null };
  var bound = false;

  function readLang() {
    try {
      var v = localStorage.getItem(LS_LANG);
      if (v === "en" || v === "zh") return v;
    } catch (e) {}
    return (navigator.language || "zh").toLowerCase().indexOf("zh") === 0 ? "zh" : "en";
  }

  function eachText(cb) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-key]"), function (el) {
      /* 磁吸元素的内容由 app.js 按语言重新拆分，这里只负责写入文本 */
      cb(el, el.getAttribute("data-i18n-key"), el.hasAttribute("data-magnet") ? "magnet" : "text");
    });
  }
  function eachHtml(cb) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-html-key]"), function (el) {
      cb(el, el.getAttribute("data-i18n-html-key"), "html");
    });
  }
  /* 运行期动态文案：内容由 JS 改写（余额、日志、状态、按钮），
     但切换语言时仍需跟随，因此单独用 data-tkey 标记 */
  function eachRuntime(cb) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-tkey]"), function (el) {
      cb(el, el.getAttribute("data-tkey"), "text");
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-tkey-html]"), function (el) {
      cb(el, el.getAttribute("data-tkey-html"), "html");
    });
  }
  function eachAttr(cb) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-attr]"), function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var i = pair.indexOf(":");
        if (i < 1) return;
        cb(el, pair.slice(0, i).trim(), pair.slice(i + 1).trim());
      });
    });
  }

  /* 首次运行：把中文原文存下来，供切回中文时还原 */
  function snapshot() {
    eachText(function (el, k) { if (!(k in ZH.text)) ZH.text[k] = el.textContent; });
    eachHtml(function (el, k) { if (!(k in ZH.html)) ZH.html[k] = el.innerHTML; });
    eachRuntime(function (el, k, kind) {
      var key = "rt:" + kind + ":" + k;
      if (!(key in ZH.text)) ZH.text[key] = kind === "html" ? el.innerHTML : el.textContent;
    });
    eachAttr(function (el, attr, k) {
      var key = attr + "|" + k;
      if (!(key in ZH.attr)) ZH.attr[key] = el.getAttribute(attr) || "";
    });
    var tm = document.querySelector('meta[name="i18n-title"]');
    if (tm) { ZH.title = tm.getAttribute("data-zh") || document.title; }
    var dm = document.querySelector('meta[name="description"]');
    if (dm) {
      ZH.desc = dm.getAttribute("content") || "";
      if (!dm.getAttribute("data-en")) dm.setAttribute("data-en", ZH.desc);
    }
  }

  function applyLang(lang) {
    var isEn = lang === "en";
    root.setAttribute("lang", isEn ? "en" : "zh-CN");

    eachText(function (el, k) {
      var v = isEn ? DICT[k] : ZH.text[k];
      if (v == null) return;
      if (el.hasAttribute("data-magnet")) {
        /* 磁吸元素：写入纯文本并打标记，由 app.js 重新拆分为字符 */
        el.setAttribute("data-magnet-text", v.trim());
        el.textContent = v;
      } else {
        el.textContent = v;
      }
    });
    eachHtml(function (el, k) {
      var v = isEn ? DICT["html:" + k] : ZH.html[k];
      if (v != null) el.innerHTML = v;
    });
    eachRuntime(function (el, k, kind) {
      var v = isEn ? DICT[(kind === "html" ? "html:" : "") + k] : ZH.text["rt:" + kind + ":" + k];
      if (v == null) return;
      if (kind === "html") el.innerHTML = v; else el.textContent = v;
    });
    eachAttr(function (el, attr, k) {
      var v = isEn ? DICT[k] : ZH.attr[attr + "|" + k];
      if (v != null) el.setAttribute(attr, v);
    });

    var tm = document.querySelector('meta[name="i18n-title"]');
    if (tm) {
      var t = isEn ? tm.getAttribute("data-en") : (tm.getAttribute("data-zh") || ZH.title);
      if (t) document.title = t;
    }
    var dm = document.querySelector('meta[name="description"]');
    if (dm) {
      var d = isEn ? dm.getAttribute("data-en") : ZH.desc;
      if (d) dm.setAttribute("content", d);
    }

    Array.prototype.forEach.call(document.querySelectorAll(".lang-toggle"), function (btn) {
      btn.classList.toggle("is-en", isEn);
      var label = isEn ? "切换到中文 / Switch to Chinese" : "Switch to English / 切换到英文";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    });

    window.DSH_I18N = {
      lang: lang,
      isEn: isEn,
      t: function (key, fallback) {
        if (!isEn) return fallback;
        return DICT[key] != null ? DICT[key] : fallback;
      }
    };
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
    /* 磁吸元素在收到 langchange 后重新拆分，需在其后重新量基线 */
    requestAnimationFrame(function () {
      if (window.__WJ_REMEASURE_MAGNET__) window.__WJ_REMEASURE_MAGNET__();
    });
  }

  window.__WJ_SET_LANG__ = function (lang) {
    try { localStorage.setItem(LS_LANG, lang); } catch (e) {}
    applyLang(lang);
  };

  /* ================= 绑定 ================= */
  function init() {
    if (!bound) {
      bound = true;
      snapshot();
      var tb = document.getElementById("themeToggle");
      if (tb) tb.addEventListener("click", function () {
        switchTheme(resolveTheme(readThemePref()) === "dark" ? "light" : "dark");
      });
      var lb = document.getElementById("langToggle");
      if (lb) lb.addEventListener("click", function () {
        window.__WJ_SET_LANG__(root.getAttribute("lang") === "en" ? "zh" : "en");
      });
    }
    applyLang(readLang());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
