// Demo numbers for the venue dashboard. There is no mockup page for it.
// Every figure is made up, but stable: each calendar month always gets the same numbers,
// so the charts don't change on reload. Money is integer cents, GST inclusive.
(function () {
  // Melbourne function trade: quiet January, Christmas parties in December. Index 0 = January.
  const season = [0.55, 0.62, 0.78, 0.84, 0.9, 0.86, 0.8, 0.84, 0.95, 1.0, 1.18, 1.45];
  const growth = (year) => 1 + (year - 2024) * 0.12;

  // A small repeatable random number for a month, so the lines aren't too smooth.
  function wobble(year, month, salt) {
    let x = (year * 12 + month) * 2654435761 + salt * 40503;
    x = Math.imul(x ^ (x >>> 15), 2246822507);
    x = Math.imul(x ^ (x >>> 13), 3266489909);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967295; // 0 to 1
  }

  function month(year, m) {
    const functions = Math.max(3, Math.round(15 * season[m] * growth(year) + (wobble(year, m, 1) - 0.5) * 5));
    const avgCents = Math.round((360000 + wobble(year, m, 2) * 90000 + (m === 11 ? 60000 : 0)) / 100) * 100;
    const enquiries = Math.round(functions * (2.1 + wobble(year, m, 3) * 0.9));
    return { year, month: m, functions, revenueCents: functions * avgCents, enquiries };
  }

  // Share of revenue by function space, and of functions by day of the week (Monday first).
  const spaceShare = [
    { name: "The Function Room", share: 0.29 },
    { name: "The Centenary Room", share: 0.22 },
    { name: "The Kalka Room", share: 0.16 },
    { name: "The Malouf Boardroom", share: 0.13 },
    { name: "The Richardson Room", share: 0.12 },
    { name: "Whole Venue", share: 0.08 },
  ];
  const dayShare = [0.03, 0.04, 0.07, 0.11, 0.23, 0.38, 0.14];

  const todos = [
    { text: "Chase the deposit for Heather’s Baby Shower", done: false },
    { text: "Remind Ben’s 30th to lock in final numbers", done: false },
    { text: "Update the summer function pack prices", done: false },
    { text: "Reply to 3 new enquiries", done: true },
  ];

  window.FF_DASHBOARD = { month, spaceShare, dayShare, todos };
})();
