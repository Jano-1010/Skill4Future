(function () {
  "use strict";
  var btn = document.getElementById("menuBtn");
  var panel = document.getElementById("menuPanel");
  if (!btn || !panel) { return; }

  function setOpen(open) {
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(panel.hidden);
  });
  document.addEventListener("click", function (e) {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== btn) { setOpen(false); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) { setOpen(false); btn.focus(); }
  });
})();
