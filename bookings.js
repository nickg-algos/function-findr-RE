// My Bookings summary (mockup page 6): the customer's bookings, each with a Summary drop-down
// and their checklist progress. The sample booking comes from data.js (shared with the My Bookings
// checklist page); a booking paid for in this tab (sessionStorage ff.bookingDraft.v1) is listed first.
(function () {
  "use strict";

  const { esc, miniChecklist, CHECKLIST_KEY } = window.FF_SHARED;
  const A = window.FF_AVAIL;
  const B = window.FF_DATA.booking;
  const $ = (sel) => document.querySelector(sel);

  let draft = null;
  try { draft = JSON.parse(sessionStorage.getItem("ff.bookingDraft.v1")); } catch (e) { /* only the sample booking */ }
  let done = ["function"];
  try { const saved = JSON.parse(localStorage.getItem(CHECKLIST_KEY)); if (saved && saved.done) done = saved.done; } catch (e) { /* Function Details only */ }

  const bookings = [];
  if (draft && draft.deposit && draft.booking) {
    const b = draft.booking;
    bookings.push({
      title: draft.eventName || b.name || "Your function", venue: b.venue, photo: b.photo, address: b.address, space: b.space,
      date: `${A.dayName(b.date)} ${A.longDate(b.date)}`, time: `${A.timeLabel(b.start)} – ${A.timeLabel(b.end)}`,
      guests: `${b.guests} guests${b.layout ? `, ${b.layout}` : ""}`, contact: draft.contact, phone: draft.phone, email: draft.email,
      status: "Confirmed – Deposit Received (demo)", done: ["function"], href: "my-bookings.html?p=14", isNew: true,
    });
  }
  bookings.push({
    title: B.eventName, venue: B.venue, photo: "assets/sample-hotel.jpg", address: B.addressLines.join(" ").replace(/,\s*$/, ""), space: B.space,
    date: B.dateLines.join(" "), time: `${B.time} – ${B.endTime}`, guests: `${B.guests} guests, ${B.layout.toLowerCase()}`,
    contact: B.contact, phone: B.phone, email: B.email, status: "Confirmed – Deposit Received", done, href: "my-bookings.html?p=7", isNew: false,
  });

  const chevron = '<svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const row = (label, value) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`;

  $("#bk-list").innerHTML = bookings.map((b, i) => `
    <article class="bk" aria-labelledby="bk-${i}">
      <div class="bk-top">
        <img src="${esc(b.photo)}" alt="" width="310" height="310">
        <div class="bk-info">
          <h2 id="bk-${i}">${esc(b.title)}${b.isNew ? ' <span class="bk-new">New</span>' : ""}</h2>
          <p class="bk-venue">${esc(b.venue)}</p>
          <p class="bk-when">${esc(b.date)}<br>${esc(b.time)}<br>${esc(b.guests)}</p>
          <p class="bk-status">${esc(b.status)}</p>
          ${miniChecklist(b.done)}
          <a class="bk-details" href="${esc(b.href)}">Choose event details ${chevron}</a>
        </div>
      </div>
      <button type="button" class="bk-toggle" aria-expanded="false" aria-controls="bk-sum-${i}">${chevron}<span>Summary</span></button>
      <div class="fold" id="bk-sum-${i}"><div class="fold-inner">
        <dl class="bk-sum">
          ${row("Event name", b.title)}
          ${row("Venue", `${b.venue}, ${b.address}`)}
          ${row("Function room", b.space)}
          ${row("Date", b.date)}
          ${row("Time", b.time)}
          ${row("Guests", b.guests)}
          ${row("Contact person", b.contact)}
          ${row("Phone number", b.phone)}
          ${row("Email", b.email)}
        </dl>
      </div></div>
    </article>`).join("");

  document.addEventListener("click", (e) => {
    const t = e.target.closest(".bk-toggle");
    if (t) {
      const open = t.getAttribute("aria-expanded") !== "true";
      t.setAttribute("aria-expanded", String(open));
      document.getElementById(t.getAttribute("aria-controls")).classList.toggle("is-open", open);
    }
    if (e.target.closest('a[href="#"]')) e.preventDefault();
  });
})();
