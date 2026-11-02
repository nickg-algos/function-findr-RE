(function () {
  "use strict";

  const D = window.FF_DATA;
  const STORE_KEY = "ff.myBookings.v2";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const money = (cents) => (cents === null ? "n/a" : "$" + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  const clone = (o) => JSON.parse(JSON.stringify(o));

  const tapIds = D.barTab.tap.map((d) => d.id);
  const bottleIds = D.barTab.bottles.map((d) => d.id);
  const wineItems = D.barTab.wines.flatMap((g) => g.items);
  const wineIds = wineItems.map((d) => d.id);
  const packages = [...D.foodPackages, ...D.beveragePackages];

  /* ---------- State ---------- */

  function initialState() {
    const dishes = {};
    D.canapes.dishes.forEach((d) => {
      const picked = D.initial.dishes[d.id];
      const v = {};
      (d.variants || []).forEach((name) => { v[name] = !!picked && picked.includes(name); });
      dishes[d.id] = { on: !!picked, v };
    });
    const drinks = {};
    [...tapIds, ...bottleIds, ...wineIds].forEach((id) => { drinks[id] = D.initial.drinks.includes(id); });
    return {
      detailsOpen: true,
      open: { food: "canapes", bev: "barTab" },
      antipastoOpen: true,
      pkg: { canapes: true, antipasto: true },
      menus: Object.fromEntries(Object.keys(D.menus).map((id) => [id, { g: {}, confirmed: null }])),
      canapes: { dishes, confirmed: clone(dishes) },
      antipasto: D.initial.antipasto,
      diet: {},
      bar: {
        drinks,
        allTap: D.initial.allTap,
        tapMode: null,
        allBottles: false,
        wineMode: null,
        spirits: D.initial.spirits,
        confirmed: null,
      },
      additional: {},
      facilities: {},
      ageAck: false,
      notes: "",
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage blocked or corrupt: start from the defaults */ }
    return initialState();
  }

  let saveTimer;
  function save() {
    let saved = false;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      saved = true;
    } catch (e) { /* the page still works without storage */ }
    const el = $("#save-state");
    el.textContent = saved ? "Your changes are saved in this browser." : "Your changes can’t be saved in this browser.";
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

  const chevronIcon = '<svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function pkgRow(p, slot) {
    const controls = p.inline ? "antipasto-options" : `panel-${p.id}`;
    return `<div class="pkg" data-pkg="${p.id}">
      <div class="pkg-row">
        ${check(`pkg.${p.id}`, esc(p.label))}
        <button type="button" class="view-menu" data-view="${p.id}" data-slot="${slot}" aria-expanded="false" aria-controls="${controls}" aria-label="View menu: ${esc(p.label)}">View menu ${chevronIcon}</button>
      </div>
      <div class="pkg-extra" data-extra="${p.id}"></div>
    </div>`;
  }

  function renderBooking() {
    const b = D.booking;
    $("#booking").innerHTML = `
      <div class="booking-top">
        <img class="booking-photo" src="assets/space.jpg" alt="${esc(b.space)} with round timber tables and stools">
        <div class="booking-info">
          <h2>${esc(b.venue)}</h2>
          <div class="info-row">
            <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M24 7c-6.6 0-12 5.2-12 11.7C12 27.4 24 41 24 41s12-13.6 12-22.3C36 12.200 30.600 7 24 7zm0 16a4.500 4.500 0 1 1 0-9 4.500 4.500 0 0 1 0 9z" transform="translate(-6 0) scale(.75)"/></svg>
            <div><p>${b.addressLines.map(esc).join("<br>")}</p><p>${esc(b.space)}</p></div>
          </div>
          <div class="info-row">
            <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="9" width="32" height="28" rx="5"/><path d="M5 18h32M13 5v7M29 5v7M12 25h3M20 25h3M12 31h3"/><circle cx="35" cy="34" r="8" fill="#fff"/><path d="M35 29v5l3 2"/></svg>
            <div><p>${b.dateLines.map(esc).join("<br>")}</p><p>${esc(b.time)}</p></div>
          </div>
          <div class="info-row">
            <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="15" cy="13" r="5"/><circle cx="33" cy="13" r="5"/><path d="M7 41V27c0-4 3-7 8-7s8 3 8 7v14M25 41V27c0-4 3-7 8-7s8 3 8 7v14M12 41V29M18 41V29M30 41V29M36 41V29"/></svg>
            <div><p>${esc(b.guests)} Guests<br>${esc(b.layout)}</p></div>
          </div>
        </div>
      </div>
      <dl class="booking-fields">
        <div class="field-row"><div><dt>Event name:</dt><dd>${esc(b.eventName)}</dd></div></div>
        <div class="field-row"><div><dt>Contact person:</dt><dd>${esc(b.contact)}</dd></div><div><dt>Phone number:</dt><dd>${esc(b.phone)}</dd></div></div>
        <div class="field-row"><div><dt>Email:</dt><dd>${esc(b.email)}</dd></div></div>
      </dl>`;
  }

  function renderForm() {
    $("#form-col").innerHTML = `
      <div class="cat">
        <div class="cat-title">Event options</div>
        <div>
          <div class="sub" id="sec-food">
            <div class="sub-title">Food Packages</div>
            <div>${D.foodPackages.map((p) => pkgRow(p, "food")).join("")}</div>
          </div>
          <div class="sub">
            <div class="sub-title">Dietary Accommodations</div>
            <div class="diet-grid">${D.dietary.map((d) => `
              <div class="diet">
                ${check(`diet.${d.id}.on`, esc(d.label))}
                <div class="qty"><label for="qty-${d.id}">Qty:</label><input id="qty-${d.id}" type="number" inputmode="numeric" min="0" max="${D.booking.guests}" data-qty="${d.id}"></div>
              </div>`).join("")}
            </div>
          </div>
          <div class="sub" id="sec-bev">
            <div class="sub-title">Beverage Options</div>
            <div>${D.beveragePackages.map((p) => pkgRow(p, "bev")).join("")}</div>
          </div>
          <div class="sub">
            <div class="sub-title">Additional</div>
            <div class="stack">${D.additional.map((a) => check(`additional.${a.id}`, a.lines.map(esc).join("<br>"), { val: a.val })).join("")}</div>
          </div>
        </div>
      </div>
      <div class="cat">
        <div class="cat-title">Facilities</div>
        <div class="plain-body two-col">${D.facilities.map((f) => check(`facilities.${f.id}`, esc(f.label))).join("")}</div>
      </div>
      <div class="cat">
        <div class="cat-title">Accessibility</div>
        <ul class="plain-body two-col struck dot-list" aria-label="Not available at this space">${D.accessibility.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
      </div>
      <div class="cat">
        <div class="cat-title">Age restrictions</div>
        <div class="plain-body">${check("ageAck", "Acknowledgement that guests under 18 must be accompanied by a parent or guardian")}</div>
      </div>
      <div class="cat">
        <div class="cat-title">Cancellation and booking flexibility</div>
        <ul class="plain-body two-col dot-list">${D.flexibility.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
      </div>
      <div class="notes-field">
        <label for="notes">Anything extra you would like the Venue to know?</label>
        <textarea id="notes" maxlength="2000"></textarea>
      </div>
      <p class="terms">Please refer to all <a href="#"><u>Terms &amp; Conditions</u></a>.</p>
      <p class="save-state" id="save-state" role="status"></p>`;

    $('[data-extra="antipasto"]').innerHTML = `
      <div class="inline-options" id="antipasto-options">
        <ul class="bullets"><li>${D.antipasto.note.map(esc).join("<br>")}</li></ul>
        ${D.antipasto.options.map((o) => `<label class="check"><input type="radio" name="antipasto" data-k="antipasto" data-val="${o.id}"><span>${esc(o.label)}</span></label>`).join("")}
      </div>`;
  }

  function panelFrame(id, title, body) {
    return `<div class="panel" id="panel-${id}" data-panel="${id}">
      <button type="button" class="panel-close" data-close="${id}" aria-label="Close ${esc(title)} menu">×</button>
      <h3 tabindex="-1">${esc(title)}</h3>
      ${body}
    </div>`;
  }

  function canapesPanel() {
    const c = D.canapes;
    const dishes = c.dishes.map((d) => `
      <div class="dish">
        ${check(`canapes.dishes.${d.id}.on`, esc(d.name))}
        ${d.variants ? `<div class="opt-grid">${d.variants.map((v) => check(`canapes.dishes.${d.id}.v.${v}`, esc(v), { round: true })).join("")}</div>` : ""}
      </div>`).join("");
    return panelFrame("canapes", c.title, `
      <ul class="bullets"><li>${esc(c.intro)}</li></ul>
      <p class="panel-lead">Please choose ${c.dishCount} dishes from our menu below: <span class="panel-count" id="dish-count" aria-live="polite"></span></p>
      ${dishes}
      <button type="button" class="confirm" data-confirm="canapes">Confirm menu selection</button>
      <p class="panel-msg" data-msg="canapes" role="alert"></p>`);
  }

  function drinkRow(d) {
    return `<div class="drink">${check(`bar.drinks.${d.id}`, esc(d.name))}<span>${d.price === null ? "TBC" : money(d.price)}</span></div>`;
  }

  function barTabPanel() {
    const b = D.barTab;
    return panelFrame("barTab", "Bar Tab", `
      <ul class="bullets">${b.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
      <p>Please place a tick beside the drinks you would like us to serve your guests:</p>
      <p class="drink-group">Tap Beers:</p>
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
      </div>
      <p class="drink-group">Bottles &amp; Cans:</p>
      ${b.bottles.map(drinkRow).join("")}
      <div class="all-row">${check("bar.allBottles", "All Bottles &amp; Cans")}</div>
      ${b.wines.map((g) => `<p class="drink-group">${esc(g.group)}:</p>${g.items.map(drinkRow).join("")}`).join("")}
      <div class="all-row">
        ${check("bar.wineMode", "House Wines Only", { val: "house" })}
        <div style="margin-top:.4rem">${check("bar.wineMode", "All Wines", { val: "all" })}</div>
      </div>
      <p class="drink-group">Spirits</p>
      <div class="all-sub" style="margin-left:0">
        ${check("bar.spirits", "Yes", { val: "yes" })}
        ${check("bar.spirits", "No", { val: "no" })}
      </div>
      <button type="button" class="confirm" data-confirm="barTab">Confirm Bar Tab selection</button>
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
    return panelFrame(p.id, p.label, `
      <ul class="bullets"><li>${esc(menu.intro)}</li></ul>
      ${groups}
      <button type="button" class="confirm" data-confirm="${p.id}">Confirm selection</button>
      <p class="panel-msg" data-msg="${p.id}" role="alert"></p>`);
  }

  function renderPanels() {
    const panel = (p) => (p.id === "canapes" ? canapesPanel() : p.id === "barTab" ? barTabPanel() : menuPanel(p));
    const food = D.foodPackages.filter((p) => !p.inline).map(panel).join("");
    const bev = D.beveragePackages.map(panel).join("");
    $("#panel-col").innerHTML = `<div class="panel-host" id="host-food">${food}</div><div class="panel-host" id="host-bev">${bev}</div>`;
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

  /* ---------- Summaries on the left column ---------- */

  function menuSummary(id) {
    if (!state.pkg[id]) return "";
    const conf = state.menus[id].confirmed;
    if (!conf) return '<p class="hint">Choose your options in the menu, then confirm.</p>';
    const lines = D.menus[id].groups
      .filter((g) => conf[g.id].length)
      .map((g) => {
        const names = g.options.filter((o) => conf[g.id].includes(o.id)).map((o) => o.label);
        return `<li><strong>${esc(g.title)}:</strong> ${esc(names.join(", "))}</li>`;
      });
    return `<ul class="summary">${lines.join("")}</ul>`;
  }

  function canapesSummary() {
    const conf = state.canapes.confirmed;
    if (!state.pkg.canapes) return "";
    if (!conf) return '<p class="hint">Choose your dishes in the menu, then confirm.</p>';
    const items = D.canapes.dishes.filter((d) => conf[d.id] && conf[d.id].on).map((d) => {
      const picked = selectedVariants(conf[d.id]);
      return `<li>${esc(d.name)}${picked.length ? `<br><span class="picked">${esc(picked.join(", "))}</span>` : ""}</li>`;
    });
    return `<ul class="summary">${items.join("")}</ul>`;
  }

  function barSummary() {
    const conf = state.bar.confirmed;
    if (!state.pkg.barTab) return "";
    if (!conf) return '<p class="hint">Choose your drinks in the menu, then confirm.</p>';
    const names = (list) => list.filter((d) => conf.drinks[d.id]).map((d) => d.name).join(", ");
    const lines = [];
    const modeLabel = { pots: "pots only (excludes Kirin & Estrella)", both: "pots & pints" };
    const tap = conf.allTap ? `All tap beer, ${modeLabel[conf.tapMode]}` : names(D.barTab.tap);
    const bottles = conf.allBottles ? "All bottles & cans" : names(D.barTab.bottles);
    const wines = conf.wineMode === "all" ? "All wines" : conf.wineMode === "house" ? "House wines only" : names(wineItems);
    if (tap) lines.push(["Tap beer", tap]);
    if (bottles) lines.push(["Bottles & cans", bottles]);
    if (wines) lines.push(["Wine", wines]);
    lines.push(["Spirits", conf.spirits === "yes" ? "Yes" : "No"]);
    return `<ul class="summary">${lines.map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(v)}</li>`).join("")}</ul>`;
  }

  const barDraft = () => {
    const { confirmed, ...draft } = state.bar;
    return draft;
  };
  const isDirty = {
    ...Object.fromEntries(menuIds.map((id) => [id, () => {
      const m = state.menus[id];
      return !!m.confirmed && JSON.stringify(menuPicks(id, m.g)) !== JSON.stringify(m.confirmed);
    }])),
    canapes: () => !!state.canapes.confirmed && JSON.stringify(state.canapes.dishes) !== JSON.stringify(state.canapes.confirmed),
    barTab: () => {
      if (!state.bar.confirmed) return false;
      return JSON.stringify(barDraft()) !== JSON.stringify(state.bar.confirmed);
    },
  };

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
    $("#dish-count").textContent = `${count} of ${c.dishCount}`;
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
        $(`[data-count="${id}.${g.id}"]`).textContent = `${n} of ${g.pick}`;
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

  function sync() {
    syncDerived();

    $$("[data-k]").forEach((el) => {
      const value = getPath(el.dataset.k);
      el.checked = el.dataset.val ? value === el.dataset.val : !!value;
    });

    $("#notes").value = state.notes;
    $('[data-extra="canapes"]').innerHTML = canapesSummary();
    $('[data-extra="barTab"]').innerHTML = barSummary();
    menuIds.forEach((id) => { $(`[data-extra="${id}"]`).innerHTML = menuSummary(id); });
    $("#antipasto-options").hidden = !state.antipastoOpen;

    $$("[data-view]").forEach((btn) => {
      const id = btn.dataset.view;
      const open = id === "antipasto"
        ? !$("#antipasto-options").hidden
        : state.open[btn.dataset.slot] === id;
      btn.setAttribute("aria-expanded", String(open));
    });
    $$("[data-panel]").forEach((p) => {
      p.hidden = state.open.food !== p.dataset.panel && state.open.bev !== p.dataset.panel;
    });

    ["canapes", "barTab", ...menuIds].forEach((id) => {
      const el = $(`[data-msg="${id}"]`);
      const m = messages[id];
      const stale = isDirty[id]() && !m;
      el.textContent = m ? m.text : stale ? "You’ve made changes. Confirm to update your selection." : "";
      el.className = `panel-msg${m ? (m.ok ? " ok" : " err") : ""}`;
    });

    const toggle = $("#details-toggle");
    toggle.setAttribute("aria-expanded", String(state.detailsOpen));
    $("#details-body").hidden = !state.detailsOpen;

    layoutPanels();
  }

  /* Wide screens: panels sit beside the section that opened them, as in the mockup.
     Narrow screens: each panel drops down directly under its package. */
  const narrow = window.matchMedia("(max-width: 1100px)");

  function layoutPanels() {
    const hostFood = $("#host-food");
    const hostBev = $("#host-bev");
    const secFood = $("#sec-food");
    const secBev = $("#sec-bev");
    hostFood.hidden = !state.open.food;
    hostBev.hidden = !state.open.bev;

    if (narrow.matches) {
      [[hostFood, state.open.food], [hostBev, state.open.bev]].forEach(([host, id]) => {
        const row = id && $(`[data-pkg="${id}"]`);
        if (row && host.previousElementSibling !== row) row.after(host);
      });
      hostFood.style.marginTop = hostBev.style.marginTop = "";
      return;
    }

    const col = $("#panel-col");
    if (hostFood.parentElement !== col) col.append(hostFood, hostBev);
    if (!state.detailsOpen) return;
    const top = col.getBoundingClientRect().top;
    hostFood.style.marginTop = `${Math.max(0, secFood.getBoundingClientRect().top - top)}px`;
    const after = state.open.food ? hostFood.getBoundingClientRect().bottom : top;
    hostBev.style.marginTop = `${Math.max(state.open.food ? 24 : 0, secBev.getBoundingClientRect().top - after)}px`;
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
    if (path === "pkg.antipasto") state.antipastoOpen = checked;

    const dishMatch = path.match(/^canapes\.dishes\.(\w+)\.on$/);
    if (dishMatch && !checked) {
      const v = state.canapes.dishes[dishMatch[1]].v;
      Object.keys(v).forEach((k) => { v[k] = false; });
    }

    const pkgMatch = path.match(/^pkg\.(\w+)$/);
    if (pkgMatch && pkgMatch[1] !== "antipasto") {
      const id = pkgMatch[1];
      const slot = D.foodPackages.some((p) => p.id === id) ? "food" : "bev";
      if (checked) {
        state.open[slot] = id;
      } else {
        if (state.open[slot] === id) state.open[slot] = null;
        if (id === "canapes") state.canapes.confirmed = null;
        else if (id === "barTab") state.bar.confirmed = null;
        else state.menus[id].confirmed = null;
      }
    }
  }

  function focusPanel(id) {
    const heading = $(`#panel-${id} h3`);
    if (heading) heading.focus();
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
      save();
    } else if (el.id === "notes") {
      state.notes = el.value;
      save();
    }
  }

  function onClick(e) {
    const anchor = e.target.closest('a[href="#"]');
    if (anchor) { e.preventDefault(); return; }

    const view = e.target.closest("[data-view]");
    if (view) {
      const id = view.dataset.view;
      if (id === "antipasto") {
        state.antipastoOpen = !state.antipastoOpen;
      } else {
        const slot = view.dataset.slot;
        const opening = state.open[slot] !== id;
        state.open[slot] = opening ? id : null;
        sync();
        save();
        if (opening) focusPanel(id);
        return;
      }
      sync();
      save();
      return;
    }

    const close = e.target.closest("[data-close]");
    if (close) {
      const id = close.dataset.close;
      const slot = state.open.food === id ? "food" : "bev";
      state.open[slot] = null;
      sync();
      save();
      const opener = $(`[data-view="${id}"]`);
      if (opener) opener.focus();
      return;
    }

    const confirm = e.target.closest("[data-confirm]");
    if (confirm) {
      const id = confirm.dataset.confirm;
      const error = id === "canapes" ? validateCanapes() : id === "barTab" ? validateBar() : validateMenu(id);
      if (error) {
        messages[id] = { text: error, ok: false };
      } else {
        if (id === "canapes") state.canapes.confirmed = clone(state.canapes.dishes);
        else if (id === "barTab") state.bar.confirmed = clone(barDraft());
        else state.menus[id].confirmed = menuPicks(id, state.menus[id].g);
        state.pkg[id] = true;
        messages[id] = { text: "Selection confirmed.", ok: true };
      }
      sync();
      save();
      return;
    }

    if (e.target.closest("#details-toggle")) {
      state.detailsOpen = !state.detailsOpen;
      sync();
      save();
    }
  }

  /* ---------- Start ---------- */

  renderBooking();
  renderForm();
  renderPanels();

  document.addEventListener("change", onChange);
  document.addEventListener("input", onInput);
  document.addEventListener("click", onClick);
  $("#event-form").addEventListener("submit", (e) => e.preventDefault());
  narrow.addEventListener("change", layoutPanels);
  window.addEventListener("resize", layoutPanels);
  if (window.ResizeObserver) new ResizeObserver(layoutPanels).observe($("#form-col"));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutPanels);
  sync();
})();
