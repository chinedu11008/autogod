/* =========================================================
   AutoGod — Layout behavior for interior pages
   =========================================================
   index.html keeps using the ORIGINAL script.js (untouched
   template file) since it also drives the homepage's parallax
   hero and the two vehicle sliders — none of which exist on the
   other pages. This file is the same mobile-menu / login-modal /
   scroll-shadow behavior from that original script.js, trimmed
   down and null-guarded so it's safe on pages that don't have a
   hero or sliders — product, cart, checkout, profile, and
   vehicles pages all load this instead.

   Runs at the top level (not wrapped in DOMContentLoaded) because
   it's loaded right before </body>, after the elements it queries
   already exist in the DOM.
   ========================================================= */

const layoutMenuBtn = document.querySelector("#menu-btn");
const layoutNavbar = document.querySelector(".navbar");

// Hamburger menu toggle (mobile/tablet nav — see the 768px
// breakpoint in style.css for how .navbar.active is displayed).
if (layoutMenuBtn && layoutNavbar) {
  layoutMenuBtn.onclick = () => {
    layoutMenuBtn.classList.toggle("fa-times"); // swaps the hamburger icon for an X
    layoutNavbar.classList.toggle("active");
  };
}

// Manual open/close for the login modal (used e.g. when the
// header's "login" button is clicked directly, as opposed to
// the requireLoginForNav()/requireLogin() gating flows in auth.js
// which open it programmatically).
const layoutLoginBtn = document.querySelector("#login-btn");
if (layoutLoginBtn) {
  layoutLoginBtn.onclick = () => {
    const modal = document.querySelector(".login-form-container");
    if (modal) modal.classList.toggle("active");
  };
}

const layoutCloseLogin = document.querySelector("#close-login-form");
if (layoutCloseLogin) {
  layoutCloseLogin.onclick = () => {
    const modal = document.querySelector(".login-form-container");
    if (modal) modal.classList.remove("active");
  };
}

// Adds a background/shadow to the fixed header once the page has
// scrolled at all (.header.active in style.css), and tidies up
// the mobile menu state if it was left open while scrolling.
window.addEventListener("scroll", () => {
  if (layoutMenuBtn) layoutMenuBtn.classList.remove("fa-times");
  if (layoutNavbar) layoutNavbar.classList.remove("active");

  const header = document.querySelector(".header");
  if (header) {
    if (window.scrollY > 0) header.classList.add("active");
    else header.classList.remove("active");
  }
});
