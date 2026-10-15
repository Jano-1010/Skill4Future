/* Dunkelmodus: Schalter oben rechts, Wahl wird im Browser gemerkt, sonst gilt die Systemeinstellung */
(function () {
  "use strict";
  var KEY = "s4f:theme";
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function stored() {
    try { var v = localStorage.getItem(KEY); return v === "dark" || v === "light" ? v : null; } catch (e) { return null; }
  }
  function current() { return stored() || (mq && mq.matches ? "dark" : "light"); }
  function apply(t) {
    root.setAttribute("data-theme", t);
    var sw = document.getElementById("themeSw");
    if (sw) { sw.setAttribute("aria-checked", t === "dark" ? "true" : "false"); }
    document.dispatchEvent(new CustomEvent("themechange", { detail: t }));
  }

  // sofort setzen, damit die Seite nicht kurz hell aufblitzt
  root.setAttribute("data-theme", current());

  function init() {
    var wrap = document.querySelector(".menu-wrap");
    if (!wrap) { return; }
    var right = document.createElement("div");
    right.className = "head-r";
    wrap.parentNode.insertBefore(right, wrap);

    var b = document.createElement("button");
    b.type = "button";
    b.id = "themeSw";
    b.className = "theme-sw";
    b.setAttribute("role", "switch");
    b.setAttribute("aria-label", "Dunkelmodus");
    b.innerHTML =
      '<svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>' +
      '<svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path></svg>' +
      '<span class="theme-sw__knob"></span>';
    b.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, next); } catch (e) { /* Speicher nicht verfügbar */ }
      apply(next);
    });
    right.appendChild(b);
    right.appendChild(wrap);
    b.setAttribute("aria-checked", root.getAttribute("data-theme") === "dark" ? "true" : "false");
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); } else { init(); }

  // Systemeinstellung folgen, solange nichts gewählt wurde
  if (mq && mq.addEventListener) {
    mq.addEventListener("change", function () { if (!stored()) { apply(current()); } });
  }
})();
