/* =========================================================
   AutoGod — Profile / dashboard page (profile.html)
   =========================================================
   This file is the "control panel" for a logged-in customer:
   it renders their stats, order history, saved (wishlisted)
   cars, test-drive bookings, and an account-settings form
   (including an editable profile photo). Everything reads
   from / writes to localStorage via the helpers in auth.js
   (session + local accounts) and shop.js (orders, wishlist,
   bookings) — this file just wires that data to the DOM.

   Guarded page: if there's no active session, requireLogin()
   (from auth.js) bounces the visitor to the homepage's login
   modal and remembers this page so they land right back here
   after signing in. See the DOMContentLoaded block at the
   bottom of this file.
   ========================================================= */


/* =========================================================
   CATEGORY: HTML TEMPLATE BUILDERS
   Small functions that turn one data object (a car, an order,
   a booking) into an HTML string for innerHTML injection.
   ========================================================= */

// One "saved car" tile for the Wishlist tab — same look as the
// listing-page car-card, but the heart always starts filled
// since everything here is, by definition, already saved.
function dashboardCarCard(car) {
  return `
    <a href="product.html?id=${car.id}" class="car-card">
      <button class="wishlist-btn active" data-id="${car.id}"><i class="fas fa-heart"></i></button>
      <img src="${car.image}" alt="${car.name}">
      <h3>${car.name}</h3>
      <div class="stars">${renderStars(car.rating)}</div>
      <div class="price">${formatPrice(car.price)}</div>
      <span class="btn">view details</span>
    </a>`;
}

// One row in the "My Orders" tab.
function orderCardHtml(order) {
  const firstItem = order.items[0];
  // If the order has more than one line item, summarise the rest as "+N more"
  const extra = order.items.length > 1 ? ` +${order.items.length - 1} more` : "";
  return `
    <div class="order-card">
      <img src="${firstItem.image}" alt="${firstItem.name}">
      <div class="order-info">
        <h4>${order.orderId}</h4>
        <p>${firstItem.name}${extra}</p>
        <p>${new Date(order.date).toLocaleDateString()} • ${formatPrice(order.total)}</p>
      </div>
      <span class="status-pill ${order.status}">${order.status}</span>
    </div>`;
}

// One row in the "Test Drives" tab.
function bookingItemHtml(booking) {
  const car = getCarById(booking.carId);
  return `
    <div class="booking-item">
      <div>
        <h4>${car ? car.name : "Vehicle"}</h4>
        <p>${booking.date} at ${booking.time}</p>
      </div>
      <button class="cancel-btn" data-id="${booking.id}">cancel</button>
    </div>`;
}


/* =========================================================
   CATEGORY: TAB NAVIGATION
   The dashboard uses one shared "activate a tab" function so
   both the tab strip itself AND the "Edit Profile" shortcut
   button (which jumps straight to Account Settings) stay in
   sync and behave identically.
   ========================================================= */

// Show one dash-panel and hide the rest, keep the matching
// dash-tab button highlighted, and smooth-scroll it into view
// (useful when "Edit Profile" is clicked from higher up the page).
function activateTab(targetId) {
  document.querySelectorAll(".dash-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.target === targetId);
  });
  document.querySelectorAll(".dash-panel").forEach(p => {
    p.classList.toggle("active", p.id === targetId);
  });
  const panel = document.getElementById(targetId);
  if (panel && typeof panel.scrollIntoView === "function") {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Wire click handlers on the tab strip itself.
function renderTabs() {
  document.querySelectorAll(".dash-tab").forEach(tab => {
    tab.addEventListener("click", () => activateTab(tab.dataset.target));
  });
}


/* =========================================================
   CATEGORY: PROFILE PHOTO (avatar) HANDLING
   Google/Facebook accounts already have a real photo from the
   provider, so editing is disabled for those — only local
   (email/password) accounts can upload their own. Uploaded
   photos are stored as base64 data-URLs directly in the
   session object in localStorage (there's no server to upload
   a file to), so we cap the file size to keep localStorage
   usage reasonable.
   ========================================================= */

const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024; // ~1.5MB before base64 inflation

// Fill in both the big profile-header avatar and the small
// preview avatar on the Account Settings tab, and show/hide
// the "change photo" control depending on the login provider.
function renderAvatarControls(session) {
  const bigAvatar = document.getElementById("profile-page-avatar");
  const previewAvatar = document.getElementById("account-avatar-preview");
  const html = session.picture
    ? `<img src="${session.picture}" alt="${session.name || "user"}">`
    : `<span>${getInitials(session.name || session.email)}</span>`;
  bigAvatar.innerHTML = html;
  previewAvatar.innerHTML = html;

  const uploadLabel = document.getElementById("avatar-upload-label");
  const uploadInput = document.getElementById("account-avatar-input");
  const hint = document.getElementById("avatar-hint");
  const canEditPhoto = session.provider === "local";

  uploadLabel.style.display = canEditPhoto ? "inline-block" : "none";
  uploadInput.disabled = !canEditPhoto;
  hint.textContent = canEditPhoto
    ? "JPG or PNG, under 1.5MB."
    : `Your photo is managed by ${session.provider === "google" ? "Google" : "Facebook"} — sign in with email/password to upload your own.`;
}

// Reads the chosen file, previews it immediately, and saves it
// straight to the session (auto-save, no "submit" step needed —
// matches how most account settings pages handle photo changes).
function handleAvatarUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please choose an image file.", "error");
    return;
  }
  if (file.size > MAX_AVATAR_BYTES) {
    showToast("That image is too large — please pick one under 1.5MB.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    updateSession({ picture: reader.result }); // reader.result is a base64 data URL
    showToast("Profile photo updated.", "success");
    renderDashboard();
  };
  reader.onerror = () => showToast("Couldn't read that image — please try another.", "error");
  reader.readAsDataURL(file);
}


/* =========================================================
   CATEGORY: MAIN RENDER
   Pulls the current session + this user's orders/wishlist/
   bookings and paints every part of the dashboard. Exposed on
   `window` so other handlers (booking submit, cancel, wishlist
   toggle, account save) can simply call renderDashboard() again
   after they change something, instead of hand-patching the DOM.
   ========================================================= */

window.renderDashboard = function renderDashboard() {
  const session = getSession();
  if (!session) return; // safety net; requireLogin() should already have redirected

  const orders = getOrdersForEmail(session.email);
  const wishlist = getWishlist();
  const bookings = getBookingsForEmail(session.email);

  // --- Profile header ---
  document.getElementById("profile-page-name").textContent = session.name || session.email;
  document.getElementById("profile-page-email").textContent = session.email;
  document.getElementById("provider-badge").textContent =
    "signed in with " + (session.provider === "local" ? "email" : session.provider);
  document.getElementById("member-since").textContent =
    "member since " + new Date(session.since).toLocaleDateString();
  renderAvatarControls(session);

  // --- Quick stats row ---
  document.getElementById("stat-orders").textContent = orders.length;
  document.getElementById("stat-saved").textContent = wishlist.length;
  document.getElementById("stat-bookings").textContent = bookings.length;

  // --- "My Orders" tab ---
  const ordersList = document.getElementById("orders-list");
  ordersList.innerHTML = orders.length
    ? orders.map(orderCardHtml).join("")
    : `<div class="empty-state"><i class="fas fa-box-open"></i>No orders yet — once you check out, they'll show up here.</div>`;

  // --- "Saved Cars" tab (wishlist) ---
  const savedGrid = document.getElementById("saved-grid");
  const savedCars = wishlist.map(id => getCarById(id)).filter(Boolean);
  savedGrid.innerHTML = savedCars.length
    ? savedCars.map(dashboardCarCard).join("")
    : `<div class="empty-state"><i class="fas fa-heart"></i>No saved cars yet — tap the heart on any vehicle to save it here.</div>`;
  // re-wire the heart buttons every render since innerHTML wipes old listeners
  savedGrid.querySelectorAll(".wishlist-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleWishlist(btn.dataset.id);
      renderDashboard();
    });
  });

  // --- "Test Drives" tab ---
  const bookingsList = document.getElementById("bookings-list");
  bookingsList.innerHTML = bookings.length
    ? bookings.map(bookingItemHtml).join("")
    : `<div class="empty-state"><i class="fas fa-calendar-days"></i>No test drives booked yet.</div>`;
  bookingsList.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", () => cancelBooking(btn.dataset.id));
  });

  // --- "Account Settings" tab ---
  const accountForm = document.getElementById("account-form");
  accountForm.querySelector('[name="name"]').value = session.name || "";
  accountForm.querySelector('[name="email"]').value = session.email || "";
  // Email is only editable for local accounts — Google/Facebook own that field.
  accountForm.querySelector('[name="email"]').disabled = session.provider !== "local";
  accountForm.querySelector('[name="phone"]').value = session.phone || "";

  // Populate the test-drive car dropdown once (guarded by dataset.filled
  // so repeated renderDashboard() calls don't rebuild it every time).
  const carSelect = document.getElementById("booking-car-select");
  if (carSelect && !carSelect.dataset.filled) {
    carSelect.innerHTML = AUTOGOD_CARS.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
    carSelect.dataset.filled = "true";
  }
};


/* =========================================================
   CATEGORY: PAGE INITIALISATION
   Guard the page, do the first render, then wire up every
   interactive control (tabs, edit-profile shortcut, avatar
   upload, test-drive booking form, account-settings form,
   logout button).
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  // Protected page — bounce to login if there's no session, remembering
  // this exact URL so the visitor lands back here after signing in.
  if (!requireLogin()) return;

  renderTabs();
  renderDashboard();

  // Don't let people book a test drive in the past.
  const bookingDateInput = document.getElementById("booking-date");
  if (bookingDateInput) bookingDateInput.min = new Date().toISOString().split("T")[0];

  // "Edit Profile" button in the header jumps straight to the
  // Account Settings tab (reuses the same activateTab() the tab
  // strip itself uses, so behaviour stays perfectly consistent).
  const editProfileBtn = document.getElementById("edit-profile-btn");
  if (editProfileBtn) editProfileBtn.addEventListener("click", () => activateTab("panel-account"));

  const dashboardLogoutBtn = document.getElementById("dashboard-logout-btn");
  if (dashboardLogoutBtn) dashboardLogoutBtn.addEventListener("click", () => logout());

  const avatarInput = document.getElementById("account-avatar-input");
  if (avatarInput) avatarInput.addEventListener("change", handleAvatarUpload);

  // --- Test-drive booking form ---
  const bookingForm = document.getElementById("booking-form");
  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const session = getSession();
    const carId = document.getElementById("booking-car-select").value;
    const date = document.getElementById("booking-date").value;
    const time = document.getElementById("booking-time").value;
    if (!carId || !date || !time) {
      showToast("Pick a vehicle, date, and time.", "error");
      return;
    }
    saveBooking({
      id: "TD-" + Date.now().toString(36).toUpperCase(),
      carId, date, time,
      email: session.email,
      name: session.name
    });
    showToast("Test drive booked!", "success");
    bookingForm.reset();
    renderDashboard();
  });

  // --- Account settings form (name + phone; email/photo handled separately above) ---
  const accountForm = document.getElementById("account-form");
  accountForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = accountForm.querySelector('[name="name"]').value.trim();
    const phone = accountForm.querySelector('[name="phone"]').value.trim();
    if (!name) {
      showToast("Name can't be empty.", "error");
      return;
    }
    updateSession({ name, phone });

    // Keep the local account list (used for email/password login) in sync too,
    // so the new name shows up next time they log in.
    const session = getSession();
    if (session.provider === "local") {
      const users = getUsers();
      const user = users.find(u => u.email === session.email);
      if (user) { user.name = name; saveUsers(users); }
    }

    showToast("Account details saved.", "success");
    renderDashboard();
  });
});
