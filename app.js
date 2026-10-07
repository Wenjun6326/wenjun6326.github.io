/* =========================================================
   欧阳文钧 · 个人站点 — 共享脚本
   零依赖。所有交互都做了特性检测与降级。
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     1. 滚动进场
     --------------------------------------------------------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------------------------------------------------
     2. 数字滚动（幂等 + 可见性兜底）
     --------------------------------------------------------- */
  function countUp(el) {
    if (el.getAttribute("data-done")) return;
    el.setAttribute("data-done", "1");
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var alt = el.getAttribute("data-alt");
    var dur = 1100, start = null;

    function finish() {
      el.textContent = target + suffix;
      if (alt) {
        var em = document.createElement("em");
        em.textContent = alt;
        el.appendChild(em);
      }
    }
    if (reduceMotion) { finish(); return; }

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step); else finish();
    }
    requestAnimationFrame(step);
  }

  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  function sweepCounters() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    counters = counters.filter(function (el) {
      if (el.getAttribute("data-done")) return false;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) { countUp(el); return false; }
      return true;
    });
  }
  if ("IntersectionObserver" in window && counters.length) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); io2.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { io2.observe(el); });
  }

  /* ---------------------------------------------------------
     3. 累计数字：滚动递增 + “+” 放大光晕
     --------------------------------------------------------- */
  (function () {
    var digits = document.getElementById("bigDigits");
    var plus = document.getElementById("bigPlus");
    var glow = document.getElementById("bigGlow");
    var box = document.getElementById("bigNumber");
    if (!digits || !plus || !glow || !box) return;

    var FROM = 380000000, TO = 400000000, DUR = 2400, played = false;
    function comma(n) { return n.toLocaleString("en-US"); }
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function pulse() {
      digits.textContent = comma(TO);
      glow.classList.remove("on"); plus.classList.remove("pop");
      void glow.offsetWidth;
      glow.classList.add("on"); plus.classList.add("pop");
      setTimeout(function () {
        glow.classList.remove("on"); plus.classList.remove("pop");
      }, 1600);
    }

    function play() {
      if (played) return;
      played = true;
      if (reduceMotion) { digits.textContent = comma(TO); plus.classList.add("pop");
        setTimeout(function () { plus.classList.remove("pop"); }, 1400); return; }
      var start = null;
      (function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / DUR, 1);
        digits.textContent = comma(Math.round(FROM + (TO - FROM) * ease(p)));
        if (p < 1) requestAnimationFrame(frame); else pulse();
      })(performance.now());
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { play(); io.unobserve(e.target); } });
      }, { threshold: 0.35 });
      io.observe(box);
    } else { play(); }
    sweepCounters = (function (orig) {
      return function () {
        if (!played) {
          var r = box.getBoundingClientRect();
          var vh = window.innerHeight || document.documentElement.clientHeight;
          if (r.top < vh * 0.92 && r.bottom > 0) play();
        }
        orig();
      };
    })(sweepCounters);
    setTimeout(function () {
      if (!played) {
        var r = box.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        if (r.top < vh * 0.92 && r.bottom > 0) play();
      }
    }, 1500);
  })();

  window.addEventListener("scroll", sweepCounters, { passive: true });
  window.addEventListener("resize", sweepCounters);
  window.addEventListener("load", sweepCounters);
  sweepCounters();
  [600, 1800, 3200].forEach(function (t) { setTimeout(sweepCounters, t); });

  /* ---------------------------------------------------------
     4. 文字磁吸：鼠标靠近排斥，移开回弹（静止时严格对齐）
     --------------------------------------------------------- */
  (function () {
    var targets = document.querySelectorAll("[data-magnet]");
    if (!targets.length || reduceMotion) return;

    var RADIUS = 96, PUSH = 50;
    var SEG = (typeof Intl !== "undefined" && Intl.Segmenter)
      ? new Intl.Segmenter("zh", { granularity: "grapheme" }) : null;

    function toChars(text) {
      if (SEG) {
        var out = [], it = SEG.segment(text)[Symbol.iterator]();
        for (var r = it.next(); !r.done; r = it.next()) out.push(r.value.segment);
        return out;
      }
      return Array.from(text);
    }

    targets.forEach(function (root) {
      var text = (root.textContent || "").trim();
      if (!text) return;
      var label = root.closest("h1, h2, h3, b") || root;
      if (!label.dataset.magnetRdy) label.dataset.magnetRdy = "1"; else return;

      var chars = toChars(text);
      root.textContent = "";
      root.setAttribute("aria-label", text);

      var items = chars.map(function (c) {
        var ch = document.createElement("span");
        ch.className = "magnet ch";
        ch.textContent = c;
        if (c === " ") { ch.style.width = ".28em"; ch.style.display = "inline-block"; }
        root.appendChild(ch);
        return { el: ch, x: 0, y: 0, vx: 0, vy: 0 };
      });

      var bounds = [], mx = 0, my = 0, active = false, raf = 0;

      function measure() {
        var sx = window.pageXOffset, sy = window.pageYOffset;
        bounds = items.map(function (it) {
          var r = it.el.getBoundingClientRect();
          return { x: r.left + sx + r.width / 2, y: r.top + sy + r.height / 2 };
        });
      }

      function tick() {
        var busy = false;
        for (var i = 0; i < items.length; i++) {
          var it = items[i], b = bounds[i];
          if (!b) continue;
          var tx = 0, ty = 0;
          if (active) {
            var dx = b.x - mx, dy = b.y - my, d = Math.sqrt(dx * dx + dy * dy);
            if (d < 0.0001) { dx = 0.7; dy = -0.7; d = 1; }
            if (d < RADIUS) {
              var f = (1 - d / RADIUS); f = f * f * PUSH;
              tx = (dx / d) * f; ty = (dy / d) * f;
            }
          }
          it.vx = (it.vx + (tx - it.x) * 0.2) * 0.72;
          it.vy = (it.vy + (ty - it.y) * 0.2) * 0.72;
          it.x += it.vx; it.y += it.vy;
          it.el.style.transform = "translate3d(" + it.x.toFixed(2) + "px," + it.y.toFixed(2) + "px,0)";
          if (Math.abs(it.x) > 0.06 || Math.abs(it.y) > 0.06 ||
              Math.abs(it.vx) > 0.06 || Math.abs(it.vy) > 0.06) busy = true;
        }
        if (busy) { raf = requestAnimationFrame(tick); }
        else {
          raf = 0;
          items.forEach(function (it) {
            it.x = it.y = it.vx = it.vy = 0;
            it.el.style.transform = "";
            it.el.classList.remove("live");
          });
        }
      }
      function wake() {
        items.forEach(function (it) { it.el.classList.add("live"); });
        if (!raf) raf = requestAnimationFrame(tick);
      }

      label.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        active = true; mx = e.pageX; my = e.pageY; wake();
      });
      label.addEventListener("pointerleave", function () { active = false; wake(); });
      window.addEventListener("resize", measure);

      measure();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { requestAnimationFrame(measure); });
      }
      setTimeout(measure, 800);
    });
  })();

  /* ---------------------------------------------------------
     5. 几何图形视差
     --------------------------------------------------------- */
  (function () {
    var shapes = document.querySelectorAll(".shapes i, .parallax");
    if (!shapes.length || reduceMotion) return;
    var ticking = false;
    function update() {
      var y = window.pageYOffset;
      shapes.forEach(function (el, i) {
        var depth = 0.05 + (i % 4) * 0.035;
        el.style.setProperty("--py", (-y * depth).toFixed(1) + "px");
        el.style.translate = "0 " + (-y * depth).toFixed(1) + "px";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ---------------------------------------------------------
     6. 按钮磁吸微交互
     --------------------------------------------------------- */
  (function () {
    if (reduceMotion) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
      function loop() {
        cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
        el.style.transform = "translate3d(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px,0)";
        if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) raf = requestAnimationFrame(loop);
        else raf = 0;
      }
      el.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        var r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        ty = (e.clientY - (r.top + r.height / 2)) * 0.28;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      el.addEventListener("pointerleave", function () {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
    });
  })();

  /* ---------------------------------------------------------
     7. 下载按钮：按下立即下载，且绝不离开当前页面
     目标链接带 Content-Disposition: attachment，
     所以浏览器会下载而不是渲染页面。
     --------------------------------------------------------- */
  document.querySelectorAll("[data-download]").forEach(function (btn) {
    var row = btn.closest(".dl-row") || btn.parentElement;
    var hint = row ? row.querySelector(".dl-hint") : null;
    var hideTimer = 0;
    var NAV_FALLBACK_MS = 1400;

    function feedback(name) {
      btn.classList.add("loading", "flying");
      setTimeout(function () { btn.classList.remove("flying"); }, 640);
      if (hint) {
        hint.textContent = "已开始下载 " + name + " —— 若没反应，请检查浏览器是否拦截了下载";
        hint.classList.add("on");
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function () { hint.classList.remove("on"); }, 8000);
      }
      setTimeout(function () { btn.classList.remove("loading"); }, 3200);
    }

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (btn.classList.contains("loading")) return;
      var url = btn.getAttribute("data-download");
      var name = btn.getAttribute("download") || "download";
      feedback(name);

      /* 方式一：真实 <a download> 元素点击 */
      var a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.rel = "noopener";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 0);

      /* 方式二：若 1.4 秒内页面还在（说明没被当成下载处理），
         直接导航到该地址 —— 响应头是 attachment，浏览器只会下载不会跳走 */
      var fallback = setTimeout(function () {
        if (document.visibilityState === "visible") window.location.href = url;
      }, NAV_FALLBACK_MS);
      window.addEventListener("pagehide", function () { clearTimeout(fallback); }, { once: true });
    });

    btn.addEventListener("auxclick", function (e) {
      if (e.button === 1) window.open(btn.getAttribute("data-download"), "_blank", "noopener");
    });
  });

  /* ---------------------------------------------------------
     8. 丝滑跳转：有 View Transitions 就用它，否则用克隆层淡出
     --------------------------------------------------------- */
  (function () {
    var supportsVT = typeof document.startViewTransition === "function";

    function fadeOverlay() {
      var o = document.createElement("div");
      o.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none;" +
        "background:#fbfbfd;opacity:0;transition:opacity .3s cubic-bezier(.22,.61,.36,1)";
      document.body.appendChild(o);
      requestAnimationFrame(function () { o.style.opacity = "1"; });
      return o;
    }

    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href === "#") return;
      if (a.hasAttribute("data-download")) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (/^(mailto:|tel:|https?:\/\/|#)/i.test(href)) return;   /* 外链与锚点交给浏览器 */
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      e.preventDefault();
      if (reduceMotion || !supportsVT) {
        if (!reduceMotion) fadeOverlay();
        setTimeout(function () { window.location.href = href; }, reduceMotion ? 0 : 300);
        return;
      }
      document.startViewTransition(function () { window.location.href = href; });
    });
  })();

  /* ---------------------------------------------------------
     9. 项目索引高亮
     --------------------------------------------------------- */
  (function () {
    var nav = document.querySelector(".p-nav");
    if (!nav || !("IntersectionObserver" in window)) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']"));
    var secs = links.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
    if (!secs.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id);
        });
      });
    }, { threshold: 0.25, rootMargin: "-25% 0px -55% 0px" });
    secs.forEach(function (s) { io.observe(s); });
  })();

  /* ---------------------------------------------------------
     10. 跑马灯：内容复制一份实现无缝循环
     --------------------------------------------------------- */
  document.querySelectorAll("[data-marquee]").forEach(function (track) {
    track.innerHTML += track.innerHTML;
  });

  /* ---------------------------------------------------------
     11. Token 控制中心
     --------------------------------------------------------- */
  (function () {
    var valueEl = document.getElementById("tokenValue");
    var meterEl = document.getElementById("meterBar");
    var noteEl = document.getElementById("tokenNote");
    var logEl = document.getElementById("logLines");
    var btn1 = document.getElementById("getToken");
    if (!valueEl || !meterEl) return;

    var statsNumberEl = document.getElementById("statsNumber");
    var tokens = 128, grabbed = 0, lifetime = 400000000;
    var notes = [
      "状态正常 · 正在等待下一次分发",
      "李老师刚刚上线了 · 机会窗口开启",
      "额度充足 · 建议继续保持礼貌",
      "检测到缓存中的 Token · 也许是上次剩的",
      "李老师看了你一眼 · 但没说不行",
      "已进入长期合作模式 · 谢谢李老师"
    ];
    function fmt(n) { return n.toLocaleString("en-US"); }
    function renderLifetime() {
      if (statsNumberEl) statsNumberEl.textContent = lifetime.toLocaleString("en-US") + "+";
    }
    function render(animate) {
      valueEl.textContent = fmt(tokens);
      meterEl.style.width = Math.max(6, Math.min(100, (tokens / 500) * 100)) + "%";
      if (animate) {
        valueEl.classList.add("pop");
        setTimeout(function () { valueEl.classList.remove("pop"); }, 240);
      }
    }
    function addLog(text) {
      if (!logEl) return;
      var line = document.createElement("div");
      var d = new Date();
      function pad(v) { return v < 10 ? "0" + v : "" + v; }
      line.innerHTML = "[" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" +
        pad(d.getSeconds()) + "] " + text;
      logEl.appendChild(line);
      while (logEl.children.length > 6) logEl.removeChild(logEl.firstChild);
    }
    function grab() {
      var gain = 32 + Math.floor(Math.random() * 96);
      tokens += gain; grabbed++; lifetime += gain;
      render(true); renderLifetime();
      addLog("获取成功 · +" + fmt(gain) + " tokens <b>✓</b>");
      if (noteEl) noteEl.textContent = notes[Math.min(grabbed, notes.length - 1)];
      if (btn1) {
        btn1.textContent = "再获取一次 (+" + fmt(gain) + ")";
        setTimeout(function () { btn1.textContent = "获取 Token"; }, 1600);
      }
    }
    render(false); renderLifetime();
    if (btn1) btn1.addEventListener("click", grab);
  })();

  /* ---------------------------------------------------------
     12. 年份
     --------------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
