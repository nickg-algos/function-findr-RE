(function () {
  "use strict";

  const D = window.FF_CALENDAR;
  const { esc, CHECKLIST_KEY, checklistSteps } = window.FF_SHARED;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  let view = "space";
  let spaceFilter = "";

  const tickIcon = '<svg class="tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.500l3.200 3.200L13 4.800" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // A live booking's progress comes from the My Bookings page; the rest are sample data.
  function progressOf(booking) {
    if (booking.live) {
      try {
        const saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY));
        if (saved) return saved;
      } catch (e) { /* nothing saved, or storage blocked */ }
    }
    return { done: booking.done, items: booking.items };
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

  function bookingCard(booking, spaceName) {
    const { done, items } = progressOf(booking);
    return `<article class="cal-card">
      <p class="cal-when">${esc(booking.date)}<br>${esc(booking.time)}</p>
      <h3>${esc(booking.title)}</h3>
      ${spaceName ? `<p class="cal-space">${esc(spaceName)}</p>` : ""}
      <p>${booking.guests} Guests</p>
      ${items.length ? items.map((item) => `<p>${esc(item)}</p>`).join("") : '<p class="cal-none">No selections yet</p>'}
      <p><a href="#"><u>Guest Contact details</u></a></p>
      ${miniChecklist(done)}
    </article>`;
  }

  const column = (title, cards) => `<section class="cal-col" aria-label="${esc(title)}">
      <h2>${esc(title)}</h2>
      ${cards.join("") || '<p class="cal-empty">No bookings yet</p>'}
    </section>`;

  const visibleSpaces = () => D.spaces.filter((s) => !spaceFilter || s.id === spaceFilter);

  function bySpace() {
    return visibleSpaces().map((s) => column(s.name, s.bookings.map((b) => bookingCard(b))));
  }

  function byDate() {
    const days = new Map();
    visibleSpaces().forEach((s) => s.bookings.forEach((b) => {
      const key = b.iso.slice(0, 10);
      if (!days.has(key)) days.set(key, { date: b.date, rows: [] });
      days.get(key).rows.push({ b, space: s.name });
    }));
    return [...days.keys()].sort().map((key) => {
      const day = days.get(key);
      const rows = day.rows.sort((x, y) => x.b.iso.localeCompare(y.b.iso));
      return column(day.date, rows.map((r) => bookingCard(r.b, r.space)));
    });
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
  }

  function step(direction) {
    const track = $("#cal-columns");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (track.firstElementChild.offsetWidth + gap), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

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
  window.addEventListener("storage", (e) => { if (e.key === CHECKLIST_KEY) render($("#cal-columns").scrollLeft); });
  window.addEventListener("pageshow", (e) => { if (e.persisted) render($("#cal-columns").scrollLeft); });
  render();
})();
