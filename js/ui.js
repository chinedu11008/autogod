/* =========================================================
   AutoGod — Shared UI helpers
   =========================================================
   Small, page-agnostic UI bits used everywhere: toast
   notifications, the header's login-button <-> profile-chip
   swap, and the cart badge count. No page-specific logic lives
   here — just "given the current session/cart, make the header
   look right."

   CATEGORIES IN THIS FILE
     1. Toast notifications
     2. Header: login button <-> profile chip
     3. Header: cart badge
     4. Wire-up (DOMContentLoaded)
   ========================================================= */


/* =========================================================
   CATEGORY 1: TOAST NOTIFICATIONS
   A single reusable "toast-container" div is created lazily on
   first use and reused after that. Each toast auto-dismisses
   itself; type is "success" (default), "error", or "info" — see
   the matching .toast-error / .toast-info styles in style.css.
   ========================================================= */
function showToast(message, type) {
  type = type || "success";
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "toast toast-" + type;
  toast.innerHTML =
    '<i class="fas ' +
    (type === "error" ? "fa-circle-exclamation" : type === "info" ? "fa-circle-info" : "fa-circle-check") +
    '"></i><span>' + message + "</span>";
  container.appendChild(toast);

  // Added in a separate frame so the CSS transition (opacity/transform
  // on .toast.show) actually animates in, instead of snapping straight
  // to its final state.
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300); // matches the CSS transition duration
  }, 3200);
}


/* =========================================================
   CATEGORY 2: HEADER — login button <-> profile chip
   Every page ships BOTH the "#login-btn" button and the
   "#profile-chip" (avatar + name + logout icon) in its markup;
   this function just toggles which one is visible based on
   whether there's an active session. Called once on every page
   load, and again by auth.js's setSession()/updateSession()
   whenever the session changes.
   ========================================================= */

// "Jane Driver" -> "JD" — used as a placeholder avatar for local
// accounts that don't have a Google/Facebook photo.
function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map(p => p[0].toUpperCase()).join("");
}

function renderAuthHeader() {
  const loginBtn = document.getElementById("login-btn");
  const chip = document.getElementById("profile-chip");
  if (!loginBtn || !chip) return; // defensive — both exist on every page, but just in case

  const session = typeof getSession === "function" ? getSession() : null;

  if (session) {
    loginBtn.style.display = "none";
    chip.style.display = "flex";

    const avatarEl = document.getElementById("profile-avatar");
    const nameEl = document.getElementById("profile-name");
    if (nameEl) nameEl.textContent = session.name || session.email;
    if (avatarEl) {
      avatarEl.innerHTML = session.picture
        ? '<img src="' + session.picture + '" alt="' + (session.name || "user") + '">'
        : '<span>' + getInitials(session.name || session.email) + "</span>";
    }
  } else {
    loginBtn.style.display = "flex";
    chip.style.display = "none";
  }
}


/* =========================================================
   CATEGORY 3: HEADER — cart badge
   The little yellow number bubble on the cart icon. Hidden
   entirely when the cart is empty rather than showing "0".
   ========================================================= */
function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  const count = typeof getCartCount === "function" ? getCartCount() : 0; // getCartCount() lives in shop.js
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}


/* =========================================================
   CATEGORY 4: WIRE-UP
   Runs on every page: paints the header for the current
   session/cart state, and wires the header's logout icon
   (the one next to the avatar in the profile chip — the
   dashboard page also has its own separate logout button,
   wired in dashboard.js).
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  renderAuthHeader();
  updateCartBadge();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof logout === "function") logout(); // logout() lives in auth.js
    });
  }
});
