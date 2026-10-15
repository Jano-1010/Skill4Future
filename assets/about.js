(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  // Elemente beim Scrollen einblenden
  var targets = document.querySelectorAll(".pr,.journey li,.step,.ab-prose,.stat");
  Array.prototype.forEach.call(targets, function (el, i) {
    el.classList.add("rv");
    if (!el.style.getPropertyValue("--d")) { el.style.setProperty("--d", String(i % 4)); }
  });
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add("in"); });
  }

  // Zahlen hochzählen
  var counters = document.querySelectorAll("[data-count]");
  function run(el) {
    var to = +el.getAttribute("data-count"), t0 = null;
    function step(t) {
      if (t0 === null) { t0 = t; }
      var p = Math.min(1, (t - t0) / 1100);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) { requestAnimationFrame(step); }
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && !reduce) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(e.target); co.unobserve(e.target); } });
    });
    Array.prototype.forEach.call(counters, function (el) { el.textContent = "0"; co.observe(el); });
  }
})();
