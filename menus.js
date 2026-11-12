// The "View menu" pop-up content for each food and drink package, shared by the function space page (p9)
// and the listing preview (p20). Menus come from data.js (FF_DATA).
window.FF_MENUS = (function () {
  "use strict";

  const { esc, money } = window.FF_SHARED;
  const D = window.FF_DATA;

  const price = (c) => (c ? money(c) : "n/a");
  const priceTable = (caption, cols, rows) => `<table class="sp-menu-table"><caption>${esc(caption)}</caption>
    <thead><tr><th scope="col">Drink</th>${cols.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr><th scope="row">${esc(r.name)}</th>${r.prices.map((p) => `<td>${price(p)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

  function html(id) {
    if (id === "canapes") {
      const c = D.canapes;
      return `<p>${esc(c.intro)} Choose ${c.dishCount} dishes.</p><ul class="sp-menu-list">${c.dishes.map((d) => `<li>${esc(d.name.replace(/:$/, ""))}${d.variants ? ` <span class="sp-muted">(${esc(d.variants.join(", "))})</span>` : ""}</li>`).join("")}</ul>`;
    }
    if (id === "antipasto") {
      return `${D.antipasto.note.map((n) => `<p>${esc(n)}</p>`).join("")}<ul class="sp-menu-list">${D.antipasto.options.map((o) => `<li>${esc(o.label)}</li>`).join("")}</ul>`;
    }
    if (id === "barTab") {
      const t = D.barTab;
      // TODO(confirm): schooner prices are $0.00 placeholders in the data, so they show as n/a.
      return `${t.notes.map((n) => `<p>${esc(n)}</p>`).join("")}
        ${priceTable("Tap beer", ["Pot", "Schooner", "Pint"], t.tap.map((d) => ({ name: d.name, prices: [d.pot, d.schooner, d.pint] })))}
        ${priceTable("Bottles & cans", ["Price"], t.bottles.filter((d) => d.price).map((d) => ({ name: d.name, prices: [d.price] })))}
        ${t.wines.map((g) => priceTable(g.group, ["Glass"], g.items.map((d) => ({ name: d.name, prices: [d.price] })))).join("")}
        <p class="sp-note">Prices include GST.</p>`;
    }
    const m = D.menus[id];
    if (!m) return "<p>The venue hasn’t added this menu yet.</p>";
    return `<p>${esc(m.intro)}</p>${m.groups.map((g) => `<h3>${esc(g.title)}${g.pick > 1 ? ` <span class="sp-muted">(choose ${g.pick})</span>` : ""}</h3><ul class="sp-menu-list">${g.options.map((o) => `<li>${esc(o.label)}</li>`).join("")}</ul>`).join("")}`;
  }

  return { html };
})();
