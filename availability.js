// Availability rules, in one place (CLAUDE.md §8): used by the space page (p9) to check a request
// and by the next steps (p10 on) to re-check whatever arrives in the link.
// A request is { date: "YYYY-MM-DD", start, end (minutes after midnight; end can pass 1440), guests }.
window.FF_AVAIL = (function () {
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const timeLabel = (mins) => {
    const m = mins % 1440;
    const h = Math.floor(m / 60);
    return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
  };
  const toMins = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const parts = (iso) => iso.split("-").map(Number);
  const dayNumber = (iso) => { const [y, m, d] = parts(iso); return Date.UTC(y, m - 1, d) / 864e5; };
  const jsWeekday = (iso) => { const [y, m, d] = parts(iso); return new Date(y, m - 1, d).getDay(); }; // 0 = Sunday
  const mondayFirst = (iso) => (jsWeekday(iso) + 6) % 7;
  const dayName = (iso) => DAYS[mondayFirst(iso)];
  const ddmmyyyy = (iso) => iso.split("-").reverse().join("/");
  const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
  const longDate = (iso) => { const [y, m, d] = parts(iso); return `${ordinal(d)} ${MONTHS[m - 1]} ${y}`; };
  const isIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "") && !Number.isNaN(dayNumber(s));
  const todayIso = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; };
  const capacityText = (space) => [space.seated && `${space.seated} seated`, space.standing && `${space.standing} standing`].filter(Boolean).join(" or ");

  // What's wrong with each field, as the message to show ("" when it's fine).
  function problems(listing, space, req) {
    const most = Math.max(space.seated || 0, space.standing || 0);
    const g = req.guests;
    return {
      date: !req.date ? "Please choose a date."
        : !isIsoDate(req.date) ? "Please choose a date."
        : req.date < todayIso() ? "Please choose a date from today onwards."
        : listing.closed.includes(jsWeekday(req.date)) ? `${listing.name} is closed on ${dayName(req.date)}s.` : "",
      start: req.start === null || Number.isNaN(req.start) ? "Please choose a start time."
        : req.start < listing.opens || req.start >= listing.latest ? `Functions here run between ${timeLabel(listing.opens)} and ${timeLabel(listing.latest)}.` : "",
      end: req.end === null || Number.isNaN(req.end) ? "Please choose an end time."
        : req.start !== null && req.end <= req.start ? "End time needs to be after the start time."
        : req.end > listing.latest ? `Functions here finish by ${timeLabel(listing.latest)}.` : "",
      guests: g === null || g === "" ? "Please enter the number of guests."
        : !Number.isInteger(g) || g < 1 ? "Please enter a whole number of guests."
        : g > most ? `The ${space.name} holds up to ${capacityText(space)}.` : "",
    };
  }

  // The first booking that overlaps the request: the space's own, or any that take the whole venue.
  function clash(calendar, listing, space, req) {
    if (!calendar || calendar.venueName !== listing.name) return null;
    return calendar.bookings.filter((b) => b.space === space.calendarId || b.space === "whole").find((b) => {
      const [bDate, bTime] = b.start.split("T");
      const offset = (dayNumber(bDate) - dayNumber(req.date)) * 1440;
      if (Math.abs(offset) > 1440) return false;
      const bStart = toMins(bTime) + offset;
      let bEnd = toMins(b.end) + offset;
      if (bEnd <= bStart) bEnd += 1440; // runs past midnight
      return req.start < bEnd && bStart < req.end;
    }) || null;
  }

  const clashText = (space, b) => {
    const [d, t] = b.start.split("T");
    return `Sorry, the ${space.name} is already booked from ${timeLabel(toMins(t))} to ${timeLabel(toMins(b.end))} on ${dayName(d)} ${ddmmyyyy(d)}. Please try another date or time.`;
  };

  // The minimum spend for the session the start time falls in, or null.
  function minSpend(venue, space, date, start) {
    if (!space.minSpendCents || !isIsoDate(date) || start === null) return null;
    const i = venue.sessions.findIndex((s) => start >= s.start && start < s.end);
    return i < 0 ? null : { day: dayName(date), session: venue.sessions[i].label, cents: space.minSpendCents[mondayFirst(date)][i] };
  }

  // Reads a request from a link's parameters (numbers stay null when missing).
  function fromParams(params) {
    const num = (k) => (params.get(k) === null || params.get(k) === "" ? null : Number(params.get(k)));
    return { date: params.get("date") || "", start: num("start"), end: num("end"), guests: num("guests"), name: (params.get("name") || "").slice(0, 80) };
  }
  const toParams = (venueId, spaceId, req) => new URLSearchParams({ venue: venueId, space: spaceId, date: req.date, start: String(req.start), end: String(req.end), guests: String(req.guests), name: req.name || "" });

  return { DAYS, timeLabel, toMins, dayName, ddmmyyyy, longDate, todayIso, capacityText, problems, clash, clashText, minSpend, fromParams, toParams };
})();
