// Demo content for the venue booking calendar (mockups pages 22 and 23).
// Rooms and bookings follow the mockup, which repeats the same bookings across rooms as filler.
// Each booking's `sel` holds the customer's checklist answers, using the option ids from
// My Bookings (data.js): food and beverage packages, dietary menus, additional items and notes.
// People are fictional; phone numbers are from ACMA's range reserved for fiction.
(function () {
  const sel = (food = [], dietary = [], bev = [], additional = [], notes = "", none = {}) => ({ food, dietary, bev, additional, notes, none: { dietary: false, additional: false, notes: false, ...none } });
  const sonya = { title: "Sonya’s 40th Birthday", start: "2025-08-01T12:00", end: "15:00", guests: 28, contact: "Sonya Example", phone: "0491 570 006", email: "sonya@example.com",
    sel: sel(["antipasto", "twocourse"], ["gf"], ["barTab"], ["cake-fee"], "Speeches at 1:30 pm, please dim the lights.") };
  const molly = { title: "Molly Celebrating 25", start: "2025-07-31T12:00", end: "15:00", guests: 20, contact: "Molly Example", phone: "0491 570 110", email: "molly@example.com",
    sel: sel(["antipasto", "twocourse"], [], ["barTab"], [], "", { dietary: true }) };
  const ben = { title: "Ben’s 30th", start: "2025-08-01T18:00", end: "22:00", guests: 26, contact: "Ben Example", phone: "0491 570 157", email: "ben@example.com",
    sel: sel(["antipasto", "twocourse"], ["vegan"]) };
  const heather = { title: "Heather’s Baby Shower", start: "2025-08-02T18:00", end: "22:00", guests: 18, contact: "Heather Example", phone: "0491 570 158", email: "heather@example.com",
    sel: sel() };
  const jane = { title: "Jane and Simon’s Engagement", start: "2025-08-03T18:30", end: "22:30", guests: 26, contact: "Jane Example", phone: "0491 570 159", email: "jane@example.com",
    sel: sel(["canapes"], [], ["drinks"], ["decorations", "music"], "", { dietary: true, notes: true }) };
  const antoinette = { title: "Antoinette’s 40th Birthday", start: "2025-08-12T18:30", end: "22:30", guests: 26, contact: "Antoinette Example", phone: "0491 570 313", email: "antoinette@example.com",
    sel: sel([], [], ["barTab"]) };
  // Reads its checklist live from the My Bookings page (p14) in this browser, so it has no `sel`.
  const sam = { title: "Sam’s 40th Birthday", start: "2026-09-20T18:30", end: "23:00", guests: 80, contact: "Sam Sample", phone: "0491 570 156", email: "sam.sample@example.com", live: true };

  const spaces = [
    { id: "functionRoom", name: "The Function Room", bookings: [sam] },
    { id: "centenary", name: "The Centenary Room", bookings: [sonya, ben, jane, antoinette] },
    { id: "malouf", name: "The Malouf Boardroom", bookings: [molly, heather, jane, antoinette] },
    { id: "kalka", name: "The Kalka Room", bookings: [sonya, ben, jane, antoinette] },
    { id: "richardson", name: "The Richardson Room", bookings: [molly, heather, jane, antoinette] },
    // Not in the mockup: shows what an empty room looks like.
    { id: "whole", name: "Whole Venue", bookings: [] },
  ];

  // One copy per room, so editing one card doesn't change its twins in other rooms.
  let n = 0;
  const bookings = [];
  spaces.forEach((s) => s.bookings.forEach((bk) => bookings.push({ ...JSON.parse(JSON.stringify(bk)), id: `bk${++n}`, space: s.id })));

  window.FF_CALENDAR = {
    venueInitials: "SH",
    venueName: "The Sample Hotel",
    spaces: spaces.map(({ id, name }) => ({ id, name })),
    bookings,
  };
})();
