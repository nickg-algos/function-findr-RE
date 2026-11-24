// "Success! You're all set" (mockup page 21): the end of venue sign-up.
// The mockup has no way on from here, so it offers the dashboard. DEMO ONLY: no email is sent.
(function () {
  "use strict";

  const { esc } = window.FF_SHARED;
  let signup = {};
  try { signup = JSON.parse(sessionStorage.getItem("ff.venueSignup.v1")) || {}; } catch (e) { /* shown without the email line */ }

  // TODO(confirm): welcome emails for new venues (CLAUDE.md §4). Until they exist, say where it would go.
  const emailLine = signup.email ? `We’ll email the details to <strong>${esc(signup.email)}</strong>.` : "We’ll email you the details.";

  document.getElementById("all-set").innerHTML = `
    <div class="cf-box">
      <h1>Success!</h1>
      <p class="cf-sub">You’re all set</p>
      ${signup.venue ? `<p class="cf-what">${esc(signup.venue)} is ready to take function bookings.</p>` : ""}
      <p class="cf-email">${emailLine}</p>
      <p class="cf-demo">Demo only: nothing has been published and no email has been sent.</p>
      <div class="cf-actions"><a class="cf-btn cf-now" href="dashboard.html">Go to your dashboard</a></div>
    </div>`;
})();
