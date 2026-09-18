/* =========================================================
   AutoGod — Page-transition loader
   =========================================================
   Shows a full-screen loader (the spinning-car gif) between
   page loads, on every page. This is a genuine multi-page site
   (no SPA framework), so "between page changes" really means
   two things working together:
     1. On THIS page loading: the loader div starts visible
        (class="active" is already in the raw HTML — see each
        page's <body>) and fades out once the page is ready,
        masking any flash of half-rendered content.
     2. On leaving THIS page: clicking any internal link
        re-shows the loader and briefly delays the actual
        navigation, so the transition feels continuous instead
        of an abrupt white/blank flash mid-reload.

   Programmatic (non-click) redirects — post-login, logout, the
   requireLogin() page-guard, "Buy Now", navbar search — call
   showPageLoader() explicitly right before setting
   window.location.href; see auth.js / product.js / nav-search.js.

   CATEGORIES IN THIS FILE
     1. Show / hide
     2. Reveal on page load (with a minimum display time)
     3. Intercept internal link clicks
   ========================================================= */

const LOADER_MIN_VISIBLE_MS = 400; // avoid an imperceptible flash on very fast loads
const LOADER_NAV_DELAY_MS = 300;   // how long the loader shows before we actually navigate
let loaderShownAt = null;


/* =========================================================
   CATEGORY 1: SHOW / HIDE
   ========================================================= */
function showPageLoader() {
  const el = document.querySelector(".loader-container");
  if (!el) return;
  loaderShownAt = Date.now();
  el.classList.add("active");
}

function hidePageLoader() {
  const el = document.querySelector(".loader-container");
  if (!el) return;
  const elapsed = loaderShownAt ? Date.now() - loaderShownAt : LOADER_MIN_VISIBLE_MS;
  const remaining = Math.max(0, LOADER_MIN_VISIBLE_MS - elapsed);
  setTimeout(() => el.classList.remove("active"), remaining);
}


/* =========================================================
   CATEGORY 2: REVEAL ON PAGE LOAD
   The loader starts "active" (visible) straight from the HTML
   itself, before any JS runs — so mark it as shown "now" the
   moment this script executes, then hide it once the page has
   finished loading (window.load, so images/fonts etc. are in,
   not just the DOM).
   ========================================================= */
loaderShownAt = Date.now();
window.addEventListener("load", hidePageLoader);


/* =========================================================
   CATEGORY 3: INTERCEPT INTERNAL LINK CLICKS
   Attached on `document` (event delegation) so it works for
   every link on the page, including ones rendered dynamically
   by product.js / vehicles.js / dashboard.js after this script
   has already run.
   ========================================================= */
document.addEventListener("click", (e) => {
  // Already handled elsewhere — e.g. a gated link's own onclick
  // (requireLoginForNav) already cancelled this because the
  // visitor isn't logged in, so no navigation is happening at all.
  if (e.defaultPrevented) return;

  const link = e.target.closest("a[href]");
  if (!link) return;

  const href = link.getAttribute("href");
  if (!href || href.startsWith("#")) return;           // same-page anchor — just scrolls, no page change
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
  if (link.target === "_blank") return;                 // opens elsewhere — this page isn't going anywhere

  let url;
  try {
    url = new URL(href, window.location.href);
  } catch (err) {
    return; // unparsable href — let the browser handle it as-is
  }
  if (url.origin !== window.location.origin) return;    // external site

  e.preventDefault();
  showPageLoader();
  setTimeout(() => { window.location.href = href; }, LOADER_NAV_DELAY_MS);
});
