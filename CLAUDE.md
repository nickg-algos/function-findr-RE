# CLAUDE.md — FunctionFindr

> Project brief for Claude Code. Read this before working on any code in this repository.
>
> **Status of this document:** first draft. Anything marked **[ASSUMPTION]** is a best guess and must be confirmed by the founder before it shapes architecture, pricing logic or anything customer-facing. If code you find in the repo contradicts this file, **the code wins** — flag the mismatch rather than "fixing" the code to match this brief.

---

## 1. What FunctionFindr is

FunctionFindr is an Australian marketplace that helps people **find, compare and book function venues** — the private rooms, bars, courtyards, rooftops and whole-venue hires that pubs, hotels, restaurants and event spaces rent out for parties and events.

It is built by people who run a venue (a pub with function spaces in Yarraville, Melbourne's inner west), so it is designed from the **venue operator's side of the counter**: it should cut the back-and-forth of enquiries, quotes, deposits and run sheets, not just list rooms.

**[ASSUMPTION]** Launch market is Melbourne (inner west / inner city first), expanding to the rest of Victoria and then other capitals.

### The problem
- **Organisers** (someone planning a 30th, an engagement party, a wake, a work Christmas party, a footy club presentation night) have to ring or email five venues, wait days for PDF function packs, and still can't compare like-for-like on price, capacity and availability.
- **Venues** lose hours to enquiries that were never going to book (wrong date, wrong size, wrong budget), chase deposits manually, and juggle availability across a paper diary, a spreadsheet and their booking system.

### The promise
- Organisers: *"Tell us the date, headcount, vibe and budget — see venues that actually fit, with real prices, and lock one in."*
- Venues: *"Only get enquiries that fit. Send a quote in two clicks. Get the deposit paid online."*

---

## 2. Users and roles

| Role | Who | Main jobs |
|---|---|---|
| **Organiser** (guest user / customer) | Members of the public, office managers, EAs, club secretaries | Search, shortlist, enquire, accept a quote, pay deposit, finalise numbers & menu |
| **Venue manager** | Function/events coordinator or licensee at a venue | Manage spaces, packages, availability; respond to enquiries; send quotes; track bookings and payments |
| **Venue owner / group admin** | Owner of one venue or a hospitality group with several | Multiple venues under one account, staff permissions, payouts, reporting |
| **FunctionFindr admin** | Internal team | Approve venues, moderate content, handle disputes/refunds, view platform metrics |

---

## 3. Core domain concepts (glossary)

Use these terms consistently in code, UI copy and database naming.

- **Venue** — a business at an address (e.g. a pub). Has one or more Spaces.
- **Space** — a bookable area within a venue (e.g. "Back Bar", "Beer Garden", "Upstairs Function Room", "Whole Venue"). Spaces can overlap (booking "Whole Venue" blocks every other space) — model this explicitly.
- **Capacity** — always stored **per layout**, never as a single number:
  - `standing` / cocktail
  - `seated_banquet` (long tables)
  - `seated_rounds`
  - `theatre`, `boardroom`, `classroom` (corporate)
- **Exclusivity** — `exclusive` (private room, own bar/door), `semi_private` (sectioned area), `shared` (reserved area in a public space).
- **Package** — a priced offer attached to one or more spaces, e.g. "Cocktail Package — 2 hrs canapés + 3 hr beverage package, $85pp". Packages contain **food** (canapés, grazing tables, set menu, buffet, BBQ) and **beverage** options (beverage package by the hour, bar tab, cash bar, tab-then-cash).
- **Pricing models** — a booking's price can be any combination of:
  - `room_hire_fee` (flat)
  - `minimum_spend` (food + beverage must reach $X; often varies by day of week and time slot)
  - `per_head` (package price × guests)
  - `bar_tab` (pre-paid cap, sometimes converts to cash bar)
  - surcharges: Sunday/public holiday surcharge (commonly 10–15%), security fee for large/late events, cleaning fee, cakeage, AV hire
- **Session / time slot** — e.g. lunch, afternoon, evening; venues often price and block by slot rather than by the hour.
- **Enquiry** — an organiser's request (date, time, guests, event type, budget, space(s), notes). Not a commitment.
- **Quote / Proposal** — the venue's priced response to an enquiry. Has an expiry date.
- **Tentative hold** — a date held for an organiser for N days pending deposit. Must auto-release.
- **Booking** — a confirmed event after deposit. Lifecycle below.
- **Deposit** — usually a fixed amount or % of minimum spend, paid to confirm. Refundability governed by the venue's cancellation policy.
- **Final numbers** — guest count and menu choices locked X days before the event (commonly 7–14). Dietary requirements captured per booking.
- **Run sheet** — the event-day timeline (arrival, speeches, food service times, cake, last drinks).

### Booking lifecycle (state machine)

```
enquiry_submitted
  → quote_sent            (venue responds)
  → quote_declined | quote_expired
  → tentative_hold        (organiser accepts, hold timer starts)
  → hold_released         (timer lapses / organiser withdraws)
  → confirmed             (deposit paid)
  → final_details_locked  (numbers + menu locked)
  → completed             (event date passed)
  → balance_settled
Any confirmed state → cancelled_by_organiser | cancelled_by_venue (refund rules apply)
```

Implement transitions in **one place** (a domain service / state machine), never by setting `status` ad hoc across the codebase. Every transition writes an audit event.

---

## 4. Key features (roughly in priority order)

**[ASSUMPTION]** on ordering — confirm before planning sprints.

### MVP
1. **Search & filter** — suburb/area or map, date, guest count (filters on the right layout's capacity), event type, budget (per head or total), exclusivity, features (outdoor area, accessible, AV, dance floor, kids welcome, dog friendly, parking, near public transport).
2. **Venue & space pages** — photos, floor plans, capacities by layout, packages with real prices, minimum spends by day, policies, location.
3. **Enquiry flow** — single structured form; optionally send the same enquiry to up to N shortlisted venues.
4. **Venue dashboard** — enquiry inbox, quote builder (from packages), availability calendar, booking list.
5. **Deposits online** — Stripe (Stripe Connect for venue payouts). **[ASSUMPTION]**
6. **Email + SMS notifications** — new enquiry, quote sent, hold expiring, deposit received, final-numbers reminder.

### Next
- Availability sync (iCal export/import; later integrations with venue systems — **[ASSUMPTION]** candidates include common AU hospitality booking/POS tools; confirm which ones partner venues actually use).
- Final numbers & dietary collection form the organiser can share with guests.
- Run sheet builder.
- Reviews (only from completed bookings — verified).
- Group/multi-venue accounts and staff permissions.
- Reporting for venues: enquiry → booking conversion, revenue by space, lead times.

### Later
- Instant book for venues that opt in (fixed packages, live availability).
- Natural-language search ("30th for 60 people in the inner west, Saturday night, under $3k").
- Supplier add-ons (DJs, photographers, cakes, styling).

---

## 5. Business model

**[ASSUMPTION — confirm before building any billing logic]** Likely one of, or a mix of:
- Commission on confirmed bookings (charged to the venue, taken from the deposit/payout), and/or
- Venue subscription tiers (listing free, paid tier for premium placement, quote tools, analytics), and/or
- Organiser booking fee.

Keep fee calculation in a single, well-tested module with configurable rates per venue/plan. Never hard-code percentages in UI components.

---

## 6. Australian specifics (non-negotiable)

- **Currency:** AUD. Store money as **integer cents**, never floats. Display as `$1,234.50`.
- **GST:** 10%. Prices shown to consumers must be **GST-inclusive** (Australian Consumer Law). Store whether each amount is inc/ex GST explicitly; generate tax invoices with ABN and GST breakdown.
- **Surcharges:** card surcharges and Sunday/public holiday surcharges must be disclosed up front, not added at checkout as a surprise (ACL drip-pricing rules).
- **Public holidays:** state-specific (VIC has Melbourne Cup Day, AFL Grand Final Friday, King's Birthday, etc.). Use a maintained holiday data source; don't hard-code.
- **Time zones:** venues store their own IANA time zone (default `Australia/Melbourne`). Store timestamps in UTC; render in the venue's zone. Watch daylight-saving transitions (first Sunday in October / first Sunday in April for VIC).
- **Formats:** `en-AU` spelling (organise, colour, licence as a noun), dates `DD/MM/YYYY`, phone numbers `+61`, postcodes 4 digits.
- **Privacy:** comply with the Privacy Act 1988 / Australian Privacy Principles. Collect only what's needed; dietary and accessibility info is sensitive — restrict access to the relevant venue and booking. Provide data export/deletion.
- **Liquor:** venues hold liquor licences with conditions (capacity, trading hours, RSA). Allow venues to record licence number and hard limits (max capacity per space, latest finish) and enforce them in search and quotes. Don't let the platform facilitate under-18 events with alcohol packages without venue sign-off.
- **Business identity:** venues provide an ABN; validate format (and optionally via ABR lookup).

---

## 7. Technical direction

**[ASSUMPTION]** — if the repo already has a stack, follow it. If starting fresh, the default proposal is:

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind. Server-rendered venue and search pages for SEO (suburb + event-type landing pages, e.g. `/venues/yarraville/30th-birthday`, are a key acquisition channel).
- **Backend:** TypeScript (Next.js route handlers / server actions, or a separate Node service if it grows).
- **Database:** PostgreSQL with PostGIS for location search. ORM: Prisma or Drizzle.
- **Auth:** separate organiser and venue-staff experiences; role-based access scoped per venue.
- **Payments:** Stripe + Stripe Connect (Express accounts for venues).
- **Email/SMS:** a transactional provider for each (e.g. Postmark/Resend, and an AU-capable SMS provider).
- **Images:** object storage + image CDN; venues upload lots of photos.
- **Hosting:** AU region (Sydney) where possible for latency and data-residency comfort.

### Data model sketch

```
Organisation (venue group) 1─* Venue 1─* Space
Space *─* Package
Space 1─* CapacityByLayout
Venue 1─* PricingRule (day_of_week, slot, min_spend_cents, room_hire_cents, surcharge_pct)
Venue 1─* BlackoutDate / AvailabilityBlock
Space *─* SpaceConflict (overlapping spaces, e.g. Whole Venue)
User (organiser | venue_staff | admin) *─* Venue (via Membership with role)
Enquiry 1─* Quote 1─0..1 Booking 1─* Payment
Booking 1─* BookingEvent (audit log of state transitions)
Booking 1─0..1 RunSheet, 1─* GuestDietary
Review 0..1 per Booking
```

---

## 8. Engineering conventions

- TypeScript `strict` on. No `any` without a comment explaining why.
- Money: integer cents + currency code. One helper for formatting.
- Dates: UTC in the DB; a single date utility for venue-local rendering.
- Availability & double-booking: enforce at the **database** level (exclusion constraint or transactional locking), not just in UI. Remember overlapping spaces.
- All state transitions and payment actions are idempotent (Stripe webhooks retry).
- Tests required for: pricing/quote calculations, GST, surcharges, availability conflicts, booking state machine, fee/commission calculation, webhook handlers.
- Accessibility: WCAG 2.1 AA for organiser-facing pages; mobile-first (most organisers browse on phones).
- Copy tone: friendly, plain, local. "Function", "venue hire", "minimum spend" — the words Melburnians actually use. No American event-industry jargon ("banquet", "check").

---

## 9. Working agreements for Claude Code

- **Ask before** changing: pricing/fee logic, payment flows, database schema migrations on existing data, auth/permissions, anything that emails or charges real customers.
- Don't invent business rules. If a rule isn't in this file or the code, add a `TODO(confirm):` comment and mention it in your summary.
- Never commit secrets; use `.env.example` for new variables.
- Seed/demo data should use fictional venues and people — **do not** use real venue names, real customer details or real staff names in fixtures.
- Prefer small, reviewable PRs with a short description of what changed and why.

---

## 10. Open questions for the founder

Fill these in and delete the matching **[ASSUMPTION]** tags above.

1. Is FunctionFindr a marketplace for many venues, a tool for a single venue/group, or both (e.g. starting with our own venue as pilot)?
2. Launch area and target number of venues at launch?
3. Revenue model — commission %, subscription tiers, organiser fee?
4. Do we take deposits through the platform, or just pass leads to venues?
5. Which booking/POS/calendar systems do partner venues already use that we must sync with?
6. Is there an existing codebase, design, domain (`functionfindr.com.au`?) or brand guide?
7. Target event types to lead with (birthdays, corporate, weddings, wakes, sports clubs)?
8. Who are the main competitors we're positioning against, and what's our sharpest difference?
