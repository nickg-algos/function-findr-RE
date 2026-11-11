// Photos and public listings for the venue's function spaces (mockup page 24), keyed by the
// booking calendar's space ids (calendar-data.js).
// TODO(confirm): the calendar's rooms (Centenary, Malouf…) aren't the same as the spaces on the public
// venue page (venue-data.js: Function Room, Dining Room…). Only the Function Room is in both, so the
// other rooms' "View Listing" opens the venue page until the two lists are made one.
window.FF_SPACE_LIST = {
  functionRoom: { photo: "assets/sample-hotel.jpg", alt: "The Function Room’s high tables and bar stools", listing: "space.html?venue=sample&space=function-room" },
  centenary: { photo: "assets/room-2.jpg", alt: "A long table set for dinner beside a fireplace in The Centenary Room", listing: "venue.html?id=sample" },
  malouf: { photo: "assets/room-3.jpg", alt: "A round table by the window in The Malouf Boardroom", listing: "venue.html?id=sample" },
  kalka: { photo: "assets/sample-share-plates.jpg", alt: "Share plates and red wine on a table in The Kalka Room", listing: "venue.html?id=sample" },
  richardson: { photo: "assets/sample-pool-room.jpg", alt: "A pool table in The Richardson Room", listing: "venue.html?id=sample" },
  whole: { photo: "assets/sample-bar.jpg", alt: "The front bar, part of a whole venue hire", listing: "venue.html?id=sample" },
};
