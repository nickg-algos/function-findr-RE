// "Hi …, let’s set up your function space…" (V42 mockup page 12, the site's p18): a venue describes a
// function space, with every section open down the page as in the mockup. DEMO ONLY: nothing is sent.
// Spaces are kept in this tab (sessionStorage ff.venueSpaces.v1) in the same shape venue-data.js uses,
// ready for the listing preview (page 20). The venue name comes from sign-up (ff.venueSignup.v1).
// Menus uploaded here are kept like p19's (localStorage ff.venueMenus.v1, see FF_SHARED.menuFile).
(function () {
  "use strict";

  const { esc, parseCents } = window.FF_SHARED;
  const D = window.FF_SPACE_SETUP;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const SIGNUP_KEY = "ff.venueSignup.v1";
  const SPACES_KEY = "ff.venueSpaces.v1";
  const read = (k, fallback) => { try { return JSON.parse(sessionStorage.getItem(k)) || fallback; } catch (e) { return fallback; } };
  const write = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  const signup = read(SIGNUP_KEY, {});
  let spaces = read(SPACES_KEY, []);
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const timeLabel = (mins) => { const m = ((mins % 1440) + 1440) % 1440; const h = Math.floor(m / 60); return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")}${h < 12 ? "am" : "pm"}`; };
  const toMins = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const duration = (m) => `${Math.floor(m / 60)} hour${Math.floor(m / 60) === 1 ? "" : "s"} ${String(m % 60).padStart(2, "0")} min`;
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "space";
  const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

  /* ---------- The form ---------- */

  // Greets the person by first name from sign-up (the mockup's "Hi Sadie, …").
  const firstName = (signup.name || "").trim().split(/\s+/)[0];
  const greetName = firstName || "there";
  document.title = `Set up a function space | FunctionFindr`;
  const req = '<span class="gs-req" aria-hidden="true">*</span>';
  const err = (id) => `<p class="gs-err" id="${id}-msg"></p>`;
  const money = (id, label) => `<span class="ss-money"><span aria-hidden="true">$</span><input id="${id}" type="text" inputmode="decimal" aria-label="${label}" aria-describedby="${id}-msg"></span>`;
  const bufferSelect = (id) => `<select id="${id}" aria-describedby="${id}-msg ${id}-hint"><option value="">Choose a time</option>${D.bufferSteps.map((m) => `<option value="${m}">${duration(m)}</option>`).join("")}</select>`;
  const chev = '<svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const uploadHint = "Upload a copy of your current menu for this catering type. Accepted formats: PDF, JPG, PNG or DOCX";

  const sessionTable = (s) => `
    <fieldset class="ss-session" aria-describedby="${s.id}-msg">
      <legend>${esc(s.label)} ${req}</legend>
      <table class="ss-hours">
        <thead><tr><th scope="col"><span class="sr-only">Day</span></th><th scope="col">Open</th><th scope="col">Close</th><th scope="col">Min Spend</th></tr></thead>
        <tbody>${DAYS.map((d, i) => `<tr>
          <th scope="row">${d}</th>
          <td><input type="time" step="900" id="${s.id}-open-${i}" aria-label="${d} ${s.id === "day" ? "day time" : "evening"} opening time"></td>
          <td><input type="time" step="900" id="${s.id}-close-${i}" aria-label="${d} ${s.id === "day" ? "day time" : "evening"} closing time"></td>
          <td>${money(`${s.id}-spend-${i}`, `${d} ${s.id === "day" ? "day time" : "evening"} minimum spend`)}</td>
        </tr>`).join("")}</tbody>
      </table>
      ${err(s.id)}
    </fieldset>`;

  // One food or drink option: its tick box, then (most of them) Upload menu and what's been uploaded.
  const menuRow = (kind, o) => `
    <div class="ss-menu-row">
      <label class="check"><input type="checkbox" name="${kind}" value="${o.id}" id="${kind}-${o.id}"><span>${esc(o.label)}</span></label>
      ${o.upload ? `
      <label class="ss-upload" for="up-${o.id}">Upload menu ${chev}<span class="sr-only"> for ${esc(o.label)}</span></label>
      <input class="gs-file ss-up-file" type="file" id="up-${o.id}" data-upload="${o.id}" data-kind="${kind}" accept=".pdf,.jpg,.jpeg,.png,.docx" aria-describedby="up-${o.id}-note">
      <p class="ss-up-note" id="up-${o.id}-note" aria-live="polite"></p>` : ""}
    </div>`;

  const checksGroup = (g) => `
    <fieldset class="ss-row ss-open-group">
      <legend>${esc(g.label)}</legend>
      <div class="ss-checks">${g.options.map((o, i) => `<label class="check"><input type="checkbox" name="g-${g.id}" value="${esc(o)}" id="g-${g.id}-${i}"><span>${esc(o)}</span></label>`).join("")}</div>
    </fieldset>`;

  $("#setup").innerHTML = `
    <h1>Hi ${esc(greetName)}, let’s set up your function space<br class="ss-br"> and show customers what your venue has to offer</h1>
    <p class="ss-added" id="ss-added" aria-live="polite"></p>

    <div class="gs-grid ss-block">
      <div class="gs-field">
        <label for="s-venue">Venue Name ${req}</label>
        <input id="s-venue" type="text" maxlength="80" value="${esc(signup.venue || "")}" aria-required="true" aria-describedby="s-venue-msg">${err("s-venue")}
      </div>
      <div></div>
      <div class="gs-field">
        <label for="s-name">Function Space Name ${req}</label>
        <input id="s-name" type="text" maxlength="60" aria-required="true" aria-describedby="s-name-msg">${err("s-name")}
      </div>
      <div class="gs-field">
        <label for="s-type">Function Space – Type <span class="gs-eg">(eg. Pub, Private Room, Restaurant, Rooftop, Bar, other)</span> ${req}</label>
        <input id="s-type" type="text" maxlength="60" aria-required="true" aria-describedby="s-type-msg">${err("s-type")}
      </div>
      <div class="gs-field gs-wide">
        <label for="s-about">About Your Function Space <span class="gs-eg">(max ${D.maxWords} words. Capture the atmosphere, style and feel that make your space special. Describe the extras that WOW)</span> ${req}</label>
        <textarea id="s-about" rows="3" aria-required="true" aria-describedby="s-about-count s-about-msg"></textarea>
        <p class="gs-hint ss-count" id="s-about-count" aria-live="polite"></p>${err("s-about")}
      </div>
    </div>

    <div class="ss-row ss-cap-row">
      <fieldset class="ss-cap" aria-describedby="s-cap-msg">
        <legend>Capacity ${req}</legend>
        <div class="ss-cap-fields">
          <label class="ss-small">Max. guest count standing:<input id="s-standing" type="number" min="1" step="1" inputmode="numeric"></label>
          <label class="ss-small">Max. guest count sitting:<input id="s-seated" type="number" min="1" step="1" inputmode="numeric"></label>
        </div>
        ${err("s-cap")}
      </fieldset>
      <div class="ss-deposit">
        <span class="ss-legend">Deposit ${req}</span>
        <label class="ss-small" for="s-deposit">Amount required to secure booking:</label>
        ${money("s-deposit", "Deposit amount")}${err("s-deposit")}
      </div>
    </div>

    <section class="ss-row" aria-labelledby="buffer-title">
      <h2 id="buffer-title">Booking Buffer Times</h2>
      <p>These times will automatically be added before and after each booking to allow for venue setup, pack down and cleaning.</p>
      <dl class="ss-example" id="ss-example" aria-live="polite"></dl>
      <div class="gs-grid ss-buffers">
        <div class="gs-field">
          <label for="s-setup">Setup Time ${req}</label>
          <p class="gs-hint" id="s-setup-hint">Time required before a booking commences to allow for venue preparation and event setup.</p>
          ${bufferSelect("s-setup")}${err("s-setup")}
        </div>
        <div class="gs-field">
          <label for="s-packdown">Pack Down &amp; Cleaning Time ${req}</label>
          <p class="gs-hint" id="s-packdown-hint">Time required after a booking concludes to allow for pack down, cleaning, and venue reset.</p>
          ${bufferSelect("s-packdown")}${err("s-packdown")}
        </div>
      </div>
    </section>

    <section class="ss-row" aria-labelledby="extras-title">
      <h2 id="extras-title">Extras</h2>
      <div class="ss-extras">${D.extras.map((x) => `
        <fieldset class="ss-extra">
          <legend>${esc(x.label)}:</legend>
          <label class="check"><input type="radio" name="x-${x.id}" value="no"><span>No</span></label>
          <label class="check"><input type="radio" name="x-${x.id}" value="yes"><span>Yes</span></label>
          ${money(`x-${x.id}-amount`, `${x.label} amount`)}${err(`x-${x.id}-amount`)}
        </fieldset>`).join("")}</div>
    </section>

    <div class="ss-row ss-sessions">${D.sessions.map(sessionTable).join("")}</div>

    <section class="ss-row ss-menus" aria-labelledby="food-title">
      <h2 id="food-title"><strong>Food</strong> Catering Type:</h2>
      <div class="ss-menu-list">${D.food.map((o) => menuRow("food", o)).join("")}</div>
      <fieldset class="ss-dietary">
        <legend>Dietary Accommodations:</legend>
        <div class="ss-checks">${D.dietary.map((o, i) => `<label class="check"><input type="checkbox" name="g-dietary" value="${esc(o)}" id="g-dietary-${i}"><span>${esc(o)}</span></label>`).join("")}</div>
      </fieldset>
    </section>

    <section class="ss-row ss-menus" aria-labelledby="bev-title">
      <h2 id="bev-title"><strong>Beverage Options</strong></h2>
      <div class="ss-menu-list">${D.beverage.map((o) => menuRow("bev", o)).join("")}</div>
    </section>

    ${D.groups.map(checksGroup).join("")}

    <section class="ss-row" aria-labelledby="img-title">
      <h2 id="img-title">Images</h2>
      <p class="gs-hint">Add photos of your function space (up to ${D.maxPhotos} images)</p>
      <div class="ss-photos">${Array.from({ length: D.maxPhotos }, (_, i) => `
        <div class="ss-photo-wrap">
          <label class="gs-photo" id="p-box-${i}" for="p-${i}">
            <span class="gs-photo-preview" id="p-preview-${i}"><svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.500a2 2 0 0 1 2-2h4l2-3h8l2 3h4a2 2 0 0 1 2 2V24a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="16" cy="16.500" r="5"/><circle cx="24" cy="12" r=".8" fill="currentColor"/></svg></span>
            <span class="gs-photo-label sr-only" id="p-label-${i}">Photo ${i + 1}</span>
          </label>
          <input id="p-${i}" class="gs-file" type="file" accept="image/jpeg,image/png,image/webp" aria-labelledby="img-title p-label-${i}">
        </div>`).join("")}</div>
      <p class="gs-err" id="p-msg"></p>
    </section>

    <div class="ss-actions">
      <button type="submit" class="ss-preview" data-action="preview">Preview function listing</button>
      <hr>
      <button type="submit" class="ss-another" data-action="another">Add another space ${chev}</button>
      <p class="ss-terms"><a href="#">Disclaimer and T&amp;C’s</a></p>
    </div>`;

  const form = $("#setup");
  const el = (id) => document.getElementById(id);

  /* ---------- Live bits: word count, buffer example, extras amounts ---------- */

  // The About box grows with what's typed (up to a limit, then it scrolls).
  function fitAbout() {
    const t = el("s-about");
    t.style.height = "auto";
    t.style.height = `${t.scrollHeight + 2}px`;
  }
  function syncWords() {
    fitAbout();
    const n = words(el("s-about").value);
    el("s-about-count").textContent = n > D.maxWords ? `${n} of ${D.maxWords} words` : "";
    el("s-about-count").classList.toggle("is-over", n > D.maxWords);
  }
  function syncExample() {
    const before = Number(el("s-setup").value) || 60;
    const after = Number(el("s-packdown").value) || 60;
    const chosen = el("s-setup").value && el("s-packdown").value;
    const short = (m) => duration(m).replace(" 00 min", "");
    const rows = [["Booking:", "1:00pm – 6:00pm"], ["Setup Time:", short(before)], ["Pack Down &amp; Cleaning Time:", short(after)], ["Venue unavailable:", `${timeLabel(780 - before)} – ${timeLabel(1080 + after)}`]];
    el("ss-example").innerHTML = `<span class="ss-ex-lead">${chosen ? "With your times:" : "Example:"}</span>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}`;
  }
  function syncExtras() {
    D.extras.forEach((x) => {
      const yes = form.querySelector(`input[name="x-${x.id}"][value="yes"]`).checked;
      const amount = el(`x-${x.id}-amount`);
      amount.disabled = !yes;
      amount.closest(".ss-money").classList.toggle("is-off", !yes);
      if (!yes) { amount.value = ""; el(`x-${x.id}-amount-msg`).textContent = ""; amount.removeAttribute("aria-invalid"); }
    });
  }
  el("s-about").addEventListener("input", syncWords);
  form.addEventListener("change", (e) => {
    if (e.target.matches("#s-setup, #s-packdown")) syncExample();
    if (e.target.name && e.target.name.startsWith("x-")) syncExtras();
  });
  syncWords(); syncExample(); syncExtras();

  /* ---------- Upload menu (kept in this browser, like p19's) ---------- */

  // The note beside each option: the uploaded file's name, or the mockup's hint.
  function syncUploadNote(id) {
    const note = el(`up-${id}-note`);
    if (!note) return;
    const file = window.FF_SHARED.menuFile(id);
    note.classList.toggle("has-file", !!file);
    note.innerHTML = file ? `Uploaded: <strong>${esc(file.name)}</strong>` : esc(uploadHint);
  }
  [...D.food, ...D.beverage].filter((o) => o.upload).forEach((o) => syncUploadNote(o.id));
  form.addEventListener("change", (e) => {
    const input = e.target.closest("[data-upload]");
    if (!input) return;
    const id = input.dataset.upload;
    const file = input.files[0];
    input.value = "";
    if (!file) return;
    const note = el(`up-${id}-note`);
    const ext = file.name.split(".").pop().toLowerCase();
    if (!D.uploadTypes.includes(ext)) { note.textContent = "Please choose a PDF, JPG, PNG or DOCX file."; return; }
    if (file.size > D.uploadMaxBytes) { note.textContent = "That file is over 2 MB. Please choose a smaller copy of the menu."; return; }
    // Demo: the file is kept in this browser so the preview can open it (see FF_SHARED.menuFile).
    const reader = new FileReader();
    reader.onload = () => {
      const files = window.FF_SHARED.menuFiles();
      const types = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
      files[id] = { name: file.name, type: file.type || types[ext], data: reader.result };
      try { localStorage.setItem(window.FF_SHARED.MENUS_KEY, JSON.stringify(files)); } catch (er) {
        note.textContent = "This menu can’t be saved in this browser. Please try a smaller file.";
        return;
      }
      el(`${input.dataset.kind}-${id}`).checked = true; // uploading a menu ticks its option
      syncUploadNote(id);
    };
    reader.readAsDataURL(file);
  });

  /* ---------- Photos (downsized, kept in the tab) ---------- */

  const photos = Array(D.maxPhotos).fill(null);
  const emptyPreview = el("p-preview-0").innerHTML; // the camera icon, to put back after a reset
  function setPhoto(i, src) {
    photos[i] = src;
    el(`p-preview-${i}`).innerHTML = `<img src="${src}" alt="Function space photo ${i + 1}">`;
    el(`p-box-${i}`).classList.add("has-photo");
    el(`p-label-${i}`).textContent = "Change photo";
    el(`p-label-${i}`).classList.remove("sr-only");
  }
  for (let i = 0; i < D.maxPhotos; i++) {
    el(`p-${i}`).addEventListener("change", () => {
      const file = el(`p-${i}`).files[0];
      el("p-msg").textContent = "";
      if (!file) return;
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { el("p-msg").textContent = "Please choose JPG, PNG or WebP photos."; return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        setPhoto(i, c.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => { URL.revokeObjectURL(url); el("p-msg").textContent = "That photo couldn’t be opened. Please try another."; };
      img.src = url;
    });
  }

  /* ---------- "Go back & make changes" from the preview: space-setup.html?edit=<space id> ---------- */

  const hhmm = (mins) => { const m = mins % 1440; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
  const toDollars = (c) => (c === null || c === undefined ? "" : c % 100 ? (c / 100).toFixed(2) : String(c / 100));
  const tickAll = (name, values) => $$(`input[name="${name}"]`, form).forEach((c) => { c.checked = (values || []).includes(c.value); });
  const editing = spaces.find((s) => s.id === new URLSearchParams(location.search).get("edit"));
  if (editing) {
    el("s-name").value = editing.name;
    el("s-type").value = editing.type;
    el("s-about").value = editing.about.join("\n\n");
    el("s-standing").value = editing.standing ?? "";
    el("s-seated").value = editing.seated ?? "";
    el("s-deposit").value = toDollars(editing.depositCents);
    el("s-setup").value = String(editing.bufferMinutes.setup);
    el("s-packdown").value = String(editing.bufferMinutes.packDown);
    D.extras.forEach((x) => {
      const cents = editing.extrasCents[x.id];
      form.querySelector(`input[name="x-${x.id}"][value="${cents === null ? "no" : "yes"}"]`).checked = true;
      el(`x-${x.id}-amount`).value = toDollars(cents);
    });
    D.sessions.forEach((s) => (editing.hours[s.id] || []).forEach((h, i) => {
      if (!h) return;
      el(`${s.id}-open-${i}`).value = hhmm(h.open);
      el(`${s.id}-close-${i}`).value = hhmm(h.close);
      el(`${s.id}-spend-${i}`).value = toDollars(h.minSpendCents);
    }));
    tickAll("food", editing.food);
    tickAll("bev", editing.bev);
    tickAll("g-dietary", editing.dietary);
    D.groups.forEach((g) => tickAll(`g-${g.id}`, editing[g.id]));
    editing.photos.forEach((src, i) => setPhoto(i, src));
    syncWords(); syncExample();
    D.extras.forEach((x) => { const amount = el(`x-${x.id}-amount`); const v = amount.value; syncExtras(); amount.value = v; });
    el("ss-added").textContent = `Editing ${editing.name}. Your changes replace the saved version.`;
  }

  /* ---------- Check and keep ---------- */

  function showAdded() {
    el("ss-added").textContent = spaces.length
      ? `You’ve added ${spaces.length === 1 ? "1 space" : `${spaces.length} spaces`}: ${spaces.map((s) => s.name).join(", ")}.`
      : "";
  }
  if (!editing) showAdded();

  function setMsg(id, text, input) {
    el(`${id}-msg`).textContent = text;
    if (input) input.toggleAttribute("aria-invalid", !!text);
    return text ? (input || el(id)) : null;
  }

  function collect() {
    const bad = [];
    const need = (id, text) => { const input = el(id); const b = setMsg(id, input.value.trim() ? "" : text, input); if (b) bad.push(b); };
    need("s-venue", "Please enter your venue’s name.");
    need("s-name", "Please give this function space a name.");
    need("s-type", "Please describe the type of space, like Private Room.");
    const about = el("s-about").value.trim();
    { const b = setMsg("s-about", !about ? "Please describe your function space." : words(about) > D.maxWords ? `Please keep this to ${D.maxWords} words or fewer.` : "", el("s-about")); if (b) bad.push(b); }

    const count = (id) => { const v = el(id).value.trim(); return v === "" ? null : Number(v); };
    const standing = count("s-standing");
    const seated = count("s-seated");
    const capBad = [standing, seated].some((n) => n !== null && (!Number.isInteger(n) || n < 1));
    { const t = capBad ? "Guest counts must be whole numbers." : standing === null && seated === null ? "Please enter a standing or seated guest count." : "";
      el("s-cap-msg").textContent = t; ["s-standing", "s-seated"].forEach((id) => el(id).toggleAttribute("aria-invalid", !!t)); if (t) bad.push(el("s-standing")); }

    const depositCents = parseCents(el("s-deposit").value);
    { const b = setMsg("s-deposit", el("s-deposit").value.trim() === "" ? "Please enter the deposit amount." : depositCents === null ? "Please enter an amount in dollars, like 250." : "", el("s-deposit")); if (b) bad.push(b); }

    ["s-setup", "s-packdown"].forEach((id) => { const b = setMsg(id, el(id).value ? "" : "Please choose a time.", el(id)); if (b) bad.push(b); });

    const extras = {};
    D.extras.forEach((x) => {
      const yes = form.querySelector(`input[name="x-${x.id}"][value="yes"]`).checked;
      const input = el(`x-${x.id}-amount`);
      const cents = yes ? parseCents(input.value) : null;
      const b = setMsg(`x-${x.id}-amount`, !yes ? "" : !input.value.trim() ? `Please enter the ${x.label.toLowerCase()} amount.` : cents === null ? "Please enter an amount in dollars, like 150." : "", input);
      if (b) bad.push(b);
      extras[x.id] = yes ? cents : null;
    });

    const hours = {};
    let anyOpen = false;
    D.sessions.forEach((s) => {
      let problem = "";
      let first = null;
      hours[s.id] = DAYS.map((d, i) => {
        const open = el(`${s.id}-open-${i}`);
        const close = el(`${s.id}-close-${i}`);
        const spend = el(`${s.id}-spend-${i}`);
        [open, close, spend].forEach((x) => x.removeAttribute("aria-invalid"));
        if (!open.value && !close.value && !spend.value.trim()) return null; // closed
        const spendCents = spend.value.trim() ? parseCents(spend.value) : null;
        let rowProblem = "";
        if (!open.value || !close.value) rowProblem = `Please give ${d}’s opening and closing times, or leave the whole row blank if closed.`;
        else if (toMins(close.value) <= toMins(open.value) && !s.overnight) rowProblem = `${d}’s closing time needs to be after its opening time.`;
        else if (toMins(close.value) === toMins(open.value)) rowProblem = `${d}’s opening and closing times are the same.`;
        else if (spend.value.trim() && spendCents === null) rowProblem = `Please enter ${d}’s minimum spend in dollars, like 1800.`;
        if (rowProblem) {
          problem = problem || rowProblem;
          const target = !open.value ? open : !close.value || rowProblem.includes("closing") || rowProblem.includes("same") ? close : spend;
          target.setAttribute("aria-invalid", "");
          first = first || target;
          return null;
        }
        anyOpen = true;
        const o = toMins(open.value);
        let c = toMins(close.value);
        if (c <= o) c += 1440; // evening running past midnight
        return { open: o, close: c, minSpendCents: spendCents };
      });
      el(`${s.id}-msg`).textContent = problem;
      if (first) bad.push(first);
    });
    if (!anyOpen && !el("day-msg").textContent && !el("evening-msg").textContent) {
      el("day-msg").textContent = "Please add the hours the space is available on at least one day.";
      bad.push(el("day-open-0"));
    }

    const ticked = (name) => $$(`input[name="${name}"]:checked`, form).map((c) => c.value);
    const groups = {};
    D.groups.forEach((g) => { groups[g.id] = ticked(`g-${g.id}`); });

    return {
      bad,
      space: {
        id: slug(el("s-name").value),
        name: el("s-name").value.trim(),
        type: el("s-type").value.trim(),
        about: about.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
        seated, standing, depositCents,
        bufferMinutes: { setup: Number(el("s-setup").value), packDown: Number(el("s-packdown").value) },
        extrasCents: extras,
        hours,
        food: ticked("food"),
        bev: ticked("bev"),
        dietary: ticked("g-dietary"),
        ...groups,
        photos: photos.filter(Boolean),
      },
    };
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const action = (e.submitter && e.submitter.dataset.action) || "preview";
    const { bad, space } = collect();
    if (bad.length) { bad[0].focus(); return; }

    // Same name twice replaces the earlier one; an edited space replaces itself even if renamed.
    const isOld = (s) => s.id === space.id || (editing && s.id === editing.id);
    const at = spaces.findIndex(isOld);
    const rest = spaces.filter((s) => !isOld(s));
    spaces = at < 0 ? rest.concat(space) : [...rest.slice(0, at), space, ...rest.slice(at)]; // keeps its place in the list
    let kept = write(SPACES_KEY, spaces);
    if (!kept) kept = write(SPACES_KEY, spaces.map((s) => ({ ...s, photos: [] }))); // photos too big for the tab
    write(SIGNUP_KEY, { ...signup, venue: el("s-venue").value.trim() });

    if (action === "another") {
      const venueName = el("s-venue").value;
      form.reset();
      el("s-venue").value = venueName;
      photos.fill(null);
      for (let i = 0; i < D.maxPhotos; i++) {
        el(`p-preview-${i}`).innerHTML = emptyPreview;
        el(`p-box-${i}`).classList.remove("has-photo");
        el(`p-label-${i}`).textContent = `Photo ${i + 1}`;
        el(`p-label-${i}`).classList.add("sr-only");
      }
      syncWords(); syncExample(); syncExtras(); showAdded();
      el("ss-added").textContent += kept ? " Now add the next one." : " (Photos couldn’t be kept in this browser.)";
      el("s-name").focus();
      return;
    }
    location.href = `preview.html?space=${encodeURIComponent(space.id)}`;
  });

  document.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });
})();
