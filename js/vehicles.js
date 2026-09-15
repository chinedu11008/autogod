/* =========================================================
   AutoGod — Vehicle listing / search / filter page (vehicles.html)
   =========================================================
   The full catalog browser: search box, 9-field filter panel,
   and an All/Popular/Featured group toggle, all running entirely
   client-side against the AUTOGOD_CARS array (cars-data.js) —
   there's no API call involved, just Array.filter(). Gated page,
   see requireLogin() at the bottom.

   CATEGORIES IN THIS FILE
     1. State + filter-band definitions
     2. Filter dropdown population
     3. Reading the entry URL (?search=, ?category=, ?group=)
     4. Heading / group-tab display sync
     5. The actual filtering logic
     6. Results grid render
     7. Page initialisation (guard, first render, wire every control)
   ========================================================= */


/* =========================================================
   CATEGORY 1: STATE + FILTER-BAND DEFINITIONS
   ========================================================= */

// "all" | "popular" | "featured" — which homepage slider's cars
// to restrict to (matches each car's `listingGroup`). Driven by
// the group-tab buttons and/or a ?group= URL param on arrival.
let currentGroup = "all";

// Price and mileage are continuous numbers, so — unlike the other
// filters, which just list every distinct value that appears in
// the data — these use hand-picked ranges ("bands") instead.
// [min, max) style: min is inclusive, max is exclusive except the
// open-ended top band, which uses Infinity.
const PRICE_BANDS = [
  { label: "under $50,000", min: 0, max: 50000 },
  { label: "$50,000 – $70,000", min: 50000, max: 70000 },
  { label: "$70,000 – $90,000", min: 70000, max: 90000 },
  { label: "over $90,000", min: 90000, max: Infinity }
];

// Mileage bands are inclusive on both ends (see getFilteredCars()).
const MILEAGE_BANDS = [
  { label: "brand new (0 mi)", min: 0, max: 0 },
  { label: "under 2,000 mi", min: 1, max: 1999 },
  { label: "2,000 – 5,000 mi", min: 2000, max: 5000 },
  { label: "over 5,000 mi", min: 5001, max: Infinity }
];


/* =========================================================
   CATEGORY 2: FILTER DROPDOWN POPULATION
   Every dropdown except price/mileage is built dynamically from
   whatever values actually exist in AUTOGOD_CARS, so the filter
   panel never drifts out of sync with the catalog — add a new
   car with a new fuel type, and it just shows up as an option
   automatically.
   ========================================================= */

function fillSelect(id, values, allLabel) {
  const el = document.getElementById(id);
  el.innerHTML = `<option value="">${allLabel}</option>` +
    values.map(v => `<option value="${v}">${v}</option>`).join("");
}

// Same idea as fillSelect(), but for the hand-picked price/mileage
// bands — the option's VALUE is the band's array index (so we can
// look the band's min/max back up cheaply), not the label text.
function fillBandSelect(id, bands, allLabel) {
  const el = document.getElementById(id);
  el.innerHTML = `<option value="">${allLabel}</option>` +
    bands.map((b, i) => `<option value="${i}">${b.label}</option>`).join("");
}

function populateFilterOptions() {
  // [...new Set(...)] de-duplicates, e.g. 3 different cars sharing
  // "Automatic" only produces one dropdown option for it.
  const bodyTypes = [...new Set(AUTOGOD_CARS.map(c => c.bodyType))].sort();
  const brands = [...new Set(AUTOGOD_CARS.map(c => c.brand))].sort(); // just "AutoGod" today — still a real, working filter
  const models = [...new Set(AUTOGOD_CARS.map(c => c.model))].sort();
  const years = [...new Set(AUTOGOD_CARS.map(c => c.year))].sort((a, b) => b - a); // newest first
  const fuels = [...new Set(AUTOGOD_CARS.map(c => c.fuel))].sort();
  const transmissions = [...new Set(AUTOGOD_CARS.map(c => c.transmission))].sort();
  const availabilities = [...new Set(AUTOGOD_CARS.map(c => c.availability))].sort();

  fillSelect("filter-bodytype", bodyTypes, "all categories");
  fillSelect("filter-brand", brands, "all brands");
  fillSelect("filter-model", models, "all models");
  fillSelect("filter-year", years, "any year");
  fillSelect("filter-fuel", fuels, "any fuel type");
  fillSelect("filter-transmission", transmissions, "any transmission");
  fillSelect("filter-availability", availabilities, "any availability");
  fillBandSelect("filter-price", PRICE_BANDS, "any price");
  fillBandSelect("filter-mileage", MILEAGE_BANDS, "any mileage");
}


/* =========================================================
   CATEGORY 3: READING THE ENTRY URL
   Lets other pages deep-link straight into a pre-filtered view:
     vehicles.html?search=roadster        (navbar search box)
     vehicles.html?category=SUV           (homepage category chips)
     vehicles.html?group=popular/featured (homepage "See More" buttons)
   ========================================================= */
function initFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const search = params.get("search");
  const category = params.get("category");
  const group = params.get("group");

  if (search) document.getElementById("filter-search").value = search;
  if (category) document.getElementById("filter-bodytype").value = category;
  if (group === "popular" || group === "featured") currentGroup = group;
}


/* =========================================================
   CATEGORY 4: HEADING / GROUP-TAB DISPLAY SYNC
   Keeps the big page heading and the active group-tab button in
   sync with `currentGroup` — called after every change to it.
   ========================================================= */
function updateHeading() {
  const heading = document.getElementById("listing-heading");
  if (currentGroup === "popular") heading.innerHTML = 'popular <span>vehicles</span>';
  else if (currentGroup === "featured") heading.innerHTML = '<span>featured</span> cars';
  else heading.innerHTML = 'all <span>vehicles</span>';
}

function syncGroupTabs() {
  document.querySelectorAll(".group-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.group === currentGroup);
  });
}


/* =========================================================
   CATEGORY 5: THE ACTUAL FILTERING LOGIC
   Reads every control's current value straight from the DOM
   (no separate "filter state" object to keep in sync — the form
   fields ARE the state) and runs one Array.filter() pass over
   the whole catalog. With only 14 cars this is trivially fast;
   a larger catalog would want to filter server-side instead.
   ========================================================= */
function getFilteredCars() {
  const search = (document.getElementById("filter-search").value || "").toLowerCase().trim();
  const bodyType = document.getElementById("filter-bodytype").value;
  const brand = document.getElementById("filter-brand").value;
  const model = document.getElementById("filter-model").value;
  const priceIdx = document.getElementById("filter-price").value;
  const yearVal = document.getElementById("filter-year").value;
  const mileageIdx = document.getElementById("filter-mileage").value;
  const fuel = document.getElementById("filter-fuel").value;
  const transmission = document.getElementById("filter-transmission").value;
  const availability = document.getElementById("filter-availability").value;

  return AUTOGOD_CARS.filter(car => {
    if (currentGroup !== "all" && car.listingGroup !== currentGroup) return false;

    // Free-text search checks name/model/brand/category/bodyType all
    // at once — e.g. typing "SUV" matches on bodyType even if it's
    // not literally in the car's name.
    if (search) {
      const haystack = (car.name + " " + car.model + " " + car.brand + " " + car.category + " " + car.bodyType).toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    // Empty-string dropdown value = "any" for that filter, so an
    // unset filter never excludes anything.
    if (bodyType && car.bodyType !== bodyType) return false;
    if (brand && car.brand !== brand) return false;
    if (model && car.model !== model) return false;
    if (yearVal && String(car.year) !== yearVal) return false;
    if (fuel && car.fuel !== fuel) return false;
    if (transmission && car.transmission !== transmission) return false;
    if (availability && car.availability !== availability) return false;

    // Price band: min inclusive, max exclusive (so $50,000 lands in
    // the "$50,000–$70,000" band, not "under $50,000").
    if (priceIdx !== "") {
      const band = PRICE_BANDS[priceIdx];
      if (car.price < band.min || car.price >= band.max) return false;
    }
    // Mileage band: inclusive on both ends (see MILEAGE_BANDS above).
    if (mileageIdx !== "") {
      const band = MILEAGE_BANDS[mileageIdx];
      const miles = getMileageNumber(car); // cars-data.js — parses "1,200 mi" -> 1200
      if (miles < band.min || miles > band.max) return false;
    }
    return true;
  });
}


/* =========================================================
   CATEGORY 6: RESULTS GRID RENDER
   ========================================================= */

// One card in the results grid — same visual pattern as the
// related-cars grid on product.html, plus an availability badge.
function listingCarCardHtml(car) {
  const availClass = car.availability === "In Stock" ? "availability-in" : "availability-limited";
  return `
    <a href="product.html?id=${car.id}" class="car-card">
      <button class="wishlist-btn" data-id="${car.id}"><i class="far fa-heart"></i></button>
      <span class="availability-tag ${availClass}">${car.availability}</span>
      <img src="${car.image}" alt="${car.name}">
      <h3>${car.name}</h3>
      <div class="stars">${renderStars(car.rating)}</div>
      <div class="price">${formatPrice(car.price)}</div>
      <span class="btn">view details</span>
    </a>`;
}

// Re-runs the filter and repaints the whole grid + results count.
// Called on first load and after every filter/search/group change
// (see the event listeners in CATEGORY 7 below).
function renderListing() {
  const filtered = getFilteredCars();
  const countEl = document.getElementById("results-count");
  countEl.textContent = filtered.length + (filtered.length === 1 ? " vehicle found" : " vehicles found");

  const grid = document.getElementById("listing-grid");
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-magnifying-glass"></i>
        No vehicles match those filters. Try clearing a few and searching again.
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(listingCarCardHtml).join("");
  updateWishlistIcons(); // shop.js — paint correct heart state on the fresh cards
  grid.querySelectorAll(".wishlist-btn[data-id]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // hearts sit inside <a class="car-card"> — don't also follow the link
      toggleWishlist(btn.dataset.id);
    });
  });
}


/* =========================================================
   CATEGORY 7: PAGE INITIALISATION
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  // Protected page — search/filters/browsing the full catalog
  // require an account. requireLogin() remembers this exact URL
  // (including any ?search=/?category=/?group= params already on
  // it) so login sends the visitor back to the same filtered view.
  if (!requireLogin()) return;

  populateFilterOptions();
  initFromQuery();     // may set currentGroup + prefill the search/category fields
  updateHeading();
  syncGroupTabs();
  renderListing();

  // Every filter control re-runs the same renderListing() — selects
  // fire on "change", the free-text search box fires on "input" (as
  // you type, not just on blur/enter).
  const filterIds = [
    "filter-search", "filter-bodytype", "filter-brand", "filter-model",
    "filter-price", "filter-year", "filter-mileage", "filter-fuel",
    "filter-transmission", "filter-availability"
  ];
  filterIds.forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener(el.tagName === "SELECT" ? "change" : "input", renderListing);
  });

  document.getElementById("clear-filters-btn").addEventListener("click", () => {
    filterIds.forEach(id => { document.getElementById(id).value = ""; });
    currentGroup = "all";
    syncGroupTabs();
    updateHeading();
    renderListing();
  });

  document.querySelectorAll(".group-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      currentGroup = tab.dataset.group;
      syncGroupTabs();
      updateHeading();
      renderListing();
    });
  });
});
