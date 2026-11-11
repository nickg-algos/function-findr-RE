// "Fill in the details below" (mockup page 11): details.html?venue=…&space=…&date=…&start=…&end=…&guests=…
// Starts from the request carried over from page 10, collects the contact details, re-checks
// everything with the shared availability rules and moves on to review and pay (page 12).
(function () {
  "use strict";

  const { esc } = window.FF_SHARED;
  const S = window.FF_SEARCH;
  const A = window.FF_AVAIL;
  const CAL = window.FF_CALENDAR;
  const $ = (sel, root = document) => root.querySelector(sel);

  // Contact details stay out of the address bar (CLAUDE.md §6, privacy); they ride along in this tab only.
  const DRAFT_KEY = "ff.bookingDraft.v1";
  const loadDraft = () => { try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY)) || {}; } catch (e) { return {}; } };
  const saveDraft = (d) => { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch (e) { /* the next page asks again */ } };

  const params = new URLSearchParams(location.search);
  const listing = S.venues.find((v) => v.id === params.get("venue")) || S.venues.find((v) => v.id === "sample");
  const venue = window.FF_VENUES[listing.id];
  const space = venue && (venue.spaces.find((s) => s.id === params.get("space")) || venue.spaces[0]);
  if (!space) {
    location.replace(`venue.html?id=${encodeURIComponent(listing.id)}`);
    return;
  }
  document.title = `Your details: ${space.name} at ${listing.name} | FunctionFindr`;

  const req = A.fromParams(params);
  const draft = loadDraft();
  const dollars = (cents) => "$" + Math.round(cents / 100).toLocaleString("en-AU");
  const popper = '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><path d="M4 28l5.500-15.500 10 10z"/><path d="M7.500 18.500l6 6M15 8.500c1-2 0-4-1.500-4.500M19.500 12.500c2.500-1.500 5-1 6.500.500M18 10l4-5M25 18l3-1M21 7l1-3M24 11l4-2"/><circle cx="21" cy="2.500" r=".9"/><circle cx="28.500" cy="13" r=".9"/><circle cx="12" cy="5" r=".9"/></svg>';
  const pin = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s-7-6.600-7-12a7 7 0 0 1 14 0c0 5.400-7 12-7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.600" fill="#fff"/></svg>';

  const times = (from, to, chosen) => {
    const out = ['<option value="">–</option>'];
    for (let m = from; m <= to; m += 30) out.push(`<option value="${m}"${m === chosen ? " selected" : ""}>${A.timeLabel(m)}</option>`);
    return out.join("");
  };
  const field = (id, label, control, cls = "") => `
    <div class="dt-field ${cls}">
      <label for="d-${id}">${label}</label>
      ${control}
      <p class="dt-err" id="d-${id}-msg"></p>
    </div>`;
  const input = (id, type, value, extra = "") => `<input id="d-${id}" type="${type}" value="${esc(value ?? "")}" aria-describedby="d-${id}-msg" ${extra}>`;
  const layoutChoice = (value, label, cap) => `
    <label class="check dt-layout${cap ? "" : " is-off"}"><input type="radio" name="layout" value="${value}"${req.layout === value || draft.layout === value ? " checked" : ""}${cap ? "" : " disabled"} aria-describedby="d-layout-msg"><span>${label}${cap ? ` <span class="dt-muted">(up to ${cap})</span>` : ` <span class="dt-muted">(not offered)</span>`}</span></label>`;

  $("#details").innerHTML = `
    <div class="dt-top">
      <div>
        <div class="av-head">${popper}<h1 class="av-title">Great news!</h1></div>
        <p class="av-lead">This space is available on the date you’ve selected.<br>To secure this space, please fill in the details below.</p>
        <p class="dt-change">You can cancel or make changes up to ${venue.changesUpToDays} days prior.</p>
      </div>
      <div class="dt-venue">
        <p class="dt-venue-name">${esc(listing.name)}</p>
        <p class="dt-address">${pin}<span>${esc(listing.street)}, ${esc(listing.suburb)}</span></p>
        <p class="dt-space">${esc(space.name)}</p>
      </div>
    </div>

    <form class="dt-form" id="details-form" novalidate>
      <div class="dt-row">
        ${field("name", "Event name:", input("name", "text", req.name || draft.eventName, 'maxlength="80" autocomplete="off"'))}
        <div class="dt-field"><span class="dt-label">Function room:</span><p class="dt-static">${esc(space.name)}</p></div>
      </div>
      <div class="dt-row">
        ${field("contact", "Contact person:", input("contact", "text", draft.contact, 'maxlength="80" autocomplete="name"'))}
        ${field("phone", "Phone number:", input("phone", "tel", draft.phone, 'autocomplete="tel" inputmode="tel"'))}
      </div>
      <div class="dt-row">
        ${field("email", "Email:", input("email", "email", draft.email, 'autocomplete="email" inputmode="email"'), "dt-wide")}
      </div>
      <div class="dt-row dt-three">
        ${field("date", "Function date:", input("date", "date", req.date, `min="${A.todayIso()}"`))}
        ${field("start", "Start time:", `<select id="d-start" aria-describedby="d-start-msg">${times(listing.opens, listing.latest - 30, req.start)}</select>`)}
        ${field("end", "End time:", `<select id="d-end" aria-describedby="d-end-msg">${times(listing.opens + 30, listing.latest, req.end)}</select>`)}
      </div>
      <div class="dt-row dt-three">
        ${field("guests", "Number of guests:", input("guests", "number", req.guests, 'min="1" step="1" inputmode="numeric"'))}
        <fieldset class="dt-field dt-layouts">
          <legend class="sr-only">Seated or standing</legend>
          ${layoutChoice("seated", "Seated", space.seated)}
          ${layoutChoice("standing", "Standing", space.standing)}
          <p class="dt-err" id="d-layout-msg"></p>
        </fieldset>
      </div>
      <p class="dt-note">All fields must be complete to secure booking.<br>Please refer to all <a href="#">Terms &amp; Conditions</a>.</p>
      <div class="dt-result" id="d-result" role="alert"></div>
      <div class="dt-actions">
        <button type="submit" class="av-btn dt-secure">Secure Booking</button>
        <p>${space.depositCents ? `A ${dollars(space.depositCents)} deposit` : "A deposit"} is required for reservation.<br>You won’t be charged yet.</p>
        <p>Once you have secured your booking you will be able to make your food, beverage and event selections.</p>
      </div>
    </form>`;

  /* ---------- Checks ---------- */

  const form = $("#details-form");
  const el = (id) => $(`#d-${id}`);
  const phoneOk = (v) => /^(?:\+?61|0)[2-478]\d{8}$/.test(v.replace(/[\s()-]/g, ""));
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  function show(id, text) {
    const msg = $(`#d-${id}-msg`);
    msg.textContent = text;
    if (id === "layout") form.querySelectorAll('input[name="layout"]').forEach((r) => r.toggleAttribute("aria-invalid", !!text));
    else el(id).toggleAttribute("aria-invalid", !!text);
    return text;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    $("#d-result").textContent = "";
    const num = (id) => (el(id).value.trim() === "" ? null : Number(el(id).value));
    const chosen = form.querySelector('input[name="layout"]:checked');
    const next = { date: el("date").value, start: num("start"), end: num("end"), guests: num("guests"), name: el("name").value.trim(), layout: chosen ? chosen.value : null };
    const contact = el("contact").value.trim();
    const phone = el("phone").value.trim();
    const email = el("email").value.trim();
    const rules = A.problems(listing, space, next);

    const order = [
      ["name", next.name ? "" : "Please give your event a name."],
      ["contact", contact ? "" : "Please enter the contact person’s name."],
      ["phone", !phone ? "Please enter a phone number." : phoneOk(phone) ? "" : "Please enter an Australian phone number, like 0412 345 678."],
      ["email", !email ? "Please enter an email address." : emailOk(email) ? "" : "Please enter an email address, like name@example.com."],
      ["date", rules.date],
      ["start", rules.start],
      ["end", rules.end],
      ["guests", rules.guests],
      ["layout", next.layout ? "" : "Please choose seated or standing."],
    ];
    const bad = order.filter(([id, text]) => show(id, text));
    if (bad.length) {
      const id = bad[0][0];
      (id === "layout" ? form.querySelector('input[name="layout"]:not([disabled])') : el(id)).focus();
      return;
    }

    const clash = A.clash(CAL, listing, space, next);
    if (clash) {
      $("#d-result").textContent = A.clashText(space, clash);
      el("date").focus();
      return;
    }

    saveDraft({ eventName: next.name, contact, phone, email, layout: next.layout });
    location.href = `mockup.html?p=12&${A.toParams(listing.id, space.id, next)}`; // TODO: page 12's own address once it's built
  });
})();
