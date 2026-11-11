// "List your venue" (mockup page 15): a marketing page for venues. Only the logo row is data.
(function () {
  "use strict";
  document.getElementById("logos").innerHTML = window.FF_SHARED.logoBoxes(window.FF_SEARCH.logos);
  document.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });
})();
