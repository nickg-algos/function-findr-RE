(function () {
  "use strict";

  const D = window.FF_DATA;
  // Inside the venue's booking calendar this page runs in the Edit Booking pop-up
  // (my-bookings.html?embed=venue&booking=<id>): just the checklist, for that booking. The calendar leaves the
  // booking's details in sessionStorage (ff.venueChecklist.v1). The live booking (Sam's) shares the customer's
  // own answers; every other calendar booking keeps its own, started from the packages the calendar has for it.
  const params = new URLSearchParams(location.search);
  const EMBED = params.get("embed") === "venue";
  let seed = null;
  if (EMBED) {
    try { seed = JSON.parse(sessionStorage.getItem("ff.venueChecklist.v1")); } catch (e) { /* no details: the live booking */ }
    if (seed && seed.id !== params.get("booking")) seed = null;
    document.body.classList.add("mb-embed");
  }
  const OWN = !!(EMBED && seed && !seed.live);
  // Editing an existing booking locks each package behind Edit Menu Selection. Adding a booking (mode=add)
  // works exactly as the customer's own checklist, because the venue fills it in for them.
  const LOCKED = EMBED && params.get("mode") !== "add";
  const STORE_KEY = OWN ? `ff.myBookings.v4.${seed.id}` : "ff.myBookings.v4";
  const STATUS_KEY = OWN ? `${window.FF_SHARED.CHECKLIST_KEY}.${seed.id}` : window.FF_SHARED.CHECKLIST_KEY;
  if (OWN) D.booking = { ...D.booking, eventName: seed.title || D.booking.eventName, guests: Number(seed.guests) || D.booking.guests };
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const { esc, money } = window.FF_SHARED;

  const tapIds = D.barTab.tap.map((d) => d.id);
  const bottleIds = D.barTab.bottles.map((d) => d.id);
  const wineItems = D.barTab.wines.flatMap((g) => g.items);
  const wineIds = wineItems.map((d) => d.id);
  const slotOf = (id) => (D.foodPackages.some((p) => p.id === id) ? "food" : "bev");

  /* ---------- State ---------- */

  function initialState() {
    const dishes = {};
    D.canapes.dishes.forEach((d) => {
      const v = {};
      (d.variants || []).forEach((name) => { v[name] = false; });
      dishes[d.id] = { on: false, v };
    });
    const drinks = {};
    [...tapIds, ...bottleIds, ...wineIds].forEach((id) => { drinks[id] = false; });
    return {
      cards: {},
      open: { food: null, bev: null },
      barOpen: {},
      pkg: {},
      menus: Object.fromEntries(Object.keys(D.menus).map((id) => [id, { g: {} }])),
      canapes: { dishes },
      antipasto: null,
      diet: {},
      bar: {
        drinks,
        allTap: false,
        tapMode: null,
        allBottles: false,
        wineMode: null,
        spirits: null,
      },
      additional: {},
      notes: "",
      none: {},
    };
  }

  function seeded() {
    const st = initialState();
    const sel = seed.sel || {};
    [...(sel.food || []), ...(sel.bev || [])].forEach((id) => { st.pkg[id] = true; });
    (sel.dietary || []).forEach((id) => { st.diet[id] = { on: true }; });
    (sel.additional || []).forEach((key) => {
      const a = D.additional.find((x) => (x.val ? `${x.id}-${x.val}` : x.id) === key);
      if (a) st.additional[a.id] = a.val || true;
    });
    Object.entries(sel.none || {}).forEach(([k, v]) => { if (v) st.none[k] = true; });
    st.notes = sel.notes || "";
    return st;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      // Selections carry over, but every section starts closed so the page opens on one screen.
      if (raw) return { ...JSON.parse(raw), cards: {}, open: { food: null, bev: null }, barOpen: {} };
    } catch (e) { /* storage blocked or corrupt: start from the defaults */ }
    return OWN ? seeded() : initialState();
  }

  let saveTimer;
  function save(announce) {
    let saved = false;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      saved = true;
    } catch (e) { /* the page still works without storage */ }
    const el = $("#save-state");
    el.textContent = announce || (saved ? "Your changes are saved in this browser." : "Your changes can’t be saved in this browser.");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { el.textContent = ""; }, 3000);
  }

  const state = load();
  const messages = {};
  const menuIds = Object.keys(D.menus);

  const getPath = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), state);
  function setPath(path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o[k] = o[k] || {}), state);
    target[last] = value;
  }

  /* ---------- Markup helpers ---------- */

  function check(path, label, opts = {}) {
    const val = opts.val ? ` data-val="${esc(opts.val)}"` : "";
    const cls = opts.round ? ' class="round"' : "";
    return `<label class="check"><input type="checkbox"${cls} data-k="${path}"${val}><span>${label}</span></label>`;
  }

  const tickIcon = '<svg class="tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // A tick once the minimum is met, otherwise how far along it is, e.g. 2/6.
  function progressMark({ done, total }) {
    if (done >= total) return `<span class="prog">${tickIcon}<span class="sr-only">Complete</span></span>`;
    return `<span class="prog"><span aria-hidden="true">${done}/${total}</span><span class="sr-only">${done} of ${total} done</span></span>`;
  }

  const chevronIcon = '<svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function pkgRow(p) {
    return `<div class="pkg" data-pkg="${p.id}">
      <div class="pkg-row">
        ${check(`pkg.${p.id}`, esc(p.label))}
        <span class="status" data-status="${p.id}"></span>
        <button type="button" class="toggle" data-view="${p.id}" aria-expanded="false" aria-controls="panel-${p.id}" aria-label="Menu: ${esc(p.label)}">${chevronIcon}</button>
      </div>
      ${p.id === "canapes" ? canapesPanel() : p.id === "barTab" ? barTabPanel() : p.inline ? antipastoPanel() : menuPanel(p)}
    </div>`;
  }

  // The animated wrapper for anything that drops down; sync() toggles is-open on it.
  const fold = (attrs, body) => `<div class="fold" ${attrs}><div class="fold-inner">${body}</div></div>`;

  // Each step's icon is the line drawing from the mockup (V44-(14)[3]), cut out in brand orange: assets/step-<id>.png.
  const stepIcon = (id) => `<img class="card-icon" src="assets/step-${id}.png" alt="" width="124" height="74">`;

  function card(id, title, body) {
    return `<div class="step">
      <span class="step-mark" data-step="${id}"></span>
      <section class="card">
      <h3><button type="button" class="card-head" data-card="${id}" aria-expanded="false" aria-controls="card-${id}">
        ${stepIcon(id)}
        <span class="card-title">${esc(title)}</span>
        <span class="card-sum" data-sum="${id}"></span>
        ${chevronIcon}
      </button></h3>
      ${fold(`id="card-${id}"`, `<div class="card-body">${body}</div>`)}
      </section>
    </div>`;
  }

  function renderBooking() {
    const b = D.booking;
    $("#booking").innerHTML = `
      <h2 class="mb-event">${esc(b.eventName)}</h2>
      <div class="booking-top">
        <img class="booking-photo" src="assets/space.jpg" alt="${esc(b.space)} with round timber tables and stools">
        <div class="mb-box">
        <section class="fn-card" id="fn-body" aria-labelledby="fn-title">${fnBody()}</section>
        <section class="contact-card" id="contact-body" aria-labelledby="contact-title">${contactBody()}</section>
        </div>
      </div>
      <div class="mb-note-row">
        <p class="mb-select">Please Make Your Selections. <span>You can change this as many times as you like until the <strong>${esc(b.finaliseBy)}</strong>.</span></p>
      </div>`;
  }

  /* ---------- Function Details (read only) and Contact Details (editable) ---------- */

  function fnBody() {
    const b = D.booking;
    return `<div class="fn-head"><h3 id="fn-title">Function Details</h3></div>
      <dl class="detail-fields">
        <div><dt>Venue:</dt><dd>${esc(b.venue)}, ${esc(b.space)}<br>${b.addressLines.map(esc).join(" ")}</dd></div>
        <div><dt>Date:</dt><dd>${b.dateLines.map(esc).join(" ")}</dd></div>
        <div><dt>Time:</dt><dd>${esc(b.time)} – ${esc(b.endTime)}</dd></div>
        <div><dt>Guests:</dt><dd>${esc(b.guests)}</dd></div>
      </dl>`;
  }

  // Contact edits are personal details, so they stay in this tab only (sessionStorage), like the booking form's.
  // TODO(confirm): whether the venue should be told when contact details change, and whether the
  // contact person at the event is required.
  const CONTACT_KEY = "ff.myBookingsContact.v1";
  const contactFields = [
    { id: "contact", label: "Contact person:", type: "text", attrs: 'maxlength="80" autocomplete="name"' },
    { id: "email", label: "Email:", type: "email", attrs: 'maxlength="120" autocomplete="email" inputmode="email"' },
    { id: "phone", label: "Phone number:", type: "tel", attrs: 'maxlength="20" autocomplete="tel" inputmode="tel"' },
    { id: "contactOnNight", label: "Contact Person at event:", type: "text", attrs: 'maxlength="80" autocomplete="off"' },
  ];
  try { Object.assign(D.booking, JSON.parse(sessionStorage.getItem(CONTACT_KEY)) || {}); } catch (e) { /* the sample details */ }

  function contactBody(editing = false) {
    const b = D.booking;
    const head = '<div class="fn-head"><h3 id="contact-title">Contact Details</h3></div>';
    if (!editing) {
      return `${head}
        <dl class="detail-fields">
          ${contactFields.map((f) => `<div><dt>${f.label}</dt><dd>${esc(b[f.id])}</dd></div>`).join("")}
        </dl>
        <div class="fn-foot"><button type="button" class="mb-edit" data-fn="edit" aria-label="Edit contact details">Edit</button></div>`;
    }
    return `${head}<div class="fn-edit">
        ${contactFields.map((f) => `
        <div class="fn-field">
          <label for="cd-${f.id}">${f.label}</label>
          <input id="cd-${f.id}" type="${f.type}" ${f.attrs} value="${esc(b[f.id])}" aria-describedby="cd-${f.id}-msg">
          <p class="fn-err" id="cd-${f.id}-msg"></p>
        </div>`).join("")}
      </div>
      <div class="fn-bottom">
        <p class="fn-hint">To change the function details, please contact ${esc(b.venue)}.</p>
        <div class="fn-actions">
          <button type="button" class="mb-save" data-fn="save">Save Changes</button>
          <button type="button" class="mb-cancel" data-fn="cancel">Cancel</button>
        </div>
      </div>`;
  }

  const phoneOk = (v) => /^(?:\+?61|0)[2-478]\d{8}$/.test(v.replace(/[\s()-]/g, ""));
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  function fnAction(action) {
    const body = $("#contact-body");
    // While editing, the form takes the whole box (Function Details hides) so the box doesn't balloon.
    const box = $(".mb-box");
    box.classList.toggle("is-editing", action === "edit");
    if (action === "save") box.classList.add("is-editing"); // until the checks pass
    if (action === "edit") {
      body.innerHTML = contactBody(true);
      $("#cd-contact").focus();
      return;
    }
    if (action === "cancel") {
      body.innerHTML = contactBody();
      $('[data-fn="edit"]').focus();
      return;
    }
    const v = Object.fromEntries(contactFields.map((f) => [f.id, $(`#cd-${f.id}`).value.trim()]));
    const errors = {
      contact: v.contact ? "" : "Please enter the contact person’s name.",
      email: !v.email ? "Please enter an email address." : emailOk(v.email) ? "" : "Please enter an email address, like name@example.com.",
      phone: !v.phone ? "Please enter a phone number." : phoneOk(v.phone) ? "" : "Please enter an Australian phone number, like 0412 345 678.",
      contactOnNight: v.contactOnNight ? "" : "Please enter who we should talk to on the day.",
    };
    Object.entries(errors).forEach(([id, text]) => {
      $(`#cd-${id}-msg`).textContent = text;
      $(`#cd-${id}`).toggleAttribute("aria-invalid", !!text);
    });
    const bad = Object.keys(errors).find((id) => errors[id]);
    if (bad) { $(`#cd-${bad}`).focus(); return; }

    Object.assign(D.booking, v);
    let kept = true;
    try { sessionStorage.setItem(CONTACT_KEY, JSON.stringify(v)); } catch (e) { kept = false; }
    box.classList.remove("is-editing");
    body.innerHTML = contactBody();
    save(kept ? "Contact details saved." : "Contact details updated, but they can’t be saved in this browser.");
    $('[data-fn="edit"]').focus();
  }

  function renderForm() {
    const b = D.booking;
    const dietary = D.dietary.map((d) => `
      <div class="diet">
        ${check(`diet.${d.id}.on`, esc(d.label))}
        <div class="qty"><label for="qty-${d.id}">Qty:</label><input id="qty-${d.id}" type="number" inputmode="numeric" min="0" max="${D.booking.guests}" data-qty="${d.id}"></div>
      </div>`).join("");
    const list = (items) => items.map((html) => `<div class="line">${html}</div>`).join("");

    $("#cards").innerHTML = `
      <div class="col">
        ${card("food", "Food Packages", D.foodPackages.map(pkgRow).join(""))}
        ${card("dietary", "Dietary Accommodations", `<div class="line">${check("none.dietary", "None")}</div>${dietary}`)}
      </div>
      <div class="col">
        ${card("bev", "Beverage Options", D.beveragePackages.map(pkgRow).join(""))}
        ${card("additional", "Additional", list([check("none.additional", "None"), ...D.additional.map((a) => check(`additional.${a.id}`, a.lines.map(esc).join("<br>"), { val: a.val }))]))}
      </div>
      <div class="col col-rest">
        ${card("notes", "Notes for the Venue", `<div class="line">${check("none.notes", "None")}</div><label for="notes" class="notes-label">Anything extra you would like the Venue to know?</label><textarea id="notes" maxlength="2000"></textarea>`)}
      </div>`;
  }

  function panelFrame(id, body) {
    return fold(`id="panel-${id}" data-panel="${id}"`, `<div class="pkg-panel">${body}</div>`);
  }

  function antipastoPanel() {
    return panelFrame("antipasto", `
      <ul class="bullets"><li>${D.antipasto.note.map(esc).join("<br>")}</li></ul>
      ${D.antipasto.options.map((o) => `<div class="dish"><label class="check"><input type="radio" name="antipasto" data-k="antipasto" data-val="${o.id}"><span>${esc(o.label)}</span></label></div>`).join("")}
      ${LOCKED ? '<button type="button" class="confirm" data-confirm="antipasto">Edit Menu Selection</button>' : ""}`);
  }

  function canapesPanel() {
    const c = D.canapes;
    const dishes = c.dishes.map((d) => `
      <div class="dish">
        ${check(`canapes.dishes.${d.id}.on`, esc(d.name))}
        ${d.variants ? `<div class="opt-grid">${d.variants.map((v) => check(`canapes.dishes.${d.id}.v.${v}`, esc(v), { round: true })).join("")}</div>` : ""}
      </div>`).join("");
    return panelFrame("canapes", `
      <ul class="bullets"><li>${esc(c.intro)}</li></ul>
      <p class="panel-lead">Please choose ${c.dishCount} dishes from our menu below: <span class="panel-count" id="dish-count" aria-live="polite"></span></p>
      ${dishes}
      <button type="button" class="confirm" data-confirm="canapes">${LOCKED ? "Edit Menu Selection" : "Confirm menu selection"}</button>
      <p class="panel-msg" data-msg="canapes" role="alert"></p>`);
  }

  function drinkRow(d) {
    return `<div class="drink">${check(`bar.drinks.${d.id}`, esc(d.name))}<span>${d.price === null ? "TBC" : money(d.price)}</span></div>`;
  }

  function barSection(id, title, body) {
    return `<div class="bar-sec">
      <button type="button" class="sec-head" data-bargroup="${id}" aria-expanded="false" aria-controls="bar-${id}">
        <span class="card-title">${esc(title)}</span>
        <span class="card-sum" data-barcount="${id}"></span>
        ${chevronIcon}
      </button>
      ${fold(`id="bar-${id}"`, `<div class="sec-body">${body}</div>`)}
    </div>`;
  }

  function barTabPanel() {
    const b = D.barTab;
    return panelFrame("barTab", `
      <ul class="bullets">${b.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
      <p class="panel-lead">Please place a tick beside the drinks you would like us to serve your guests, then answer Spirits: <span class="panel-count" id="bar-count" aria-live="polite"></span></p>
      ${barSection("tap", "Tap Beers", `
        <div class="tap-scroll"><table class="tap">
          <thead><tr><td></td><th scope="col">Pot</th><th scope="col">Schooner</th><th scope="col">Pint</th></tr></thead>
          <tbody>${b.tap.map((d) => `<tr>
            <td>${check(`bar.drinks.${d.id}`, esc(d.name))}</td>
            <td class="num">${money(d.pot)}</td><td class="num">${money(d.schooner)}</td><td class="num">${money(d.pint)}</td>
          </tr>`).join("")}</tbody>
        </table></div>
        <div class="all-row">
          ${check("bar.allTap", "All Tap Beer:")}
          <div class="all-sub">
            ${check("bar.tapMode", "Pots only (excludes Kirin &amp; Estrella)", { val: "pots" })}
            ${check("bar.tapMode", "Pots &amp; Pints", { val: "both" })}
          </div>
        </div>`)}
      ${barSection("bottles", "Bottles & Cans", `
        ${b.bottles.map(drinkRow).join("")}
        <div class="all-row">${check("bar.allBottles", "All Bottles &amp; Cans")}</div>`)}
      ${barSection("wine", "Wine", `
        ${b.wines.map((g) => `<p class="drink-group">${esc(g.group)}:</p>${g.items.map(drinkRow).join("")}`).join("")}
        <div class="all-row">
          <div class="line">${check("bar.wineMode", "House Wines Only", { val: "house" })}</div>
          <div class="line">${check("bar.wineMode", "All Wines", { val: "all" })}</div>
        </div>`)}
      <div class="spirits">
        <span class="card-title">Spirits</span>
        ${check("bar.spirits", "Yes", { val: "yes" })}
        ${check("bar.spirits", "No", { val: "no" })}
      </div>
      <button type="button" class="confirm" data-confirm="barTab">${LOCKED ? "Edit Bar Tab Selection" : "Confirm Bar Tab selection"}</button>
      <p class="panel-msg" data-msg="barTab" role="alert"></p>`);
  }

  function menuPanel(p) {
    const menu = D.menus[p.id];
    const groups = menu.groups.map((g) => {
      const base = `menus.${p.id}.g.${g.id}`;
      const ask = g.optional ? "(optional)" : g.pick === 1 ? "(choose 1)" : `(choose ${g.pick})`;
      const count = g.pick > 1 ? `<span class="panel-count" data-count="${p.id}.${g.id}" aria-live="polite"></span>` : "";
      const options = g.options.map((o) => (g.pick === 1
        ? `<label class="check"><input type="radio" name="${p.id}-${g.id}" data-k="${base}" data-val="${o.id}"><span>${esc(o.label)}</span></label>`
        : check(`${base}.${o.id}`, esc(o.label)))).map((c) => `<div class="dish">${c}</div>`).join("");
      return `<p class="panel-lead">${esc(g.title)} ${ask} ${count}</p>${options}`;
    }).join("");
    return panelFrame(p.id, `
      <ul class="bullets"><li>${esc(menu.intro)}</li></ul>
      ${groups}
      <button type="button" class="confirm" data-confirm="${p.id}">${LOCKED ? "Edit Menu Selection" : "Confirm selection"}</button>
      <p class="panel-msg" data-msg="${p.id}" role="alert"></p>`);
  }

  /* ---------- Validation ---------- */

  const selectedVariants = (dish) => Object.keys(dish.v).filter((k) => dish.v[k]);

  function validateCanapes() {
    const count = D.canapes.dishes.filter((d) => state.canapes.dishes[d.id].on).length;
    if (count !== D.canapes.dishCount) {
      return `Please choose ${D.canapes.dishCount} dishes. You’ve chosen ${count}.`;
    }
    const missing = D.canapes.dishes.find((d) => {
      const s = state.canapes.dishes[d.id];
      return s.on && d.variants && selectedVariants(s).length === 0;
    });
    return missing ? `Please choose at least one option for ${missing.name.replace(/\s*\(.*|:$/g, "")}.` : null;
  }

  function validateBar() {
    const b = state.bar;
    if (b.allTap && !b.tapMode) return "Please choose Pots only or Pots & Pints for All Tap Beer.";
    const anyDrink = b.allTap || b.allBottles || b.wineMode || Object.values(b.drinks).some(Boolean);
    if (!anyDrink) return "Please tick at least one drink.";
    if (!b.spirits) return "Please choose Yes or No for spirits.";
    return null;
  }

  // Normalised picks for a sample menu, so unticked and never-ticked options compare equal.
  function menuPicks(id, g) {
    const picks = {};
    D.menus[id].groups.forEach((group) => {
      const value = g[group.id];
      picks[group.id] = group.pick === 1
        ? group.options.filter((o) => o.id === value).map((o) => o.id)
        : group.options.filter((o) => value && value[o.id]).map((o) => o.id);
    });
    return picks;
  }

  function validateMenu(id) {
    const picks = menuPicks(id, state.menus[id].g);
    const group = D.menus[id].groups.find((g) => !g.optional && picks[g.id].length !== g.pick);
    if (!group) return null;
    return group.pick === 1
      ? `Please choose an option for ${group.title.toLowerCase().replace(/\?$/, "")}.`
      : `Please choose ${group.pick} for ${group.title.toLowerCase()}. You’ve chosen ${picks[group.id].length}.`;
  }

  /* ---------- Checklist progress: the same rules as the validators above ---------- */

  function canapesProgress() {
    const done = D.canapes.dishes.filter((d) => {
      const s = state.canapes.dishes[d.id];
      return s.on && (!d.variants || selectedVariants(s).length > 0);
    }).length;
    return { done, total: D.canapes.dishCount };
  }

  function barProgress() {
    const b = state.bar;
    const drinks = !(b.allTap && !b.tapMode) && (b.allTap || b.allBottles || b.wineMode || Object.values(b.drinks).some(Boolean));
    return { done: (drinks ? 1 : 0) + (b.spirits ? 1 : 0), total: 2 };
  }

  function menuProgress(id) {
    const picks = menuPicks(id, state.menus[id].g);
    const required = D.menus[id].groups.filter((g) => !g.optional);
    return {
      done: required.reduce((sum, g) => sum + Math.min(picks[g.id].length, g.pick), 0),
      total: required.reduce((sum, g) => sum + g.pick, 0),
    };
  }

  function pkgProgress(id) {
    if (id === "canapes") return canapesProgress();
    if (id === "barTab") return barProgress();
    if (id === "antipasto") return { done: state.antipasto ? 1 : 0, total: 1 };
    return menuProgress(id);
  }

  // Needs one finished package, and every package the customer has ticked must be finished.
  function sectionProgress(list) {
    const ticked = list.filter((p) => state.pkg[p.id]);
    const done = ticked.filter((p) => {
      const { done: d, total } = pkgProgress(p.id);
      return d >= total;
    }).length;
    return { done, total: Math.max(1, ticked.length) };
  }

  /* ---------- Checklist down the side of the sections ---------- */

  const steps = ["function", "food", "dietary", "bev", "additional", "notes"];

  function stepDone(id) {
    if (id === "function") return true; // Already filled in from the booking.
    if (id === "food" || id === "bev") {
      const { done, total } = sectionProgress(id === "food" ? D.foodPackages : D.beveragePackages);
      return done >= total;
    }
    // TODO(confirm): these three now need an answer, where ticking None counts as one.
    if (getPath(`none.${id}`)) return true;
    if (id === "dietary") return D.dietary.some((d) => getPath(`diet.${d.id}.on`));
    if (id === "additional") return countOf(state.additional) > 0;
    return !!state.notes.trim();
  }

  // The line fills down to the first step still to do.
  function syncChecklist() {
    let reached = true;
    steps.forEach((id) => {
      const el = $(`[data-step="${id}"]`);
      const done = stepDone(id);
      if (!el) return; // Function Details is the box at the top, not a step card.
      el.className = `step-mark${done ? " is-done" : ""}`;
      el.innerHTML = done ? `${tickIcon}<span class="sr-only">Complete</span>` : '<span class="sr-only">Not complete yet</span>';
      reached = reached && done;
      el.parentElement.classList.toggle("is-filled", reached);
    });
    const pill = $("#checklist-pill");
    const wasComplete = pill.childElementCount > 0;
    if (reached !== wasComplete) pill.innerHTML = reached ? `<button type="button" class="pill">${tickIcon}Checklist complete - SUBMIT</button>` : "";
    publishChecklist();
  }

  // Lets the venue's booking calendar show this customer's progress. A stand-in for a real backend.
  function publishChecklist() {
    const finished = (list) => list.filter((p) => {
      if (!state.pkg[p.id]) return false;
      const { done, total } = pkgProgress(p.id);
      return done >= total;
    }).map((p) => p.label);
    const status = {
      done: steps.filter(stepDone),
      items: [...(stepDone("food") ? finished(D.foodPackages) : []), ...(stepDone("bev") ? finished(D.beveragePackages) : [])],
    };
    try {
      localStorage.setItem(STATUS_KEY, JSON.stringify(status));
    } catch (e) { /* the page still works without storage */ }
  }

  /* ---------- Short status text on rows and section headers ---------- */

  function pkgStatus(id) {
    if (!state.pkg[id]) return "";
    const option = id === "antipasto" && D.antipasto.options.find((o) => o.id === state.antipasto);
    return `${option ? `<span>${esc(option.label)}</span>` : ""}${progressMark(pkgProgress(id))}`;
  }

  const countOf = (obj) => Object.values(obj || {}).filter(Boolean).length;
  const selected = (n) => (n ? `${n} selected` : "Select");

  function syncSummaries() {
    const ticked = (list) => list.filter((p) => state.pkg[p.id]).length;
    const diets = D.dietary.filter((d) => getPath(`diet.${d.id}.on`)).map((d) => {
      const qty = getPath(`diet.${d.id}.qty`);
      return `${d.label.replace(" menu", "")}${qty != null ? ` ${qty}` : ""}`;
    });
    const sums = {
      function: `${D.booking.eventName}, ${D.booking.guests} guests`,
      // "Confirmed" once the step is finished (its tick fills); until then, how many are ticked.
      food: stepDone("food") ? "Confirmed" : selected(ticked(D.foodPackages)),
      bev: stepDone("bev") ? "Confirmed" : selected(ticked(D.beveragePackages)),
      dietary: getPath("none.dietary") ? "Confirmed" : diets.join(", ") || "Select",
      additional: getPath("none.additional") ? "Confirmed" : countOf(state.additional) ? "Confirmed" : "Select",
      notes: getPath("none.notes") ? "Confirmed" : state.notes.trim() ? "Added" : "",
    };
    $$("[data-sum]").forEach((el) => { el.textContent = sums[el.dataset.sum] || ""; });

    $$("[data-status]").forEach((el) => { el.innerHTML = pkgStatus(el.dataset.status); });

    const b = state.bar;
    const ticks = (ids) => ids.filter((id) => b.drinks[id]).length;
    const modeLabel = { pots: "All, pots only", both: "All, pots & pints" };
    const counts = {
      tap: b.allTap ? modeLabel[b.tapMode] || "All, choose size" : selected(ticks(tapIds)),
      bottles: b.allBottles ? "All" : selected(ticks(bottleIds)),
      wine: b.wineMode === "all" ? "All wines" : b.wineMode === "house" ? "House wines only" : selected(ticks(wineIds)),
    };
    $$("[data-barcount]").forEach((el) => { el.textContent = counts[el.dataset.barcount]; });

    syncChecklist();
  }

  /* ---------- Sync state to the DOM ---------- */

  function setDisabled(path, disabled) {
    $$(`[data-k="${path}"]`).forEach((el) => {
      el.disabled = disabled;
      el.closest(".check").classList.toggle("is-off", disabled);
    });
  }

  function syncDerived() {
    const c = D.canapes;
    const dishes = state.canapes.dishes;
    const count = c.dishes.filter((d) => dishes[d.id].on).length;
    const dishProgress = canapesProgress();
    const needsOption = count >= c.dishCount && dishProgress.done < c.dishCount;
    $("#dish-count").innerHTML = `${progressMark(dishProgress)}${needsOption ? "<span>Choose an option for each ticked dish.</span>" : ""}`;
    $("#bar-count").innerHTML = progressMark(barProgress());
    c.dishes.forEach((d) => {
      const s = dishes[d.id];
      setDisabled(`canapes.dishes.${d.id}.on`, !s.on && count >= c.dishCount);
      (d.variants || []).forEach((v) => {
        const full = d.maxVariants && selectedVariants(s).length >= d.maxVariants && !s.v[v];
        setDisabled(`canapes.dishes.${d.id}.v.${v}`, !s.on || !!full);
      });
    });

    menuIds.forEach((id) => {
      const picks = menuPicks(id, state.menus[id].g);
      D.menus[id].groups.filter((g) => g.pick > 1).forEach((g) => {
        const n = picks[g.id].length;
        $(`[data-count="${id}.${g.id}"]`).innerHTML = progressMark({ done: n, total: g.pick });
        g.options.forEach((o) => {
          setDisabled(`menus.${id}.g.${g.id}.${o.id}`, n >= g.pick && !picks[g.id].includes(o.id));
        });
      });
    });

    const b = state.bar;
    tapIds.forEach((id) => setDisabled(`bar.drinks.${id}`, b.allTap));
    bottleIds.forEach((id) => setDisabled(`bar.drinks.${id}`, b.allBottles));
    wineIds.forEach((id) => setDisabled(`bar.drinks.${id}`, !!b.wineMode));

    D.dietary.forEach((d) => {
      const on = !!getPath(`diet.${d.id}.on`);
      const input = $(`[data-qty="${d.id}"]`);
      input.disabled = !on;
      const qty = getPath(`diet.${d.id}.qty`);
      if (document.activeElement !== input) input.value = on && qty != null ? qty : "";
    });
  }

  // Venue's view (calendar pop-up): the customer has already chosen, so each package stays locked until the
  // venue presses Edit Menu Selection, which unlocks that package; Save Menu Selection checks it and locks it again.
  const unlocked = new Set();
  const editLabel = (id, open) => `${open ? "Save" : "Edit"} ${id === "barTab" ? "Bar Tab" : "Menu"} Selection`;
  function applyLocks() {
    if (!LOCKED) return;
    [...D.foodPackages, ...D.beveragePackages].forEach((p) => {
      const locked = !unlocked.has(p.id);
      $$(`[data-k="pkg.${p.id}"]`).forEach((el) => { el.disabled = locked; });
      const panel = $(`#panel-${p.id}`);
      if (panel) $$("input, textarea, select", panel).forEach((el) => { el.disabled = locked; });
      $$(`[data-confirm="${p.id}"]`).forEach((b) => { b.textContent = editLabel(p.id, !locked); });
      const row = $(`[data-pkg="${p.id}"]`);
      if (row) row.classList.toggle("is-locked", locked);
    });
  }

  function sync() {
    syncDerived();
    applyLocks();

    $$("[data-k]").forEach((el) => {
      const value = getPath(el.dataset.k);
      el.checked = el.dataset.val ? value === el.dataset.val : !!value;
    });

    $("#notes").value = state.notes;
    syncSummaries();

    $$("[data-card]").forEach((btn) => {
      const open = !!state.cards[btn.dataset.card];
      btn.setAttribute("aria-expanded", String(open));
      $(`#card-${btn.dataset.card}`).classList.toggle("is-open", open);
    });
    $$("[data-bargroup]").forEach((btn) => {
      const open = !!state.barOpen[btn.dataset.bargroup];
      btn.setAttribute("aria-expanded", String(open));
      $(`#bar-${btn.dataset.bargroup}`).classList.toggle("is-open", open);
    });
    $$("[data-view]").forEach((btn) => {
      btn.setAttribute("aria-expanded", String(state.open[slotOf(btn.dataset.view)] === btn.dataset.view));
    });
    $$("[data-panel]").forEach((p) => {
      p.classList.toggle("is-open", state.open[slotOf(p.dataset.panel)] === p.dataset.panel);
    });

    ["canapes", "barTab", ...menuIds].forEach((id) => {
      const el = $(`[data-msg="${id}"]`);
      const m = messages[id];
      el.textContent = m ? m.text : "";
      el.className = `panel-msg${m ? " err" : ""}`;
    });
  }

  /* ---------- Events ---------- */

  function applySideEffects(path, checked) {
    const b = state.bar;
    if (path === "bar.tapMode" && checked) b.allTap = true;
    if (path === "bar.allTap") {
      if (checked) tapIds.forEach((id) => { b.drinks[id] = false; });
      else b.tapMode = null;
    }
    if (path === "bar.allBottles" && checked) bottleIds.forEach((id) => { b.drinks[id] = false; });
    if (path === "bar.wineMode" && checked) wineIds.forEach((id) => { b.drinks[id] = false; });
    if (path === "antipasto") state.pkg.antipasto = true;

    // None and a real answer can't both stand in the same section.
    if (checked) {
      if (path === "none.dietary") state.diet = {};
      if (path === "none.additional") state.additional = {};
      if (path === "none.notes") state.notes = "";
      if (path.startsWith("diet.")) setPath("none.dietary", false);
      if (path.startsWith("additional.")) setPath("none.additional", false);
    }

    // Choosing something inside a menu counts as choosing that package.
    const inside = path.match(/^(?:canapes\.dishes|menus\.(\w+)\.g)\b/);
    if (inside && checked) state.pkg[inside[1] || "canapes"] = true;
    if (path.startsWith("bar.") && checked) state.pkg.barTab = true;

    const dishMatch = path.match(/^canapes\.dishes\.(\w+)\.on$/);
    if (dishMatch && !checked) {
      const v = state.canapes.dishes[dishMatch[1]].v;
      Object.keys(v).forEach((k) => { v[k] = false; });
    }

    const pkgMatch = path.match(/^pkg\.(\w+)$/);
    if (pkgMatch) {
      const id = pkgMatch[1];
      const slot = slotOf(id);
      if (checked) {
        state.open[slot] = id;
      } else if (state.open[slot] === id) {
        state.open[slot] = null;
      }
    }
  }

  function onChange(e) {
    const el = e.target;
    if (el.dataset.k) {
      const path = el.dataset.k;
      setPath(path, el.dataset.val ? (el.checked ? el.dataset.val : null) : el.checked);
      applySideEffects(path, el.checked);
      Object.keys(messages).forEach((id) => { messages[id] = null; });
      sync();
      save();
    }
  }

  function onInput(e) {
    const el = e.target;
    if (el.dataset.qty) {
      let qty = el.value === "" ? null : Math.floor(Number(el.value));
      if (qty !== null) qty = Math.min(Math.max(0, qty), D.booking.guests);
      setPath(`diet.${el.dataset.qty}.qty`, qty);
      syncSummaries();
      save();
    } else if (el.id === "notes") {
      state.notes = el.value;
      if (el.value.trim()) {
        setPath("none.notes", false);
        $('[data-k="none.notes"]').checked = false;
      }
      syncSummaries();
      save();
    }
  }

  function onClick(e) {
    const anchor = e.target.closest('a[href="#"]');
    if (anchor) { e.preventDefault(); return; }

    const fnBtn = e.target.closest("[data-fn]");
    if (fnBtn) { fnAction(fnBtn.dataset.fn); return; }

    // "Checklist complete - SUBMIT": tell the customer it's gone through.
    // TODO(confirm): demo only; nothing is sent to the venue yet, and what happens next (email, venue sign-off) is still to decide.
    const done = $("#submitted");
    if (e.target.closest("#checklist-pill .pill")) {
      if (done.showModal) done.showModal(); else done.setAttribute("open", "");
      $("#submitted-ok").focus();
      return;
    }
    if (e.target === done || e.target.closest("[data-close-submitted]")) {
      done.close();
      const pill = $("#checklist-pill .pill");
      if (pill) pill.focus();
      return;
    }

    const cardBtn = e.target.closest("[data-card]");
    if (cardBtn) {
      state.cards[cardBtn.dataset.card] = !state.cards[cardBtn.dataset.card];
      sync();
      save();
      return;
    }

    const barBtn = e.target.closest("[data-bargroup]");
    if (barBtn) {
      state.barOpen[barBtn.dataset.bargroup] = !state.barOpen[barBtn.dataset.bargroup];
      sync();
      save();
      return;
    }

    const view = e.target.closest("[data-view]");
    if (view) {
      const id = view.dataset.view;
      const slot = slotOf(id);
      state.open[slot] = state.open[slot] === id ? null : id;
      sync();
      save();
      return;
    }

    const confirm = e.target.closest("[data-confirm]");
    if (confirm) {
      const id = confirm.dataset.confirm;
      if (LOCKED && !unlocked.has(id)) {
        // Edit Menu Selection: unlock this package and open its menu.
        unlocked.add(id);
        state.open[slotOf(id)] = id;
        sync();
        const first = $(`#panel-${id} input:not([disabled]), #panel-${id} textarea`) || $(`[data-k="pkg.${id}"]`);
        if (first) first.focus();
        save(`${id === "barTab" ? "Bar tab" : "Menu"} unlocked for editing.`);
        return;
      }
      if (LOCKED && !state.pkg[id]) {
        // The venue unticked the package while editing: nothing to check, just lock it again.
        unlocked.delete(id);
        messages[id] = null;
        sync();
        save("Package removed.");
        return;
      }
      const error = id === "canapes" ? validateCanapes() : id === "barTab" ? validateBar()
        : id === "antipasto" ? (state.antipasto ? "" : "Please choose a platter.") : validateMenu(id);
      if (error) {
        messages[id] = { text: error };
        // The problem may be inside a closed drinks section, so show it.
        if (id === "barTab" && state.bar.allTap && !state.bar.tapMode) state.barOpen.tap = true;
        sync();
        save();
        return;
      }
      state.pkg[id] = true;
      messages[id] = null;
      state.open[slotOf(id)] = null;
      unlocked.delete(id);
      sync();
      save(LOCKED ? "Menu selection updated." : "Selection confirmed.");
      $(`[data-view="${id}"]`).focus();
      return;
    }
  }

  /* ---------- Start ---------- */

  delete state.fn; // From the earlier Function Details editor.
  if (EMBED && window.parent !== window) {
    const post = () => window.parent.postMessage({ type: "ff-checklist-height", h: document.documentElement.scrollHeight }, location.origin);
    new ResizeObserver(post).observe(document.body);
    window.addEventListener("load", post);
  }
  renderBooking();
  renderForm();
  // Enter in the Contact Details fields saves them.
  $("#booking").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.closest(".fn-edit")) { e.preventDefault(); fnAction("save"); }
  });

  document.addEventListener("change", onChange);
  document.addEventListener("input", onInput);
  document.addEventListener("click", onClick);
  $("#event-form").addEventListener("submit", (e) => e.preventDefault());
  sync();
})();
