// Venue page (mockup page 8): venue.html?id=sample. Any venue in search-data.js gets a page;
// the ones in venue-data.js also get their function spaces and a fuller photo gallery.
(function () {
  "use strict";

  const { esc, logoBoxes, reviewCards, initCarousels } = window.FF_SHARED;
  const S = window.FF_SEARCH;
  const $ = (sel, root = document) => root.querySelector(sel);

  const id = new URLSearchParams(location.search).get("id") || "sample";
  const listing = S.venues.find((v) => v.id === id) || S.venues.find((v) => v.id === "sample");
  const detail = window.FF_VENUES[listing.id] || null;

  const typeNames = { pub: "Pub", bar: "Bar", rooftop: "Rooftop bar", restaurant: "Restaurant", other: "Event space" };
  const venue = {
    name: listing.name,
    address: `${listing.street}, ${listing.suburb}`,
    verified: listing.verified,
    tags: detail ? [detail.cuisine, detail.type] : [typeNames[listing.type]].filter(Boolean),
    about: detail ? detail.about : listing.about,
    photo: detail ? detail.photo : { src: `assets/venue-${listing.photo}.jpg`, alt: `Inside ${listing.name}` },
    spaces: detail ? detail.spaces : [],
    gallery: detail ? detail.gallery : [],
  };
  document.title = `${venue.name} | FunctionFindr`;

  const pinIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s-7-6.600-7-12a7 7 0 0 1 14 0c0 5.400-7 12-7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.600" fill="#fff"/></svg>';
  const dotsIcon = '<svg viewBox="0 0 18 18" aria-hidden="true" fill="currentColor"><circle cx="3" cy="3" r="1.600"/><circle cx="9" cy="3" r="1.600"/><circle cx="15" cy="3" r="1.600"/><circle cx="3" cy="9" r="1.600"/><circle cx="9" cy="9" r="1.600"/><circle cx="15" cy="9" r="1.600"/><circle cx="3" cy="15" r="1.600"/><circle cx="9" cy="15" r="1.600"/><circle cx="15" cy="15" r="1.600"/></svg>';
  const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 3.500L13.500 8 9 12.500" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- The venue ---------- */

  const capacity = (s) => [s.seated && `${s.seated} seated`, s.standing && `${s.standing} standing`].filter(Boolean)
    .map((t) => `<span>${t}</span>`).join('<span class="vp-sep" aria-hidden="true">|</span>');

  const spacesHtml = venue.spaces.length
    ? venue.spaces.map((s, i) => `
      <article class="vp-space" aria-labelledby="space-${i}">
        <div class="vp-space-text">
          <h3 id="space-${i}">${esc(s.name)}</h3>
          <p class="vp-cap">${capacity(s)}</p>
          ${s.about.map((p) => `<p>${esc(p)}</p>`).join("")}
          <p class="vp-fac"><strong>Facilities</strong> ${esc(s.facilities.join(", "))}</p>
          <a class="vp-check" href="mockup.html?p=9" aria-label="Check availability for the ${esc(s.name)}">Check availability ${arrow}</a>
        </div>
        <img src="${esc(s.photo)}" alt="${esc(s.alt)}" loading="lazy" width="236" height="236">
      </article>`).join("")
    : `<p class="vp-empty">${esc(venue.name)} hasn’t listed its function spaces yet. The venue holds up to ${listing.seated} seated or ${listing.standing} standing. <a href="search.html">Compare other venues</a>.</p>`;

  const mapHtml = listing.pin
    ? `<div class="vp-map" style="background-position:${listing.pin[0]}% ${listing.pin[1]}%" role="img" aria-label="Map showing ${esc(venue.name)} at ${esc(venue.address)}">
        <span class="vp-map-pin" style="left:${listing.pin[0]}%;top:${listing.pin[1]}%">${pinIcon}</span>
      </div>`
    : "";

  $("#venue").innerHTML = `
    <h1>${esc(venue.name)}</h1>
    <p class="vp-address">${pinIcon}<span>${esc(venue.address)}</span></p>

    <div class="vp-hero">
      <img src="${esc(venue.photo.src)}" alt="${esc(venue.photo.alt)}" width="1268" height="633">
      ${venue.verified ? '<span class="vp-badge">Verified Venue</span>' : ""}
      <button type="button" class="vp-gallery-btn" id="gallery-open" aria-haspopup="dialog">${dotsIcon}Photo gallery</button>
    </div>

    <div class="vp-about">
      ${venue.tags.length ? `<p class="vp-tags">${venue.tags.map((t) => `<span>${esc(t)}</span>`).join('<span class="vp-sep" aria-hidden="true">|</span>')}</p>` : ""}
      <p>${esc(venue.about)}</p>
    </div>

    <section class="vp-spaces" aria-labelledby="spaces-title">
      <h2 class="sr-only" id="spaces-title">Function spaces</h2>
      ${spacesHtml}
    </section>

    <section class="vp-location" aria-labelledby="location-title">
      <h2 id="location-title">Location</h2>
      ${mapHtml}
      <p class="vp-map-address">${esc(venue.address)}</p>
    </section>`;

  $("#logos").innerHTML = logoBoxes(S.logos);
  $("#reviews").innerHTML = reviewCards(S.testimonials);
  initCarousels(["reviews"]);

  /* ---------- Photo gallery ---------- */

  // The main photo is one of the spaces when the venue has them, so it's only added on its own otherwise.
  const photos = venue.spaces.length ? [...venue.spaces.map((s) => ({ src: s.photo, alt: s.alt })), ...venue.gallery] : [venue.photo];
  const dialog = $("#gallery");
  $("#gallery-title").textContent = `Photos of ${venue.name}`;
  $("#gallery-grid").innerHTML = photos.map((p) => `<li><img src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy"></li>`).join("");
  $("#gallery-open").addEventListener("click", () => dialog.showModal());
  $("#gallery-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  document.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });
})();
