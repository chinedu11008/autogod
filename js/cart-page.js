/* =========================================================
   AutoGod — Cart page
   =========================================================
   Reads the cart straight out of shop.js's localStorage-backed
   helpers and renders it — there's no local state kept in this
   file itself, so any change (qty stepper, remove) just calls
   the shop.js function and re-renders from scratch. Gated page,
   see requireLogin() at the bottom.

   CATEGORIES IN THIS FILE
     1. Cart-line template
     2. Main render (renderCartPage, exposed on window)
     3. Page initialisation (guard + render)
   ========================================================= */


/* =========================================================
   CATEGORY 1: CART-LINE TEMPLATE
   ========================================================= */
// One row in the cart: image, name, unit price, a +/- quantity
// stepper, a remove button, and the line's running total.
function cartItemHtml(item) {
  return `
    <div class="cart-item" data-id="${item.car.id}">
      <img src="${item.car.image}" alt="${item.car.name}">
      <div class="item-info">
        <h3>${item.car.name}</h3>
        <div class="unit-price">${formatPrice(item.car.price)} each</div>
      </div>
      <div class="item-actions">
        <div class="qty-stepper">
          <button type="button" class="cart-qty-minus" data-id="${item.car.id}">−</button>
          <span>${item.qty}</span>
          <button type="button" class="cart-qty-plus" data-id="${item.car.id}">+</button>
        </div>
        <button class="remove-btn" data-id="${item.car.id}" title="remove"><i class="fas fa-trash"></i></button>
      </div>
      <div class="line-total">${formatPrice(item.lineTotal)}</div>
    </div>`;
}


/* =========================================================
   CATEGORY 2: MAIN RENDER
   Exposed as window.renderCartPage so shop.js's removeFromCart()/
   setCartQty() can trigger a fresh re-render after they mutate
   the cart, without this file needing to know about them first.
   ========================================================= */
window.renderCartPage = function renderCartPage() {
  const container = document.getElementById("cart-container");
  const items = getCartDetailed(); // shop.js — joins raw {id,qty} against the car catalog

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-cart-shopping"></i>
        <h3>Your cart is empty</h3>
        <p>Browse the lineup and add a vehicle to get started.</p>
        <a href="index.html#vehicles" class="btn">browse vehicles</a>
      </div>`;
    return;
  }

  // Flat 3% "estimated fees & taxes" — a stand-in for real
  // location-based tax calculation, which would need a backend.
  const subtotal = getCartTotal();
  const fees = Math.round(subtotal * 0.03);
  const total = subtotal + fees;

  container.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">
        ${items.map(cartItemHtml).join("")}
      </div>
      <div class="cart-summary">
        <h3>order summary</h3>
        <div class="summary-row"><span>subtotal</span><span>${formatPrice(subtotal)}</span></div>
        <div class="summary-row"><span>estimated fees &amp; taxes</span><span>${formatPrice(fees)}</span></div>
        <div class="summary-row total"><span>total</span><span>${formatPrice(total)}</span></div>
        <a href="checkout.html" class="btn">proceed to checkout</a>
      </div>
    </div>`;

  // Re-wire every control after the innerHTML rewrite above (old
  // listeners don't survive it). Quantity buttons and remove both
  // call straight into shop.js, which itself calls renderCartPage()
  // again once the underlying data has changed.
  container.querySelectorAll(".cart-qty-minus").forEach(btn => {
    btn.addEventListener("click", () => {
      const cart = getCart();
      const item = cart.find(i => i.id === btn.dataset.id);
      if (item) setCartQty(item.id, item.qty - 1);
    });
  });
  container.querySelectorAll(".cart-qty-plus").forEach(btn => {
    btn.addEventListener("click", () => {
      const cart = getCart();
      const item = cart.find(i => i.id === btn.dataset.id);
      if (item) setCartQty(item.id, item.qty + 1);
    });
  });
  container.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(btn.dataset.id));
  });
};


/* =========================================================
   CATEGORY 3: PAGE INITIALISATION
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  // Protected page — the cart icon that links here is gated too (see the
  // header markup + js/auth.js requireLoginForNav), but this guard also
  // catches anyone who bookmarks/types the URL directly while logged out.
  if (!requireLogin()) return;
  renderCartPage();
});
