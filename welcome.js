// "Welcome, …" (mockup page 4): the customer's wishlists and bookings.
// Wishlists share the search page's store (localStorage ff.search.v2), so a list made here shows up
// under the hearts on search and the other way round. The name comes from sign-up (ff.customer.v1).
(function () {
  "use strict";

  const { esc } = window.FF_SHARED;
  const S = window.FF_SEARCH;
  const B = window.FF_DATA.booking;
  const $ = (sel) => document.querySelector(sel);
  const STORE_KEY = "ff.search.v2";

  let wishlists;
  try { wishlists = JSON.parse(localStorage.getItem(STORE_KEY)).wishlists; } catch (e) { wishlists = S.wishlists.map((l) => ({ ...l, venues: [...l.venues] })); }
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify({ wishlists })); return true; } catch (e) { return false; } };

  let who = {};
  try { who = JSON.parse(sessionStorage.getItem("ff.customer.v1")) || {}; } catch (e) { /* general greeting */ }
  const first = (who.name || "").split(/\s+/)[0] || who.username || "";
  $("#wl-title").textContent = first ? `Welcome, ${first}` : "Welcome back";
  document.title = `${first ? `Welcome, ${first}` : "Welcome back"} | FunctionFindr`;

  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8.5-5.100-10.400-10C.300 7.300 2.700 4 6.200 4c2.300 0 4.300 1.300 5.800 3.500C13.500 5.300 15.500 4 17.800 4c3.500 0 5.900 3.300 4.600 7-1.900 4.900-10.400 10-10.400 10z"/></svg>';
  const venue = (id) => S.venues.find((v) => v.id === id);

  function render() {
    $("#wl-lists").innerHTML = wishlists.map((l) => {
      const v = venue(l.venues[0]);
      return `
        <li>
          <a class="wl-card" href="wishlist.html?list=${encodeURIComponent(l.id)}">
            <span class="wl-photo">${v ? `<img src="assets/venue-${v.photo}.jpg" alt="" loading="lazy">` : ""}<span class="wl-heart">${heart}</span></span>
            <span class="wl-name">${esc(l.name)}</span>
            <span class="wl-count">${l.venues.length} saved</span>
          </a>
        </li>`;
    }).join("") + `
        <li>
          <button type="button" class="wl-card wl-new" id="wl-new" aria-haspopup="dialog">
            <span class="wl-photo wl-new-photo"><img src="assets/wishlist-new.jpg" alt=""></span>
            <span class="wl-name">Create a new Wishlist</span>
          </button>
        </li>`;
  }
  render();

  // My Bookings: the booking from data.js, shared with the My Bookings page.
  $("#wl-bookings").innerHTML = `
    <li>
      <a class="wl-card" href="bookings.html">
        <span class="wl-photo"><img src="assets/sample-hotel.jpg" alt="" loading="lazy"></span>
        <span class="wl-name">${esc(B.eventName)}</span>
        <span class="wl-venue">${esc(B.venue)}</span>
        <span class="wl-count">${esc(B.dateLines[1])}<br>${esc(B.time)} – ${esc(B.endTime)}</span>
      </a>
    </li>`;

  /* ---------- Create a new Wishlist ---------- */

  const box = $("#wl-box");
  document.addEventListener("click", (e) => {
    if (e.target.closest("#wl-new")) {
      $("#wl-name").value = "";
      $("#wl-msg").textContent = "";
      box.showModal();
    }
    if (e.target === box || e.target.closest("[data-close]")) box.close();
    if (e.target.closest('a[href="#"]')) e.preventDefault();
  });
  $("#wl-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#wl-name").value.trim();
    $("#wl-msg").textContent = name ? "" : "Please give your wishlist a name.";
    $("#wl-name").toggleAttribute("aria-invalid", !name);
    if (!name) { $("#wl-name").focus(); return; }
    wishlists.push({ id: `list-${Date.now().toString(36)}`, name, venues: [] });
    const kept = save();
    box.close();
    render();
    $("#wl-live").textContent = kept ? `${name} created. Heart venues on search to add them.` : `${name} created, but it can’t be saved in this browser.`;
    $("#wl-new").focus();
  });
})();
