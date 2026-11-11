// "Review & Pay" (mockup page 12): pay.html?venue=…&space=…&date=…&start=…&end=…&guests=…&layout=…
// Shows the booking with the contact details from page 11 and takes the deposit.
// DEMO ONLY: no payment is taken and card details never leave the page (CLAUDE.md §9 asks before
// any payment flow). TODO(confirm): Stripe (Connect) for real deposits; whether the deposit includes
// GST and needs a tax invoice; and any card surcharge, which must be shown up front (CLAUDE.md §6).
(function () {
  "use strict";

  const { esc } = window.FF_SHARED;
  const S = window.FF_SEARCH;
  const A = window.FF_AVAIL;
  const CAL = window.FF_CALENDAR;
  const $ = (sel, root = document) => root.querySelector(sel);

  const DRAFT_KEY = "ff.bookingDraft.v1";
  const loadDraft = () => { try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY)) || null; } catch (e) { return null; } };
  const saveDraft = (d) => { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch (e) { /* not needed to continue */ } };

  const params = new URLSearchParams(location.search);
  const listing = S.venues.find((v) => v.id === params.get("venue")) || S.venues.find((v) => v.id === "sample");
  const venue = window.FF_VENUES[listing.id];
  const space = venue && (venue.spaces.find((s) => s.id === params.get("space")) || venue.spaces[0]);
  if (!space) {
    location.replace(`venue.html?id=${encodeURIComponent(listing.id)}`);
    return;
  }

  // Opened without a booking (from the dev bar, say): show a clearly marked, fictional example.
  const example = !params.has("date");
  let req = A.fromParams(params);
  let draft = loadDraft();
  if (example) {
    const d = new Date();
    d.setDate(d.getDate() + 21 + ((6 - d.getDay() + 7) % 7));
    req = { date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, start: 1140, end: Math.min(1380, listing.latest), guests: Math.min(80, space.standing || space.seated), name: "Sam’s 40th Birthday", layout: space.standing ? "standing" : "seated" };
    draft = { eventName: req.name, contact: "Sam Sample", phone: "0491 570 156", email: "sam.sample@example.com", layout: req.layout };
  }

  const detailsHref = `details.html?${A.toParams(listing.id, space.id, req)}`;
  const main = $("#pay");
  const back = `<a class="pay-back" href="${esc(detailsHref)}" aria-label="Back to your details"><svg viewBox="0 0 10 16" aria-hidden="true"><path d="M8 2L2 8l6 6" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`;
  const stop = (title, text, linkText) => {
    document.title = `${title} | FunctionFindr`;
    main.innerHTML = `<div class="pay-head">${back}<h1>${esc(title)}</h1></div><p class="pay-stop">${esc(text)}</p><a class="pay-stop-link" href="${esc(detailsHref)}">${esc(linkText)}</a>`;
  };

  const found = A.problems(listing, space, req);
  const problem = Object.values(found).find(Boolean) || (!req.layout && "Please choose seated or standing.");
  const clash = problem ? null : A.clash(CAL, listing, space, req);
  if (problem || clash) { stop("Review & Pay", problem || A.clashText(space, clash), "Go back to your details"); return; }
  if (!draft || !draft.contact || !draft.phone || !draft.email) { stop("Review & Pay", "We need the contact person’s details before you pay the deposit.", "Fill in your details"); return; }

  document.title = `Review & Pay: ${space.name} at ${listing.name} | FunctionFindr`;
  const deposit = space.depositCents || 0;
  const photo = space.mainPhoto || { src: space.photo, alt: space.alt };
  const row = (label, value) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`;
  const field = (id, label, extra, cls = "") => `
    <div class="pay-field ${cls}">
      <label for="c-${id}">${label}</label>
      <input id="c-${id}" ${extra} aria-describedby="c-${id}-msg">
      <p class="pay-err" id="c-${id}-msg"></p>
    </div>`;

  main.innerHTML = `
    <div class="pay-head">${back}<h1>Review &amp; Pay</h1></div>
    ${example ? `<p class="av-example">This is an example booking. <a href="space.html?venue=${esc(listing.id)}&amp;space=${esc(space.id)}">Start your own</a>.</p>` : ""}
    <div class="pay-layout">
      <section class="pay-summary" aria-labelledby="summary-title">
        <h2 id="summary-title">Summary</h2>
        <dl>
          ${row("Event name:", draft.eventName || req.name)}
          ${row("Function room:", space.name)}
          <div class="pay-pair">${row("Contact person:", draft.contact)}${row("Phone number:", draft.phone)}</div>
          ${row("Email:", draft.email)}
          ${row("Function date:", `${A.dayName(req.date)} ${A.longDate(req.date)}`)}
          <div class="pay-pair">${row("Start time:", A.timeLabel(req.start))}${row("End time:", A.timeLabel(req.end))}</div>
          <div class="pay-pair">${row("Number of guests:", String(req.guests))}${row("Layout:", req.layout === "seated" ? "Seated" : "Standing")}</div>
        </dl>
        <a class="pay-change" href="${esc(detailsHref)}"><svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round"/></svg>Make changes</a>
      </section>

      <section class="pay-main" aria-labelledby="deposit-title">
        <img src="${esc(photo.src)}" alt="${esc(photo.alt)}" width="840" height="420">
        <h2 id="deposit-title">Pay deposit ${deposit ? `$${(deposit / 100).toFixed(2)}` : ""}</h2>
        <p class="pay-demo"><strong>Demo only.</strong> No payment is taken, and card details aren’t saved or sent anywhere. Try 4242 4242 4242 4242 with any future expiry.</p>
        <form class="pay-form" id="pay-form" novalidate autocomplete="off">
          ${field("number", "Card number", 'type="text" inputmode="numeric" maxlength="23" placeholder="1234 5678 9012 3456"', "pay-wide")}
          ${field("name", "Name on card", 'type="text" maxlength="80"', "pay-wide")}
          ${field("expiry", "Expiry date", 'type="text" inputmode="numeric" maxlength="7" placeholder="MM/YY"')}
          ${field("cvc", "CVC", 'type="text" inputmode="numeric" maxlength="4" placeholder="123"')}
          <div class="pay-result" id="c-result" role="alert"></div>
          <button type="submit" class="pay-go">Book my function</button>
          <p class="pay-after">Once your deposit has been received you will proceed to making your food, beverage and event selections.</p>
        </form>
      </section>
    </div>`;

  /* ---------- Card checks (format only, in card.js; nothing is charged) ---------- */

  const el = (id) => $(`#c-${id}`);
  window.FF_CARD.tidy(el("number"), el("expiry"), el("cvc"));

  $("#pay-form").addEventListener("submit", (e) => {
    e.preventDefault();
    $("#c-result").textContent = "";
    const checks = window.FF_CARD.problems({ number: el("number").value, name: el("name").value, expiry: el("expiry").value, cvc: el("cvc").value });
    const bad = checks.filter(([id, text]) => {
      $(`#c-${id}-msg`).textContent = text;
      el(id).toggleAttribute("aria-invalid", !!text);
      return text;
    });
    if (bad.length) { el(bad[0][0]).focus(); return; }

    // Someone else may have taken the date while this page was open.
    const late = A.clash(CAL, listing, space, req);
    if (late) { $("#c-result").textContent = A.clashText(space, late); return; }

    ["number", "name", "expiry", "cvc"].forEach((id) => { el(id).value = ""; }); // never kept
    // The booking itself rides along too, so My Bookings (page 6) can list it in this tab.
    saveDraft({ ...draft, deposit: "demo", booking: { venueId: listing.id, venue: listing.name, address: `${listing.street}, ${listing.suburb}`, space: space.name, photo: (space.mainPhoto || { src: space.photo }).src, ...req } });
    location.href = `confirmed.html?${A.toParams(listing.id, space.id, req)}`;
  });
})();
