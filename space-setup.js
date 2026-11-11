// "Hi …, welcome!" (mockup page 18): a venue describes a function space. DEMO ONLY: nothing is sent.
// Spaces are kept in this tab (sessionStorage ff.venueSpaces.v1) in the same shape venue-data.js uses,
// ready for the listing preview (page 20). The venue name comes from sign-up (ff.venueSignup.v1).
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

  const greeting = signup.venue ? `Hi ${signup.venue}, welcome!` : "Hi there, welcome!";
  document.title = `Set up a function space | FunctionFindr`;
  const err = (id) => `<p class="gs-err" id="${id}-msg"></p>`;
  const money = (id, label) => `<span class="ss-money"><span aria-hidden="true">$</span><input id="${id}" type="text" inputmode="decimal" aria-label="${label}" aria-describedby="${id}-msg"></span>`;
  const bufferSelect = (id) => `<select id="${id}" aria-describedby="${id}-msg ${id}-hint"><option value="">Choose a time</option>${D.bufferSteps.map((m) => `<option value="${m}">${duration(m)}</option>`).join("")}</select>`;

  const sessionTable = (s) => `
    <fieldset class="ss-session" aria-describedby="${s.id}-msg">
      <legend>${esc(s.label)} <span class="gs-req" aria-hidden="true">*</span></legend>
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

  $("#setup").innerHTML = `
    <h1>${esc(greeting)}</h1>
    <p class="gs-demo">Demo only: nothing here is sent anywhere yet. Fields marked <span class="gs-req" aria-hidden="true">*</span> are required.</p>
    <p class="ss-added" id="ss-added" aria-live="polite"></p>

    <div class="gs-grid ss-block">
      <div class="gs-field">
        <label for="s-venue">Venue Name <span class="gs-req" aria-hidden="true">*</span></label>
        <input id="s-venue" type="text" maxlength="80" value="${esc(signup.venue || "")}" aria-required="true" aria-describedby="s-venue-msg">${err("s-venue")}
      </div>
      <div></div>
      <div class="gs-field">
        <label for="s-name">Function Space Name <span class="gs-req" aria-hidden="true">*</span></label>
        <input id="s-name" type="text" maxlength="60" aria-required="true" aria-describedby="s-name-msg">${err("s-name")}
      </div>
      <div class="gs-field">
        <label for="s-type">Function Space – Type <span class="gs-eg">(eg. Pub, Private Room, Restaurant, Rooftop, Bar, other)</span> <span class="gs-req" aria-hidden="true">*</span></label>
        <input id="s-type" type="text" maxlength="60" aria-required="true" aria-describedby="s-type-msg">${err("s-type")}
      </div>
      <div class="gs-field gs-wide">
        <label for="s-about">About Your Function Space <span class="gs-eg">(max ${D.maxWords} words. Capture the atmosphere, style and feel that make your space special. Describe the extras that WOW)</span> <span class="gs-req" aria-hidden="true">*</span></label>
        <textarea id="s-about" rows="4" aria-required="true" aria-describedby="s-about-count s-about-msg"></textarea>
        <p class="gs-hint ss-count" id="s-about-count">0 of ${D.maxWords} words</p>${err("s-about")}
      </div>
    </div>

    <div class="ss-row ss-cap-row">
      <fieldset class="ss-cap" aria-describedby="s-cap-msg">
        <legend>Capacity <span class="gs-req" aria-hidden="true">*</span></legend>
        <div class="ss-cap-fields">
          <label class="ss-small">Max. guest count standing:<input id="s-standing" type="number" min="1" step="1" inputmode="numeric"></label>
          <label class="ss-small">Max. guest count seated:<input id="s-seated" type="number" min="1" step="1" inputmode="numeric"></label>
        </div>
        ${err("s-cap")}
      </fieldset>
      <div class="ss-deposit">
        <span class="ss-legend">Deposit <span class="gs-req" aria-hidden="true">*</span></span>
        <label class="ss-small" for="s-deposit">Amount required to secure booking:</label>
        ${money("s-deposit", "Deposit amount")}${err("s-deposit")}
      </div>
    </div>

    <section class="ss-row" aria-labelledby="buffer-title">
      <h2 id="buffer-title">Booking Buffer Times</h2>
      <p>These times will automatically be added before and after each booking to allow for venue setup, pack down and cleaning.</p>
      <p class="ss-example" id="ss-example" aria-live="polite"></p>
      <div class="gs-grid ss-buffers">
        <div class="gs-field">
          <label for="s-setup">Setup Time <span class="gs-req" aria-hidden="true">*</span></label>
          <p class="gs-hint" id="s-setup-hint">Time required before a booking commences to allow for venue preparation and event setup.</p>
          ${bufferSelect("s-setup")}${err("s-setup")}
        </div>
        <div class="gs-field">
          <label for="s-packdown">Pack Down &amp; Cleaning Time <span class="gs-req" aria-hidden="true">*</span></label>
          <p class="gs-hint" id="s-packdown-hint">Time required after a booking concludes to allow for pack down, cleaning, and venue reset.</p>
          ${bufferSelect("s-packdown")}${err("s-packdown")}
        </div>
      </div>
    </section>

    <section class="ss-row" aria-labelledby="extras-title">
      <h2 id="extras-title">Extras</h2>
      <p class="gs-hint">Enter amounts including GST. Customers see these charges up front, before they book.</p>
      <div class="ss-extras">${D.extras.map((x) => `
        <fieldset class="ss-extra">
          <legend>${esc(x.label)}:</legend>
          <label class="check"><input type="radio" name="x-${x.id}" value="no" checked><span>No</span></label>
          <label class="check"><input type="radio" name="x-${x.id}" value="yes"><span>Yes</span></label>
          ${money(`x-${x.id}-amount`, `${x.label} amount`)}${err(`x-${x.id}-amount`)}
        </fieldset>`).join("")}</div>
    </section>

    <div class="ss-row ss-sessions">${D.sessions.map(sessionTable).join("")}</div>

    <section class="ss-row" aria-labelledby="fb-title">
      <h2 id="fb-title">Food &amp; Beverage Catering:</h2>
      <a class="ss-menu-link" href="venue-setup.html">Enter menu items <svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
    </section>

    ${D.groups.map((g) => `
    <fieldset class="ss-row ss-group">
      <legend>${esc(g.label)}</legend>
      <div class="ss-checks">${g.options.map((o, i) => `<label class="check"><input type="checkbox" name="g-${g.id}" value="${esc(o)}" id="g-${g.id}-${i}"><span>${esc(o)}</span></label>`).join("")}</div>
    </fieldset>`).join("")}

    <section class="ss-row" aria-labelledby="img-title">
      <h2 id="img-title">Images</h2>
      <p class="gs-hint">Add photos of your function space (up to ${D.maxPhotos} images)</p>
      <div class="ss-photos">${Array.from({ length: D.maxPhotos }, (_, i) => `
        <div class="ss-photo-wrap">
          <label class="gs-photo" id="p-box-${i}" for="p-${i}">
            <span class="gs-photo-preview" id="p-preview-${i}"><svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.500a2 2 0 0 1 2-2h4l2-3h8l2 3h4a2 2 0 0 1 2 2V24a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="16" cy="16.500" r="5"/><circle cx="24" cy="12" r=".8" fill="currentColor"/></svg></span>
            <span class="gs-photo-label" id="p-label-${i}">Photo ${i + 1}</span>
          </label>
          <input id="p-${i}" class="gs-file" type="file" accept="image/jpeg,image/png,image/webp" aria-labelledby="img-title p-label-${i}">
        </div>`).join("")}</div>
      <p class="gs-err" id="p-msg"></p>
    </section>

    <div class="ss-actions">
      <button type="submit" class="ss-preview" data-action="preview">Preview function listing</button>
      <hr>
      <button type="submit" class="ss-another" data-action="another">Add another space <svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <p class="ss-terms"><a href="#">Disclaimer and T&amp;C’s</a></p>
    </div>`;

  const form = $("#setup");
  const el = (id) => document.getElementById(id);

  /* ---------- Live bits: word count, buffer example, extras amounts ---------- */

  function syncWords() {
    const n = words(el("s-about").value);
    el("s-about-count").textContent = `${n} of ${D.maxWords} words`;
    el("s-about-count").classList.toggle("is-over", n > D.maxWords);
  }
  function syncExample() {
    const before = Number(el("s-setup").value) || 60;
    const after = Number(el("s-packdown").value) || 60;
    const chosen = el("s-setup").value && el("s-packdown").value;
    el("ss-example").textContent = `${chosen ? "With your times" : "Example"}: a 1:00pm – 6:00pm booking makes the space unavailable from ${timeLabel(780 - before)} to ${timeLabel(1080 + after)}.`;
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

  /* ---------- Photos (downsized, kept in the tab) ---------- */

  const photos = Array(D.maxPhotos).fill(null);
  const emptyPreview = el("p-preview-0").innerHTML; // the camera icon, to put back after a reset
  function setPhoto(i, src) {
    photos[i] = src;
    el(`p-preview-${i}`).innerHTML = `<img src="${src}" alt="Function space photo ${i + 1}">`;
    el(`p-box-${i}`).classList.add("has-photo");
    el(`p-label-${i}`).textContent = "Change photo";
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

  /* ---------- Check and keep ---------- */

  function showAdded() {
    el("ss-added").textContent = spaces.length
      ? `You’ve added ${spaces.length === 1 ? "1 space" : `${spaces.length} spaces`}: ${spaces.map((s) => s.name).join(", ")}.`
      : "";
  }
  showAdded();

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

    const ticked = {};
    D.groups.forEach((g) => { ticked[g.id] = $$(`input[name="g-${g.id}"]:checked`, form).map((c) => c.value); });

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
        ...ticked,
        photos: photos.filter(Boolean),
      },
    };
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const action = (e.submitter && e.submitter.dataset.action) || "preview";
    const { bad, space } = collect();
    if (bad.length) { bad[0].focus(); return; }

    // Same name twice replaces the earlier one.
    spaces = spaces.filter((s) => s.id !== space.id).concat(space);
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
      }
      syncWords(); syncExample(); syncExtras(); showAdded();
      el("ss-added").textContent += kept ? " Now add the next one." : " (Photos couldn’t be kept in this browser.)";
      el("s-name").focus();
      return;
    }
    location.href = "mockup.html?p=20"; // TODO: page 20's own address once it's built
  });

  document.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });
})();
