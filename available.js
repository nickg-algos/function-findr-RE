// "Great news!" (mockup page 10): available.html?venue=…&space=…&date=…&start=…&end=…&guests=…
// Re-checks the request with the shared availability rules, shows it, and asks the customer to
// sign in or register before confirming.
(function () {
  "use strict";

  const { esc } = window.FF_SHARED;
  const S = window.FF_SEARCH;
  const A = window.FF_AVAIL;
  const CAL = window.FF_CALENDAR;
  const $ = (sel, root = document) => root.querySelector(sel);

  const params = new URLSearchParams(location.search);
  const listing = S.venues.find((v) => v.id === params.get("venue")) || S.venues.find((v) => v.id === "sample");
  const venue = window.FF_VENUES[listing.id];
  const space = venue && (venue.spaces.find((s) => s.id === params.get("space")) || venue.spaces[0]);
  if (!space) {
    location.replace(`venue.html?id=${encodeURIComponent(listing.id)}`);
    return;
  }

  // Opened without a selection (from the dev bar, say): show an example, three weeks out on a Saturday.
  let req = A.fromParams(params);
  const example = !params.has("date");
  if (example) {
    const d = new Date();
    d.setDate(d.getDate() + 21 + ((6 - d.getDay() + 7) % 7));
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    req = { date: iso, start: 1140, end: Math.min(1380, listing.latest), guests: Math.min(80, Math.max(space.seated || 0, space.standing || 0)), name: "" };
  }

  const found = A.problems(listing, space, req);
  const fieldProblem = Object.values(found).find(Boolean);
  const clash = fieldProblem ? null : A.clash(CAL, listing, space, req);
  const problem = fieldProblem || (clash && A.clashText(space, clash));
  const editHref = `space.html?${A.toParams(listing.id, space.id, req)}`;
  const nextHref = `details.html?${A.toParams(listing.id, space.id, req)}`;

  const icon = {
    popper: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><path d="M4 28l5.500-15.500 10 10z"/><path d="M7.500 18.500l6 6M15 8.500c1-2 0-4-1.500-4.500M19.500 12.500c2.500-1.500 5-1 6.500.500M18 10l4-5M25 18l3-1M21 7l1-3M24 11l4-2"/><circle cx="21" cy="2.500" r=".9"/><circle cx="28.500" cy="13" r=".9"/><circle cx="12" cy="5" r=".9"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s-7-6.600-7-12a7 7 0 0 1 14 0c0 5.400-7 12-7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.600" fill="#fff"/></svg>',
    calendar: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="23" height="21" rx="3"/><path d="M3 11h23M9 3.500v5M20 3.500v5"/><circle cx="25" cy="25" r="5" fill="#fff"/><path d="M22.800 25l1.600 1.600 2.800-3"/></svg>',
    guests: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="14" r="2.500"/><circle cx="22" cy="14" r="2.500"/><path d="M6 30v-7c0-2 2-3.500 4-3.500s4 1.500 4 3.500v7M18 30v-7c0-2 2-3.500 4-3.500s4 1.500 4 3.500v7M11 2l5 6 5-6M16 8v3"/></svg>',
    lock: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="13" width="20" height="16" rx="3"/><path d="M11 13V9a5 5 0 0 1 10 0v4"/><circle cx="16" cy="21" r=".8" fill="currentColor"/></svg>',
    userPlus: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="16" r="12"/><circle cx="14" cy="13" r="4.500"/><path d="M6.500 25c1.500-3.500 4.500-5 7.500-5s6 1.500 7.500 5"/><circle cx="25" cy="22" r="4.500" fill="currentColor" stroke="none"/><path d="M25 19.800v4.400M22.800 22h4.400" stroke="#fff" stroke-width="1.500"/></svg>',
    bookings: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="23" height="21" rx="3"/><path d="M3 11h23M9 3.500v5M20 3.500v5M8 16h.5M13 16h.5M18 16h.5M8 21h.5M13 21h.5"/><circle cx="25" cy="25" r="5" fill="#fff"/><path d="M22.800 25l1.600 1.600 2.800-3"/></svg>',
    chat: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6h22a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H15l-5 5v-5H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/></svg>',
    bell: '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22V14a8 8 0 0 1 16 0v8l3 3H5zM13 28a3 3 0 0 0 6 0M16 3v3"/></svg>',
  };

  const main = $("#available");

  if (problem) {
    document.title = `Not available | FunctionFindr`;
    main.innerHTML = `
      <h1 class="av-title av-title-bad">Sorry, this selection isn’t available</h1>
      <p class="av-lead">${esc(problem)}</p>
      <a class="av-edit" href="${esc(editHref)}">Edit Selection</a>`;
    return;
  }

  document.title = `Great news! ${space.name} at ${listing.name} | FunctionFindr`;
  const photo = space.mainPhoto || { src: space.photo, alt: space.alt };
  const field = (form, id, label, type, auto) => `
    <div class="av-field-wrap">
      <div class="av-field"><label for="${form}-${id}">${label}</label><input id="${form}-${id}" name="${id}" type="${type}" autocomplete="${auto}" aria-describedby="${form}-${id}-msg"></div>
      <p class="av-err" id="${form}-${id}-msg"></p>
    </div>`;

  main.innerHTML = `
    <div class="av-head">${icon.popper}<h1 class="av-title">Great news!</h1></div>
    <p class="av-lead">This space is available on the date you’ve selected.<br>To secure this space, please sign in or create an account.</p>
    ${example ? `<p class="av-example">This is an example selection. <a href="space.html?venue=${esc(listing.id)}&amp;space=${esc(space.id)}">Choose your own date</a>.</p>` : ""}

    <section class="av-panel" aria-labelledby="confirm-title">
      <div class="av-sel">
        <img src="${esc(photo.src)}" alt="${esc(photo.alt)}" width="372" height="372">
        <div class="av-details">
          <h2 class="av-venue">${esc(listing.name)}</h2>
          <ul class="av-facts">
            <li>${icon.pin}<span>${esc(listing.street)},<br>${esc(listing.suburb)}<span class="av-space">${esc(space.name)}</span></span></li>
            <li>${icon.calendar}<span>${A.dayName(req.date)}<br>${A.longDate(req.date)}<span class="av-time">${A.timeLabel(req.start)} – ${A.timeLabel(req.end)}</span></span></li>
            <li>${icon.guests}<span>${req.guests} Guests</span></li>
          </ul>
          ${req.name ? `<p class="av-event">Event: ${esc(req.name)}</p>` : ""}
        </div>
        <div class="av-edit-wrap">
          <a class="av-edit" href="${esc(editHref)}">Edit Selection</a>
          <p>To confirm your booking<br>Sign In/Register below</p>
        </div>
      </div>

      <h2 class="av-confirm" id="confirm-title">Confirm booking</h2>
      <div class="av-forms">
        <form class="av-card" id="signin" novalidate aria-labelledby="signin-title">
          <h3 id="signin-title">Sign In</h3>
          <p class="av-kicker">Existing Customers</p>
          <p class="av-blurb">Welcome back!<br>Sign into your account to continue your booking.</p>
          ${field("signin", "username", "Username:", "text", "username")}
          ${field("signin", "password", "Password:", "password", "current-password")}
          <button type="submit" class="av-btn">${icon.lock}Sign In</button>
        </form>
        <span class="av-or" aria-hidden="true">or</span>
        <form class="av-card" id="register" novalidate aria-labelledby="register-title">
          <h3 id="register-title">Register</h3>
          <p class="av-kicker">New Customers</p>
          <p class="av-blurb">Create a free account to complete your booking and manage enquiries.</p>
          ${field("register", "username", "Username:", "text", "username")}
          ${field("register", "password", "Password:", "password", "new-password")}
          <button type="submit" class="av-btn">${icon.userPlus}Register</button>
        </form>
      </div>
      <p class="av-demo">Demo only: accounts aren’t set up yet, so any username and password will continue. Nothing typed here is saved or sent anywhere.</p>
    </section>

    <section class="av-why" aria-labelledby="why-title">
      <h2 id="why-title">Why do I need an account?</h2>
      <ul>
        <li>${icon.bookings}<span>Manage your bookings all in one place</span></li>
        <li>${icon.chat}<span>Track enquiries and responses</span></li>
        <li>${icon.bell}<span>Receive important booking updates</span></li>
      </ul>
    </section>`;

  // TODO(confirm): real sign-in and registration need a server and the founder's decisions on
  // accounts (CLAUDE.md §9 asks before any auth work). Until then both forms only check that
  // something was typed, then carry the booking request on. Passwords never leave the page.
  ["signin", "register"].forEach((id) => {
    const form = document.getElementById(id);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let first = null;
      ["username", "password"].forEach((name) => {
        const input = form.elements[name];
        const empty = !input.value.trim();
        const text = empty ? (name === "username" ? "Please enter your username." : "Please enter your password.") : "";
        $(`#${id}-${name}-msg`).textContent = text;
        input.closest(".av-field").classList.toggle("is-bad", empty);
        input.toggleAttribute("aria-invalid", empty);
        if (empty && !first) first = input;
      });
      if (first) { first.focus(); return; }
      form.elements.password.value = "";
      location.href = nextHref;
    });
  });
})();
