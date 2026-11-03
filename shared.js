// Helpers used by every page, plus the developer tabs for flipping between mockup pages.
window.FF_SHARED = (function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const money = (cents) => (cents === null ? "n/a" : "$" + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));

  // Dollars as typed ("5.8", "$5.80", "1,000") to integer cents, or null if it isn't a price.
  function parseCents(text) {
    const m = String(text).trim().replace(/^\$/, "").replace(/,/g, "").match(/^(\d{1,6})(?:\.(\d{0,2}))?$/);
    return m ? Number(m[1]) * 100 + Number((m[2] || "").padEnd(2, "0")) : null;
  }

  const devPages = [
    { href: "search.html", label: "p2 Venue Search" },
    { href: "index.html", label: "p14 My Bookings" },
    { href: "venue-setup.html", label: "p19 Venue Food & Beverage" },
  ];

  function renderDevTabs() {
    const current = location.pathname.split("/").pop() || "index.html";
    const nav = document.createElement("nav");
    nav.className = "dev-tabs";
    nav.setAttribute("aria-label", "Developer pages");
    nav.innerHTML = `<span class="dev-tabs-label">Dev</span>${devPages.map((p) => `<a href="${p.href}"${p.href === current ? ' aria-current="page"' : ""}>${esc(p.label)}</a>`).join("")}`;
    document.body.append(nav);
    document.body.classList.add("has-dev-tabs");
  }
  document.addEventListener("DOMContentLoaded", renderDevTabs);

  return { esc, money, parseCents };
})();
