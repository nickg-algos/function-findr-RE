(function () {
  "use strict";

  const D = window.FF_SEARCH;
  const { esc } = window.FF_SHARED;
  const STORE_KEY = "ff.search.v2";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- State ---------- */

  const chevronIcon = '<svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const emptySearch = { date: "", start: null, end: null, guests: null, price: null };
  const anyOfIds = new Set(D.filterGroups.flatMap((g) => g.sets).filter((s) => s.anyOf).flatMap((s) => s.items.map(([id]) => id)));

  let applied = { ...emptySearch };
  let appliedFilters = new Set();
  let draftFilters = new Set();
  let sort = "distance";
  let visible = D.pageSize;
  let activeVenue = null;
  let wishlists = [];
  let wishFor = null;
  let toastTimer;
  const filterSecOpen = {};

  function loadWishlists() {
    try {
      wishlists = JSON.parse(localStorage.getItem(STORE_KEY)).wishlists;
    } catch (e) { wishlists = D.wishlists.map((l) => ({ ...l, venues: [...l.venues] })); /* nothing saved, or storage blocked */ }
  }
  function saveWishlists() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ wishlists }));
    } catch (e) { /* the page still works without storage */ }
  }
  const isSaved = (id) => wishlists.some((l) => l.venues.includes(id));
  const venueById = (id) => D.venues.find((v) => v.id === id);

  /* ---------- Search rules ---------- */

  const timeLabel = (mins) => {
    const m = mins % 1440;
    const h = Math.floor(m / 60);
    return `${h % 12 || 12}.${String(m % 60).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
  };
  const weekday = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).getDay();
  };
  const hasFeature = (venue, id) => venue.type === id || venue.features.includes(id);

  // TODO(confirm): guests count against the bigger of seated or standing, as the search bar doesn't ask for a layout.
  function matches(venue, search, filters) {
    if (venue.distanceKm > D.nearKm) return false;
    if (search.date && venue.closed.includes(weekday(search.date))) return false;
    if (search.start !== null && search.start < venue.opens) return false;
    if (search.end !== null && search.end > venue.latest) return false;
    if (search.guests !== null && search.guests > Math.max(venue.seated, venue.standing)) return false;
    if (search.price !== null && venue.price > search.price) return false;
    // Venue Type is any-of, because a venue only has one; every other ticked filter must apply.
    const types = [...filters].filter((id) => anyOfIds.has(id));
    if (types.length && !types.includes(venue.type)) return false;
    return [...filters].filter((id) => !anyOfIds.has(id)).every((id) => hasFeature(venue, id));
  }

  const sorters = {
    distance: (a, b) => a.distanceKm - b.distanceKm,
    priceLow: (a, b) => a.price - b.price || a.distanceKm - b.distanceKm,
    priceHigh: (a, b) => b.price - a.price || a.distanceKm - b.distanceKm,
    rating: (a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm,
    capacity: (a, b) => Math.max(b.seated, b.standing) - Math.max(a.seated, a.standing),
  };

  const resultsFor = (search, filters) => D.venues.filter((v) => matches(v, search, filters));

  function readForm() {
    const num = (id) => {
      const v = $(id).value;
      return v === "" ? null : Number(v);
    };
    return { date: $("#s-date").value, start: num("#s-start"), end: num("#s-end"), guests: num("#s-guests"), price: num("#s-price") };
  }

  function searchProblem(s) {
    if (s.start !== null && s.end !== null && s.end <= s.start) return "End time needs to be after the start time.";
    if (s.guests !== null && (!Number.isInteger(s.guests) || s.guests < 1)) return "Please enter a whole number of guests.";
    if (s.date) {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (s.date < today) return "Please choose a date from today onwards.";
    }
    return "";
  }

  /* ---------- Markup ---------- */

  const heartPath = "M12 21s-8.5-5.1-10.4-10C.3 7.300 2.700 4 6.200 4c2.300 0 4.300 1.300 5.800 3.500C13.500 5.300 15.500 4 17.800 4c3.500 0 5.900 3.300 4.600 7-1.900 4.900-10.400 10-10.400 10z";

  function priceMark(level) {
    return `<span class="v-price" aria-label="Price level ${level} of 5"><span aria-hidden="true"><b>${"$".repeat(level)}</b>${"$".repeat(5 - level)}</span></span>`;
  }

  const heartLabel = (v) => (isSaved(v.id) ? `${v.name} is in your wishlist. Change where it’s saved` : `Save ${v.name} to a wishlist`);

  function cardHtml(v) {
    const on = isSaved(v.id);
    return `<article class="v-card${activeVenue === v.id ? " is-active" : ""}" data-venue="${v.id}">
      <div class="v-photo">
        <img src="assets/venue-${v.photo}.jpg" alt="Inside ${esc(v.name)}" loading="lazy">
        ${v.verified ? '<span class="v-badge">Verified Venue</span>' : ""}
        <button type="button" class="v-heart${on ? " is-on" : ""}" data-heart="${v.id}" aria-haspopup="dialog" aria-label="${esc(heartLabel(v))}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${heartPath}"/></svg>
        </button>
      </div>
      <div class="v-top">
        <div>
          <h3><a href="#">${esc(v.name)}</a></h3>
          <p class="v-address"><svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1a5 5 0 0 0-5 5c0 3.600 5 9 5 9s5-5.400 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>${esc(v.street)}, ${esc(v.suburb)}</p>
        </div>
        <div class="v-score">
          ${priceMark(v.price)}
          <span class="v-rating" aria-label="Rated ${v.rating} out of 5"><span class="v-star" aria-hidden="true">★</span><span aria-hidden="true">${v.rating.toFixed(1)}</span></span>
        </div>
      </div>
      <p class="v-about">${esc(v.about)}</p>
      <p class="v-cap"><span>Max Seated: ${v.seated}</span><span>Max Standing: ${v.standing}</span></p>
    </article>`;
  }

  /* ---------- Render ---------- */

  const mainResults = () => resultsFor(applied, appliedFilters).sort(sorters[sort]);

  function renderResults() {
    const main = mainResults();
    const shown = main.slice(0, visible);
    $("#results").innerHTML = shown.map(cardHtml).join("");
    $("#result-count").textContent = main.length
      ? `Showing 1-${shown.length} of ${main.length} result${main.length === 1 ? "" : "s"}`
      : "No venues match your search";
    $("#no-results").hidden = main.length > 0;
    $("#show-more").hidden = shown.length >= main.length;

    const ids = new Set(main.map((v) => v.id));
    const also = D.venues.filter((v) => !ids.has(v.id)).sort(sorters.distance).slice(0, D.alsoCount);
    $("#also-section").hidden = also.length === 0;
    $("#also").innerHTML = also.map(cardHtml).join("");

    $("#map-pins").innerHTML = main.filter((v) => v.pin).map((v) => `
      <button type="button" class="map-pin${activeVenue === v.id ? " is-active" : ""}" data-pin="${v.id}" style="left:${v.pin[0]}%;top:${v.pin[1]}%" aria-label="Show ${esc(v.name)}">
        <svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 1C5.900 1 1 5.800 1 11.700 1 19.500 12 31 12 31s11-11.500 11-19.300C23 5.800 18.100 1 12 1z"/><circle cx="12" cy="11.500" r="4"/></svg>
        <span class="map-tip">${esc(v.name)}</span>
      </button>`).join("");
  }

  function renderFilters() {
    $("#filter-groups").innerHTML = D.filterGroups.map((g) => `
      <section class="f-group">
        <h3><button type="button" class="sec-head" data-filter-sec="${g.id}" aria-expanded="false" aria-controls="f-${g.id}">
          <span class="card-title">${esc(g.title)}</span>
          <span class="card-sum" data-filter-sum="${g.id}"></span>
          ${chevronIcon}
        </button></h3>
        <div class="fold" id="f-${g.id}"><div class="fold-inner"><div class="f-body">
          ${g.sets.map((s) => `${s.title ? `<p class="f-sub">${esc(s.title)}</p>` : ""}
            <div class="f-grid">${s.items.map(([id, label]) => `<label class="check"><input type="checkbox" data-filter="${id}"><span>${esc(label)}</span></label>`).join("")}</div>`).join("")}
        </div></div></div>
      </section>`).join("");
  }

  function syncFilters() {
    $$("[data-filter]").forEach((el) => { el.checked = draftFilters.has(el.dataset.filter); });
    D.filterGroups.forEach((g) => {
      const n = g.sets.flatMap((s) => s.items).filter(([id]) => draftFilters.has(id)).length;
      $(`[data-filter-sum="${g.id}"]`).textContent = n ? `${n} selected` : "";
    });
    $$("[data-filter-sec]").forEach((btn) => {
      const open = !!filterSecOpen[btn.dataset.filterSec];
      btn.setAttribute("aria-expanded", String(open));
      $(`#f-${btn.dataset.filterSec}`).classList.toggle("is-open", open);
    });
    const n = resultsFor(readForm(), draftFilters).length;
    $("#show-results").textContent = `Show ${n} result${n === 1 ? "" : "s"}`;
    $("#filter-value").textContent = appliedFilters.size ? `${appliedFilters.size} selected` : "Any";
  }

  /* ---------- Filter panel ---------- */

  function setPanel(open) {
    const panel = $("#filter-panel");
    if (open === !panel.hidden) return;
    panel.hidden = !open;
    $("#filter-open").setAttribute("aria-expanded", String(open));
    if (open) {
      draftFilters = new Set(appliedFilters);
      syncFilters();
      $("#filter-close").focus();
    }
  }

  /* ---------- My Wishlist box ---------- */

  function renderWishFrames() {
    $("#wish-venue").textContent = venueById(wishFor).name;
    $("#wish-frames").innerHTML = wishlists.map((l) => {
      const saved = l.venues.includes(wishFor);
      const latest = venueById(l.venues[l.venues.length - 1]);
      return `<button type="button" class="w-frame${saved ? " is-saved" : ""}" data-wish="${l.id}" aria-pressed="${saved}">
        <span class="w-photo">
          ${latest ? `<img src="assets/venue-${latest.photo}.jpg" alt="">` : ""}
          <svg class="w-heart" viewBox="0 0 24 24" aria-hidden="true"><path d="${heartPath}"/></svg>
        </span>
        <span class="w-name">${esc(l.name)}</span>
        <span class="w-count">${l.venues.length} saved${saved ? " · Saved here" : ""}</span>
      </button>`;
    }).join("") + `<button type="button" class="w-frame w-new" data-wish-new aria-expanded="${!$("#wish-create").hidden}" aria-controls="wish-create">
        <span class="w-photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${heartPath}"/></svg></span>
        <span class="w-name">Create a new Wishlist</span>
      </button>`;
  }

  function openWishBox(id) {
    wishFor = id;
    $("#wish-create").hidden = true;
    $("#wish-name").value = "";
    $("#wish-msg").textContent = "";
    renderWishFrames();
    $("#wish-box").showModal();
  }

  function syncHeart(id) {
    $$(`[data-heart="${id}"]`).forEach((el) => {
      el.classList.toggle("is-on", isSaved(id));
      el.setAttribute("aria-label", heartLabel(venueById(id)));
    });
  }

  function showToast(text) {
    const el = $("#wish-toast");
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; el.textContent = ""; }, 3500);
  }

  function saveToList(list) {
    list.venues.push(wishFor);
    saveWishlists();
    syncHeart(wishFor);
    $("#wish-box").close();
    showToast(`${venueById(wishFor).name} saved to ${list.name}`);
  }

  function setActive(id) {
    if (activeVenue === id) return;
    activeVenue = id;
    $$("[data-venue]").forEach((el) => el.classList.toggle("is-active", el.dataset.venue === id));
    $$("[data-pin]").forEach((el) => el.classList.toggle("is-active", el.dataset.pin === id));
  }

  function runSearch() {
    const search = readForm();
    const problem = searchProblem(search);
    $("#search-msg").textContent = problem;
    if (problem) return false;
    applied = search;
    visible = D.pageSize;
    renderResults();
    syncFilters();
    return true;
  }

  /* ---------- Events ---------- */

  function onClick(e) {
    if (e.target.closest('a[href="#"]')) e.preventDefault();

    const panel = $("#filter-panel");
    if (!panel.hidden && !e.target.closest("#filter-panel") && !e.target.closest("#filter-open")) setPanel(false);

    const heart = e.target.closest("[data-heart]");
    if (heart) {
      openWishBox(heart.dataset.heart);
      return;
    }

    if (e.target.closest("#wish-close") || e.target === $("#wish-box")) {
      $("#wish-box").close();
      return;
    }

    const frame = e.target.closest("[data-wish]");
    if (frame) {
      const list = wishlists.find((l) => l.id === frame.dataset.wish);
      if (list.venues.includes(wishFor)) {
        // Already in this frame, so clicking takes it out and leaves the box open.
        list.venues.splice(list.venues.indexOf(wishFor), 1);
        saveWishlists();
        syncHeart(wishFor);
        renderWishFrames();
        $(`[data-wish="${list.id}"]`).focus();
      } else {
        saveToList(list);
      }
      return;
    }

    if (e.target.closest("[data-wish-new]")) {
      $("#wish-create").hidden = false;
      renderWishFrames();
      $("#wish-name").focus();
      return;
    }

    if (e.target.closest("#filter-open")) { setPanel(panel.hidden); return; }
    if (e.target.closest("#filter-close")) { setPanel(false); $("#filter-open").focus(); return; }

    const sec = e.target.closest("[data-filter-sec]");
    if (sec) {
      filterSecOpen[sec.dataset.filterSec] = !filterSecOpen[sec.dataset.filterSec];
      syncFilters();
      return;
    }

    if (e.target.closest("#filter-clear")) {
      draftFilters = new Set();
      syncFilters();
      return;
    }

    if (e.target.closest("#show-results")) {
      appliedFilters = new Set(draftFilters);
      if (runSearch()) {
        setPanel(false);
        $("#filter-open").focus();
      }
      return;
    }

    if (e.target.closest("#clear-all")) {
      $("#search-form").reset();
      appliedFilters = new Set();
      draftFilters = new Set();
      runSearch();
      $("#s-date").focus();
      return;
    }

    if (e.target.closest("#show-more")) {
      const first = visible;
      visible += D.pageSize;
      renderResults();
      const next = $$("#results h3 a")[first];
      if (next) next.focus();
      return;
    }

    const pin = e.target.closest("[data-pin]");
    if (pin) {
      const id = pin.dataset.pin;
      const index = mainResults().findIndex((v) => v.id === id);
      if (index >= visible) {
        visible = index + 1;
        renderResults();
      }
      setActive(id);
      const card = $(`#results [data-venue="${id}"]`);
      card.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      return;
    }

    if (e.target.closest("#map-toggle")) {
      const map = $("#map-column");
      const open = map.classList.toggle("is-open");
      const btn = $("#map-toggle");
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Hide map" : "Show map";
      return;
    }

    const arrow = e.target.closest("[data-review-step]");
    if (arrow) {
      const track = $("#reviews");
      const card = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: Number(arrow.dataset.reviewStep) * (card.offsetWidth + gap), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }

  function syncReviewArrows() {
    const track = $("#reviews");
    const max = track.scrollWidth - track.clientWidth - 2;
    $('[data-review-step="-1"]').disabled = track.scrollLeft <= 2;
    $('[data-review-step="1"]').disabled = track.scrollLeft >= max;
  }

  function onChange(e) {
    const el = e.target;
    if (el.dataset.filter) {
      if (el.checked) draftFilters.add(el.dataset.filter);
      else draftFilters.delete(el.dataset.filter);
      syncFilters();
      return;
    }
    if (el.id === "sort") {
      sort = el.value;
      renderResults();
    }
  }

  function onKeydown(e) {
    if (e.key !== "Escape") return;
    if (!$("#filter-panel").hidden) {
      setPanel(false);
      $("#filter-open").focus();
    }
  }

  function onPointer(e) {
    const el = e.target.closest ? e.target.closest("[data-venue],[data-pin]") : null;
    if (el) setActive(el.dataset.venue || el.dataset.pin);
  }

  /* ---------- Start ---------- */

  function fillTimes() {
    const options = [];
    for (let m = 600; m <= 1500; m += 30) options.push(`<option value="${m}">${timeLabel(m)}</option>`);
    const any = '<option value="">Any</option>';
    $("#s-start").innerHTML = any + options.join("");
    $("#s-end").innerHTML = any + options.join("");
  }

  loadWishlists();
  fillTimes();
  renderFilters();
  renderResults();
  syncFilters();
  $("#logos").innerHTML = D.logos.map((l) => `<div class="logo-box logo-${l.style}">${esc(l.name)}</div>`).join("");
  $("#reviews").innerHTML = D.testimonials.map((t) => `<figure class="review"><figcaption>${esc(t.name)}</figcaption><blockquote>${esc(t.text)}</blockquote></figure>`).join("");

  document.addEventListener("click", onClick);
  document.addEventListener("change", onChange);
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("mouseover", onPointer);
  document.addEventListener("focusin", onPointer);
  $("#search-form").addEventListener("submit", (e) => { e.preventDefault(); runSearch(); });
  $("#wish-create").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#wish-name").value.trim();
    $("#wish-msg").textContent = name ? "" : "Please give your wishlist a name.";
    if (!name) { $("#wish-name").focus(); return; }
    const list = { id: `list-${Date.now().toString(36)}`, name, venues: [] };
    wishlists.push(list);
    saveToList(list);
  });
  $("#search-form").addEventListener("input", () => { if (!$("#filter-panel").hidden) syncFilters(); });
  $("#reviews").addEventListener("scroll", syncReviewArrows, { passive: true });
  window.addEventListener("resize", syncReviewArrows);
  syncReviewArrows();
})();
