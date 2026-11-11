// Demo content for the venue page (mockup page 8). The venue is fictional, per CLAUDE.md §9.
// Venues without an entry here still get a page, built from their listing in search-data.js.
window.FF_VENUES = {
  sample: {
    cuisine: "Modern Australian",
    type: "Gastro Pub",
    photo: { src: "assets/sample-hotel.jpg", alt: "The upstairs function room at The Sample Hotel, with high tables and bar stools in the afternoon sun" },
    about: "Set in the heart of Yarraville, The Sample Hotel blends modern pub dining with relaxed, character-filled spaces perfect for any occasion. Whether you’re planning a casual celebration, a milestone event or a corporate gathering, the venue offers flexible function areas, thoughtful food and beverage packages, and a welcoming atmosphere that makes hosting easy. With its mix of indoor and outdoor spaces and a focus on fresh, contemporary hospitality, The Sample Hotel is a go-to destination for events in Melbourne’s inner west.",

    // Capacities come from each description; the mockup's "50 seated | 100 standing" lines were placeholders.
    // TODO(confirm): seated numbers for the Bar/Pool Room and Rooftop Deck, and standing for the Dining Room.
    spaces: [
      {
        name: "Function Room", seated: 50, standing: 100,
        photo: "assets/sample-function-room.jpg", alt: "The function room's high tables, bar stools and long bar",
        about: [
          "Opposite the deck, this light-filled upstairs function space offers a fresh, modern setting for relaxed celebrations and social gatherings. With room for up to 100 guests standing or 50 seated, the space is versatile and easily adapted to suit a range of occasions.",
          "Large windows bring in natural light, while the contemporary interior creates a welcoming atmosphere that feels both polished and comfortable. Ideal for cocktail-style events, milestone celebrations or casual corporate functions.",
        ],
        facilities: ["AV Equipment", "Wi-Fi Access", "Dance Floor", "Air Conditioning/Heating", "High and Low Tables"],
      },
      {
        name: "Dining Room", seated: 60, standing: null,
        photo: "assets/sample-dining-room.jpg", alt: "The dining room's timber chairs and tables under a large abstract painting",
        about: [
          "Located on the ground floor, the dining room offers a warm and inviting space suited to more intimate, seated occasions. Accommodating up to 60 guests, the room blends classic pub character with a fresh, modern finish.",
          "Ideal for long lunches, private dinners or smaller celebrations, the layout supports both communal and structured dining. Soft lighting and a welcoming atmosphere make it perfect for hosting meaningful moments with friends, family or colleagues.",
        ],
        facilities: ["AV Equipment", "Wi-Fi Access", "Dance Floor", "Air Conditioning/Heating"],
      },
      {
        name: "Bar/Pool Room", seated: null, standing: 70,
        photo: "assets/sample-pool-room.jpg", alt: "A pool table under a hanging lamp in a timber-panelled bar",
        about: [
          "Set within the heart of the venue, this semi-private space combines the energy of the main bar with a more defined area for group gatherings. With room for up to 70 guests standing, the pool and bar area is perfect for casual celebrations, team events or social catch-ups.",
          "The pool table adds something to do, while the surrounding bar keeps drinks close at hand all night. Lively yet contained, it strikes a balance between atmosphere and flexibility for informal functions.",
        ],
        facilities: ["Air Conditioning/Heating", "Pool Table", "High and Low Tables"],
      },
      {
        name: "Rooftop Deck", seated: null, standing: 80,
        photo: "assets/sample-rooftop.jpg", alt: "The rooftop deck's timber benches and high bar tables",
        about: [
          "Perched above the venue, this open-air rooftop offers a vibrant and relaxed setting for social celebrations and casual events. With space for up to 80 guests standing, the deck captures the energy of Yarraville with a breezy, laid-back atmosphere.",
          "A mix of seating and standing areas makes mingling easy, and the outdoor bar suits cocktail-style functions. Perfect for birthdays, after-work drinks or summer parties.",
        ],
        facilities: ["AV Equipment", "Wi-Fi Access", "Air Conditioning/Heating", "High and Low Tables"],
      },
    ],

    // Extra photos for the gallery, after the main photo and the spaces.
    gallery: [
      { src: "assets/sample-bar.jpg", alt: "The front bar's timber counter and stools" },
      { src: "assets/sample-share-plates.jpg", alt: "Share plates, salads and red wine on a dining table" },
      { src: "assets/sample-food.jpg", alt: "A burger, chips and drinks on a round pub table" },
    ],
  },
};
