(function () {
  "use strict";

  const D = window.FF_CALENDAR;
  const P = window.FF_DATA; // The customer's checklist options, from My Bookings.
  const { esc, CHECKLIST_KEY, checklistSteps, tickIcon, miniChecklist, selStepDone } = window.FF_SHARED;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  let view = "space";
  let spaceFilter = "";
  let nextId = D.bookings.length + 1;

  const chevron = '<svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- Dates and times ---------- */

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const ordinal = (d) => d + ([11, 12, 13].includes(d) ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[d % 10] || "th"));
  function fmtDate(iso) {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return `${ordinal(d)} ${MONTHS[m - 1]} ${y}`;
  }
  function fmtTime(hm) {
    const [h, m] = hm.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
  }

  /* ---------- The customer's checklist ---------- */

  // The options a venue can tick for each step, with the same labels the customer sees.
  const options = {
    food: P.foodPackages.map((p) => ({ key: p.id, label: p.label })),
    dietary: P.dietary.map((d) => ({ key: d.id, label: d.label })),
    bev: P.beveragePackages.map((p) => ({ key: p.id, label: p.label })),
    // Both cake options share one id on My Bookings, so only one can be ticked.
    additional: P.additional.map((a) => ({ key: a.val ? `${a.id}-${a.val}` : a.id, group: a.id, label: a.lines.join(" ") })),
  };
  const labelOf = (step, key) => (options[step].find((o) => o.key === key) || { label: key }).label;
  const hasNone = (step) => ["dietary", "additional", "notes"].includes(step);

  const emptySel = () => ({ food: [], dietary: [], bev: [], additional: [], notes: "", none: { dietary: false, additional: false, notes: false } });

  // The booking details: shown as rows in Add/Edit Booking, and all needed for Function Details to tick.
  const fields = [
    { k: "space", label: "Function room", type: "select" },
    { k: "title", label: "Event name", type: "text" },
    { k: "contact", label: "Contact person", type: "text", auto: "name" },
    { k: "phone", label: "Phone number", type: "tel", auto: "tel" },
    { k: "email", label: "Email", type: "email", auto: "email" },
    { k: "date", label: "Function date", type: "date" },
    { k: "startTime", label: "Start time", type: "time" },
    { k: "end", label: "End time", type: "time" },
    { k: "guests", label: "No. of guests", type: "number" },
  ];

  const toDraft = (b) => ({
    id: b.id, live: !!b.live, space: b.space, title: b.title, contact: b.contact, phone: b.phone, email: b.email,
    date: b.start.slice(0, 10), startTime: b.start.slice(11, 16), end: b.end, guests: String(b.guests),
    sel: JSON.parse(JSON.stringify(b.sel || emptySel())),
  });

  // What's wrong with each detail, keyed by field. Empty means Function Details is done.
  function problems(d) {
    const out = {};
    fields.forEach((f) => { if (!String(d[f.k] || "").trim()) out[f.k] = `Add the ${f.label.toLowerCase()}`; });
    if (!out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) out.email = "Enter an email like name@example.com";
    if (!out.phone && d.phone.replace(/\D/g, "").length < 8) out.phone = "Enter a phone number";
    // TODO(confirm): an upper limit should come from the room's licensed capacity.
    const guests = String(d.guests).trim();
    if (!out.guests && (!/^\d+$/.test(guests) || Number(guests) < 1 || Number(guests) > 1000)) out.guests = "Enter a number of guests from 1 to 1,000";
    // Late finishes run past midnight (the mockup has 5:00 pm to 1:30 am), so only the same time is wrong.
    if (!out.startTime && !out.end && d.startTime === d.end) out.end = "The end time must be different from the start time";
    return out;
  }

  function stepDone(id, d) {
    const s = d.sel;
    if (id === "function") return Object.keys(problems(d)).length === 0;
    return selStepDone(id, s);
  }

  // A live booking's checklist comes from the My Bookings page; the rest are filled in here.
  function liveStatus() {
    try {
      const saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY));
      if (saved) return saved;
    } catch (e) { /* nothing saved, or storage blocked */ }
    return { done: ["function"], items: [] };
  }

  // Progress saved by a booking's own checklist (the pop-up's My Bookings checklist), if it has been opened.
  function savedStatus(id) {
    try { return JSON.parse(localStorage.getItem(`${CHECKLIST_KEY}.${id}`)); } catch (e) { return null; }
  }

  function checklistOf(b) {
    if (b.live) return liveStatus();
    const d = toDraft(b);
    const saved = savedStatus(b.id);
    if (saved) {
      // Function Details comes from the booking details here; the other steps from the checklist.
      return { done: checklistSteps.map((s) => s.id).filter((id) => (id === "function" ? stepDone(id, d) : saved.done.includes(id))), items: saved.items };
    }
    return {
      done: checklistSteps.map((s) => s.id).filter((id) => stepDone(id, d)),
      items: [...d.sel.food.map((k) => labelOf("food", k)), ...d.sel.bev.map((k) => labelOf("bev", k))],
    };
  }

  /* ---------- Calendar ---------- */

  const spaceName = (id) => (D.spaces.find((s) => s.id === id) || { name: "" }).name;

  function bookingCard(b, showSpace) {
    const { done, items } = checklistOf(b);
    return `<article class="cal-card">
      <p class="cal-when">${esc(fmtDate(b.start))}<br>${esc(fmtTime(b.start.slice(11, 16)))} to ${esc(fmtTime(b.end))}</p>
      <h3>${esc(b.title)}</h3>
      ${showSpace ? `<p class="cal-space">${esc(spaceName(b.space))}</p>` : ""}
      <p>${b.guests} Guests</p>
      ${items.length ? items.map((item) => `<p>${esc(item)}</p>`).join("") : '<p class="cal-none">No selections yet</p>'}
      <p class="cal-foot"><a href="#"><u>Guest Contact details</u></a></p>
      ${miniChecklist(done)}
      <button type="button" class="cal-edit" data-edit="${b.id}" aria-label="View or edit booking: ${esc(b.title)}, ${esc(spaceName(b.space))}">View/Edit Booking</button>
    </article>`;
  }

  const column = (title, cards) => `<section class="cal-col" aria-label="${esc(title)}">
      <h2>${esc(title)}</h2>
      ${cards.join("") || '<p class="cal-empty">No bookings yet</p>'}
    </section>`;

  const visibleSpaces = () => D.spaces.filter((s) => !spaceFilter || s.id === spaceFilter);
  const byStart = (x, y) => x.start.localeCompare(y.start);

  function bySpace() {
    return visibleSpaces().map((s) => column(s.name, D.bookings.filter((b) => b.space === s.id).sort(byStart).map((b) => bookingCard(b))));
  }

  function byDate() {
    const shown = new Set(visibleSpaces().map((s) => s.id));
    const days = new Map();
    D.bookings.filter((b) => shown.has(b.space)).sort(byStart).forEach((b) => {
      const key = b.start.slice(0, 10);
      if (!days.has(key)) days.set(key, []);
      days.get(key).push(b);
    });
    return [...days.keys()].sort().map((key) => column(fmtDate(key), days.get(key).map((b) => bookingCard(b, true))));
  }

  function syncArrows() {
    const track = $("#cal-columns");
    const max = track.scrollWidth - track.clientWidth - 2;
    $("#cal-prev").hidden = track.scrollLeft <= 2;
    $("#cal-next").hidden = track.scrollLeft >= max;
  }

  function render(scrollLeft = 0) {
    const columns = view === "space" ? bySpace() : byDate();
    const track = $("#cal-columns");
    track.innerHTML = columns.join("") || '<p class="cal-empty">No bookings yet</p>';
    track.scrollLeft = scrollLeft;
    $("#cal-crumb").textContent = view === "space" ? "By Space" : "By Date";
    $$("[data-view]").forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.view === view)));
    syncArrows();
    evenCards();
  }

  // Every booking card is as tall as the tallest, so the calendar reads as an even grid; the contact link,
  // mini checklist and button sit at the bottom of each (see .cal-foot in calendar.css).
  function evenCards() {
    const cards = $$(".cal-card");
    cards.forEach((c) => { c.style.minHeight = ""; });
    const tallest = Math.max(0, ...cards.map((c) => c.offsetHeight));
    cards.forEach((c) => { c.style.minHeight = `${tallest}px`; });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(evenCards);

  function step(direction) {
    const track = $("#cal-columns");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (track.firstElementChild.offsetWidth + gap), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  /* ---------- Add Booking and Edit Booking ---------- */

  const box = $("#bk-box");
  const form = $("#bk-form");
  let draft = null;
  let showErrors = false;

  function fieldRow(f) {
    const id = `bk-${f.k}`;
    const value = esc(draft[f.k]);
    let input;
    if (f.type === "select") {
      input = `<select id="${id}" data-f="${f.k}">${D.spaces.map((s) => `<option value="${s.id}"${s.id === draft.space ? " selected" : ""}>${esc(s.name)}</option>`).join("")}</select>`;
    } else {
      const extra = f.type === "number" ? ' min="1" max="1000" step="1" inputmode="numeric"' : "";
      input = `<input id="${id}" data-f="${f.k}" type="${f.type}" value="${value}" autocomplete="${f.auto || "off"}"${extra}>`;
    }
    return `<div class="bk-row"><label for="${id}">${esc(f.label)}:</label><div class="bk-input">${input}<p class="bk-msg" id="${id}-msg"></p></div></div>`;
  }

  // The pop-up's checklist is My Bookings itself (my-bookings.html?embed=venue), so it looks and works exactly
  // as it does for the customer. It reads this booking's details from sessionStorage (ff.venueChecklist.v1).
  const frame = $("#bk-frame");
  function loadChecklist() {
    try {
      sessionStorage.setItem("ff.venueChecklist.v1", JSON.stringify({ id: draft.id, live: draft.live, title: draft.title, guests: Number(draft.guests) || 0, sel: draft.sel }));
    } catch (e) { /* the checklist falls back to the customer's own */ }
    frame.style.height = "";
    frame.src = `my-bookings.html?embed=venue&booking=${encodeURIComponent(draft.id)}`;
  }
  window.addEventListener("message", (e) => {
    if (e.origin === location.origin && e.data && e.data.type === "ff-checklist-height") frame.style.height = `${Math.ceil(e.data.h)}px`;
  });

  // Side by side, the details stretch so the line under No. of guests lines up with the bottom of the
  // Notes for the venue card (measured when the checklist first loads, with every card closed).
  function alignDetails() {
    const list = $("#bk-fields");
    list.style.minHeight = "";
    list.classList.remove("is-stretched");
    if (window.matchMedia("(max-width: 960px)").matches || !box.open) return;
    const fd = frame.contentDocument;
    const cards = fd ? fd.querySelectorAll(".step .card") : [];
    const last = cards[cards.length - 1];
    if (!last) return;
    const bottom = frame.getBoundingClientRect().top + last.getBoundingClientRect().bottom;
    const need = bottom - list.getBoundingClientRect().top;
    if (need > list.offsetHeight) {
      list.style.minHeight = `${need}px`;
      list.classList.add("is-stretched");
    }
  }
  frame.addEventListener("load", () => setTimeout(alignDetails, 150));

  // "3 of 6 done" above the checklist: Function Details from the details on the left, the rest from the checklist.
  function syncSteps() {
    const status = draft.live ? liveStatus() : savedStatus(draft.id);
    const done = checklistSteps.map((s) => s.id).filter((id) => (id === "function"
      ? stepDone(id, draft)
      : status ? status.done.includes(id) : stepDone(id, draft)));
    const count = done.length;
    $("#bk-check-sum").innerHTML = count === checklistSteps.length ? `${tickIcon}Checklist complete` : `${count} of ${checklistSteps.length} done`;
    $("#bk-check-sum").classList.toggle("is-complete", count === checklistSteps.length);
  }

  function syncErrors() {
    const errs = showErrors ? problems(draft) : {};
    fields.forEach((f) => {
      const input = $(`#bk-${f.k}`);
      const msg = $(`#bk-${f.k}-msg`);
      msg.textContent = errs[f.k] || "";
      if (errs[f.k]) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", msg.id);
      } else {
        input.removeAttribute("aria-invalid");
        input.removeAttribute("aria-describedby");
      }
    });
  }

  function openBox(booking) {
    const adding = !booking;
    const blank = { id: "", space: spaceFilter || D.spaces[0].id, title: "", contact: "", phone: "", email: "", start: "", end: "", guests: "", sel: emptySel() };
    draft = toDraft(booking || blank);
    if (adding) {
      draft.id = `bk${nextId}`;
      // A new booking starts with a clean checklist, even if an earlier unsaved one used this id.
      try { localStorage.removeItem(`ff.myBookings.v4.${draft.id}`); localStorage.removeItem(`${CHECKLIST_KEY}.${draft.id}`); } catch (e) { /* nothing saved */ }
    }
    showErrors = false;
    box.dataset.mode = adding ? "add" : "edit";
    $("#bk-heading").textContent = adding ? "Add Booking" : "Edit Booking";
    $("#bk-fields").innerHTML = fields.map(fieldRow).join("");
    $("#bk-save").textContent = adding ? "Add Function" : "Save Changes";
    resetCancel();
    $("#bk-lead").textContent = draft.live
      ? `${draft.contact} is filling this in on their My Bookings page, so it updates here as they go.`
      : adding
        ? "Fill in anything already agreed with the customer. They can finish the rest on their own checklist."
        : "These are the customer’s checklist answers. Change them here if they’ve asked you to.";
    syncSteps();
    loadChecklist();
    form.scrollTop = 0;
    box.showModal();
    box.scrollTop = 0;
  }

  // Cancel Function takes two clicks, so a booking isn't lost to a slip.
  function resetCancel() {
    const btn = $("#bk-cancel");
    btn.dataset.confirm = "";
    btn.textContent = box.dataset.mode === "add" ? "Cancel" : "Cancel Function";
    btn.classList.remove("is-danger");
    $("#bk-cancel-note").textContent = "";
  }

  function toast(text) {
    const t = $("#cal-toast");
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  function save() {
    const errs = problems(draft);
    if (Object.keys(errs).length) {
      showErrors = true;
      syncErrors();
      $(`#bk-${fields.find((f) => errs[f.k]).k}`).focus();
      return;
    }
    const record = {
      title: draft.title.trim(), contact: draft.contact.trim(), phone: draft.phone.trim(), email: draft.email.trim(),
      start: `${draft.date}T${draft.startTime}`, end: draft.end, guests: Number(draft.guests), space: draft.space,
    };
    const adding = box.dataset.mode === "add";
    if (adding) {
      D.bookings.push({ ...record, id: draft.id, sel: draft.sel });
      nextId++;
    } else {
      const b = D.bookings.find((x) => x.id === draft.id);
      Object.assign(b, record);
      if (!b.live) b.sel = draft.sel;
    }
    if (spaceFilter && spaceFilter !== record.space) {
      spaceFilter = "";
      $("#cal-filter").value = "";
    }
    box.close();
    render(adding ? 0 : $("#cal-columns").scrollLeft);
    toast(adding ? `${record.title} added to ${spaceName(record.space)}` : "Changes saved");
  }

  function cancelClicked() {
    const btn = $("#bk-cancel");
    if (box.dataset.mode === "add") return box.close();
    if (!btn.dataset.confirm) {
      btn.dataset.confirm = "1";
      btn.textContent = "Yes, cancel this function";
      btn.classList.add("is-danger");
      $("#bk-cancel-note").textContent = "This takes it off the calendar. Press again to confirm.";
      return;
    }
    // TODO(confirm): a real cancellation needs the venue's refund rules and a message to the customer.
    const title = draft.title;
    if (!draft.live) {
      try { localStorage.removeItem(`ff.myBookings.v4.${draft.id}`); localStorage.removeItem(`${CHECKLIST_KEY}.${draft.id}`); } catch (e) { /* nothing saved */ }
    }
    D.bookings.splice(D.bookings.findIndex((x) => x.id === draft.id), 1);
    box.close();
    render($("#cal-columns").scrollLeft);
    toast(`${title} cancelled`);
  }

  form.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.f) draft[t.dataset.f] = t.value;
    syncSteps();
    if (showErrors) syncErrors();
  });

  form.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.f) {
      draft[t.dataset.f] = t.value;
      syncSteps();
      if (showErrors) syncErrors();
      return;
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    save();
  });

  form.addEventListener("click", (e) => {
    if (e.target.closest("#bk-cancel")) cancelClicked();
    if (e.target.closest("#bk-close")) box.close();
  });

  // Clicking the dark area around the box closes it.
  box.addEventListener("click", (e) => { if (e.target === box) box.close(); });

  /* ---------- Page wiring ---------- */

  $("#cal-filter").innerHTML = `<option value="">View all function spaces</option>${D.spaces.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}`;
  $("#cal-avatar").textContent = D.venueInitials;
  $("#cal-avatar").setAttribute("aria-label", `${D.venueName} account`);

  document.addEventListener("click", (e) => {
    if (e.target.closest('a[href="#"]')) e.preventDefault();
    const tab = e.target.closest("[data-view]");
    if (tab) {
      view = tab.dataset.view;
      render();
      return;
    }
    const edit = e.target.closest("[data-edit]");
    if (edit) openBox(D.bookings.find((b) => b.id === edit.dataset.edit));
    if (e.target.closest("#cal-add")) openBox(null);
    if (e.target.closest("#cal-next")) step(1);
    if (e.target.closest("#cal-prev")) step(-1);
  });
  $("#cal-filter").addEventListener("change", (e) => {
    spaceFilter = e.target.value;
    render();
  });
  $("#cal-columns").addEventListener("scroll", syncArrows, { passive: true });
  window.addEventListener("resize", syncArrows);
  // Picks up progress made on My Bookings in another tab, or before coming back with the dev tabs.
  function refreshLive() {
    render($("#cal-columns").scrollLeft);
    if (box.open) syncSteps();
  }
  window.addEventListener("storage", (e) => { if (e.key && e.key.startsWith(CHECKLIST_KEY)) refreshLive(); });
  window.addEventListener("pageshow", (e) => { if (e.persisted) refreshLive(); });
  // "View Bookings" on the function spaces page opens calendar.html?space=<id>, showing just that room.
  const fromLink = new URLSearchParams(location.search).get("space");
  if (fromLink && D.spaces.some((s) => s.id === fromLink)) {
    spaceFilter = fromLink;
    $("#cal-filter").value = fromLink;
  }
  render();
})();
