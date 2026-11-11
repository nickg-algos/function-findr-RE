// One wishlist's venues (mockup page 5): wishlist.html?list=<id>.
// Lists live in the search page's store (localStorage ff.search.v2); the cards use search's styles.
// Here the heart takes a venue off this list, with an undo.
(function () {
  "use strict";

  const { esc } = window.FF_SHARED;
  const S = window.FF_SEARCH;
  const $ = (sel) => document.querySelector(sel);
  const STORE_KEY = "ff.search.v2";
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
  const longDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${ordinal(d)} ${MONTHS[m - 1]} ${y}`; };

  let wishlists;
  try { wishlists = JSON.parse(localStorage.getItem(STORE_KEY)).wishlists; } catch (e) { wishlists = S.wishlists.map((l) => ({ ...l, venues: [...l.venues] })); }
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify({ wishlists })); } catch (e) { /* works for this visit */ } };

  const list = wishlists.find((l) => l.id === new URLSearchParams(location.search).get("list"));
  const main = $("#wishlist");
  const back = '<a class="ws-back" href="welcome.html"><span aria-hidden="true">&lt;</span> Back to wishlists</a>';

  if (!list) {
    document.title = "Wishlist not found | FunctionFindr";
    main.innerHTML = `<h1 class="ws-title">We couldn’t find that wishlist</h1><p class="ws-empty">It may have been removed in another tab.</p>${back}`;
    return;
  }
  document.title = `${list.name} | FunctionFindr`;

  const heartPath = "M12 21s-8.500-5.100-10.400-10C.300 7.300 2.700 4 6.200 4c2.300 0 4.300 1.300 5.800 3.500C13.500 5.300 15.500 4 17.800 4c3.500 0 5.900 3.300 4.600 7-1.900 4.900-10.400 10-10.400 10z";
  const venue = (id) => S.venues.find((v) => v.id === id);
  let lastRemoved = null;

  const card = (v) => `
    <article class="v-card" data-venue="${esc(v.id)}">
      <div class="v-photo">
        <img src="assets/venue-${v.photo}.jpg" alt="Inside ${esc(v.name)}" loading="lazy">
        ${v.verified ? '<span class="v-badge">Verified Venue</span>' : ""}
        <button type="button" class="v-heart is-on" data-remove="${esc(v.id)}" aria-label="Remove ${esc(v.name)} from ${esc(list.name)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${heartPath}"/></svg>
        </button>
      </div>
      <div class="v-top">
        <div>
          <h2 class="ws-name"><a href="venue.html?id=${esc(v.id)}">${esc(v.name)}</a></h2>
          <p class="v-address"><svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1a5 5 0 0 0-5 5c0 3.600 5 9 5 9s5-5.400 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>${esc(v.street)}, ${esc(v.suburb)}</p>
        </div>
        <div class="v-score">
          <span class="v-rating" aria-label="Rated ${v.rating} out of 5"><span class="v-star" aria-hidden="true">★</span><span aria-hidden="true">${v.rating.toFixed(1)}</span></span>
        </div>
      </div>
      <p class="v-about">${esc(v.about)}</p>
      <p class="v-cap"><span>Max Seated: ${v.seated}</span><span>Max Standing: ${v.standing}</span></p>
    </article>`;

  function render() {
    const venues = list.venues.map(venue).filter(Boolean);
    main.innerHTML = `
      <h1 class="ws-title">${esc(list.name)}</h1>
      ${list.date ? `<p class="ws-meta">${longDate(list.date)}</p>` : ""}
      ${list.guests ? `<p class="ws-meta">${list.guests} people</p>` : ""}
      <p class="ws-count">${venues.length ? `Showing 1-${venues.length} of ${venues.length} result${venues.length === 1 ? "" : "s"}` : ""}</p>
      <div class="ws-undo" id="ws-undo" role="status">${lastRemoved ? `${esc(venue(lastRemoved.id).name)} removed. <button type="button" id="ws-undo-btn">Undo</button>` : ""}</div>
      ${venues.length ? `<div class="v-grid">${venues.map(card).join("")}</div>` : `<p class="ws-empty">No venues saved yet. <a href="search.html">Find venues</a> and tap the heart to add them here.</p>`}
      ${back}`;
  }
  render();

  document.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-remove]");
    if (rm) {
      const id = rm.dataset.remove;
      lastRemoved = { id, at: list.venues.indexOf(id) };
      list.venues = list.venues.filter((x) => x !== id);
      save();
      render();
      $("#ws-undo-btn").focus();
      return;
    }
    if (e.target.closest("#ws-undo-btn") && lastRemoved) {
      list.venues.splice(lastRemoved.at, 0, lastRemoved.id);
      const id = lastRemoved.id;
      lastRemoved = null;
      save();
      render();
      $("#ws-undo").textContent = `${venue(id).name} is back on the list.`;
      const btn = document.querySelector(`[data-remove="${id}"]`);
      if (btn) btn.focus();
    }
    if (e.target.closest('a[href="#"]')) e.preventDefault();
  });
})();
