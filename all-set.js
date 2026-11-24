// "Congratulations, your listing is now live" (V42 mockup page 14, the site's p21): the end of venue sign-up,
// matched 1:1 to the mockup (confetti, the two-line title and "Check email for details", nothing else).
// DEMO ONLY: nothing is published and no email is sent. TODO(confirm): welcome emails for new venues (CLAUDE.md §4).
(function () {
  "use strict";

  document.getElementById("all-set").innerHTML = `
    <div class="cf-box cf-live">
      <h1>Congratulations,<br> your listing is now live</h1>
      <p class="cf-live-email">Check email for details</p>
    </div>`;
})();
