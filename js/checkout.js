/* =========================================================
   AutoGod — Checkout page
   =========================================================
   No real payment gateway is wired in here — a browser alone
   can't safely charge a card (that needs a PCI-compliant
   backend). This simulates a FULL checkout — real validation,
   a fake "processing" delay, and a genuine order saved to the
   customer's dashboard — and optionally emails an order
   confirmation via EmailJS if that's configured in js/config.js
   (separate from the contact form, which uses Formspree —
   see js/contact.js).

   CATEGORIES IN THIS FILE
     1. Order-summary sidebar
     2. Form helpers (prefill, input formatting, validation)
     3. Placing the order (localStorage + optional email)
     4. Success screen
     5. Page initialisation (guard, render, wire the form)
   ========================================================= */


/* =========================================================
   CATEGORY 1: ORDER-SUMMARY SIDEBAR
   ========================================================= */
function miniItemHtml(item) {
  return `
    <div class="mini-item">
      <span class="name">${item.car.name} × ${item.qty}</span>
      <span>${formatPrice(item.lineTotal)}</span>
    </div>`;
}

// Renders the read-only summary column and returns the computed
// totals so the submit handler doesn't have to recompute them —
// also matters for correctness: totals are locked in at the
// moment checkout loads, not silently changed by anything else.
function renderOrderSummary() {
  const items = getCartDetailed();
  const summaryEl = document.getElementById("checkout-summary-items");
  const subtotal = getCartTotal();
  const fees = Math.round(subtotal * 0.03); // same flat 3% estimate used on cart.html
  const total = subtotal + fees;

  summaryEl.innerHTML = items.map(miniItemHtml).join("") + `
    <div class="mini-item"><span class="name">estimated fees &amp; taxes</span><span>${formatPrice(fees)}</span></div>
    <div class="mini-item" style="font-weight:700;font-size:1.7rem;border-bottom:none;">
      <span class="name">total</span><span>${formatPrice(total)}</span>
    </div>`;

  return { items, subtotal, fees, total };
}


/* =========================================================
   CATEGORY 2: FORM HELPERS
   ========================================================= */

// Saves the visitor re-typing what we already know from their
// session (name/email) — doesn't touch address/payment fields.
function prefillFromSession(form) {
  const session = getSession();
  if (!session) return;
  if (form.querySelector('[name="fullname"]')) form.querySelector('[name="fullname"]').value = session.name || "";
  if (form.querySelector('[name="email"]')) form.querySelector('[name="email"]').value = session.email || "";
}

// Live-formats the card number field into groups of 4 as you type:
// "4242424242424242" -> "4242 4242 4242 4242". Capped at 19 digits
// (the longest real card numbers in use).
function formatCardNumberInput(e) {
  let digits = e.target.value.replace(/\D/g, "").slice(0, 19);
  e.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
}

// Live-formats the expiry field into "MM/YY" as you type.
function formatExpiryInput(e) {
  let digits = e.target.value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) digits = digits.slice(0, 2) + "/" + digits.slice(2);
  e.target.value = digits;
}

// Lightweight validation — every field required, plus format
// checks on card number/expiry/CVC. This is NOT a real card
// validator (no Luhn check, no issuer lookup) since nothing here
// actually talks to a payment network; it just stops obviously
// broken submissions and gives the visitor a clear reason why.
function validateCheckoutForm(form) {
  const required = ["fullname", "email", "phone", "address", "city", "cardname", "cardnumber", "expiry", "cvc"];
  for (const field of required) {
    const el = form.querySelector(`[name="${field}"]`);
    if (!el || !el.value.trim()) {
      showToast("Please fill in every field before placing your order.", "error");
      if (el) el.focus();
      return false;
    }
  }
  const cardDigits = form.querySelector('[name="cardnumber"]').value.replace(/\D/g, "");
  if (cardDigits.length < 13 || cardDigits.length > 19) {
    showToast("That card number doesn't look right.", "error");
    return false;
  }
  const expiry = form.querySelector('[name="expiry"]').value;
  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    showToast("Enter the expiry date as MM/YY.", "error");
    return false;
  }
  const cvc = form.querySelector('[name="cvc"]').value;
  if (!/^\d{3,4}$/.test(cvc)) {
    showToast("Enter a valid CVC.", "error");
    return false;
  }
  return true;
}


/* =========================================================
   CATEGORY 3: PLACING THE ORDER
   ========================================================= */

// Optional: if EmailJS is configured (js/config.js), send the
// customer a receipt. emailJsReady() lives in contact.js — this
// is a completely separate email from the contact-form/Formspree
// flow, just sharing the same EmailJS SDK setup.
function sendOrderConfirmationEmail(order) {
  if (!emailJsReady("EMAILJS_ORDER_TEMPLATE_ID")) return;
  const itemsText = order.items.map(i => `${i.name} x${i.qty} — ${formatPrice(i.lineTotal)}`).join("\n");
  emailjs.send(AUTOGOD_CONFIG.EMAILJS_SERVICE_ID, AUTOGOD_CONFIG.EMAILJS_ORDER_TEMPLATE_ID, {
    order_id: order.orderId,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    items: itemsText,
    total: formatPrice(order.total),
    to_email: AUTOGOD_CONFIG.OWNER_EMAIL
  }).catch(err => console.error("Order email failed:", err)); // best-effort — never blocks the order itself
}

// The actual "transaction": builds one order record, saves it
// (shop.js), fires the optional confirmation email, and empties
// the cart. No payment gateway is called — this is the simulated
// part (see the file banner above).
function placeOrder(form, totals) {
  const orderId = generateOrderId(); // shop.js
  const session = getSession();

  const order = {
    orderId,
    date: new Date().toISOString(),
    status: "confirmed",
    customerName: form.querySelector('[name="fullname"]').value.trim(),
    // Prefer the logged-in session's email (authoritative) over
    // whatever's typed in the form, in case they differ.
    customerEmail: (session ? session.email : form.querySelector('[name="email"]').value.trim()),
    shippingAddress: [
      form.querySelector('[name="address"]').value.trim(),
      form.querySelector('[name="city"]').value.trim(),
      form.querySelector('[name="state"]') ? form.querySelector('[name="state"]').value.trim() : "",
      form.querySelector('[name="zip"]') ? form.querySelector('[name="zip"]').value.trim() : ""
    ].filter(Boolean).join(", "),
    items: totals.items.map(i => ({ id: i.car.id, name: i.car.name, image: i.car.image, qty: i.qty, lineTotal: i.lineTotal })),
    subtotal: totals.subtotal,
    fees: totals.fees,
    total: totals.total,
    // Only the last 4 digits are ever stored — never the full card
    // number (not that a real number was collected here anyway).
    cardLast4: form.querySelector('[name="cardnumber"]').value.replace(/\D/g, "").slice(-4)
  };

  saveOrder(order);      // shop.js — persists to localStorage, powers the dashboard
  sendOrderConfirmationEmail(order);
  clearCart();           // shop.js
  return order;
}


/* =========================================================
   CATEGORY 4: SUCCESS SCREEN
   Replaces the whole checkout form with a confirmation view —
   the "processing overlay" element lives OUTSIDE #checkout-container
   in the HTML specifically so this innerHTML swap doesn't wipe it.
   ========================================================= */
function showOrderSuccess(order) {
  document.getElementById("checkout-container").innerHTML = `
    <div class="order-success">
      <i class="fas fa-circle-check"></i>
      <h2>Order placed!</h2>
      <p>Thanks, ${order.customerName.split(" ")[0]} — your order is confirmed.</p>
      <div class="order-id">${order.orderId}</div>
      <p>A summary has been added to your dashboard.${emailJsReady("EMAILJS_ORDER_TEMPLATE_ID") ? " We've also emailed you a confirmation." : ""}</p>
      <div class="action-row" style="justify-content:center;display:flex;gap:1rem;margin-top:2rem;">
        <a href="profile.html" class="btn">view my orders</a>
        <a href="index.html" class="btn btn-outline">back to home</a>
      </div>
    </div>`;
}


/* =========================================================
   CATEGORY 5: PAGE INITIALISATION
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  // Protected page — same reasoning as cart.html (see js/cart-page.js):
  // catches direct/bookmarked visits from a logged-out browser.
  if (!requireLogin()) return;

  const container = document.getElementById("checkout-container");
  const items = getCartDetailed();

  // Nothing to check out — send them back to browse rather than
  // showing an empty payment form.
  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-cart-shopping"></i>
        <h3>Your cart is empty</h3>
        <p>Add a vehicle to your cart before checking out.</p>
        <a href="index.html#vehicles" class="btn">browse vehicles</a>
      </div>`;
    return;
  }

  const totals = renderOrderSummary();
  const form = document.getElementById("checkout-form");
  prefillFromSession(form);

  form.querySelector('[name="cardnumber"]').addEventListener("input", formatCardNumberInput);
  form.querySelector('[name="expiry"]').addEventListener("input", formatExpiryInput);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateCheckoutForm(form)) return;

    // Fake "processing" delay so the flow feels like a real payment
    // is happening, rather than the order appearing instantly.
    const overlay = document.getElementById("processing-overlay");
    overlay.classList.add("active");

    setTimeout(() => {
      const order = placeOrder(form, totals);
      overlay.classList.remove("active");
      showOrderSuccess(order);
    }, 1600);
  });
});
