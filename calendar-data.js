// Demo content for the venue booking calendar (mockup page 23).
// Rooms and bookings follow the mockup, which repeats the same bookings across rooms as filler.
// `done` lists the customer's finished checklist steps; `items` are their food and drink choices so far.
(function () {
  const allSteps = ["function", "food", "dietary", "bev", "additional", "notes"];
  const b = (iso, date, time, title, guests, done, items) => ({ iso, date, time, title, guests, done, items });
  const sonya = b("2025-08-01T12:00", "1st August 2025", "12:00 pm to 3:00 pm", "Sonya’s 40th Birthday", 28, allSteps, ["Grazing Board", "2 course set menu", "Bar tab"]);
  const molly = b("2025-07-31T12:00", "31st July 2025", "12:00 pm to 3:00 pm", "Molly Celebrating 25", 20, ["function", "food", "dietary", "bev"], ["Grazing Board", "2 course set menu", "Bar tab"]);
  const ben = b("2025-08-01T18:00", "1st August 2025", "6:00 pm to 10:00 pm", "Ben’s 30th", 26, ["function", "food", "dietary"], ["Grazing Board", "2 course set menu"]);
  const heather = b("2025-08-02T18:00", "2nd August 2025", "6:00 pm to 10:00 pm", "Heather’s Baby Shower", 18, ["function"], []);
  const jane = b("2025-08-03T18:30", "3rd August 2025", "6:30 pm to 10:30 pm", "Jane and Simon’s Engagement", 26, allSteps, ["Grazing Board", "2 course set menu", "Bar tab"]);
  const antoinette = b("2025-08-12T18:30", "12th August 2025", "6:30 pm to 10:30 pm", "Antoinette’s 40th Birthday", 26, ["function", "bev"], ["Bar tab"]);
  // Reads its progress live from the My Bookings page (p14) in this browser.
  const sam = { ...b("2026-09-20T18:30", "20th September 2026", "6:30 pm to 11:00 pm", "Sam’s 40th Birthday", 80, ["function"], []), live: true };

  window.FF_CALENDAR = {
    venueInitials: "SH",
    venueName: "The Sample Hotel",
    spaces: [
      { id: "functionRoom", name: "The Function Room", bookings: [sam] },
      { id: "centenary", name: "The Centenary Room", bookings: [sonya, ben, jane, antoinette] },
      { id: "malouf", name: "The Malouf Boardroom", bookings: [molly, heather, jane, antoinette] },
      { id: "kalka", name: "The Kalka Room", bookings: [sonya, ben, jane, antoinette] },
      { id: "richardson", name: "The Richardson Room", bookings: [molly, heather, jane, antoinette] },
      // Not in the mockup: shows what an empty room looks like.
      { id: "whole", name: "Whole Venue", bookings: [] },
    ],
  };
})();
