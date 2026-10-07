(function () {
  "use strict";

  // Checkliste: Haken pro Thema im Browser merken
  var id = document.body.getAttribute("data-id");
  var boxes = Array.prototype.slice.call(document.querySelectorAll(".checklist input[type=checkbox]"));
  var progress = document.querySelector(".checks .progress");
  var key = "s4f:check:" + id;
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { saved = []; }

  function update() {
    var done = boxes.filter(function (b) { return b.checked; });
    if (progress) {
      progress.textContent = done.length + " von " + boxes.length + " erledigt";
    }
    try {
      localStorage.setItem(key, JSON.stringify(done.map(function (b) { return +b.getAttribute("data-i"); })));
    } catch (e) { /* Speicher nicht verfügbar */ }
  }
  boxes.forEach(function (b) {
    b.checked = saved.indexOf(+b.getAttribute("data-i")) !== -1;
    b.addEventListener("change", update);
  });
  if (boxes.length) { update(); }

  // Inhaltsverzeichnis: aktuellen Abschnitt hervorheben
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  var map = {};
  links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
  if ("IntersectionObserver" in window && links.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("on"); });
          var a = map[e.target.id];
          if (a) { a.classList.add("on"); }
        }
      });
    }, { rootMargin: "-90px 0px -65% 0px" });
    Object.keys(map).forEach(function (sid) {
      var el = document.getElementById(sid);
      if (el) { io.observe(el); }
    });
  }
})();
