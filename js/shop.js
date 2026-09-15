/* =========================================================
   AutoGod — Shop
   =========================================================
   Cart, wishlist, orders, and test-drive bookings. Everything
   is stored in this browser's localStorage — there's no real
   server, so this data doesn't sync across devices, but it
   persists between visits and powers the dashboard.

   Note: none of this requires being logged in to CALL — the
   wishlist heart works for anyone browsing. It's the PAGES that
   surface this data (product.html, cart.html, profile.html) that
   are gated, via requireLogin() in auth.js.

   CATEGORIES IN THIS FILE
     1. Storage helpers (generic JSON read/write)
     2. Cart
     3. Wishlist ("saved cars")
     4. Orders
     5. Test-drive bookings
     6. Wire-up (DOMContentLoaded)
   ========================================================= */


/* =========================================================
   CATEGORY 1: STORAGE HELPERS
   Every feature below is just an array of plain objects under
   one localStorage key — these two helpers do the JSON.parse /
   JSON.stringify boilerplate + fail-safe fallback once, instead
   of repeating try/catch everywhere.
   ========================================================= */
const CART_KEY = "autogod_cart";
const WISHLIST_KEY = "autogod_wishlist";
const ORDERS_KEY = "autogod_orders";
const BOOKINGS_KEY = "autogod_bookings";

function readJson(key, fallback) {
  try {
    const val = JSON.parse(localStorage.getItem(key));
    return val === null || val === undefined ? fallback : val;
  } catch (e) {
    return fallback; // corrupted/missing data — behave as if it were empty
  }
}
function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}


/* =========================================================
   CATEGORY 2: CART
   Stored as a small array of { id, qty } — the full car details
   (name, image, price...) are always looked up fresh from
   cars-data.js via getCartDetailed(), so the cart itself never
   goes stale if that catalog data changes.
   ========================================================= */
function getCart() { return readJson(CART_KEY, []); }

// Every cart mutation goes through saveCart() so the header
// badge count updates immediately, everywhere it's visible.
function saveCart(cart) { writeJson(CART_KEY, cart); if (typeof updateCartBadge === "function") updateCartBadge(); }

// Adds `qty` of a car, or increases the quantity if it's already
// in the cart. Used by both "Add to Cart" and "Buy Now" (product.js).
function addToCart(id, qty) {
  qty = qty || 1;
  const cart = getCart();
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, qty });
  }
  saveCart(cart);
  const car = typeof getCarById === "function" ? getCarById(id) : null;
  showToast((car ? car.name : "Item") + " added to your cart.", "success");
}

function removeFromCart(id) {
  saveCart(getCart().filter(item => item.id !== id));
  showToast("Removed from cart.", "info");
  // Only defined on cart.html — re-render immediately if we're there.
  if (typeof window.renderCartPage === "function") window.renderCartPage();
}

function setCartQty(id, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, qty); // never let quantity drop to 0 via the stepper — use remove instead
  saveCart(cart);
  if (typeof window.renderCartPage === "function") window.renderCartPage();
}

function clearCart() { saveCart([]); } // called by checkout.js once an order is placed

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

// Joins the raw {id, qty} cart entries against the car catalog so
// callers get full car objects + a pre-computed line total. Any
// id that no longer matches a car in AUTOGOD_CARS is silently
// dropped (defensive — shouldn't normally happen).
function getCartDetailed() {
  return getCart()
    .map(item => {
      const car = getCarById(item.id);
      if (!car) return null;
      return { car, qty: item.qty, lineTotal: car.price * item.qty };
    })
    .filter(Boolean);
}

function getCartTotal() {
  return getCartDetailed().reduce((sum, item) => sum + item.lineTotal, 0);
}


/* =========================================================
   CATEGORY 3: WISHLIST ("saved cars")
   Just an array of car ids. The heart-icon buttons that toggle
   this are sprinkled across the homepage, listing page, product
   page, and dashboard — updateWishlistIcons() below is what
   keeps all of them in sync after any single click.
   ========================================================= */
function getWishlist() { return readJson(WISHLIST_KEY, []); }

function isWishlisted(id) { return getWishlist().includes(id); }

function toggleWishlist(id) {
  let list = getWishlist();
  if (list.includes(id)) {
    list = list.filter(x => x !== id);
    showToast("Removed from saved cars.", "info");
  } else {
    list.push(id);
    showToast("Saved to your wishlist.", "success");
  }
  writeJson(WISHLIST_KEY, list);
  updateWishlistIcons();
}

// Re-paints every heart button currently on the page (filled/outline
// icon, "active" class, and — on the product page's larger button —
// the "save"/"saved" text label) to match localStorage. Called after
// every toggle, and once on every page load in the wire-up below.
function updateWishlistIcons() {
  document.querySelectorAll(".wishlist-btn[data-id]").forEach(btn => {
    const active = isWishlisted(btn.dataset.id);
    btn.classList.toggle("active", active);
    const icon = btn.querySelector("i");
    if (icon) icon.className = active ? "fas fa-heart" : "far fa-heart";
    const label = btn.querySelector(".wishlist-label");
    if (label) label.textContent = active ? "saved" : "save";
  });
}


/* =========================================================
   CATEGORY 4: ORDERS
   Created once, by checkout.js, when a (simulated) purchase goes
   through. Stored newest-first so the dashboard's "My Orders"
   list doesn't need to sort anything itself.
   ========================================================= */

// Human-ish order reference, e.g. "AG-M1A2B3C4-517" — not a real
// sequential ID (there's no server to hand those out), just needs
// to look plausible and be unique enough for a demo.
function generateOrderId() {
  return "AG-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 900 + 100);
}

function getOrders() { return readJson(ORDERS_KEY, []); }

function saveOrder(order) {
  const orders = getOrders();
  orders.unshift(order); // newest first
  writeJson(ORDERS_KEY, orders);
}

// Orders are matched to a customer by email (not a user ID, since
// local/Google/Facebook accounts don't share one) — this is what
// powers the dashboard's order history for the logged-in session.
function getOrdersForEmail(email) {
  if (!email) return [];
  return getOrders().filter(o => o.customerEmail && o.customerEmail.toLowerCase() === email.toLowerCase());
}


/* =========================================================
   CATEGORY 5: TEST-DRIVE BOOKINGS
   Same shape/pattern as orders — a flat list, matched by email,
   newest first. Created from the dashboard's "Test Drives" tab.
   ========================================================= */
function getBookings() { return readJson(BOOKINGS_KEY, []); }

function saveBooking(booking) {
  const bookings = getBookings();
  bookings.unshift(booking);
  writeJson(BOOKINGS_KEY, bookings);
}

function getBookingsForEmail(email) {
  if (!email) return [];
  return getBookings().filter(b => b.email && b.email.toLowerCase() === email.toLowerCase());
}

function cancelBooking(bookingId) {
  writeJson(BOOKINGS_KEY, getBookings().filter(b => b.id !== bookingId));
  showToast("Test drive cancelled.", "info");
  if (typeof window.renderDashboard === "function") window.renderDashboard();
}


/* =========================================================
   CATEGORY 6: WIRE-UP
   Runs on every page. Paints whichever wishlist heart buttons
   happen to exist on this page (there may be none, e.g. on
   checkout.html) and attaches their click handlers.
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  updateWishlistIcons();
  document.querySelectorAll(".wishlist-btn[data-id]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // these hearts sit inside <a class="car-card"> links — don't also follow the link
      toggleWishlist(btn.dataset.id);
    });
  });
});
