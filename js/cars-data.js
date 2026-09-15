/* =========================================================
   AutoGod — Car Catalog
   =========================================================
   Single source of truth for every vehicle on the site. Add a
   new car by adding a new object below — the homepage cards,
   product pages, listing/filter page, cart, and dashboard all
   read from this one file (no data is duplicated elsewhere).

   FIELD REFERENCE (every car object below has all of these):
     id            unique slug, used in URLs: product.html?id=X
     name          full display name shown on product.html
     category      marketing label shown as a pill on product.html
                    (e.g. "Family SUV" — more specific than bodyType)
     condition     "New" or "Certified Pre-Owned"
     year / price  numbers, used directly and for filter bands
     rating        0–5, half-points allowed (renderStars() below)
     transmission / fuel / topSpeed / engine / power / mileage
                    spec strings shown on the product page and,
                    for transmission/fuel/mileage, also used as
                    filter options on vehicles.html
     seats / drivetrain / colors  more product-page spec details
     image         path under /image, reused everywhere (cards,
                    galleries, cart, dashboard — one photo per car)
     description   2–3 sentence blurb on the product page
     vin           fictional, just for product-page flavour
     brand         constant "AutoGod" (single in-house brand —
                    still wired up as a real filter on vehicles.html)
     model         name minus the "AutoGod " prefix, used for
                    search matching and the "model" filter
     bodyType      broad category used for the homepage's "shop by
                    category" chips and the listing page's filter
                    (e.g. "SUV" — coarser than `category` above)
     availability  "In Stock" or "Limited Stock" — its own filter,
                    also shown as a badge on listing cards
     listingGroup  "popular" or "featured" — which homepage slider
                    a car appears in, and which the "See More" /
                    group-tab links on vehicles.html point at
   ========================================================= */

const AUTOGOD_CARS = [
  {
    id: "vehicle-1",
    name: "AutoGod Horizon GT",
    category: "Sports Coupe",
    condition: "New",
    year: 2024,
    price: 68500,
    rating: 4.8,
    transmission: "Automatic",
    fuel: "Petrol",
    topSpeed: "189 mph",
    engine: "3.0L Twin-Turbo V6",
    power: "410 hp",
    mileage: "0 mi (Brand New)",
    seats: 4,
    drivetrain: "Rear-Wheel Drive",
    colors: ["Jet Black", "Storm Grey", "Racing Yellow"],
    image: "image/vehicle-1.png",
    description: "The Horizon GT is built for drivers who want a genuine sports coupe without giving up daily comfort. A twin-turbo V6 and a tuned sport suspension give it sharp, confident handling, while the cabin keeps things comfortable for longer drives.",
    vin: "AGH1Z0R1ZN2024001",
    brand: "AutoGod",
    model: "Horizon GT",
    bodyType: "Coupe",
    availability: "In Stock",
    listingGroup: "popular"
  },
  {
    id: "vehicle-2",
    name: "AutoGod Voyager SUV",
    category: "Family SUV",
    condition: "New",
    year: 2024,
    price: 54900,
    rating: 4.6,
    transmission: "Automatic",
    fuel: "Hybrid",
    topSpeed: "130 mph",
    engine: "2.5L Hybrid I4",
    power: "245 hp combined",
    mileage: "0 mi (Brand New)",
    seats: 7,
    drivetrain: "All-Wheel Drive",
    colors: ["Pearl White", "Deep Blue", "Graphite"],
    image: "image/vehicle-2.png",
    description: "Roomy, efficient, and easy to live with, the Voyager SUV seats seven and pairs a hybrid drivetrain with genuine all-wheel-drive capability — a strong pick for growing families who still want to save on fuel.",
    vin: "AGV0Y1G3RN2024002",
    brand: "AutoGod",
    model: "Voyager SUV",
    bodyType: "SUV",
    availability: "In Stock",
    listingGroup: "popular"
  },
  {
    id: "vehicle-3",
    name: "AutoGod Falcon Roadster",
    category: "Convertible",
    condition: "New",
    year: 2023,
    price: 72300,
    rating: 4.7,
    transmission: "Automatic",
    fuel: "Petrol",
    topSpeed: "175 mph",
    engine: "3.5L V6",
    power: "365 hp",
    mileage: "1,200 mi",
    seats: 2,
    drivetrain: "Rear-Wheel Drive",
    colors: ["Cherry Red", "Jet Black", "Silver Mist"],
    image: "image/vehicle-3.png",
    description: "A two-seat roadster with a power-folding soft top, the Falcon trades practicality for pure open-road fun. Light, balanced, and quick to respond, it's built for weekend drives more than the daily commute.",
    vin: "AGF4L1C0N2023003",
    brand: "AutoGod",
    model: "Falcon Roadster",
    bodyType: "Convertible",
    availability: "Limited Stock",
    listingGroup: "popular"
  },
  {
    id: "vehicle-4",
    name: "AutoGod Terra X",
    category: "Off-Road SUV",
    condition: "New",
    year: 2024,
    price: 61200,
    rating: 4.5,
    transmission: "Automatic",
    fuel: "Diesel",
    topSpeed: "118 mph",
    engine: "3.0L Turbo-Diesel V6",
    power: "330 hp",
    mileage: "0 mi (Brand New)",
    seats: 5,
    drivetrain: "4x4 with Low Range",
    colors: ["Sand Beige", "Forest Green", "Matte Grey"],
    image: "image/vehicle-4.png",
    description: "Built on a reinforced ladder frame with locking differentials and real ground clearance, the Terra X is made for drivers who actually leave the pavement — without giving up a comfortable, well-equipped cabin.",
    vin: "AGT3RR0AX2024004",
    brand: "AutoGod",
    model: "Terra X",
    bodyType: "SUV",
    availability: "In Stock",
    listingGroup: "popular"
  },
  {
    id: "vehicle-5",
    name: "AutoGod Volt-E",
    category: "Electric Sedan",
    condition: "New",
    year: 2024,
    price: 58750,
    rating: 4.9,
    transmission: "Single-Speed Automatic",
    fuel: "Electric",
    topSpeed: "155 mph",
    engine: "Dual Electric Motors",
    power: "395 hp",
    mileage: "0 mi (Brand New)",
    seats: 5,
    drivetrain: "All-Wheel Drive",
    colors: ["Arctic White", "Midnight Blue", "Silver Mist"],
    image: "image/vehicle-5.png",
    description: "A 310-mile range, quick-charging support, and instant dual-motor torque make the Volt-E one of our quietest and quickest sedans — all with zero tailpipe emissions.",
    vin: "AGV0LT3EN2024005",
    brand: "AutoGod",
    model: "Volt-E",
    bodyType: "Electric",
    availability: "In Stock",
    listingGroup: "popular"
  },
  {
    id: "vehicle-6",
    name: "AutoGod Ranger Pro",
    category: "Pickup Truck",
    condition: "New",
    year: 2023,
    price: 49999,
    rating: 4.4,
    transmission: "Manual",
    fuel: "Diesel",
    topSpeed: "112 mph",
    engine: "2.8L Turbo-Diesel I4",
    power: "260 hp",
    mileage: "2,400 mi",
    seats: 5,
    drivetrain: "4x4",
    colors: ["Steel Grey", "Deep Blue", "White"],
    image: "image/vehicle-6.png",
    description: "A dependable work truck with a 2,800 lb payload rating and a 7,500 lb tow rating, the Ranger Pro is built for job sites during the week and everything else on the weekend.",
    vin: "AGR4NG3RP2023006",
    brand: "AutoGod",
    model: "Ranger Pro",
    bodyType: "Truck",
    availability: "In Stock",
    listingGroup: "popular"
  },
  {
    id: "car-1",
    name: "AutoGod Nova Sedan",
    category: "Sedan",
    condition: "New",
    year: 2024,
    price: 42500,
    rating: 4.5,
    transmission: "Automatic",
    fuel: "Petrol",
    topSpeed: "142 mph",
    engine: "2.0L Turbo I4",
    power: "228 hp",
    mileage: "0 mi (Brand New)",
    seats: 5,
    drivetrain: "Front-Wheel Drive",
    colors: ["Silver Mist", "Jet Black", "Ruby Red"],
    image: "image/car-1.png",
    description: "The Nova is our best-selling everyday sedan — a comfortable ride, a well-finished cabin, and enough power to make merging and overtaking effortless.",
    vin: "AGN0V4SDN2024007",
    brand: "AutoGod",
    model: "Nova Sedan",
    bodyType: "Sedan",
    availability: "In Stock",
    listingGroup: "featured"
  },
  {
    id: "car-2",
    name: "AutoGod Zenith Luxury",
    category: "Luxury Sedan",
    condition: "New",
    year: 2024,
    price: 89900,
    rating: 4.9,
    transmission: "Automatic",
    fuel: "Petrol",
    topSpeed: "160 mph",
    engine: "4.0L Twin-Turbo V8",
    power: "480 hp",
    mileage: "0 mi (Brand New)",
    seats: 5,
    drivetrain: "All-Wheel Drive",
    colors: ["Obsidian Black", "Champagne Gold", "Pearl White"],
    image: "image/car-2.png",
    description: "Our flagship sedan pairs a V8 with a hand-finished cabin, massaging seats, and a full suite of driver-assist features — a genuine luxury experience with serious performance underneath.",
    vin: "AGZ3N1THL2024008",
    brand: "AutoGod",
    model: "Zenith Luxury",
    bodyType: "Sedan",
    availability: "Limited Stock",
    listingGroup: "featured"
  },
  {
    id: "car-3",
    name: "AutoGod Rally X5",
    category: "Hot Hatch",
    condition: "New",
    year: 2023,
    price: 37800,
    rating: 4.6,
    transmission: "Manual",
    fuel: "Petrol",
    topSpeed: "148 mph",
    engine: "2.0L Turbo I4",
    power: "290 hp",
    mileage: "1,800 mi",
    seats: 4,
    drivetrain: "All-Wheel Drive",
    colors: ["Racing Yellow", "Jet Black", "Blue Metallic"],
    image: "image/car-3.png",
    description: "Small, quick, and genuinely fun on a twisty road, the Rally X5 borrows its all-wheel-drive system and short-throw manual gearbox straight from the track team.",
    vin: "AGR4LLYX2023009",
    brand: "AutoGod",
    model: "Rally X5",
    bodyType: "Hatchback",
    availability: "In Stock",
    listingGroup: "featured"
  },
  {
    id: "car-4",
    name: "AutoGod Cascade Hybrid",
    category: "Crossover",
    condition: "New",
    year: 2024,
    price: 46300,
    rating: 4.5,
    transmission: "Automatic",
    fuel: "Hybrid",
    topSpeed: "128 mph",
    engine: "2.0L Hybrid I4",
    power: "212 hp combined",
    mileage: "0 mi (Brand New)",
    seats: 5,
    drivetrain: "All-Wheel Drive",
    colors: ["Sage Green", "Pearl White", "Graphite"],
    image: "image/car-4.png",
    description: "A relaxed, efficient crossover for daily driving — the Cascade Hybrid returns strong fuel economy without asking you to give up cargo space or all-wheel-drive traction.",
    vin: "AGC4SC4DH2024010",
    brand: "AutoGod",
    model: "Cascade Hybrid",
    bodyType: "SUV",
    availability: "In Stock",
    listingGroup: "featured"
  },
  {
    id: "car-5",
    name: "AutoGod Titan 4x4",
    category: "Off-Roader",
    condition: "Certified Pre-Owned",
    year: 2023,
    price: 55600,
    rating: 4.4,
    transmission: "Automatic",
    fuel: "Diesel",
    topSpeed: "105 mph",
    engine: "3.0L Turbo-Diesel V6",
    power: "280 hp",
    mileage: "8,900 mi",
    seats: 5,
    drivetrain: "4x4 with Low Range",
    colors: ["Matte Grey", "Sand Beige", "Black"],
    image: "image/car-5.png",
    description: "Certified pre-owned and fully inspected, the Titan 4x4 is a rugged, no-nonsense off-roader with low mileage and plenty of trail life left in it.",
    vin: "AGT1T4N4X2023011",
    brand: "AutoGod",
    model: "Titan 4x4",
    bodyType: "SUV",
    availability: "In Stock",
    listingGroup: "featured"
  },
  {
    id: "car-6",
    name: "AutoGod Comet GTX",
    category: "Muscle Car",
    condition: "New",
    year: 2024,
    price: 64200,
    rating: 4.8,
    transmission: "Manual",
    fuel: "Petrol",
    topSpeed: "172 mph",
    engine: "5.0L V8",
    power: "460 hp",
    mileage: "0 mi (Brand New)",
    seats: 4,
    drivetrain: "Rear-Wheel Drive",
    colors: ["Racing Yellow", "Cherry Red", "Jet Black"],
    image: "image/car-6.png",
    description: "Naturally-aspirated V8, a proper manual gearbox, and a widebody stance — the Comet GTX is built for drivers who want an unapologetic muscle car experience.",
    vin: "AGC0M3TG2024012",
    brand: "AutoGod",
    model: "Comet GTX",
    bodyType: "Coupe",
    availability: "In Stock",
    listingGroup: "featured"
  },
  {
    id: "car-7",
    name: "AutoGod Aura Minivan",
    category: "Minivan",
    condition: "New",
    year: 2023,
    price: 39400,
    rating: 4.3,
    transmission: "Automatic",
    fuel: "Petrol",
    topSpeed: "118 mph",
    engine: "3.5L V6",
    power: "290 hp",
    mileage: "0 mi (Brand New)",
    seats: 8,
    drivetrain: "Front-Wheel Drive",
    colors: ["Pearl White", "Silver Mist", "Deep Blue"],
    image: "image/car-7.png",
    description: "Eight seats, sliding doors, and a genuinely quiet cabin — the Aura is built around making family road trips easier, with plenty of room for everyone and everything.",
    vin: "AGA0R4M1N2023013",
    brand: "AutoGod",
    model: "Aura Minivan",
    bodyType: "Minivan",
    availability: "In Stock",
    listingGroup: "featured"
  },
  {
    id: "car-8",
    name: "AutoGod Blitz Turbo",
    category: "Sports Sedan",
    condition: "New",
    year: 2024,
    price: 58000,
    rating: 4.7,
    transmission: "Automatic",
    fuel: "Petrol",
    topSpeed: "165 mph",
    engine: "3.0L Twin-Turbo I6",
    power: "375 hp",
    mileage: "0 mi (Brand New)",
    seats: 5,
    drivetrain: "Rear-Wheel Drive",
    colors: ["Storm Grey", "Jet Black", "Blue Metallic"],
    image: "image/car-8.png",
    description: "The Blitz Turbo is proof a sedan can still be genuinely quick — a twin-turbo inline-six, a well-balanced chassis, and just enough back-seat room to make it practical, too.",
    vin: "AGB1L1TZ2024014",
    brand: "AutoGod",
    model: "Blitz Turbo",
    bodyType: "Sedan",
    availability: "In Stock",
    listingGroup: "featured"
  }
];

/* =========================================================
   CATALOG HELPERS
   Small pure functions used across product.js, cart-page.js,
   checkout.js, vehicles.js, and dashboard.js — kept here next
   to the data itself since they're really just "ways of reading
   the catalog," not page-specific logic.
   ========================================================= */

// Look up one car by its id (e.g. from a ?id= URL param, or a
// cart/order line item). Returns null instead of undefined so
// callers can safely do `if (!car) { show "not found" }`.
function getCarById(id) {
  return AUTOGOD_CARS.find(c => c.id === id) || null;
}

// Mileage is stored as a display string ("1,200 mi", "0 mi (Brand
// New)") so it reads nicely on the product page — this strips it
// back down to a plain number for the vehicles.html mileage filter.
function getMileageNumber(car) {
  const digits = String(car.mileage).replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

// $68,500 -> "$68,500/-" — the "/-" suffix matches the original
// template's pricing style used throughout the site.
function formatPrice(amount) {
  return "$" + Number(amount).toLocaleString("en-US") + "/-";
}

// Turns a numeric rating (e.g. 4.8) into a row of Font Awesome
// star icons: filled stars, an optional half-star, then outline
// stars to fill out to 5 — used on cards and the product page.
function renderStars(rating) {
  let full = Math.floor(rating);
  let hasHalf = rating - full >= 0.5;
  let html = "";
  for (let i = 0; i < full; i++) html += '<i class="fas fa-star"></i>';
  if (hasHalf) html += '<i class="fas fa-star-half-alt"></i>';
  let remaining = 5 - full - (hasHalf ? 1 : 0);
  for (let i = 0; i < remaining; i++) html += '<i class="far fa-star"></i>';
  return html;
}
