// Demo content for the venue search page (mockup page 2).
// Venues, addresses, logos and testimonials are placeholders, per CLAUDE.md §9.
(function () {
  const blurb = {
    bar: "A relaxed neighbourhood bar with a private back room, built for birthdays and work drinks.",
    dining: "A contemporary restaurant serving modern-Australian dishes with seasonal eating in mind.",
    pub: "A friendly local pub with a beer garden and a function room for every kind of get-together.",
    rooftop: "An open-air rooftop with city views, a dedicated bar and plenty of room to mingle.",
    hall: "A flexible event space with its own entrance, ideal for large parties and presentation nights.",
  };
  const v = (id, name, street, suburb, about, photo, price, rating, seated, standing, distanceKm, pin, verified, opens, latest, closed, type, features) => ({
    id, name, street, suburb, about: blurb[about], photo, price, rating, seated, standing, distanceKm, pin, verified, opens, latest, closed, type, features: features.split(" "),
  });
  const food = "canapes alacarte";
  const bev = "barTab drinkPackages";
  const usual = "wifi aircon tables";

  // Times are minutes after midnight; past 1440 runs into the next morning.
  // TODO(confirm): distance is from the city for now, as the mockup has no starting point.
  window.FF_SEARCH = {
    pageSize: 6,
    nearKm: 10, // TODO(confirm): venues further out than this appear under Also available.
    alsoCount: 4,
    venues: [
      v("sample", "The Sample Hotel", "1 Example Street", "Yarraville", "pub", 3, 2, 4.5, 80, 120, 7.2, [8, 52], true, 660, 1440, [], "pub", `${food} kids courses vegetarian glutenFree halal ${bev} payg decorations cakeBYO av wifi aircon tables danceFloor pool wheelchair wheelchairToilets street transport dj ownMusic systemMusic over18 cancel7 flexible`),
      v("foobar", "Foo Bar", "12 Sample Road", "South Melbourne", "bar", 2, 2, 4.2, 40, 90, 2.8, [88, 69], true, 720, 1500, [1], "bar", `${food} vegetarian vegan ${bev} cocktails decorations cakeBYO ${usual} av smoking street transport dj ownMusic over18 flexible`),
      v("lorem", "Lorem Rooftop", "88 Placeholder Lane", "Docklands", "rooftop", 1, 4, 4.7, 90, 220, 2.1, [83, 56], true, 720, 1440, [], "rooftop", `${food} vegan vegetarian glutenFree allergy ${bev} cocktails decorations av ${usual} danceFloor wheelchair wheelchairToilets lift onSite transport live dj systemMusic over18 cancel7`),
      v("ipsum", "Ipsum Dining Room", "4 Demo Parade", "North Melbourne", "dining", 3, 3, 4.6, 60, 80, 2.4, [86, 34], false, 660, 1380, [1, 2], "restaurant", `alacarte courses privateDining kids vegetarian vegan glutenFree allergy halal drinkPackages payg cakeBYO ${usual} wheelchair wheelchairToilets street transport systemMusic child cancel7 flexible`),
      v("mockup", "Mockup Social", "230 Example Avenue", "West Melbourne", "bar", 2, 2, 3.9, 30, 70, 2.9, [60, 42], true, 900, 1440, [0, 1], "privateRoom", `canapes vegetarian barTab cocktails payg decorations cakeBYO wifi tables pool smoking street transport dj ownMusic over18`),
      v("prototype", "Prototype Brewing", "19 Fictional Street", "Port Melbourne", "pub", 1, 3, 4.4, 120, 250, 4.6, [62, 76], true, 660, 1410, [], "pub", `${food} courses kids vegetarian glutenFree ${bev} payg decorations av ${usual} danceFloor pool smoking wheelchair wheelchairToilets lift onSite live dj systemMusic child flexible`),
      v("sandbox", "Sandbox Hall", "7 Sample Crescent", "Kensington", "hall", 3, 1, 4.1, 150, 300, 4.0, [64, 25], false, 600, 1380, [], "other", `canapes kids vegetarian halal barTab payg decorations cakeBYO av wifi aircon tables danceFloor wheelchair wheelchairToilets onSite transport live dj ownMusic child flexible`),
      v("wireframe", "Wireframe Wine Room", "61 Dummy Road", "Seddon", "bar", 2, 4, 4.8, 24, 50, 6.4, [15, 38], true, 960, 1380, [0, 1, 2], "privateRoom", `canapes courses privateDining vegetarian glutenFree drinkPackages cocktails ${usual} street systemMusic over21 cancel7`),
      v("template", "Template Terrace", "300 Example Boulevard", "Flemington", "rooftop", 1, 3, 4.3, 70, 160, 5.1, [50, 14], true, 720, 1440, [1], "rooftop", `${food} vegan vegetarian ${bev} cocktails decorations av ${usual} danceFloor smoking lift wheelchair onSite transport dj ownMusic over18 cancel7 flexible`),
      v("specimen", "The Specimen Room", "5 Placeholder Place", "Footscray", "dining", 3, 2, 4.0, 45, 60, 6.9, [22, 29], false, 660, 1320, [2], "restaurant", `alacarte courses kids privateDining vegetarian vegan halal allergy payg drinkPackages cakeBYO wifi aircon wheelchair wheelchairToilets street transport systemMusic child`),
      v("dummy", "The Dummy Arms", "150 Sample Street", "Port Melbourne", "pub", 2, 1, 3.8, 50, 110, 5.2, [76, 83], true, 660, 1440, [], "pub", `canapes kids courses vegetarian glutenFree barTab payg decorations cakeBYO wifi tables pool smoking street transport live ownMusic child flexible`),
      v("example", "Example Hall", "27 Demo Street", "Maribyrnong", "hall", 3, 2, 4.2, 200, 350, 8.3, [14, 9], true, 600, 1410, [], "other", `${food} courses kids vegetarian vegan glutenFree halal allergy ${bev} payg decorations cakeBYO av wifi aircon tables danceFloor wheelchair wheelchairToilets lift onSite live dj systemMusic ownMusic child cancel7 flexible`),
      v("draftroom", "Draft Room Bar", "9 Placeholder Road", "Newport", "bar", 2, 2, 4.4, 35, 80, 10.6, null, true, 720, 1440, [1], "bar", `canapes vegetarian barTab cocktails decorations wifi tables street ownMusic over18`),
      v("fictional", "Fictional Rooms", "410 Example Highway", "Williamstown", "dining", 3, 3, 4.5, 80, 100, 12.4, null, true, 660, 1380, [], "restaurant", `alacarte courses privateDining kids vegetarian vegan glutenFree drinkPackages cakeBYO ${usual} wheelchair onSite systemMusic child cancel7`),
      v("sketch", "Sketch Pavilion", "2 Sample Esplanade", "Altona", "hall", 1, 2, 4.0, 120, 200, 15.8, null, true, 600, 1380, [], "other", `canapes kids courses barTab payg decorations cakeBYO av danceFloor wheelchair wheelchairToilets onSite live dj child flexible`),
      v("outline", "Outline Bar & Terrace", "33 Dummy Lane", "Sunshine", "rooftop", 2, 2, 3.9, 60, 150, 13.2, null, false, 720, 1440, [1], "rooftop", `${food} vegetarian ${bev} decorations wifi tables smoking transport dj over18`),
    ],

    filterGroups: [
      { id: "food", title: "Food", sets: [
        { title: "Catering Type:", items: [["canapes", "Canapés/ Finger food"], ["courses", "2 or 3 course menu"], ["alacarte", "À la carte"], ["privateDining", "Private Dining"], ["kids", "Kids Menu"]] },
        { title: "Dietary Accommodations:", items: [["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["glutenFree", "Gluten-Free"], ["halal", "Halal"], ["allergy", "Allergy-Friendly"]] },
      ] },
      { id: "beverage", title: "Beverage Options", sets: [{ items: [["barTab", "Bar Tab"], ["payg", "Pay-As-You-Go"], ["drinkPackages", "Drink Packages"], ["cocktails", "Cocktail Options"]] }] },
      { id: "additional", title: "Additional", sets: [{ items: [["decorations", "Own Decorations Welcome"], ["cakeBYO", "BYO Celebration Cake permitted"]] }] },
      { id: "area", title: "Area Type", sets: [{ title: "Venue Type:", anyOf: true, items: [["pub", "Pub"], ["privateRoom", "Private Room"], ["rooftop", "Rooftop"], ["bar", "Bar"], ["restaurant", "Restaurant"], ["other", "Other"]] }] },
      { id: "facilities", title: "Facilities", sets: [{ items: [["av", "AV Equipment: TV, Projector, Screen, Microphone, Speakers"], ["wifi", "Wi-Fi Access"], ["danceFloor", "Dance Floor"], ["aircon", "Air Conditioning/Heating"], ["pool", "Pool Table"], ["tables", "High and Low Tables"], ["smoking", "Smoking Area"]] }] },
      { id: "access", title: "Accessibility", sets: [{ items: [["wheelchair", "Wheelchair Accessible"], ["wheelchairToilets", "Wheelchair Accessible Toilets"], ["lift", "Lift Access"]] }] },
      { id: "transport", title: "Parking / Transport Availability", sets: [{ items: [["onSite", "On-site"], ["transport", "Close to Public Transport"], ["street", "Street"]] }] },
      { id: "music", title: "Music & Sound", sets: [{ items: [["live", "Live band allowed"], ["systemMusic", "Venue-provided music system"], ["dj", "DJ allowed"], ["ownMusic", "Play own music – via iPhone/laptop"]] }] },
      { id: "age", title: "Age Restrictions", sets: [{ items: [["over18", "18+"], ["over21", "21+"], ["child", "Child-Friendly"]] }] },
      { id: "cancel", title: "Cancellation & Booking Flexibility", sets: [{ items: [["cancel7", "Free Cancellation up to 7 days prior"], ["flexible", "Flexible Date Changes"]] }] },
    ],

    // Sample wishlists from mockup page 4, holding venues that aren't on the first page of results.
    wishlists: [
      { id: "list-50th", name: "50th birthday celebration", venues: ["wireframe", "template", "specimen"] },
      { id: "list-21st", name: "Sam’s 21st birthday", venues: ["example", "dummy", "fictional", "sketch"] },
    ],

    logos: [
      { name: "The Sample Hotel", style: "serif" },
      { name: "FOO BAR", style: "wide" },
      { name: "Lorem Rooftop", style: "script" },
      { name: "Example Hall", style: "serif" },
    ],

    testimonials: [
      { name: "Alex Sample", text: "FunctionFindr made planning my event so much easier! I found the perfect venue within minutes, complete with all amenities I needed." },
      { name: "Erin Example", text: "FunctionFindr made planning my event so much easier! I found the perfect venue within minutes, complete with all amenities I needed." },
      { name: "Paityn Placeholder", text: "FunctionFindr made planning my event so much easier! I found the perfect venue within minutes, complete with all amenities I needed." },
      { name: "Sam Demo", text: "We compared five venues for our club presentation night without a single phone call. Being able to see real capacities saved us hours." },
      { name: "Jordan Test", text: "Booking our work Christmas party used to take weeks of emails. This time it was sorted over a coffee." },
    ],
  };
})();
