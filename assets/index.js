(function () {
  "use strict";

  var ACCENT = "#4FA3E0";
  var ICONS = {
    versicherung: ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"],
    vorsorge: ["M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z", "M16 10h.01", "M2 8v1a2 2 0 0 0 2 2h1"],
    investition: ["M16 7h6v6", "m22 7-8.5 8.5-5-5L2 17"],
    allokation: ["M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z", "M21.21 15.89A10 10 0 1 1 8 2.83"]
  };
  var POS = [["50%", "14%"], ["86%", "50%"], ["50%", "86%"], ["14%", "50%"]];
  var ANGLES = [-90, 0, 90, 180];

  var nodes = window.S4F_NODES || [];
  var byParent = {};
  nodes.forEach(function (n) {
    var k = n.parent || "__root__";
    (byParent[k] = byParent[k] || []).push(n);
  });
  function kids(id) {
    return (byParent[id] || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  var areas = kids("hub").map(function (a, i) {
    return { id: a.id, name: a.short || a.label, label: a.label, lead: a.description, topics: kids(a.id) };
  });
  if (!areas.length) { return; }

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var sel = 0;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function iconSvg(id) {
    var d = (ICONS[id] || []).map(function (p) { return '<path d="' + p + '"></path>'; }).join("");
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  }

  // Dekoratives Hintergrundnetz, mit festem Startwert, damit es immer gleich aussieht
  function buildNet(active) {
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function P(r, deg) { var a = deg * Math.PI / 180; return [50 + r * Math.cos(a), 50 + r * Math.sin(a)]; }
    function f(v) { return +v.toFixed(2); }
    var lines = [], dots = [];
    ANGLES.slice(0, areas.length).forEach(function (A, i) {
      var on = i === active, lc = on ? "#9DB6D9" : "#CBD9EC", p = P(36, A), kidsPts = [];
      for (var k = 0; k < 6; k++) {
        var a = A - 50 + k * 20 + (rnd() - 0.5) * 8, r = 58 + rnd() * 10, q = P(r, a);
        kidsPts.push(q);
        lines.push([p[0], p[1], q[0], q[1], lc, on ? 0.35 : 0.25]);
        dots.push([q[0], q[1], 1.7, "#fff", on ? ACCENT : "#9DB6D9"]);
        for (var g = 0; g < 2; g++) {
          var gp = P(r + 13 + rnd() * 8, a + (g ? 7 : -7) + (rnd() - 0.5) * 4);
          lines.push([q[0], q[1], gp[0], gp[1], "#DDE3EB", 0.2]);
          dots.push([gp[0], gp[1], 1, "#DDE3EB", "#CBD9EC"]);
        }
      }
      for (var j = 0; j < kidsPts.length - 1; j++) {
        lines.push([kidsPts[j][0], kidsPts[j][1], kidsPts[j + 1][0], kidsPts[j + 1][1], "#DDE3EB", 0.2]);
      }
    });
    return lines.map(function (l) {
      return '<line x1="' + f(l[0]) + '" y1="' + f(l[1]) + '" x2="' + f(l[2]) + '" y2="' + f(l[3]) + '" stroke="' + l[4] + '" stroke-width="' + l[5] + '" stroke-linecap="round"></line>';
    }).join("") + dots.map(function (d) {
      return '<circle cx="' + f(d[0]) + '" cy="' + f(d[1]) + '" r="' + d[2] + '" fill="' + d[3] + '" stroke="' + d[4] + '" stroke-width=".3"></circle>';
    }).join("");
  }

  var cross = document.getElementById("cross");
  var netEl = document.getElementById("net");
  var tabsEl = document.getElementById("tabs");
  var topicsEl = document.getElementById("topics");

  // Kreuz-Karten einmal anlegen
  areas.forEach(function (a, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "area";
    b.style.left = POS[i][0];
    b.style.top = POS[i][1];
    b.setAttribute("data-i", i);
    b.setAttribute("aria-label", a.label);
    b.innerHTML = '<span class="ico">' + iconSvg(a.id) + '</span><span class="nm">' + esc(a.name) + "</span>";
    b.addEventListener("click", function () { select(i, true); });
    cross.appendChild(b);
  });

  // Tabs
  tabsEl.innerHTML = areas.map(function (a, i) {
    return '<button type="button" class="tab" data-i="' + i + '">' + esc(a.name) + "</button>";
  }).join("");
  Array.prototype.forEach.call(tabsEl.querySelectorAll(".tab"), function (t) {
    t.addEventListener("click", function () { select(+t.getAttribute("data-i"), false); });
  });

  // Alle Themen
  document.getElementById("allGrid").innerHTML = areas.map(function (a, i) {
    return '<div class="all__col"><strong>' + (i + 1) + " · " + esc(a.name) + "</strong>" +
      a.topics.map(function (t) { return '<a href="' + esc(t.page) + '">' + esc(t.short || t.label) + "</a>"; }).join("") + "</div>";
  }).join("");

  function render() {
    var a = areas[sel];
    netEl.innerHTML = buildNet(sel);
    Array.prototype.forEach.call(cross.querySelectorAll(".area"), function (b) {
      var on = +b.getAttribute("data-i") === sel;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    Array.prototype.forEach.call(tabsEl.querySelectorAll(".tab"), function (t) {
      var on = +t.getAttribute("data-i") === sel;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-pressed", on ? "true" : "false");
    });
    document.getElementById("kicker").textContent = "Bereich " + (sel + 1) + " von " + areas.length;
    document.getElementById("areaName").textContent = a.label;
    document.getElementById("areaLead").textContent = a.lead;
    topicsEl.innerHTML = a.topics.map(function (t) {
      return '<a class="topic" href="' + esc(t.page) + '"><div class="bar"></div><strong>' + esc(t.label) +
        '</strong><span class="d">' + esc(t.description) + '</span><span class="go">Öffnen →</span></a>';
    }).join("");
  }

  function scrollToAreas() {
    var el = document.getElementById("bereiche");
    if (el) { el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
  }

  function select(i, scroll) {
    sel = i;
    render();
    try { history.replaceState(null, "", "#" + areas[i].id); } catch (e) { /* ignorieren */ }
    if (scroll) { scrollToAreas(); }
  }

  function fromHash() {
    var h = (location.hash || "").slice(1);
    for (var i = 0; i < areas.length; i++) {
      if (areas[i].id === h) { sel = i; render(); scrollToAreas(); return true; }
    }
    return false;
  }

  window.addEventListener("hashchange", fromHash);
  render();
  fromHash();
})();
