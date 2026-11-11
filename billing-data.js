// Venue subscription prices, in one place (CLAUDE.md §5: no prices hard-coded in pages).
// These are the mockup's figures (page 17).
// TODO(confirm): the business model is still an assumption in CLAUDE.md §5, as is whether these
// prices include GST. Nothing here charges anyone; the sign-up page is a demo.
window.FF_BILLING = {
  trialDays: 90,
  plans: [
    { id: "monthly", label: "Monthly Plan", priceCents: 19500, per: "mo", perWord: "month" },
    { id: "yearly", label: "Yearly Plan", priceCents: 210600, per: "yr", perWord: "year" },
  ],
  bookingFeeCents: 5000, // per confirmed function booked through FunctionFindr
};
