// "Congratulations, your function is booked!!" (mockup page 13; wording changed by request 2026-11-24): confirmed.html?venue=…&space=…&date=…&start=…&end=…
// The last step of the booking flow. Choosing event details goes to My Bookings (page 14);
// logging out clears the booking details kept in this tab.
(function () {
  "use strict";

  const { esc } = window.FF_SHARED;
  const S = window.FF_SEARCH;
  const A = window.FF_AVAIL;
  const $ = (sel, root = document) => root.querySelector(sel);

  const DRAFT_KEY = "ff.bookingDraft.v1";
  let draft = null;
  try { draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY)); } catch (e) { /* shown without the email line */ }

  const params = new URLSearchParams(location.search);
  const listing = S.venues.find((v) => v.id === params.get("venue")) || S.venues.find((v) => v.id === "sample");
  const venue = window.FF_VENUES[listing.id];
  const space = venue && (venue.spaces.find((s) => s.id === params.get("space")) || venue.spaces[0]);
  const req = A.fromParams(params);
  const hasBooking = !!(space && req.date && req.start !== null);
  const days = venue ? venue.changesUpToDays : 7;

  // TODO(confirm): confirmation emails (CLAUDE.md §4 MVP). Until they exist, say where it would go.
  const emailLine = draft && draft.email
    ? `We’ll email the details to <strong>${esc(draft.email)}</strong>.`
    : "We’ll email you the details.";

  $("#confirmed").innerHTML = `
    <div class="cf-box">
      <svg class="cf-popper" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><path d="M4 28l5.500-15.500 10 10z"/><path d="M7.500 18.500l6 6M15 8.500c1-2 0-4-1.500-4.500M19.500 12.500c2.500-1.500 5-1 6.500.500M18 10l4-5M25 18l3-1M21 7l1-3M24 11l4-2"/><circle cx="21" cy="2.500" r=".9"/><circle cx="28.500" cy="13" r=".9"/><circle cx="12" cy="5" r=".9"/></svg>
      <h1 class="cf-party"><span class="cf-big">Congratulations,</span> <span class="cf-line">your function is booked!!</span></h1>
      ${hasBooking ? `<p class="cf-what">${esc(space.name)} at ${esc(listing.name)}<br>${A.dayName(req.date)} ${A.longDate(req.date)}, ${A.timeLabel(req.start)}${req.end !== null ? ` – ${A.timeLabel(req.end)}` : ""}</p>` : ""}
      <p class="cf-email">${emailLine}</p>
      <p class="cf-demo">Demo only: no booking has been made and no email has been sent.</p>
      <div class="cf-actions">
        <a class="cf-btn cf-now" href="my-bookings.html?p=14">Choose event details now<small>(can be changed up to ${days} days prior to booking date)</small></a>
        <a class="cf-btn cf-later" href="index.html" id="log-out">Log out and choose event details later<small>(can be changed up to ${days} days prior to booking date)</small></a>
      </div>
    </div>`;

  $("#log-out").addEventListener("click", () => {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) { /* nothing to clear */ }
  });
})();
