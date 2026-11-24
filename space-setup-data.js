// Choices for the function space set up page (mockup page 18), in the mockup's order and wording.
window.FF_SPACE_SETUP = {
  // Booking buffer choices, in minutes: 15 minutes to 5 hours.
  bufferSteps: Array.from({ length: 20 }, (_, i) => (i + 1) * 15),

  sessions: [
    { id: "day", label: "Day Time Function Space Available Hours" },
    { id: "evening", label: "Evening Function Space Available Hours", overnight: true }, // may close after midnight
  ],

  extras: [
    { id: "roomHire", label: "Room Hire" },
    { id: "cleaning", label: "Cleaning Fee" },
    { id: "security", label: "Security Fee" },
  ],

  // Food Catering Type and Beverage Options (V42 mockup p12): a tick box each, most with an Upload menu.
  food: [
    { id: "canapes", label: "Canapés/ Finger food", upload: true },
    { id: "private", label: "Private Dining", upload: true },
    { id: "alacarte", label: "À la carte", upload: true },
    { id: "course", label: "2 or 3 course menu", upload: true },
    { id: "kids", label: "Kids Menu", upload: true },
    { id: "onTheDay", label: "Will order food on the day" },
  ],
  dietary: ["Vegetarian", "Vegan", "Gluten-Free", "Allergy-Friendly", "Halal"],
  beverage: [
    { id: "barTab", label: "Bar tab", upload: true },
    { id: "drinks", label: "Drink packages", upload: true },
    { id: "cocktails", label: "Cocktail options", upload: true },
    { id: "payg", label: "Pay-As-You-Go", upload: true },
  ],
  uploadTypes: ["pdf", "jpg", "jpeg", "png", "docx"],
  uploadMaxBytes: 2 * 1024 * 1024,

  groups: [
    { id: "additional", label: "Additional", options: ["Own Decorations Welcome (please avoid adhesives or confetti)", "BYO Celebration Cake permitted ($1pp venue cutting fee applies)", "BYO Celebration Cake - guest to cut. No cakeage"] },
    { id: "facilities", label: "Facilities", options: ["AV Equipment: TV, projector, screen, microphone, speakers", "Air conditioning / Heating", "Wi-Fi Access", "Dance Floor", "Smoking Area", "Pool Table", "High and Low Tables"] },
    { id: "accessibility", label: "Accessibility", options: ["Wheelchair Accessible", "Wheelchair Accessible Toilets", "Lift Access"] },
    { id: "transport", label: "Parking / Transport Availability", options: ["On-site", "Street", "Close to Public Transport"] },
    { id: "music", label: "Music & sound", options: ["Live band allowed", "DJ allowed", "Venue-provided music system", "Play own music – via iPhone/laptop"] },
    // TODO(confirm): "21+" is in the mockup, though 18 is the legal drinking age everywhere in Australia.
    { id: "age", label: "Age Restrictions", options: ["18+", "21+", "Guests under 18 must be accompanied by a parent or guardian", "Child friendly"] },
    { id: "cancellation", label: "Cancellation and booking flexibility", options: ["Free Cancellation up to 7 days prior", "Flexible date changes"] },
  ],

  maxWords: 200,
  maxPhotos: 3,
};
