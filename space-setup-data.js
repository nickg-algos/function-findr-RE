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
