/* =========================================================
   AutoGod — Product (single vehicle) page
   =========================================================
   Renders one car's full detail view based on the ?id= URL
   param, using the shared AUTOGOD_CARS catalog (cars-data.js).
   Gated page — see requireLogin() at the bottom.

   CATEGORIES IN THIS FILE
     1. Related-vehicles helpers
     2. Main render (renderProduct)
     3. Page initialisation (guard + render)
   ========================================================= */

let currentQty = 1; // quantity stepper state, reset per page load


/* =========================================================
   CATEGORY 1: RELATED-VEHICLES HELPERS
   ========================================================= */

// Picks 3 "you might also like" cars: same category first, then
// pads out with anything else, so the row is never empty even for
// a car whose category has no other matches.
function getRelatedCars(car) {
  const sameCategory = AUTOGOD_CARS.filter(c => c.id !== car.id && c.category === car.category);
  const others = AUTOGOD_CARS.filter(c => c.id !== car.id && c.category !== car.category);
  return [...sameCategory, ...others].slice(0, 3);
}

// One small card in the "you might also like" grid — same visual
// pattern as the listing page's cards (see vehicles.js).
function carCardHtml(car) {
  return `
    <a href="product.html?id=${car.id}" class="car-card">
      <button class="wishlist-btn" data-id="${car.id}"><i class="far fa-heart"></i></button>
      <img src="${car.image}" alt="${car.name}">
      <h3>${car.name}</h3>
      <div class="stars">${renderStars(car.rating)}</div>
      <div class="price">${formatPrice(car.price)}</div>
      <span class="btn">view details</span>
    </a>`;
}


/* =========================================================
   CATEGORY 2: MAIN RENDER
   ========================================================= */
function renderProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const car = id ? getCarById(id) : null;
  const container = document.getElementById("product-container");

  // Bad/missing ?id= (stale link, typo, deleted car) — show a
  // friendly dead-end instead of a blank page.
  if (!car) {
    container.innerHTML = `
      <div class="not-found">
        <i class="fas fa-car-side"></i>
        <h2>We couldn't find that vehicle</h2>
        <p>It may have sold, or the link might be off. Browse the full lineup instead.</p>
        <a href="index.html#vehicles" class="btn">back to vehicles</a>
      </div>`;
    document.title = "AutoGod — Vehicle not found";
    return;
  }

  document.title = "AutoGod — " + car.name;

  // Everything below is built as one HTML string and injected in a
  // single innerHTML write, then event listeners are attached
  // afterward (they can't survive the innerHTML write itself).
  container.innerHTML = `
    <div class="product-top">
      <div class="product-gallery">
        <img src="${car.image}" alt="${car.name}">
      </div>
      <div class="product-info">
        <span class="category-tag">${car.category}</span>
        <span class="condition-tag">${car.condition}</span>
        <h1>${car.name}</h1>
        <div class="stars">${renderStars(car.rating)} <span>${car.rating.toFixed(1)} rating</span></div>
        <div class="price">${formatPrice(car.price)} <span>${car.year} model</span></div>
        <p class="description">${car.description}</p>

        <div class="qty-row">
          <span>quantity</span>
          <div class="qty-stepper">
            <button type="button" id="qty-minus">−</button>
            <span id="qty-value">1</span>
            <button type="button" id="qty-plus">+</button>
          </div>
        </div>

        <div class="action-row">
          <button class="btn" id="add-to-cart-btn">add to cart</button>
          <button class="btn" id="buy-now-btn">buy now</button>
          <button class="btn btn-outline wishlist-btn wishlist-btn-inline" data-id="${car.id}">
            <i class="far fa-heart"></i><span class="wishlist-label">save</span>
          </button>
        </div>
      </div>
    </div>

    <div class="specs-section">
      <h2>full specifications</h2>
      <div class="specs-grid">
        <div class="spec-item"><div class="label">year</div><div class="value">${car.year}</div></div>
        <div class="spec-item"><div class="label">mileage</div><div class="value">${car.mileage}</div></div>
        <div class="spec-item"><div class="label">transmission</div><div class="value">${car.transmission}</div></div>
        <div class="spec-item"><div class="label">fuel type</div><div class="value">${car.fuel}</div></div>
        <div class="spec-item"><div class="label">engine</div><div class="value">${car.engine}</div></div>
        <div class="spec-item"><div class="label">power</div><div class="value">${car.power}</div></div>
        <div class="spec-item"><div class="label">top speed</div><div class="value">${car.topSpeed}</div></div>
        <div class="spec-item"><div class="label">drivetrain</div><div class="value">${car.drivetrain}</div></div>
        <div class="spec-item"><div class="label">seats</div><div class="value">${car.seats}</div></div>
        <div class="spec-item"><div class="label">colors available</div><div class="value">${car.colors.join(", ")}</div></div>
        <div class="spec-item"><div class="label">condition</div><div class="value">${car.condition}</div></div>
        <div class="spec-item"><div class="label">vin</div><div class="value">${car.vin}</div></div>
      </div>
    </div>

    <div class="related-section">
      <h2>you might also like</h2>
      <div class="related-grid">
        ${getRelatedCars(car).map(carCardHtml).join("")}
      </div>
    </div>
  `;

  // --- Quantity stepper (clamped 1–10, purely local UI state) ---
  const qtyValue = document.getElementById("qty-value");
  document.getElementById("qty-minus").addEventListener("click", () => {
    currentQty = Math.max(1, currentQty - 1);
    qtyValue.textContent = currentQty;
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    currentQty = Math.min(10, currentQty + 1);
    qtyValue.textContent = currentQty;
  });

  // --- Primary actions ---
  document.getElementById("add-to-cart-btn").addEventListener("click", () => {
    addToCart(car.id, currentQty); // shop.js — shows its own confirmation toast
  });
  document.getElementById("buy-now-btn").addEventListener("click", () => {
    // "Buy Now" = add to cart, then skip straight to checkout
    addToCart(car.id, currentQty);
    window.location.href = "checkout.html";
  });

  // --- Wishlist hearts (the big inline one + one per related-car card) ---
  updateWishlistIcons(); // shop.js — paints correct filled/outline state
  document.querySelectorAll(".wishlist-btn[data-id]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // related-card hearts sit inside an <a> — don't also follow the link
      toggleWishlist(btn.dataset.id);
    });
  });
}


/* =========================================================
   CATEGORY 3: PAGE INITIALISATION
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  // Protected page — vehicle details require an account. See
  // requireLogin() in auth.js: it remembers this exact URL
  // (including ?id=...) so login sends the visitor right back here.
  if (!requireLogin()) return;
  renderProduct();
});
