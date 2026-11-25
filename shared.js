// Helpers used by every page, plus the developer tabs for flipping between mockup pages.
window.FF_SHARED = (function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const money = (cents) => (cents === null ? "n/a" : "$" + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));

  // Dollars as typed ("5.8", "$5.80", "1,000") to integer cents, or null if it isn't a price.
  function parseCents(text) {
    const m = String(text).trim().replace(/^\$/, "").replace(/,/g, "").match(/^(\d{1,6})(?:\.(\d{0,2}))?$/);
    return m ? Number(m[1]) * 100 + Number((m[2] || "").padEnd(2, "0")) : null;
  }

  // Every page of the site in mockup order (p = page in BMF Website MockUp-Complete-V44.pdf).
  // A step without `href` is shown as its mockup image by mockup.html. A step can also keep its own
  // address while still being an image (`image: true`).
  // When a page is built, give it an `href` and delete its image from mockup/ and mockup-data.js.
  const flow = [
    { p: 1, title: "Landing page", href: "index.html" },
    { p: 2, title: "Venue search", href: "search.html" },
    { p: 3, title: "Log in or sign up", href: "login.html" },
    { p: 4, title: "Welcome and wishlists", href: "welcome.html" },
    { p: 5, title: "Wishlist venues", href: "wishlist.html" },
    { p: 7, title: "My Bookings", href: "my-bookings.html" },
    { p: 8, title: "Venue page", href: "venue.html" },
    { p: 9, title: "Function space and availability", href: "space.html" },
    { p: 10, title: "Available: sign in to book", href: "available.html" },
    { p: 11, title: "Available: your details", href: "details.html" },
    { p: 12, title: "Review and pay", href: "pay.html" },
    { p: 13, title: "Booking confirmed", href: "confirmed.html" },
    { p: 14, title: "My Bookings: choose event details", href: "my-bookings.html" },
    { p: 15, title: "List your venue", href: "list-venue.html" },
    { p: 16, title: "Venue sign-up", href: "get-started.html" },
    { p: 17, title: "90 days free", href: "trial.html" },
    { p: 18, title: "Function space setup", href: "space-setup.html" },
    { p: 20, title: "Preview your listing", href: "preview.html" }, // V42 PDF p13, moved between p18 and p19 by request
    { p: 19, title: "Food and beverage setup", href: "venue-setup.html" },
    { p: 21, title: "You’re all set", href: "all-set.html" },
    { p: null, title: "Venue dashboard (no mockup)", href: "dashboard.html" },
    { p: 22, title: "Booking calendar: add or edit", href: "calendar.html" },
    { p: 23, title: "Booking calendar by space", href: "calendar.html" },
    { p: 24, title: "Function spaces", href: "function-spaces.html" },
  ];
  const fileOf = (s) => s.href || "mockup.html";
  // Pages that appear twice in the flow carry ?p= so Previous and Next know where you are.
  const stepHref = (s) => (!s.href ? `mockup.html?p=${s.p}` : flow.filter((x) => x.href === s.href).length > 1 ? `${s.href}?p=${s.p}` : s.href);

  function currentStep() {
    const file = location.pathname.split("/").pop() || "index.html";
    const p = Number(new URLSearchParams(location.search).get("p")) || null;
    const here = flow.filter((s) => fileOf(s) === file);
    return here.find((s) => s.p === p) || (file === "mockup.html" ? null : here[0]) || null;
  }

  // Dev bar "Required fields" switch: Off lets forms go on with fields left blank, to click through the demo
  // quickly. Kept across pages (localStorage ff.devRequired.v1). Forms ask FF_SHARED.requiredOn().
  const REQ_KEY = "ff.devRequired.v1";
  const requiredOn = () => { try { return localStorage.getItem(REQ_KEY) !== "off"; } catch (e) { return true; } };

  function renderDevTabs() {
    const cur = currentStep();
    const i = flow.indexOf(cur);
    const prev = i > 0 ? flow[i - 1] : null;
    const next = i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
    const name = (s) => `${s.p ? `p${s.p} ` : ""}${s.title}`;
    const kind = (s) => (s.href && !s.image ? "live" : "mockup image");
    const step = (s, label, cls) => (s
      ? `<a class="dev-step ${cls}" href="${stepHref(s)}" title="${esc(name(s))}">${label}</a>`
      : `<span class="dev-step ${cls}" aria-disabled="true">${label}</span>`);
    const nav = document.createElement("nav");
    nav.className = "dev-tabs";
    nav.setAttribute("aria-label", "Developer pages");
    nav.innerHTML = `<span class="dev-tabs-label">Dev</span>
      ${step(prev, "‹ Previous", "dev-prev")}
      <label class="dev-jump"><span class="sr-only">Go to page</span><select>${cur ? "" : '<option value="" selected>Go to page…</option>'}${flow.map((s) => `<option value="${stepHref(s)}"${s === cur ? " selected" : ""}>${esc(name(s))} · ${kind(s)}</option>`).join("")}</select></label>
      ${step(next, "Next ›", "dev-next")}
      <button type="button" class="dev-req" aria-pressed="${requiredOn()}" title="Off lets forms continue with blank fields">Required fields <span class="dev-req-state">${requiredOn() ? "On" : "Off"}</span></button>`;
    const reqBtn = nav.querySelector(".dev-req");
    reqBtn.addEventListener("click", () => {
      const on = !requiredOn();
      try { localStorage.setItem(REQ_KEY, on ? "on" : "off"); } catch (e) { /* this page only */ }
      reqBtn.setAttribute("aria-pressed", String(on));
      reqBtn.querySelector(".dev-req-state").textContent = on ? "On" : "Off";
    });
    nav.querySelector("select").addEventListener("change", (e) => { if (e.target.value) location.href = e.target.value; });
    document.body.append(nav);
    document.body.classList.add("has-dev-tabs");
  }
  // Not inside a frame, such as the checklist in the booking calendar's Edit Booking pop-up.
  if (window.self === window.top) document.addEventListener("DOMContentLoaded", renderDevTabs);

  const CHECKLIST_KEY = "ff.checklistStatus.v1";
  const checklistSteps = [
    { id: "function", label: "Function Details" },
    { id: "food", label: "Food Packages" },
    { id: "dietary", label: "Dietary Accommodations" },
    { id: "bev", label: "Beverage Options" },
    { id: "additional", label: "Additional" },
    { id: "notes", label: "Notes for the venue" },
  ];

  const tickIcon = '<svg class="tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.500l3.200 3.200L13 4.800" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Whether a booking's checklist answers (the `sel` shape in calendar-data.js) finish a step.
  // Function Details isn't covered: it depends on the booking details, which each page checks itself.
  function selStepDone(id, sel) {
    if (id === "food" || id === "bev") return sel[id].length > 0;
    if (sel.none[id]) return true;
    return id === "notes" ? !!sel.notes.trim() : sel[id].length > 0;
  }

  // The customer's checklist in miniature: same steps, ticks and filling line as My Bookings.
  function miniChecklist(done) {
    const isDone = (s) => done.includes(s.id);
    const firstOpen = checklistSteps.findIndex((s) => !isDone(s));
    const reached = firstOpen === -1 ? checklistSteps.length : firstOpen;
    const count = checklistSteps.filter(isDone).length;
    const left = checklistSteps.filter((s) => !isDone(s)).map((s) => s.label);
    const summary = left.length ? `Checklist ${count} of ${checklistSteps.length} done. Still to do: ${left.join(", ")}.` : "Checklist complete.";
    const marks = checklistSteps.map((s, i) => `${i ? `<span class="mini-line${i <= reached ? " is-filled" : ""}"></span>` : ""}<span class="mini-box${isDone(s) ? " is-done" : ""}" title="${esc(s.label)}: ${isDone(s) ? "done" : "to do"}">${isDone(s) ? tickIcon : ""}</span>`).join("");
    let text = `<p class="mini-text is-complete">Checklist complete</p>`;
    if (left.length) {
      const state = count > 1 ? `${count} of ${checklistSteps.length} done` : "Not started";
      text = `<p class="mini-text">${state}<br>Next: ${esc(left[0])}</p>`;
    }
    return `<div class="mini"><div class="mini-track" role="img" aria-label="${esc(summary)}">${marks}</div>${text}</div>`;
  }

  /* ---------- Venue logos, reviews and side-scrolling rows (styles in styles.css) ---------- */

  const logoBoxes = (logos) => logos.map((l) => `<div class="logo-box logo-${esc(l.style)}">${esc(l.name)}</div>`).join("");
  const reviewCards = (list) => list.map((t) => `<figure class="review"><figcaption>${esc(t.name)}</figcaption><blockquote>${esc(t.text)}</blockquote></figure>`).join("");

  // Rows like "What people say": arrow buttons carry data-track="<row id>" and data-step="-1" or "1",
  // move the row one card at a time, and switch off at either end.
  function initCarousels(ids) {
    const tracks = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const sync = (t) => {
      const max = t.scrollWidth - t.clientWidth - 2;
      document.querySelectorAll(`[data-track="${t.id}"]`).forEach((b) => { b.disabled = Number(b.dataset.step) < 0 ? t.scrollLeft <= 2 : t.scrollLeft >= max; });
    };
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-track]");
      const track = btn && document.getElementById(btn.dataset.track);
      const card = track && track.firstElementChild;
      if (!card) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: Number(btn.dataset.step) * (card.offsetWidth + gap), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
    tracks.forEach((t) => {
      t.addEventListener("scroll", () => sync(t), { passive: true });
      sync(t);
    });
    window.addEventListener("resize", () => tracks.forEach(sync));
  }

  /* ---------- Minimum spend amounts (p9 space page and p20 preview) ---------- */

  // Whole dollars with no thousands comma ($1200), as the founder asked for minimum spends.
  const plainDollars = (cents) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
  /* ---------- Menus a venue uploads for each food or drink option (p19), shown to customers (p9, p20) ---------- */

  // TODO(confirm): a demo stand-in. Files are kept in this browser (localStorage); a real upload goes to object storage.
  const MENUS_KEY = "ff.venueMenus.v1"; // { optionId: { name, type, data } }
  function menuFiles() {
    try { return JSON.parse(localStorage.getItem(MENUS_KEY)) || {}; } catch (e) { return {}; }
  }
  const menuFile = (id) => menuFiles()[id] || null;
  // Opens the file in a new tab (PDFs in the browser's viewer, images as they are).
  function openMenuFile(id) {
    const m = menuFile(id);
    if (!m) return;
    const bin = atob(m.data.split(",")[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    window.open(URL.createObjectURL(new Blob([bytes], { type: m.type })), "_blank");
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-open-file]");
    if (b) openMenuFile(b.dataset.openFile);
  });

  return { requiredOn, esc, money, parseCents, CHECKLIST_KEY, checklistSteps, tickIcon, selStepDone, miniChecklist, flow, stepHref, logoBoxes, reviewCards, initCarousels, plainDollars, MENUS_KEY, menuFiles, menuFile };
})();

/* ---------- Zoom like a PDF: Cmd + scroll (Ctrl + scroll on Windows, or pinch on a trackpad) ---------- */
// Zooms the whole page around the pointer, from 50% to 200%. The level is kept across pages
// (localStorage ff.zoom.v1). Cmd/Ctrl + 0 puts it back to 100%. Pages shown inside another page
// (the calendar's embedded checklist) follow the page around them, so they don't zoom on their own.
(function () {
  "use strict";
  if (window.top !== window) return;
  const KEY = "ff.zoom.v1";
  const MIN = 0.5, MAX = 2;
  const root = document.documentElement;
  let z = 1;
  try { z = Math.min(MAX, Math.max(MIN, Number(localStorage.getItem(KEY)) || 1)); } catch (e) { /* 100% */ }

  const badge = document.createElement("p");
  badge.setAttribute("role", "status");
  badge.style.cssText = "position:fixed;z-index:9999;right:1rem;bottom:3.25rem;margin:0;padding:.35rem .8rem;border-radius:999px;background:#231f20;color:#fff;font:500 .9rem/1.3 'Instrument Sans',Helvetica,Arial,sans-serif;pointer-events:none;opacity:0;transition:opacity .15s";
  document.body.append(badge);
  let hideTimer = 0;
  function show() {
    badge.textContent = `${Math.round(z * 100)}%`;
    badge.style.opacity = "1";
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { badge.style.opacity = "0"; }, 900);
  }

  // Sets the zoom, keeping the point under (x, y) in the same place on screen.
  function setZoom(next, x = innerWidth / 2, y = innerHeight / 2) {
    next = Math.min(MAX, Math.max(MIN, Math.round(next * 100) / 100));
    if (next === z) { show(); return; }
    const sx = (scrollX + x) / z, sy = (scrollY + y) / z;
    z = next;
    root.style.zoom = z === 1 ? "" : String(z);
    scrollTo(sx * z - x, sy * z - y);
    try { localStorage.setItem(KEY, String(z)); } catch (e) { /* this page only */ }
    show();
  }
  if (z !== 1) root.style.zoom = String(z);

  addEventListener("wheel", (e) => {
    if (!e.metaKey && !e.ctrlKey) return;
    e.preventDefault();
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; // lines → pixels
    setZoom(z * Math.exp(-Math.max(-50, Math.min(50, dy)) * 0.002), e.clientX, e.clientY); // about 10% per wheel click
  }, { passive: false });

  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "0" && z !== 1) { e.preventDefault(); setZoom(1); }
  });
})();
