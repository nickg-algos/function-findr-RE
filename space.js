// Function space page (mockup page 9): space.html?venue=sample&space=function-room.
// Shows the space's packages, minimum spends and policies, and checks a date against the
// venue's hours, the space's capacity and the booking calendar before moving on to page 10.
(function () {
  "use strict";

  const { esc, money } = window.FF_SHARED;
  const S = window.FF_SEARCH;
  const D = window.FF_DATA; // menus, shared with My Bookings
  const CAL = window.FF_CALENDAR;
  const $ = (sel, root = document) => root.querySelector(sel);

  const params = new URLSearchParams(location.search);
  const listing = S.venues.find((v) => v.id === params.get("venue")) || S.venues.find((v) => v.id === "sample");
  const venue = window.FF_VENUES[listing.id];
  const space = venue && (venue.spaces.find((s) => s.id === params.get("space")) || venue.spaces[0]);
  if (!space) {
    location.replace(`venue.html?id=${encodeURIComponent(listing.id)}`);
    return;
  }
  document.title = `${space.name} at ${listing.name} | FunctionFindr`;

  /* ---------- Helpers ---------- */

  const A = window.FF_AVAIL; // availability rules, shared with the next steps
  const { DAYS, timeLabel } = A;
  const dollars = (cents) => "$" + Math.round(cents / 100).toLocaleString("en-AU");
  const capText = A.capacityText(space);

  const icon = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s-7-6.600-7-12a7 7 0 0 1 14 0c0 5.400-7 12-7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.600" fill="#fff"/></svg>',
    dots: '<svg viewBox="0 0 18 18" aria-hidden="true" fill="currentColor"><circle cx="3" cy="3" r="1.600"/><circle cx="9" cy="3" r="1.600"/><circle cx="15" cy="3" r="1.600"/><circle cx="3" cy="9" r="1.600"/><circle cx="9" cy="9" r="1.600"/><circle cx="15" cy="9" r="1.600"/><circle cx="3" cy="15" r="1.600"/><circle cx="9" cy="15" r="1.600"/><circle cx="15" cy="15" r="1.600"/></svg>',
    chevron: '<svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    seated: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6v13h9v9M4 19l-1 9M13 19h3"/><rect x="15" y="12" width="14" height="4" rx="1"/><path d="M18 16v12M26 16v12"/><circle cx="22" cy="5" r="2"/><path d="M22 7v5"/></svg>',
    standing: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="6" r="2.500"/><circle cx="22" cy="6" r="2.500"/><path d="M6 29v-8l-1-6c0-2 2-3 4-3h2c2 0 4 1 4 3M26 29v-8l1-6c0-2-2-3-4-3h-2c-2 0-4 1-4 3M10 29v-7M22 29v-7M15 15l1 4 1-4"/></svg>',
    food: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v8a3 3 0 0 0 6 0V3M9 3v26M20 29V3c3 1 5 5 5 10s-2 6-5 6M26 29V19"/></svg>',
    drink: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5l8 8-11 11a3 3 0 0 1-4 0l-4-4a3 3 0 0 1 0-4z"/><path d="M14 10l8 8M21 3l8 8M24 2l2 2M27 5l2 2M5 25l3 3"/></svg>',
    balloons: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19c-4 0-7-4-7-8.500S8 3 12 3s7 3 7 7.500S16 19 12 19z"/><path d="M21 21c-3.500 0-6-3.500-6-7.500 0-.900.100-1.700.400-2.500M24 7c2.300 1 4 3.500 4 6.500 0 4-2.500 7.500-6 7.500"/><path d="M12 19l-1 2h2zM21.500 21l-1 2h2zM12 21c0 3-2 4-2 8M21.500 23c0 2.500 1.500 3.500 1.500 6"/></svg>',
    flag: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22V3M5 4h13l-3 4.500 3 4.500H5"/></svg>',
  };

  /* ---------- Page ---------- */

  const pkgLabel = (list, id) => (list.find((p) => p.id === id) || { label: id }).label;
  const pkgList = (ids, list) => `<ul class="sp-pkgs">${ids.map((id) => `
    <li><span>${esc(pkgLabel(list, id))}</span><button type="button" class="sp-view" data-menu="${esc(id)}" aria-haspopup="dialog" aria-label="View the ${esc(pkgLabel(list, id))} menu">View menu ${icon.chevron}</button></li>`).join("")}</ul>`;
  const bullets = (items, cls = "") => `<ul class="sp-bullets ${cls}">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;

  const minSpend = space.minSpendCents
    ? `<section class="sp-row" aria-labelledby="ms-title">
        <h2 id="ms-title">Minimum spend</h2>
        <div>
          <table class="sp-table">
            <caption class="sr-only">Minimum spend for the ${esc(space.name)} by day and session</caption>
            <thead class="sr-only"><tr><th scope="col">Day</th>${venue.sessions.map((s) => `<th scope="col">${esc(s.label)}</th>`).join("")}</tr></thead>
            <tbody>${DAYS.map((day, i) => `<tr><th scope="row">${day}</th>${venue.sessions.map((s, j) => `<td><strong>${timeLabel(s.start)} – ${timeLabel(s.end)}</strong><br>${window.FF_SHARED.plainDollars(space.minSpendCents[i][j])} min spend</td>`).join("")}</tr>`).join("")}</tbody>
          </table>
          <p class="sp-note">Minimum spends include GST.</p>
        </div>
      </section>`
    : "";

  const facilities = space.facilities.map((f) => (f === "AV Equipment" && space.av ? `AV Equipment: ${space.av.join(", ")}` : f));
  const access = space.accessibility
    ? `<section class="sp-row" aria-labelledby="ax-title">
        <h2 id="ax-title">Accessibility</h2>
        <ul class="sp-bullets">${space.accessibility.map((a) => (a.available
          ? `<li>${esc(a.label)}</li>`
          : `<li class="is-no"><s>${esc(a.label)}</s> <span class="sp-no">Not available</span></li>`)).join("")}</ul>
      </section>`
    : "";

  const sidePhotos = space.sidePhotos || [];
  const mainPhoto = space.mainPhoto || { src: space.photo, alt: space.alt };
  $("#space").innerHTML = `
    <div class="sp-top">
      <div>
        <h1>${esc(listing.name)}</h1>
        <p class="vp-address">${icon.pin}<span>${esc(listing.street)}, ${esc(listing.suburb)}</span></p>
        <p class="sp-name">${esc(space.name)}</p>
      </div>
      <dl class="sp-key">
        ${space.depositCents ? `<div><dt>Deposit</dt><dd>${dollars(space.depositCents)}</dd></div>` : ""}
        <div><dt class="sp-key-cap">Capacity</dt><dd>
          ${space.seated ? `<span>${icon.seated}${space.seated} Seated</span>` : ""}
          ${space.standing ? `<span>${icon.standing}${space.standing} Standing</span>` : ""}
        </dd></div>
      </dl>
    </div>

    <div class="sp-photos${sidePhotos.length ? "" : " is-single"}">
      <div class="sp-photo-main">
        <img src="${esc(mainPhoto.src)}" alt="${esc(mainPhoto.alt)}" width="950" height="633">
        ${listing.verified ? '<span class="vp-badge">Verified Venue</span>' : ""}
      </div>
      ${sidePhotos.map((p) => `<img class="sp-photo-side" src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy" width="300" height="320">`).join("")}
      <button type="button" class="vp-gallery-btn" id="gallery-open" aria-haspopup="dialog">${icon.dots}Photo gallery</button>
    </div>

    <div class="sp-layout">
      <div class="sp-main">
        <section class="sp-row" aria-labelledby="about-title">
          <h2 id="about-title">About this space</h2>
          <div class="sp-about">${space.about.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
        </section>

        <section class="sp-row" aria-labelledby="opt-title">
          <h2 id="opt-title">Event options</h2>
          <div class="sp-options">
            <div class="sp-sub"><img class="sp-icon" src="assets/step-food.png" alt="" width="124" height="74"><h3>Food Packages</h3>${pkgList(venue.foodPackages, D.foodPackages)}</div>
            <div class="sp-sub"><img class="sp-icon" src="assets/step-dietary.png" alt="" width="124" height="74"><h3>Dietary Accommodations</h3>${bullets(venue.dietary, "sp-two")}</div>
            <div class="sp-sub"><img class="sp-icon" src="assets/step-bev.png" alt="" width="124" height="74"><h3>Beverage Options</h3>${pkgList(venue.beveragePackages, D.beveragePackages)}</div>
            <div class="sp-sub"><img class="sp-icon" src="assets/step-additional.png" alt="" width="124" height="74"><h3>Additional</h3>${bullets(venue.additional)}</div>
          </div>
        </section>

        ${minSpend}

        <section class="sp-row" aria-labelledby="cap-title">
          <h2 id="cap-title">Capacity</h2>
          <p class="sp-cap">
            ${space.standing ? `<span>${icon.standing}${space.standing} Standing</span>` : ""}
            ${space.seated ? `<span>${icon.seated}${space.seated} Seated</span>` : ""}
          </p>
        </section>

        <section class="sp-row" aria-labelledby="fac-title">
          <h2 id="fac-title">Facilities</h2>
          ${bullets(facilities, "sp-two")}
        </section>

        ${access}

        <section class="sp-row" aria-labelledby="age-title">
          <h2 id="age-title">Age restrictions</h2>
          <p>${esc(venue.ageRule)}</p>
        </section>

        <section class="sp-row" aria-labelledby="cx-title">
          <h2 id="cx-title">Cancellation and booking flexibility</h2>
          ${bullets(venue.cancellation, "sp-two")}
        </section>
      </div>

      <aside class="sp-aside" aria-label="Check availability">
        <form class="sp-card" id="avail-form" novalidate>
          <div class="sp-field">
            <label for="a-name">Event name:</label>
            <input id="a-name" type="text" maxlength="80" autocomplete="off">
          </div>
          <div class="sp-field">
            <label for="a-date">Function date:</label>
            <input id="a-date" type="date" aria-describedby="a-date-msg">
            <p class="sp-err" id="a-date-msg"></p>
          </div>
          <div class="sp-pair">
            <div class="sp-field">
              <label for="a-start">Start time:</label>
              <select id="a-start" aria-describedby="a-start-msg"></select>
              <p class="sp-err" id="a-start-msg"></p>
            </div>
            <div class="sp-field">
              <label for="a-end">End time:</label>
              <select id="a-end" aria-describedby="a-end-msg"></select>
              <p class="sp-err" id="a-end-msg"></p>
            </div>
          </div>
          <div class="sp-field">
            <label for="a-guests">Number of guests:</label>
            <input id="a-guests" type="number" inputmode="numeric" min="1" step="1" aria-describedby="a-guests-hint a-guests-msg">
            <p class="sp-hint" id="a-guests-hint">Up to ${esc(capText)}.</p>
            <p class="sp-err" id="a-guests-msg"></p>
          </div>
          <p class="sp-spend" id="a-spend" aria-live="polite"></p>
          <button type="submit" class="sp-see">See availability</button>
          <div class="sp-result" id="a-result" role="alert"></div>
        </form>
        <a class="sp-report" href="mailto:info@functionfindr.com?subject=${encodeURIComponent(`Report listing: ${space.name} at ${listing.name}`)}">${icon.flag}Report Listing</a>
      </aside>
    </div>

    <section class="vp-location" aria-labelledby="location-title">
      <h2 id="location-title">Location</h2>
      ${listing.pin ? `<div class="vp-map" style="background-position:${listing.pin[0]}% ${listing.pin[1]}%" role="img" aria-label="Map showing ${esc(listing.name)} at ${esc(listing.street)}, ${esc(listing.suburb)}">
        <span class="vp-map-pin" style="left:${listing.pin[0]}%;top:${listing.pin[1]}%">${icon.pin}</span></div>` : ""}
      <p class="vp-map-address">${esc(listing.street)}, ${esc(listing.suburb)}</p>
    </section>`;

  /* ---------- Menus ---------- */

  const price = (c) => (c ? money(c) : "n/a");
  const priceTable = (caption, cols, rows) => `<table class="sp-menu-table"><caption>${esc(caption)}</caption>
    <thead><tr><th scope="col">Drink</th>${cols.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr><th scope="row">${esc(r.name)}</th>${r.prices.map((p) => `<td>${price(p)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

  function menuHtml(id) {
    if (id === "canapes") {
      const c = D.canapes;
      return `<p>${esc(c.intro)} Choose ${c.dishCount} dishes.</p><ul class="sp-menu-list">${c.dishes.map((d) => `<li>${esc(d.name.replace(/:$/, ""))}${d.variants ? ` <span class="sp-muted">(${esc(d.variants.join(", "))})</span>` : ""}</li>`).join("")}</ul>`;
    }
    if (id === "antipasto") {
      return `${D.antipasto.note.map((n) => `<p>${esc(n)}</p>`).join("")}<ul class="sp-menu-list">${D.antipasto.options.map((o) => `<li>${esc(o.label)}</li>`).join("")}</ul>`;
    }
    if (id === "barTab") {
      const t = D.barTab;
      // TODO(confirm): schooner prices are $0.00 placeholders in the data, so they show as n/a.
      return `${t.notes.map((n) => `<p>${esc(n)}</p>`).join("")}
        ${priceTable("Tap beer", ["Pot", "Schooner", "Pint"], t.tap.map((d) => ({ name: d.name, prices: [d.pot, d.schooner, d.pint] })))}
        ${priceTable("Bottles & cans", ["Price"], t.bottles.filter((d) => d.price).map((d) => ({ name: d.name, prices: [d.price] })))}
        ${t.wines.map((g) => priceTable(g.group, ["Glass"], g.items.map((d) => ({ name: d.name, prices: [d.price] })))).join("")}
        <p class="sp-note">Prices include GST.</p>`;
    }
    const m = D.menus[id];
    if (!m) return "<p>The venue hasn’t added this menu yet.</p>";
    return `<p>${esc(m.intro)}</p>${m.groups.map((g) => `<h3>${esc(g.title)}${g.pick > 1 ? ` <span class="sp-muted">(choose ${g.pick})</span>` : ""}</h3><ul class="sp-menu-list">${g.options.map((o) => `<li>${esc(o.label)}</li>`).join("")}</ul>`).join("")}`;
  }

  const menuDialog = $("#menu");
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-menu]");
    if (!btn) return;
    const id = btn.dataset.menu;
    $("#menu-title").textContent = pkgLabel([...D.foodPackages, ...D.beveragePackages], id);
    $("#menu-body").innerHTML = menuHtml(id);
    menuDialog.showModal();
  });

  /* ---------- Photo gallery ---------- */

  const photos = [mainPhoto, ...sidePhotos, ...venue.spaces.filter((s) => s !== space).map((s) => ({ src: s.photo, alt: s.alt }))];
  $("#gallery-title").textContent = `Photos of ${listing.name}`;
  $("#gallery-grid").innerHTML = photos.map((p) => `<li><img src="${esc(p.src)}" alt="${esc(p.alt)}" loading="lazy"></li>`).join("");
  $("#gallery-open").addEventListener("click", () => $("#gallery").showModal());

  document.querySelectorAll("dialog").forEach((d) => {
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  });

  /* ---------- Check availability ---------- */

  const form = $("#avail-form");
  const fields = { date: $("#a-date"), start: $("#a-start"), end: $("#a-end"), guests: $("#a-guests") };
  const times = (from, to) => { const out = []; for (let m = from; m <= to; m += 30) out.push(`<option value="${m}">${timeLabel(m)}</option>`); return out.join(""); };
  fields.start.innerHTML = '<option value="">–</option>' + times(listing.opens, listing.latest - 30);
  fields.end.innerHTML = '<option value="">–</option>' + times(listing.opens + 30, listing.latest);
  fields.date.min = A.todayIso();

  // Coming back with "Edit Selection" from the next step: start from what was chosen.
  const before = A.fromParams(params);
  if (before.date) fields.date.value = before.date;
  if (before.start !== null && fields.start.querySelector(`option[value="${before.start}"]`)) fields.start.value = String(before.start);
  if (before.end !== null && fields.end.querySelector(`option[value="${before.end}"]`)) fields.end.value = String(before.end);
  if (Number.isInteger(before.guests)) fields.guests.value = String(before.guests);
  if (before.name) $("#a-name").value = before.name;

  function readForm() {
    const num = (el) => (el.value.trim() === "" ? null : Number(el.value));
    return { date: fields.date.value, start: num(fields.start), end: num(fields.end), guests: num(fields.guests), name: $("#a-name").value.trim() };
  }

  function showSpend() {
    const req = readForm();
    const ms = A.minSpend(venue, space, req.date, req.start);
    $("#a-spend").textContent = ms ? `Minimum spend for a ${ms.day} ${ms.session.toLowerCase()}: ${window.FF_SHARED.plainDollars(ms.cents)} (inc. GST)` : "";
  }
  form.addEventListener("change", showSpend);
  showSpend();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const result = $("#a-result");
    result.textContent = "";
    result.className = "sp-result";
    const req = readForm();
    const found = A.problems(listing, space, req);
    let firstBad = null;
    Object.keys(fields).forEach((key) => {
      $(`#a-${key}-msg`).textContent = found[key];
      fields[key].toggleAttribute("aria-invalid", !!found[key]);
      if (found[key] && !firstBad) firstBad = key;
    });
    if (firstBad) { fields[firstBad].focus(); return; }

    const clash = A.clash(CAL, listing, space, req);
    if (clash) {
      result.classList.add("is-bad");
      result.textContent = A.clashText(space, clash);
      return;
    }

    // Free: carry the request on to the next step (page 10).
    location.href = `available.html?${A.toParams(listing.id, space.id, req)}`;
  });
})();
