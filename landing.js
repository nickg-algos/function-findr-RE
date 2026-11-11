// Landing page (mockup page 1): room and venue cards, the hero search bar and the two carousels.
(function () {
  "use strict";

  const { esc, logoBoxes, reviewCards, initCarousels } = window.FF_SHARED;
  const S = window.FF_SEARCH;
  const L = window.FF_LANDING;
  const $ = (sel, root = document) => root.querySelector(sel);
  const dollars = (cents) => "$" + Math.round(cents / 100).toLocaleString("en-AU");

  const pinIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s-7-6.600-7-12a7 7 0 0 1 14 0c0 5.400-7 12-7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.600" fill="#fff"/></svg>';
  const arrow = '<svg class="l-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 3.500L13.500 8 9 12.500" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- Cards ---------- */

  $("#rooms").innerHTML = L.rooms.map((r) => `
    <a class="l-card" href="mockup.html?p=9">
      <img src="${esc(r.photo)}" alt="${esc(r.alt)}" loading="lazy" width="390" height="280">
      <div class="l-card-body">
        <h3>${esc(r.name)} <span class="l-card-venue">at ${esc(r.venue)}</span></h3>
        <p class="l-address">${pinIcon}<span>${esc(r.address)}</span></p>
        <dl class="l-facts">
          <div><dt>Size</dt><dd>${r.sizeM2.toLocaleString("en-AU")} m²</dd></div>
          <div><dt>Seated</dt><dd>${r.seated}</dd></div>
          <div><dt>Standing</dt><dd>${r.standing}</dd></div>
        </dl>
        <p class="l-price">${dollars(r.priceCents)} <span>/ night</span> <small>inc. GST</small></p>
      </div>
    </a>`).join("");

  const venues = L.venueIds.map((id) => S.venues.find((v) => v.id === id)).filter(Boolean);
  $("#venues").innerHTML = venues.map((v) => `
    <article class="l-venue">
      <img src="assets/venue-${v.photo}.jpg" alt="Inside ${esc(v.name)}" loading="lazy" width="390" height="280">
      <div class="l-card-body">
        <h3>${esc(v.name)}</h3>
        <p class="l-address">${pinIcon}<span>${esc(v.street)}, ${esc(v.suburb)}</span></p>
        <a class="l-find" href="venue.html?id=${esc(v.id)}" aria-label="Find my function at ${esc(v.name)}">Find my function ${arrow}</a>
      </div>
    </article>`).join("");

  $("#logos").innerHTML = logoBoxes(S.logos);
  $("#reviews").innerHTML = reviewCards(S.testimonials);

  /* ---------- Hero search: goes to the search page ---------- */

  const form = $("#hero-search");
  const guests = $("#l-guests");
  form.addEventListener("submit", (e) => {
    const raw = guests.value.trim();
    const n = Number(raw);
    const bad = raw !== "" && (!Number.isInteger(n) || n < 1);
    $("#l-search-msg").textContent = bad ? "Please enter a whole number of guests." : "";
    guests.toggleAttribute("aria-invalid", bad);
    if (bad) { e.preventDefault(); guests.focus(); }
  });

  /* ---------- Carousels (Our venues, What people say) ---------- */

  initCarousels(["venues", "reviews"]);
  document.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });
})();
