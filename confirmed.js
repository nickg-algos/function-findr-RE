// "Success! Booking Confirmation" (mockup page 13): confirmed.html?venue=…&space=…&date=…&start=…&end=…
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
      <h1>Success!</h1>
      <p class="cf-sub">Booking Confirmation</p>
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
