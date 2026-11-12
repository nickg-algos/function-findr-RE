(function () {
  "use strict";

  const D = window.FF_SETUP;
  const { esc, money, parseCents } = window.FF_SHARED;
  const STORE_KEY = "ff.venueSetup.v1";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const allCats = [...D.food, ...D.beverage];
  const catById = (id) => allCats.find((c) => c.id === id);
  const groupById = (cat, id) => cat.groups.find((g) => g.id === id);
  const uid = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  /* ---------- State ---------- */

  const newRow = (name = "", custom = false) => ({ id: uid(), name, custom, added: false, avail: {}, sizes: {} });

  function initialState() {
    const cats = {};
    allCats.forEach((c) => {
      const groups = {};
      (c.groups || []).forEach((g) => { groups[g.id] = g.rows.map((name) => newRow(name)); });
      const allRows = {};
      (c.groups || []).filter((g) => g.allRow).forEach((g) => { allRows[g.id] = { ...newRow(g.allRow.name), conditions: g.allRow.conditions }; });
      cats[c.id] = { on: false, desc: "", file: null, groups, allRows, shown: {} };
    });
    return { cats };
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
  if (!Array.isArray(state.dietary)) state.dietary = []; // saved before dietary moved to this page
  // Drop-downs start closed on every visit, as on the My Bookings page.
  const open = {};
  // Food Options and Beverage Options start open so the choices are in view.
  const sectionOpen = { food: true, bev: true, diet: false };
  const secOpen = {};
  const rowMessages = {};

  const findRow = (catId, groupId, rowId) => {
    const c = state.cats[catId];
    const all = c.allRows[groupId];
    return all && all.id === rowId ? all : c.groups[groupId].find((r) => r.id === rowId);
  };

  // Food menus show one option at first; the rest wait for Add another option.
  function shownCount(catId, group) {
    const c = state.cats[catId];
    const list = c.groups[group.id];
    let n = (c.shown && c.shown[group.id]) || 1;
    list.forEach((r, i) => { if (r.added || r.custom) n = Math.max(n, i + 1); });
    return Math.min(n, list.length);
  }

  function setShown(catId, groupId, n) {
    const c = state.cats[catId];
    c.shown = { ...c.shown, [groupId]: n };
  }

  /* ---------- Add to menu rules ---------- */

  // TODO(confirm): what a venue must fill in before an option can go on the menu.
  function rowProblem(group, row, isAll) {
    if (!row.name.trim()) return "Please enter a name first.";
    if (!group.sizes) return null;
    if (isAll) return group.sizes.some((s) => row.sizes[s.id] && row.sizes[s.id].on) ? null : "Please tick at least one size.";
    const priced = group.sizes.some((s) => {
      const v = row.sizes[s.id];
      return v && v.cents !== null && v.cents !== undefined && (s.noTick || v.on);
    });
    return priced ? null : `Please enter a price${group.sizes.length > 1 ? " for at least one size" : ""}.`;
  }

  /* ---------- Markup ---------- */

  const chevronIcon = '<svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const tickIcon = '<svg class="tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const fold = (attrs, body) => `<div class="fold" ${attrs}><div class="fold-inner">${body}</div></div>`;
  const checked = (on) => (on ? " checked" : "");

  function addButton(row) {
    return row.added
      ? `<button type="button" class="vs-add is-added" data-action="toggle-add" aria-pressed="true">${tickIcon}Added</button>`
      : '<button type="button" class="vs-add" data-action="toggle-add" aria-pressed="false">Add to menu</button>';
  }

  function rowActions(row, label, removable = row.custom) {
    return `<div class="opt-actions" data-label="${esc(label)}">
      ${addButton(row)}
      ${removable ? '<button type="button" class="vs-remove" data-action="remove-row">Remove</button>' : ""}
    </div>`;
  }

  const rowMsg = (row) => `<p class="row-msg" role="alert">${esc(rowMessages[row.id] || "")}</p>`;
  const rowAttrs = (cat, group, row, isAll) => `data-cat="${cat.id}" data-group="${group.id}" data-row="${row.id}"${isAll ? ' data-all="1"' : ""}`;

  function foodRow(cat, group, row, i) {
    const label = `${group.prefix} ${i + 1}`;
    const inputId = `name-${row.id}`;
    const avail = group.avail ? `
      <p class="avail-label">Select available options:</p>
      <div class="avail">${D.availOptions.map((o) => `<label class="check"><input type="checkbox" class="round" data-f="avail" data-opt="${esc(o)}"${checked(row.avail[o])}><span>${esc(o)}</span></label>`).join("")}</div>` : "";
    return `<div class="opt" ${rowAttrs(cat, group, row)}>
      <label class="opt-label" for="${inputId}">${esc(label)}:</label>
      <div class="opt-main">
        <input class="vs-field" id="${inputId}" type="text" data-f="name" placeholder="Enter details" value="${esc(row.name)}">
        ${avail}
        ${rowMsg(row)}
      </div>
      ${rowActions(row, label, i > 0)}
    </div>`;
  }

  function sizeCell(row, size) {
    const v = row.sizes[size.id] || {};
    const hasPrice = v.cents !== null && v.cents !== undefined;
    const name = `${row.name || "Option"} ${size.label}`.trim();
    const tick = size.noTick ? "" : `<label class="size-tick"><input type="checkbox" class="round" data-f="tick" data-size="${size.id}" aria-label="Offer ${esc(name)}"${checked(v.on)}></label>`;
    const price = size.noPrice ? "" : `<input class="vs-field vs-price" type="text" inputmode="decimal" data-f="price" data-size="${size.id}" aria-label="${esc(name)} price" placeholder="$0.00" value="${hasPrice ? money(v.cents) : ""}">${size.suffix ? `<span class="price-suffix">${esc(size.suffix)}</span>` : ""}`;
    return `<div class="size-cell"><span class="size-tag">${esc(size.label)}</span>${tick}${price}</div>`;
  }

  function drinkRow(cat, group, row, sizes, isAll) {
    return `<div class="drink-opt" ${rowAttrs(cat, group, row, isAll)}>
      <input class="vs-field" type="text" data-f="name" aria-label="Drink name" placeholder="Enter details" value="${esc(row.name)}">
      ${sizes.map((s) => sizeCell(row, s)).join("")}
      ${rowActions(row, row.name)}
      ${rowMsg(row)}
    </div>`;
  }

  function groupBody(cat, group) {
    const c = state.cats[cat.id];
    const list = c.groups[group.id];
    if (!group.sizes) {
      return `${list.slice(0, shownCount(cat.id, group)).map((row, i) => foodRow(cat, group, row, i)).join("")}${addOption(cat, group)}`;
    }
    const all = c.allRows[group.id];
    const head = group.sizes.length > 1 || group.sizes[0].noTick ? `<div class="drink-head" aria-hidden="true"><span></span>${group.sizes.map((s) => `<span>${esc(s.label)}${s.noTick ? "" : " price"}</span>`).join("")}<span></span></div>` : "";
    const allSizes = group.sizes.map((s) => ({ ...s, noPrice: true }));
    return `<div class="drink-table" style="--sizes:${group.sizes.length}">
      ${head}
      ${list.map((row) => drinkRow(cat, group, row, group.sizes)).join("")}
      ${addOption(cat, group)}
      ${all ? `${drinkRow(cat, group, all, allSizes, true)}
        <div class="conditions">
          <label for="cond-${all.id}">Any exclusions or conditions:</label>
          <input class="vs-field" id="cond-${all.id}" type="text" data-conditions="${cat.id}.${group.id}" value="${esc(all.conditions)}">
        </div>` : ""}
    </div>`;
  }

  const addOption = (cat, group) => `<div class="add-row"><button type="button" class="vs-pill" data-add-option="${cat.id}.${group.id}">Add another option</button></div>`;

  function uploadBlock(cat) {
    const file = state.cats[cat.id].file;
    return `<div class="upload-row">
      <button type="button" class="vs-pill vs-upload" data-upload="${cat.id}">Upload menu ${chevronIcon}</button>
      <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.docx" data-file="${cat.id}" aria-label="Upload a menu for ${esc(cat.label)}">
      <p class="upload-hint">${esc(D.uploadHint)}</p>
      ${file ? `<p class="upload-file">${tickIcon}<span>${esc(file)}</span> <button type="button" class="vs-remove" data-remove-file="${cat.id}">Remove</button></p>` : ""}
      <p class="row-msg" role="alert" data-file-msg="${cat.id}"></p>
    </div>`;
  }

  function catBody(cat) {
    const c = state.cats[cat.id];
    const desc = cat.descLabel ? `<div class="desc">
        <label for="desc-${cat.id}">${esc(cat.descLabel)}</label>
        <textarea class="vs-field" id="desc-${cat.id}" rows="3" data-desc="${cat.id}" placeholder="${esc(cat.descEg)}">${esc(c.desc)}</textarea>
      </div>` : "";
    const groups = (cat.groups || []).map((g) => {
      if (!g.collapsible) return groupBody(cat, g);
      const key = `${cat.id}.${g.id}`;
      return `<div class="vs-sec">
        <button type="button" class="sec-head" data-sec="${key}" aria-expanded="${!!secOpen[key]}" aria-controls="sec-${cat.id}-${g.id}">
          <span class="card-title">${esc(g.title)}</span>
          <span class="card-sum" data-secsum="${key}"></span>
          ${chevronIcon}
        </button>
        <div class="fold${secOpen[key] ? " is-open" : ""}" id="sec-${cat.id}-${g.id}"><div class="fold-inner">${groupBody(cat, g)}</div></div>
      </div>`;
    }).join("");
    const note = cat.priceNote ? `<p class="price-note">${esc(cat.priceNote)}</p>` : "";
    return `${cat.upload ? uploadBlock(cat) : ""}${desc}${note}${groups}`;
  }

  function catBlock(cat) {
    const c = state.cats[cat.id];
    if (cat.plain) {
      return `<div class="cat"><div class="cat-head"><label class="check"><input type="checkbox" data-cat-on="${cat.id}"${checked(c.on)}><span>${esc(cat.label)}</span></label></div></div>`;
    }
    return `<div class="cat" data-catblock="${cat.id}">
      <div class="cat-head">
        <label class="check"><input type="checkbox" data-cat-on="${cat.id}"${checked(c.on)}><span>${esc(cat.label)}</span></label>
        <span class="card-sum" data-catsum="${cat.id}"></span>
        <button type="button" class="toggle" data-cat-toggle="${cat.id}" aria-expanded="false" aria-controls="cat-${cat.id}" aria-label="${esc(cat.label)} settings">${chevronIcon}</button>
      </div>
      ${fold(`id="cat-${cat.id}"`, `<div class="cat-body" data-catbody="${cat.id}">${catBody(cat)}</div>`)}
    </div>`;
  }

  function render() {
    $("#setup-intro").textContent = D.intro;
    $("#diet-list").innerHTML = D.dietary.map((o) => `<label class="check"><input type="checkbox" data-diet value="${esc(o)}"${state.dietary.includes(o) ? " checked" : ""}><span>${esc(o)}</span></label>`).join("");
    $("#food-list").innerHTML = D.food.map(catBlock).join("");
    $("#bev-list").innerHTML = D.beverage.map(catBlock).join("");
  }

  function rerenderCat(catId) {
    $(`[data-catbody="${catId}"]`).innerHTML = catBody(catById(catId));
  }

  /* ---------- Sync state to the DOM ---------- */

  const addedCount = (catId) => {
    const c = state.cats[catId];
    return [...Object.values(c.groups).flat(), ...Object.values(c.allRows)].filter((r) => r.added).length;
  };

  function sync() {
    const sections = { food: D.food, bev: D.beverage };
    Object.keys(sections).forEach((key) => {
      const isOpen = sectionOpen[key];
      $(`[data-section-toggle="${key}"]`).setAttribute("aria-expanded", String(isOpen));
      $(`#${key}-fold`).classList.toggle("is-open", isOpen);
      const n = sections[key].filter((cat) => state.cats[cat.id].on).length;
      $(`[data-section-sum="${key}"]`).textContent = n ? `${n} selected` : "";
    });
    // Dietary Accommodations: what's ticked, or "Select an option".
    $('[data-section-toggle="diet"]').setAttribute("aria-expanded", String(sectionOpen.diet));
    $("#diet-fold").classList.toggle("is-open", sectionOpen.diet);
    const diet = state.dietary;
    const dietSum = $('[data-section-sum="diet"]');
    dietSum.textContent = !diet.length ? "Select an option" : diet.length > 2 ? `${diet.length} selected` : diet.join(", ");
    dietSum.classList.toggle("is-set", diet.length > 0);
    allCats.filter((cat) => !cat.plain).forEach((cat) => {
      const isOpen = !!open[cat.id];
      $(`[data-cat-toggle="${cat.id}"]`).setAttribute("aria-expanded", String(isOpen));
      $(`#cat-${cat.id}`).classList.toggle("is-open", isOpen);
      const c = state.cats[cat.id];
      const n = addedCount(cat.id);
      const parts = [];
      if (c.file) parts.push("Menu uploaded");
      if (n) parts.push(`${n} added`);
      $(`[data-catsum="${cat.id}"]`).textContent = parts.join(", ");
    });
    $$("[data-secsum]").forEach((el) => {
      const [catId, groupId] = el.dataset.secsum.split(".");
      const c = state.cats[catId];
      const n = [...c.groups[groupId], ...(c.allRows[groupId] ? [c.allRows[groupId]] : [])].filter((r) => r.added).length;
      el.textContent = n ? `${n} added` : "";
    });
    $$("[data-sec]").forEach((btn) => {
      const isOpen = !!secOpen[btn.dataset.sec];
      const [catId, groupId] = btn.dataset.sec.split(".");
      btn.setAttribute("aria-expanded", String(isOpen));
      $(`#sec-${catId}-${groupId}`).classList.toggle("is-open", isOpen);
    });
  }

  function refreshRowUi(el, cat, group, row, isAll) {
    // An option that no longer meets the rules comes back off the menu.
    if (row.added && rowProblem(group, row, isAll)) row.added = false;
    const holder = el.closest("[data-row]");
    const btn = $('[data-action="toggle-add"]', holder);
    btn.outerHTML = addButton(row);
    $(".row-msg", holder).textContent = rowMessages[row.id] || "";
  }

  /* ---------- Events ---------- */

  function setPriceError(input, bad) {
    input.classList.toggle("is-invalid", bad);
    if (bad) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function onRowField(el) {
    const holder = el.closest("[data-row]");
    if (!holder) return false;
    const { cat: catId, group: groupId, row: rowId, all } = holder.dataset;
    const cat = catById(catId);
    const group = groupById(cat, groupId);
    const row = findRow(catId, groupId, rowId);
    const f = el.dataset.f;
    if (f === "name") row.name = el.value;
    if (f === "avail") row.avail[el.dataset.opt] = el.checked;
    if (f === "tick") row.sizes[el.dataset.size] = { cents: null, ...row.sizes[el.dataset.size], on: el.checked };
    if (f === "price") {
      const size = el.dataset.size;
      const blank = el.value.trim() === "";
      const cents = blank ? null : parseCents(el.value);
      const bad = !blank && cents === null;
      setPriceError(el, bad);
      rowMessages[row.id] = bad ? "Please enter a price like $5.80." : "";
      row.sizes[size] = { ...row.sizes[size], cents };
      if (!bad && !blank) {
        el.value = money(cents);
        // Entering a price means the size is on offer.
        row.sizes[size].on = true;
        const tick = $(`[data-f="tick"][data-size="${size}"]`, holder);
        if (tick) tick.checked = true;
      }
    } else {
      rowMessages[row.id] = "";
    }
    refreshRowUi(el, cat, group, row, !!all);
    sync();
    save();
    return true;
  }

  function onChange(e) {
    const el = e.target;
    if (el.hasAttribute("data-diet")) {
      state.dietary = $$("[data-diet]").filter((c) => c.checked).map((c) => c.value);
      sync();
      save();
      return;
    }
    if (el.dataset.catOn) {
      const id = el.dataset.catOn;
      state.cats[id].on = el.checked;
      if (!catById(id).plain) open[id] = el.checked;
      sync();
      save();
      return;
    }
    if (el.dataset.file) {
      const id = el.dataset.file;
      const file = el.files[0];
      if (!file) return;
      const ext = file.name.split(".").pop().toLowerCase();
      if (!D.uploadTypes.includes(ext)) {
        el.value = "";
        $(`[data-file-msg="${id}"]`).textContent = "Please choose a PDF, JPG, PNG or DOCX file.";
        return;
      }
      // Mockup only: the file name is kept, the file itself goes nowhere.
      state.cats[id].file = file.name;
      state.cats[id].on = true;
      $(`[data-cat-on="${id}"]`).checked = true;
      rerenderCat(id);
      sync();
      save();
      return;
    }
    if (el.dataset.f === "avail" || el.dataset.f === "tick" || el.dataset.f === "price") onRowField(el);
  }

  function onInput(e) {
    const el = e.target;
    if (el.dataset.f === "name") { onRowField(el); return; }
    if (el.dataset.desc) {
      state.cats[el.dataset.desc].desc = el.value;
      save();
    }
    if (el.dataset.conditions) {
      const [catId, groupId] = el.dataset.conditions.split(".");
      state.cats[catId].allRows[groupId].conditions = el.value;
      save();
    }
  }

  function onClick(e) {
    if (e.target.closest('a[href="#"]')) { e.preventDefault(); return; }

    const sectionToggle = e.target.closest("[data-section-toggle]");
    if (sectionToggle) {
      const key = sectionToggle.dataset.sectionToggle;
      sectionOpen[key] = !sectionOpen[key];
      sync();
      return;
    }

    const catToggle = e.target.closest("[data-cat-toggle]");
    if (catToggle) {
      open[catToggle.dataset.catToggle] = !open[catToggle.dataset.catToggle];
      sync();
      return;
    }

    const sec = e.target.closest("[data-sec]");
    if (sec) {
      secOpen[sec.dataset.sec] = !secOpen[sec.dataset.sec];
      sync();
      return;
    }

    const addOpt = e.target.closest("[data-add-option]");
    if (addOpt) {
      const [catId, groupId] = addOpt.dataset.addOption.split(".");
      const group = groupById(catById(catId), groupId);
      const list = state.cats[catId].groups[groupId];
      const shown = group.sizes ? list.length : shownCount(catId, group);
      if (shown === list.length) list.push(newRow("", true));
      if (!group.sizes) setShown(catId, groupId, shown + 1);
      const row = list[shown];
      rerenderCat(catId);
      sync();
      save();
      $(`[data-row="${row.id}"] [data-f="name"]`).focus();
      return;
    }

    const upload = e.target.closest("[data-upload]");
    if (upload) {
      $(`[data-file="${upload.dataset.upload}"]`).click();
      return;
    }

    const removeFile = e.target.closest("[data-remove-file]");
    if (removeFile) {
      const id = removeFile.dataset.removeFile;
      state.cats[id].file = null;
      rerenderCat(id);
      sync();
      save();
      $(`[data-upload="${id}"]`).focus();
      return;
    }

    const action = e.target.closest("[data-action]");
    if (!action) return;
    const holder = action.closest("[data-row]");
    const { cat: catId, group: groupId, row: rowId, all } = holder.dataset;
    const cat = catById(catId);
    const group = groupById(cat, groupId);
    const row = findRow(catId, groupId, rowId);

    if (action.dataset.action === "remove-row") {
      const list = state.cats[catId].groups[groupId];
      if (!group.sizes) setShown(catId, groupId, Math.max(1, shownCount(catId, group) - 1));
      list.splice(list.indexOf(row), 1);
      rerenderCat(catId);
      sync();
      save();
      $(`[data-add-option="${catId}.${groupId}"]`).focus();
      return;
    }

    if (row.added) {
      row.added = false;
    } else {
      const problem = rowProblem(group, row, !!all);
      rowMessages[row.id] = problem || "";
      if (!problem) {
        row.added = true;
        state.cats[catId].on = true;
        $(`[data-cat-on="${catId}"]`).checked = true;
      }
    }
    refreshRowUi(action, cat, group, row, !!all);
    sync();
    save();
    $('[data-action="toggle-add"]', holder).focus();
  }

  /* ---------- Start ---------- */

  render();
  document.addEventListener("change", onChange);
  document.addEventListener("input", onInput);
  document.addEventListener("click", onClick);
  $("#setup-form").addEventListener("submit", (e) => e.preventDefault());
  sync();
})();
