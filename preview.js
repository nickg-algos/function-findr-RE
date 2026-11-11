// "Preview and approve your function space listing" (mockup page 20).
// Shows the spaces set up on page 18 (sessionStorage ff.venueSpaces.v1) the way customers will see
// them on the space page, with the venue from sign-up (ff.venueSignup.v1) and the packages switched on
// in the food and beverage set up (localStorage ff.venueSetup.v1). DEMO ONLY: nothing goes live.
(function () {
  "use strict";

  const { esc } = window.FF_SHARED;
  const SETUP = window.FF_SETUP;
  const DATA = window.FF_DATA;
  const $ = (sel, root = document) => root.querySelector(sel);
  const readS = (k, f) => { try { return JSON.parse(sessionStorage.getItem(k)) || f; } catch (e) { return f; } };
  const readL = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) || f; } catch (e) { return f; } };

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const timeLabel = (mins) => { const m = mins % 1440; const h = Math.floor(m / 60); return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
  const dollars = (c) => "$" + (c % 100 ? (c / 100).toFixed(2) : String(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const duration = (m) => [Math.floor(m / 60) && `${Math.floor(m / 60)} hour${Math.floor(m / 60) === 1 ? "" : "s"}`, m % 60 && `${m % 60} min`].filter(Boolean).join(" ");

  /* ---------- What to preview: their spaces, or a marked example ---------- */

  const signup = readS("ff.venueSignup.v1", {});
  let spaces = readS("ff.venueSpaces.v1", []);
  const example = !spaces.length;
  let venue = { name: signup.venue || "Your venue", address: signup.address || "", photo: signup.photo || null };
  let packages = null; // [{ label, desc }] for food and beverage

  if (example) {
    const s = window.FF_SEARCH.venues.find((v) => v.id === "sample");
    const v = window.FF_VENUES.sample;
    const fr = v.spaces[0];
    venue = { name: s.name, address: `${s.street}, ${s.suburb}`, photo: null };
    const label = (list, id) => (list.find((p) => p.id === id) || {}).label;
    packages = {
      food: v.foodPackages.map((id) => ({ label: label(DATA.foodPackages, id), desc: "" })),
      bev: v.beveragePackages.map((id) => ({ label: label(DATA.beveragePackages, id), desc: "" })),
    };
    spaces = [{
      id: fr.id, name: fr.name, type: "Private Room", about: fr.about, seated: fr.seated, standing: fr.standing, depositCents: fr.depositCents,
      bufferMinutes: { setup: 60, packDown: 60 }, extrasCents: { roomHire: null, cleaning: null, security: null },
      hours: {
        day: DAYS.map((d, i) => ({ open: v.sessions[0].start, close: v.sessions[0].end, minSpendCents: fr.minSpendCents[i][0] })),
        evening: DAYS.map((d, i) => ({ open: v.sessions[1].start, close: v.sessions[1].end, minSpendCents: fr.minSpendCents[i][1] })),
      },
      dietary: ["Halal", "Gluten-Free", "Vegan"], additional: v.additional.slice(0, 3),
      facilities: ["AV Equipment: TV, projector, screen, microphone, speakers", "Wi-Fi Access", "Dance Floor", "Air conditioning / Heating", "High and Low Tables"],
      accessibility: [], transport: ["Close to Public Transport"], music: ["Play own music – via iPhone/laptop", "DJ allowed"],
      age: ["Guests under 18 must be accompanied by a parent or guardian"], cancellation: ["Free Cancellation up to 7 days prior", "Flexible date changes"],
      photos: [fr.mainPhoto.src, ...fr.sidePhotos.map((p) => p.src)],
    }];
  } else {
    const cats = (readL("ff.venueSetup.v1", {}).cats) || {};
    const on = (list) => list.filter((c) => cats[c.id] && cats[c.id].on).map((c) => ({ label: c.label, desc: cats[c.id].desc || "" }));
    packages = { food: on(SETUP.food), bev: on(SETUP.beverage) };
  }

  const allAccess = window.FF_SPACE_SETUP.groups.find((g) => g.id === "accessibility").options;
  // Open on the space just saved (preview.html?space=<id>), or the first.
  let current = Math.max(0, spaces.findIndex((s) => s.id === new URLSearchParams(location.search).get("space")));

  /* ---------- Render one space, in the space page's layout ---------- */

  const icon = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s-7-6.600-7-12a7 7 0 0 1 14 0c0 5.400-7 12-7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.600" fill="#fff"/></svg>',
    seated: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6v13h9v9M4 19l-1 9M13 19h3"/><rect x="15" y="12" width="14" height="4" rx="1"/><path d="M18 16v12M26 16v12"/><circle cx="22" cy="5" r="2"/><path d="M22 7v5"/></svg>',
    standing: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="6" r="2.500"/><circle cx="22" cy="6" r="2.500"/><path d="M6 29v-8l-1-6c0-2 2-3 4-3h2c2 0 4 1 4 3M26 29v-8l1-6c0-2-2-3-4-3h-2c-2 0-4 1-4 3M10 29v-7M22 29v-7"/></svg>',
  };
  const bullets = (items, cls = "") => (items.length ? `<ul class="sp-bullets ${cls}">${items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : '<p class="pv-none">None selected</p>');
  const row = (title, body) => `<section class="sp-row"><h2>${esc(title)}</h2><div>${body}</div></section>`;
  const pkgs = (list) => (list.length
    ? `<ul class="pv-pkgs">${list.map((p) => `<li><strong>${esc(p.label)}</strong>${p.desc ? `<span>${esc(p.desc)}</span>` : ""}</li>`).join("")}</ul>`
    : '<p class="pv-none">None yet. <a href="venue-setup.html">Enter menu items</a></p>');

  function render() {
    const s = spaces[current];
    const photos = s.photos.length ? s.photos : venue.photo ? [venue.photo] : [];
    const cap = [s.seated && `<span>${icon.seated}${s.seated} Seated</span>`, s.standing && `<span>${icon.standing}${s.standing} Standing</span>`].filter(Boolean).join("");
    const sessions = [["day", "Day time"], ["evening", "Evening"]];
    const anySpend = sessions.some(([id]) => s.hours[id].some(Boolean));
    const hoursTable = anySpend ? `
      <table class="sp-table">
        <caption class="sr-only">Hours and minimum spend for the ${esc(s.name)} by day</caption>
        <thead class="sr-only"><tr><th scope="col">Day</th>${sessions.map(([, l]) => `<th scope="col">${l}</th>`).join("")}</tr></thead>
        <tbody>${DAYS.map((d, i) => `<tr><th scope="row">${d}</th>${sessions.map(([id]) => {
          const h = s.hours[id][i];
          return `<td>${h ? `<strong>${timeLabel(h.open)} – ${timeLabel(h.close)}</strong><br>${h.minSpendCents !== null ? `${dollars(h.minSpendCents)} min spend` : "No minimum spend"}` : '<span class="pv-none">Closed</span>'}</td>`;
        }).join("")}</tr>`).join("")}</tbody>
      </table>
      <p class="sp-note">Minimum spends include GST.</p>` : '<p class="pv-none">No hours yet.</p>';
    const extras = [["roomHire", "Room hire"], ["cleaning", "Cleaning fee"], ["security", "Security fee"]].filter(([k]) => s.extrasCents[k] !== null);

    $("#pv-space").innerHTML = `
      <div class="sp-top">
        <div>
          <p class="pv-venue">${esc(venue.name)}</p>
          ${venue.address ? `<p class="vp-address">${icon.pin}<span>${esc(venue.address)}</span></p>` : ""}
          <h2 class="sp-name">${esc(s.name)}</h2>
        </div>
        <dl class="sp-key">
          <div><dt>Deposit</dt><dd>${dollars(s.depositCents)}</dd></div>
          <div><dt class="sp-key-cap">Capacity</dt><dd>${cap}</dd></div>
        </dl>
      </div>

      ${photos.length ? `<div class="sp-photos${photos.length > 2 ? "" : " is-single"}">
        <div class="sp-photo-main"><img src="${esc(photos[0])}" alt="${esc(s.name)}, photo 1"></div>
        ${photos.length > 2 ? photos.slice(1, 3).map((p, i) => `<img class="sp-photo-side" src="${esc(p)}" alt="${esc(s.name)}, photo ${i + 2}">`).join("") : ""}
      </div>` : '<p class="pv-nophoto">No photos yet. Customers see listings with photos first.</p>'}

      <div class="sp-main pv-main">
        ${row("About this space", `<div class="sp-about">${s.about.map((p) => `<p>${esc(p)}</p>`).join("")}</div>`)}
        <section class="sp-row"><h2>Event options</h2><div class="sp-options">
          <div class="sp-sub"><span></span><h3>Food Packages</h3>${pkgs(packages.food)}</div>
          <div class="sp-sub"><span></span><h3>Dietary Accommodations</h3>${bullets(s.dietary, "sp-two")}</div>
          <div class="sp-sub"><span></span><h3>Beverage Options</h3>${pkgs(packages.bev)}</div>
          <div class="sp-sub"><span></span><h3>Additional</h3>${bullets(s.additional)}</div>
        </div></section>
        ${row("Minimum spend", hoursTable)}
        ${row("Capacity", `<p class="sp-cap">${cap}</p>`)}
        ${row("Facilities", bullets(s.facilities, "sp-two"))}
        ${row("Accessibility", `<ul class="sp-bullets">${allAccess.map((a) => (s.accessibility.includes(a) ? `<li>${esc(a)}</li>` : `<li class="is-no"><s>${esc(a)}</s> <span class="sp-no">Not available</span></li>`)).join("")}</ul>`)}
        ${row("Parking and transport", bullets(s.transport, "sp-two"))}
        ${row("Music and sound", bullets(s.music, "sp-two"))}
        ${row("Age restrictions", bullets(s.age))}
        ${row("Cancellation and booking flexibility", bullets(s.cancellation, "sp-two"))}
      </div>

      <aside class="pv-venue-only" aria-labelledby="vo-title">
        <h2 id="vo-title">Only you see this</h2>
        <dl>
          <div><dt>Type</dt><dd>${esc(s.type)}</dd></div>
          <div><dt>Setup time</dt><dd>${duration(s.bufferMinutes.setup)}</dd></div>
          <div><dt>Pack down &amp; cleaning</dt><dd>${duration(s.bufferMinutes.packDown)}</dd></div>
          <div><dt>Extras</dt><dd>${extras.length ? extras.map(([k, l]) => `${l} ${dollars(s.extrasCents[k])}`).join(", ") : "None"}</dd></div>
        </dl>
      </aside>`;
    document.title = `Preview: ${s.name} | FunctionFindr`;
    $("#pv-edit").href = example ? "space-setup.html" : `space-setup.html?edit=${encodeURIComponent(s.id)}`;
  }

  /* ---------- Page ---------- */

  $("#pv-tabs").innerHTML = spaces.length > 1
    ? `<div class="pv-tabs" role="group" aria-label="Choose a space to preview">${spaces.map((s, i) => `<button type="button" data-space="${i}" aria-pressed="${i === current}">${esc(s.name)}</button>`).join("")}</div>`
    : "";
  if (example) $("#pv-example").innerHTML = '<p class="av-example">You haven’t set up a function space yet, so this is an example. <a href="space-setup.html">Set up your first space</a>.</p>';

  document.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-space]");
    if (tab) {
      current = Number(tab.dataset.space);
      document.querySelectorAll("[data-space]").forEach((b) => b.setAttribute("aria-pressed", String(b === tab)));
      render();
    }
    if (e.target.closest('a[href="#"]')) e.preventDefault();
  });

  $("#pv-approve").addEventListener("click", () => {
    if (!example) { try { sessionStorage.setItem("ff.venueSignup.v1", JSON.stringify({ ...signup, approved: "demo" })); } catch (err) { /* fine */ } }
    location.href = "mockup.html?p=21"; // TODO: page 21's own address once it's built
  });

  render();
})();
