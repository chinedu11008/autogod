/* =========================================================
   AutoGod — Navbar vehicle search
   =========================================================
   Lives in the navbar on every page (see .nav-search in each
   HTML file's header). Searching is itself a protected action
   per the gating rules in auth.js — even from the public
   homepage, submitting a search while logged out opens the
   login modal instead of showing results, and remembers the
   query so it runs automatically the moment login succeeds.

   This file only builds the target URL and decides whether to
   navigate immediately or gate first — the actual search/filter
   logic that reads ?search= back out lives in vehicles.js
   (see initFromQuery() there).
   ========================================================= */

function handleNavSearch(e) {
  e.preventDefault(); // always intercept — we navigate manually either way, see below
  const input = document.getElementById("nav-search-input");
  const query = input ? input.value.trim() : "";
  // Empty search just opens the full unfiltered listing page.
  const target = "vehicles.html" + (query ? ("?search=" + encodeURIComponent(query)) : "");

  if (getSession()) {
    if (typeof showPageLoader === "function") showPageLoader();
    window.location.href = target; // logged in — go straight there
    return;
  }

  // Logged out — same pattern as requireLoginForNav() in auth.js,
  // just inlined here since this isn't a simple <a href> click.
  setIntendedDestination(target);
  showToast("Please log in to search vehicles.", "info");
  const modal = document.querySelector(".login-form-container");
  if (modal) modal.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("nav-search-form");
  if (form) form.addEventListener("submit", handleNavSearch);
});
