// Demo content for the My Bookings page. The venue and organiser are fictional,
// per CLAUDE.md §9. Swap them here; nothing else on the page hard-codes them.
window.FF_DATA = {
  booking: {
    venue: "The Sample Hotel",
    addressLines: ["1 Example Street,", "Yarraville"],
    space: "Function Room",
    dateLines: ["Saturday", "20th September 2026"],
    time: "6.30 pm",
    guests: 80,
    layout: "Standing",
    eventName: "Sam’s 40th Birthday",
    contact: "Sam Sample",
    phone: "0491 570 156", // ACMA reserved fictional number
    email: "sam.sample@example.com",
  },

  canapes: {
    title: "Canapés/ Finger food",
    intro: "Our function food menu is priced at $25 per person.",
    dishCount: 6,
    dishes: [
      { id: "rice", name: "mixed vegetable rice paper rolls, hoisin:", variants: ["regular", "gluten free", "vegan"] },
      { id: "croquettes", name: "pea & haloumi croquettes, garlic mayo, napoli, micro herbs (veg)" },
      { id: "crostini", name: "smoked salmon crostini, goats cheese, capers, spanish onion, dill" },
      { id: "squid", name: "lemon salt & pepper squid, garlic aioli:", variants: ["regular", "gluten free"] },
      { id: "karaage", name: "fried chicken karaage, snow pea tendrils, onion, yum yum sauce (gf)" },
      { id: "skewers", name: "lemon garlic & rosemary chicken skewers, mint yoghurt (gf)" },
      { id: "sausage", name: "pork & parmesan sausage rolls, tomato relish" },
      { id: "pizza", name: "assorted pizza slices (2 selections only):", variants: ["regular", "gluten free", "vegan", "vegetarian"], maxVariants: 2 },
    ],
  },

  antipasto: {
    note: ["Platters are priced at $200 per 20 people.", "Vegetarian & Vegan options available."],
    options: [
      { id: "veg", label: "Vegetarian/Cheeses" },
      { id: "meat", label: "Meat/Cheeses" },
    ],
  },

  foodPackages: [
    { id: "canapes", label: "Canapés/ Finger food", panel: "canapes" },
    { id: "antipasto", label: "Antipasto platter", inline: true },
    { id: "private", label: "Private Dining" },
    { id: "alacarte", label: "À la carte" },
    { id: "twocourse", label: "2 course menu" },
    { id: "threecourse", label: "3 course menu" },
    { id: "kids", label: "Kids Menu" },
  ],

  beveragePackages: [
    { id: "barTab", label: "Bar tab", panel: "barTab" },
    { id: "drinks", label: "Drink packages" },
    { id: "cocktails", label: "Cocktail options" },
    { id: "payg", label: "Pay-As-You-Go" },
  ],

  dietary: [
    { id: "halal", label: "Halal menu" },
    { id: "vegan", label: "Vegan menu" },
    { id: "gf", label: "Gluten free menu" },
  ],

  additional: [
    { id: "decorations", lines: ["Own Decorations Welcome", "(please avoid adhesives or confetti)"] },
    { id: "cake", val: "fee", lines: ["BYO Celebration Cake permitted", "($1pp venue cutting fee applies)"] },
    { id: "cake", val: "free", lines: ["BYO Celebration Cake - guest to cut. No cakeage"] },
    { id: "music", lines: ["Play your own music"] },
    { id: "dj", lines: ["DJ"] },
  ],

  facilities: [
    { id: "av", label: "AV Equipment: TV, Projector, Screen, Microphone, Speakers" },
    { id: "dance", label: "Dance Floor" },
    { id: "wifi", label: "Wi-Fi Access" },
    { id: "air", label: "Air Conditioning/Heating" },
    { id: "tables", label: "High and Low Tables" },
  ],

  // Struck through in the mockup: shown as not available at this space.
  accessibility: ["Wheelchair friendly toilets", "Lift access", "Wheelchair accessible"],
  flexibility: ["Free Cancellation up to 10 days prior", "Flexible date changes"],

  // All prices are integer cents, null means not offered or not supplied.
  barTab: {
    notes: [
      "Beverage tabs are charged on consumption (per drink) and served until the limit you appoint is reached.",
      "Please note it is strictly the responsibility of the event host to ensure guests consume beverages included in their package.",
    ],
    // TODO(confirm): every schooner price is $0.00 in the mockup, which looks like a placeholder.
    tap: [
      { id: "carlton", name: "Carlton Draught", pot: 580, schooner: 0, pint: 1100 },
      { id: "estrella", name: "Estrella Damm Lager", pot: null, schooner: 0, pint: 1200 },
      { id: "furphy", name: "Furphy Ale", pot: 580, schooner: 0, pint: 1100 },
      { id: "crisp", name: "Furphy Crisp Lager", pot: 580, schooner: 0, pint: 1100 },
      { id: "kirin", name: "Kirin Lager", pot: null, schooner: 0, pint: 1200 },
      { id: "steam", name: "Mountain Goat Steam Ale", pot: 650, schooner: 0, pint: 1300 },
      { id: "goat", name: "Goat", pot: 600, schooner: 0, pint: 1200 },
      { id: "cider", name: "Somersby Apple Cider", pot: 600, schooner: 0, pint: 1200 },
    ],
    bottles: [
      { id: "northern", name: "Great Northern - mid strength", price: 700 },
      { id: "dry", name: "Carlton Dry", price: 800 },
      { id: "corona", name: "Corona", price: 900 },
      { id: "pear1", name: "Somersby pear", price: null }, // TODO(confirm): no price in the mockup, and listed twice
      { id: "peroni", name: "Peroni Nastro", price: 1000 },
      { id: "ginger", name: "Brookevale Ginger Beer", price: 1000 },
      { id: "souki", name: "Asahi souki – mid strength", price: 750 },
      { id: "sample", name: "Sample ¾ ipa", price: 1000 },
      { id: "black", name: "Asahi super dry black", price: 1100 },
      { id: "birds", name: "Two birds sunset ale", price: 1000 },
      { id: "cascade", name: "Cascade Light", price: 600 },
      { id: "xpa", name: "Two bays xpa – gf", price: 1000 },
      { id: "pale", name: "Mountain Goat pale ale", price: 950 },
      { id: "rabbit", name: "White rabbit dark ale", price: 900 },
      { id: "monteiths", name: "Monteiths crushed apple", price: 900 },
      { id: "pear2", name: "Somersby pear", price: 900 },
    ],
    wines: [
      { group: "Bubbles", items: [
        { id: "cuvee", name: "Rothbury estate sparkling cuvee", price: 800 },
        { id: "prosecco", name: "Bandini Prosecco", price: 1000 },
        { id: "chandon", name: "Chandon nv", price: 1200 },
      ] },
      { group: "White", items: [
        { id: "moscato", name: "Deakin Estate Moscato", price: 850 },
        { id: "ssb", name: "Rothbury Estate Semillon Sauvignon blanc", price: 800 },
        { id: "totara", name: "Totara Sauvignon Blanc", price: 950 },
        { id: "riesling", name: "Thorn-clarke Sandpiper Riesling", price: 1000 },
        { id: "grigio", name: "Aquilani Pinot Grigio", price: 1000 },
        { id: "bastard", name: "Fat Bastard Chardonnay", price: 950 },
        { id: "lala", name: "La La Land Pinot Gris", price: 1000 },
        { id: "dreams", name: "In Dreams Chardonnay", price: 1200 },
      ] },
      { group: "Rose", items: [
        { id: "tellurose", name: "Tellurian Rose", price: 950 },
        { id: "rameau", name: "Rameau d’or petit rose", price: 1200 },
      ] },
      { group: "Red", items: [
        { id: "botanica", name: "First Creek ‘Botanica’ Pinot Noir", price: 950 },
        { id: "jack", name: "Jack & Jill Pinot Noir", price: 1300 },
        { id: "annie", name: "Annie’s Lane Cabernet Merlot", price: 900 },
        { id: "boots", name: "Snake & Herring Dirty Boots Cab Sauv", price: 1200 },
        { id: "rsc", name: "Rothbury Estate Shiraz Cab Sauv", price: 800 },
        { id: "redline", name: "Tellurian Redline Shiraz", price: 1200 },
      ] },
    ],
  },

  // Sample content so the page can be played with. Dishes come from page 19 of the
  // mockup where it has them; the rest, and all these prices, are placeholders.
  // A group with pick: 1 is a single choice, pick: n needs exactly n, optional: true needs none.
  menus: {
    private: {
      intro: "A set menu served to your table. Sample price $65 per person.",
      groups: [
        { id: "style", title: "Service style", pick: 1, options: [
          { id: "shared", label: "Shared plates down the table" },
          { id: "alternate", label: "Alternate serve" },
        ] },
        { id: "extras", title: "Extras", optional: true, options: [
          { id: "bread", label: "Bread & dips on arrival" },
          { id: "cheese", label: "Cheese board to finish" },
        ] },
      ],
    },
    alacarte: {
      intro: "Guests order from our à la carte menu on the day.",
      groups: [
        { id: "billing", title: "How would you like to pay?", pick: 1, options: [
          { id: "separate", label: "Guests pay separately" },
          { id: "single", label: "One bill for the host" },
        ] },
      ],
    },
    twocourse: {
      intro: "Your guests order their preferred entrée and main on the night. Sample price $55 per person.",
      groups: [
        { id: "entrees", title: "Entrées", pick: 3, options: [
          { id: "arancini", label: "Mixed mushroom arancini, garlic mayo & pecorino" },
          { id: "calamari", label: "Fried calamari, lemon pepper seasoning & garlic mayo" },
          { id: "halloumi", label: "Crispy halloumi, strawberries, mountain pepper berry & balsamic glaze" },
          { id: "dimsims", label: "Pork dim sums, homemade soy & chilli sauce" },
        ] },
        { id: "mains", title: "Mains", pick: 3, options: [
          { id: "beef", label: "Asian beef salad, eye fillet, crispy noodles, cucumber, coriander & chilli" },
          { id: "parma", label: "Chicken parmigiana, chips & salad" },
          { id: "fish", label: "Market fish, greens & lemon butter" },
          { id: "gnocchi", label: "Pumpkin & sage gnocchi (veg)" },
        ] },
      ],
    },
    threecourse: {
      intro: "Your guests order their preferred entrée, main and dessert on the night. Sample price $70 per person.",
      groups: [
        { id: "entrees", title: "Entrées", pick: 3, options: [
          { id: "arancini", label: "Mixed mushroom arancini, garlic mayo & pecorino" },
          { id: "calamari", label: "Fried calamari, lemon pepper seasoning & garlic mayo" },
          { id: "halloumi", label: "Crispy halloumi, strawberries, mountain pepper berry & balsamic glaze" },
          { id: "dimsims", label: "Pork dim sums, homemade soy & chilli sauce" },
        ] },
        { id: "mains", title: "Mains", pick: 3, options: [
          { id: "beef", label: "Asian beef salad, eye fillet, crispy noodles, cucumber, coriander & chilli" },
          { id: "parma", label: "Chicken parmigiana, chips & salad" },
          { id: "fish", label: "Market fish, greens & lemon butter" },
          { id: "gnocchi", label: "Pumpkin & sage gnocchi (veg)" },
        ] },
        { id: "desserts", title: "Desserts", pick: 2, options: [
          { id: "sticky", label: "Homemade sticky date pudding, vanilla bean ice cream & butterscotch" },
          { id: "brownie", label: "Chocolate brownie, vanilla ice cream" },
          { id: "tart", label: "Lemon tart, double cream" },
        ] },
      ],
    },
    kids: {
      intro: "Sample price $18 per child, includes a soft drink.",
      groups: [
        { id: "meals", title: "Kids meals", pick: 2, options: [
          { id: "fishchips", label: "Fish & chips" },
          { id: "nuggets", label: "Chicken nuggets & chips" },
          { id: "burger", label: "Cheeseburger & chips" },
          { id: "pasta", label: "Pasta napoli" },
        ] },
      ],
    },
    drinks: {
      intro: "Sample packages, served for the length of your event.",
      groups: [
        { id: "package", title: "Drink package", pick: 1, options: [
          { id: "option1", label: "Option 1: tap beer, house wine & soft drinks, $55 per guest" },
          { id: "option2", label: "Option 2: all beer, all wine & soft drinks, $70 per guest" },
        ] },
      ],
    },
    cocktails: {
      intro: "Sample cocktail packages for your guests.",
      groups: [
        { id: "package", title: "Cocktail package", pick: 1, options: [
          { id: "option1", label: "Option 1: one cocktail on arrival, $18 per guest" },
          { id: "option2", label: "Option 2: two cocktails per guest, $32 per guest" },
        ] },
        { id: "cocktail", title: "Cocktails", pick: 2, options: [
          { id: "spritz", label: "Aperol spritz" },
          { id: "margarita", label: "Margarita" },
          { id: "espresso", label: "Espresso martini" },
        ] },
      ],
    },
    payg: {
      intro: "Guests buy their own drinks from the bar.",
      groups: [
        { id: "setup", title: "How would you like it to run?", pick: 1, options: [
          { id: "guests", label: "Guests pay for all their own drinks" },
          { id: "tabfirst", label: "Start with a bar tab, then guests pay" },
        ] },
      ],
    },
  },

  // The selections drawn in the mockup, used until the organiser changes something.
  initial: {
    dishes: {
      rice: ["regular", "gluten free", "vegan"],
      crostini: [], karaage: [], skewers: [], sausage: [],
      pizza: ["regular", "vegan"],
    },
    antipasto: "meat",
    drinks: ["peroni", "souki", "sample", "black", "cascade", "xpa", "pale",
      "cuvee", "prosecco", "chandon", "ssb", "riesling", "bastard", "lala", "dreams",
      "tellurose", "rameau", "jack", "annie", "rsc"],
    allTap: true,
    spirits: "yes",
  },
};
