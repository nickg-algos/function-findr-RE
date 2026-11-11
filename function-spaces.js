// Function spaces (mockup page 24): the venue's rooms, each with View Bookings, View Listing and Edit Listing.
// Rooms come from the booking calendar; spaces set up on page 18 in this tab (ff.venueSpaces.v1) follow them.
(function () {
  "use strict";

  const { esc } = window.FF_SHARED;
  const CAL = window.FF_CALENDAR;
  const LIST = window.FF_SPACE_LIST;
  const $ = (sel) => document.querySelector(sel);

  let added = [];
  try { added = JSON.parse(sessionStorage.getItem("ff.venueSpaces.v1")) || []; } catch (e) { /* only the calendar's rooms */ }

  const icon = {
    bookings: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="23" height="21" rx="3"/><path d="M3 11h23M9 3.500v5M20 3.500v5M8 16h.5M13 16h.5M18 16h.5M8 21h.5M13 21h.5"/><circle cx="25" cy="25" r="5" fill="#fff"/><path d="M22.800 25l1.600 1.600 2.800-3"/></svg>',
    listing: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="24" height="18" rx="1.500"/><path d="M2 9h24M5 7h.5M8 7h.5M6 13h8M6 17h6"/><path d="M17 21.500c2-3 6-3 8 0-2 3-6 3-8 0z" fill="#fff"/><circle cx="21" cy="21.500" r="1.400"/></svg>',
    edit: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="22" height="20" rx="2"/><path d="M7 11h14M7 15h10M7 19h6"/><path d="M27 15l3 3-9 9-4 1 1-4z" fill="#fff"/></svg>',
  };
  const count = (id) => CAL.bookings.filter((b) => b.space === id).length;
  const plural = (n) => (n === 1 ? "1 booking" : `${n} bookings`);

  const rooms = CAL.spaces.map((s) => ({
    name: s.name,
    photo: (LIST[s.id] || {}).photo,
    alt: (LIST[s.id] || {}).alt || "",
    meta: `${plural(count(s.id))} on the calendar`,
    bookings: `calendar.html?space=${encodeURIComponent(s.id)}`,
    listing: (LIST[s.id] || {}).listing || "venue.html?id=sample",
    edit: "space-setup.html", // TODO: the calendar's rooms have no set up details to edit yet
    isNew: false,
  })).concat(added.map((s) => ({
    name: s.name,
    photo: s.photos[0],
    alt: `${s.name}`,
    meta: "New: not on the calendar yet",
    bookings: null,
    listing: `preview.html?space=${encodeURIComponent(s.id)}`,
    edit: `space-setup.html?edit=${encodeURIComponent(s.id)}`,
    isNew: true,
  })));

  $("#fs-note").textContent = added.length ? `Including ${added.length === 1 ? "1 space" : `${added.length} spaces`} you’ve just set up.` : "";
  $("#fs-list").innerHTML = rooms.map((r, i) => `
    <section class="fs-space" aria-labelledby="fs-${i}">
      <h2 id="fs-${i}">${esc(r.name)}${r.isNew ? ' <span class="fs-new">New</span>' : ""}</h2>
      <div class="fs-body">
        ${r.photo ? `<img src="${esc(r.photo)}" alt="${esc(r.alt)}" loading="lazy" width="460" height="352">` : '<div class="fs-nophoto">No photo yet</div>'}
        <div class="fs-actions">
          ${r.bookings ? `<a class="fs-btn" href="${esc(r.bookings)}">${icon.bookings}View Bookings</a>` : `<span class="fs-btn is-off" aria-disabled="true">${icon.bookings}View Bookings</span>`}
          <a class="fs-btn" href="${esc(r.listing)}">${icon.listing}View Listing</a>
          <a class="fs-btn" href="${esc(r.edit)}">${icon.edit}Edit Listing</a>
          <p class="fs-meta">${esc(r.meta)}</p>
        </div>
      </div>
    </section>`).join("");
  document.querySelector(".cal-crumb").textContent = CAL.venueName;
  document.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });
})();
