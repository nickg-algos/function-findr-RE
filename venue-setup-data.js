// Demo content for the venue food and beverage set up page (mockup page 19).
// Dishes and drinks are starting suggestions a venue can edit. No real venue names, per CLAUDE.md §9.
(function () {
  const rows = (...names) => names;
  const food = (title, prefix, id, ...names) => ({ id, title, collapsible: true, prefix, avail: true, rows: rows(...names) });
  const glassBottle = [{ id: "glass", label: "Glass" }, { id: "bottle", label: "Bottle" }];
  const uploadHint = "Upload a copy of this menu so customers can see what's on offer. PDF, JPG or PNG, up to 2 MB.";

  window.FF_SETUP = {
  // Dietary needs the venue caters for (moved here from the space set-up page; one list for the whole venue).
  dietary: ["Vegetarian", "Vegan", "Gluten-Free", "Allergy-Friendly", "Halal"],

    intro: "Set up your food and beverage packages so customers can choose their catering and drinks options when booking. Selections will flow directly into your venue dashboard making it easy to manage upcoming events and catering requirements.",
    uploadHint,
    uploadTypes: ["pdf", "jpg", "jpeg", "png"],
    availOptions: ["regular", "gluten free", "halal", "vegetarian", "vegan"],

    food: [
      {
        id: "canapes", label: "Canapés / Finger food",
        descLabel: "Enter a short description of your Canapés / Finger food menu mentioning price per person, inclusions, and conditions:",
        descEg: "e.g. Our function food is priced at $25 per person. Minimum 30 guests. Please choose 6 dishes from our menu. All options are halal. Contact us for information regarding shared antipasto platters.",
        groups: [food("Options", "Option", "options",
          "mixed vegetable rice paper rolls, hoisin",
          "pea & haloumi croquettes, garlic mayo, napoli, micro herbs (veg)",
          "smoked salmon crostini, goats cheese, capers, spanish onion, dill",
          "lemon salt & pepper squid, garlic aioli",
          "fried chicken karaage, snow pea tendrils, onion, yum yum sauce (gf)",
          "lemon garlic & rosemary chicken skewers, mint yoghurt (gf)",
          "pork & parmesan sausage rolls, tomato relish",
          "assorted pizza slices (2 selections only)")],
      },
      {
        id: "antipasto", label: "Antipasto Platter",
        descLabel: "Enter a short description of your Antipasto platter options mentioning price per person, inclusions, and conditions:",
        descEg: "e.g. Antipasto platters are priced at $200 per 20 people.",
        groups: [food("Options", "Antipasto Option", "options", "Vegetarian / Cheeses", "Meat / Cheeses")],
      },
      { id: "private", label: "Private Dining", upload: true },
      { id: "alacarte", label: "À la carte", upload: true },
      {
        id: "twocourse", label: "2 course menu",
        descLabel: "Enter a short description of your 2 course food menu mentioning price per person, inclusions, and conditions:",
        descEg: "e.g. Choose two courses from our specially selected function menu. Choose 3 entrées and 3 main options from the list. Your guests will order their preferred entrée and main course from your chosen menu during the function.",
        groups: [
          food("Entrées", "Entrée Option", "entrees",
            "Mixed mushroom Arancini w/ garlic mayo & Pecorino",
            "Fried Calamari, lemon pepper seasoning & garlic mayo",
            "Crispy Halloumi w/ strawberries, mountain pepper berry & balsamic glaze",
            "Pork Dim Sums w/ homemade soy & chilli sauce"),
          food("Mains", "Main Option", "mains",
            "Crispy Halloumi w/ strawberries, mountain pepper berry & balsamic glaze",
            "Asian Beef Salad, marinated eye fillet, crispy noodles, cucumber, coriander & chilli"),
        ],
      },
      {
        id: "threecourse", label: "3 course menu",
        descLabel: "Enter a short description of your 3 course food menu mentioning price per person, inclusions, and conditions:",
        descEg: "e.g. Choose three courses from our specially selected function menu. Choose 3 entrées, 3 main options and 2 dessert options from the list. Your guests will order their preferred entrée, main and dessert course from your chosen menu during the function.",
        groups: [
          food("Entrées", "Entrée Option", "entrees", "Mixed mushroom Arancini w/ garlic mayo & Pecorino"),
          food("Mains", "Main Option", "mains", "Asian Beef Salad, marinated eye fillet, crispy noodles, cucumber, coriander & chilli"),
          food("Desserts", "Dessert Option", "desserts", "Homemade Sticky Date Pudding w/ vanilla bean ice cream & butterscotch"),
        ],
      },
      { id: "kids", label: "Kids Menu", groups: [{ id: "options", title: "Options", collapsible: true, prefix: "Option", rows: ["", "", ""] }] },
      { id: "onTheDay", label: "Will order food on the day", plain: true },
    ],

    beverage: [
      {
        id: "barTab", label: "Bar tab",
        descLabel: "Enter a short description of your beverage options including pricing, inclusions, and conditions:",
        descEg: "e.g. Beverage tabs are charged on consumption (per drink) and served until the limit you appoint is reached. Please note it is strictly the responsibility of the event host to ensure guests consume beverages included in their package.",
        priceNote: "Enter prices including GST.",
        groups: [
          {
            id: "tap", title: "Tap Beer", collapsible: true,
            sizes: [{ id: "pot", label: "Pot" }, { id: "schooner", label: "Schooner" }, { id: "pint", label: "Pint" }],
            rows: rows("Carlton Draught", "Estrella Damm Lager", "Furphy Ale", "Furphy Crisp Lager", "Kirin Lager", "Mountain Goat Steam Ale", "Goat", "Somersby Apple Cider"),
            allRow: { name: "All Tap Beer", conditions: "Excludes Kirin & Estrella" },
          },
          {
            id: "bottles", title: "Bottles & Cans", collapsible: true,
            sizes: [{ id: "each", label: "Price", noTick: true }],
            rows: rows("Great Northern - mid strength", "Carlton Dry", "Corona", "Somersby Pear", "Peroni Nastro"),
          },
          { id: "bubbles", title: "Bubbles", collapsible: true, sizes: glassBottle, rows: rows("Rothbury estate sparkling cuvee", "Bandini Prosecco", "Chandon nv") },
          { id: "white", title: "White", collapsible: true, sizes: glassBottle, rows: rows("Deakin Estate Moscato") },
          { id: "rose", title: "Rosé", collapsible: true, sizes: glassBottle, rows: rows("Tellurian Rose") },
          { id: "red", title: "Red", collapsible: true, sizes: glassBottle, rows: rows("First Creek ‘Botanica’ Pinot Noir") },
        ],
      },
      {
        id: "drinks", label: "Drink packages", upload: true, priceNote: "Enter prices including GST.",
        groups: [{ id: "packages", sizes: [{ id: "each", label: "Price", suffix: "per guest" }], rows: rows("Drink Package – Option 1", "Drink Package – Option 2") }],
      },
      {
        id: "cocktails", label: "Cocktail options", upload: true, priceNote: "Enter prices including GST.",
        groups: [{ id: "packages", sizes: [{ id: "each", label: "Price" }], rows: rows("Cocktail Package – Option 1", "Cocktail Package – Option 2") }],
      },
      { id: "payg", label: "Pay-As-You-Go", upload: true },
    ],
  };
})();
