// Demo content for the landing page (mockup page 1).
// Rooms, venues and addresses are placeholders, per CLAUDE.md §9. Logos, reviews and the
// venue list come from search-data.js so the two pages stay in step.
window.FF_LANDING = {
  // "Browse function rooms". Sizes, capacities and prices are the mockup's figures.
  // TODO(confirm): the mockup prices rooms "per night"; CLAUDE.md §3 prices by room hire, minimum spend or per head.
  // TODO(confirm): the mockup's fourth fact on each card is an unlabelled Yes/No icon, so it's left out.
  rooms: [
    { name: "Function Room", venue: "The Sample Hotel", address: "1 Example Street, Yarraville VIC 3013", photo: "assets/room-1.jpg", alt: "An upstairs function room with high tables and bar stools", sizeM2: 900, seated: 50, standing: 100, priceCents: 500000 },
    { name: "Dining Room", venue: "Fictional Rooms", address: "410 Example Highway, Williamstown VIC 3016", photo: "assets/room-2.jpg", alt: "A long dining table set for a function beside a fireplace", sizeM2: 900, seated: 50, standing: 150, priceCents: 100000 },
    { name: "Private Dining Room", venue: "Wireframe Wine Room", address: "61 Dummy Road, Seddon VIC 3011", photo: "assets/room-3.jpg", alt: "A small private dining room with a round table by the window", sizeM2: 900, seated: 50, standing: 150, priceCents: 500000 },
  ],

  // "Our venues", in this order, from FF_SEARCH.venues (ordered so the first three photos differ).
  venueIds: ["sample", "lorem", "outline", "example", "fictional", "sandbox"],
};
