/* =========================================================
   AutoGod — Authentication
   =========================================================
   Three ways to sign in, all client-side (no real backend):
     1. Google Sign-In   (real OAuth, once GOOGLE_CLIENT_ID is set)
     2. Facebook Login   (real OAuth, once FACEBOOK_APP_ID is set)
     3. Email / password (local demo account system — stored
        in THIS browser's localStorage only, not a real server.
        Good for demoing the dashboard/orders/wishlist without
        Google/Facebook, but not secure real-world auth.)

   Whichever method succeeds, we store one simple session object
   in localStorage under "autogod_session" and send the visitor
   on to wherever they were originally trying to go (see the
   CATEGORY: CONTINUE-WHERE-YOU-LEFT-OFF section below).

   CATEGORIES IN THIS FILE
     1. Constants
     2. Continue-where-you-left-off (intended destination + gating)
     3. Session (get/set/update/logout)
     4. Page guard (requireLogin — for pages that need a full visit-guard)
     5. Local demo accounts (signup / login / forgot password)
     6. Google Sign-In
     7. Facebook Login
     8. Wire-up (DOMContentLoaded)
   ========================================================= */


/* =========================================================
   CATEGORY 1: CONSTANTS — localStorage / sessionStorage keys
   ========================================================= */
const SESSION_KEY = "autogod_session";              // the logged-in user (localStorage)
const USERS_KEY = "autogod_users";                  // local demo accounts (localStorage)
const DEST_KEY = "autogod_intended_destination";    // "continue here after login" (sessionStorage)


/* =========================================================
   CATEGORY 2: CONTINUE-WHERE-YOU-LEFT-OFF
   =========================================================
   The core idea: before login even starts, remember the URL
   the visitor actually wanted. After any successful login (or
   after a guarded page bounces them to the homepage), we send
   them straight there instead of always landing on the generic
   dashboard.
   ========================================================= */

// Remember a URL to send the visitor to once they're logged in.
function setIntendedDestination(url) {
  sessionStorage.setItem(DEST_KEY, url);
}

// Read + clear that remembered URL, and navigate there (or to a
// fallback if nothing was remembered — e.g. someone who opened
// the login form directly from the header, not via a gated link).
function goToIntendedDestination(fallback) {
  const dest = sessionStorage.getItem(DEST_KEY);
  sessionStorage.removeItem(DEST_KEY);
  if (typeof showPageLoader === "function") showPageLoader();
  window.location.href = dest || fallback || "profile.html";
}

/* Click-intercept gate for links/buttons that should be visible to
   everyone but require an account to actually open — vehicle
   details, "check out", category chips, "see more", the navbar
   search, the cart icon, the hero "explore cars" CTA, etc.

   If already logged in: returns true, so an <a href="..."> just
   navigates normally (nothing else to do).
   If logged out: cancels the click, remembers the destination,
   pops the login modal open, and returns false.

   Usage on a link:  onclick="return requireLoginForNav(event, 'cart.html')" */
function requireLoginForNav(e, destinationUrl) {
  if (getSession()) return true;
  if (e) e.preventDefault();
  setIntendedDestination(destinationUrl);
  showToast("Please log in to continue.", "info");
  const modal = document.querySelector(".login-form-container");
  if (modal) modal.classList.add("active");
  return false;
}


/* =========================================================
   CATEGORY 3: SESSION
   The logged-in user is just one JSON object in localStorage.
   No tokens/expiry to manage since there's no real server —
   "logged in" simply means this key exists.
   ========================================================= */

// Returns the current session object, or null if logged out.
function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch (e) {
    return null; // malformed/missing data — treat as logged out
  }
}

// Persist a session (adds a "since" timestamp the first time),
// then refresh the header's login-button ↔ profile-chip swap.
function setSession(session) {
  session.since = session.since || new Date().toISOString();
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  if (typeof renderAuthHeader === "function") renderAuthHeader(); // defined in ui.js
}

// Shallow-merge a partial update into the current session — used
// by the Account Settings form (name/phone) and avatar upload.
function updateSession(patch) {
  const session = getSession();
  if (!session) return;
  setSession(Object.assign({}, session, patch));
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  showToast("You've been logged out.", "info");
  setTimeout(() => {
    if (typeof showPageLoader === "function") showPageLoader();
    window.location.href = "index.html";
  }, 400);
}


/* =========================================================
   CATEGORY 4: PAGE GUARD
   For pages that are ENTIRELY gated (product.html, vehicles.html,
   cart.html, checkout.html, profile.html) rather than just
   individual links on a public page. Called at the very top of
   each page's DOMContentLoaded handler:

       if (!requireLogin()) return;

   Unlike requireLoginForNav (which intercepts a click before any
   navigation happens), this runs AFTER the page has already been
   requested — it covers someone bookmarking or typing the URL
   directly, not just clicking a gated link.
   ========================================================= */
function requireLogin() {
  if (!getSession()) {
    // Remember this exact page (path + query string) so login sends
    // the visitor right back to it, e.g. product.html?id=vehicle-3
    setIntendedDestination(window.location.pathname.split("/").pop() + window.location.search);
    sessionStorage.setItem("autogod_redirect_reason", "login-required");
    if (typeof showPageLoader === "function") showPageLoader();
    window.location.href = "index.html";
    return false;
  }
  return true;
}


/* =========================================================
   CATEGORY 5: LOCAL DEMO ACCOUNTS
   Email/password "sign up or log in" against a plain array of
   {name, email, password} objects in localStorage. This is a
   convenience for demoing the site without needing a Google/
   Facebook app — it is NOT secure (plaintext passwords, no
   server, anyone with devtools can read them). See SETUP.md.
   ========================================================= */

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Single submit handler for the login/signup form — which branch
// runs depends on form.dataset.mode ("login" or "signup"), toggled
// by toggleAuthMode() below.
function handleLocalAuthSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const mode = form.dataset.mode || "login";
  const email = form.querySelector('[name="email"]').value.trim().toLowerCase();
  const password = form.querySelector('[name="password"]').value;
  const nameField = form.querySelector('[name="fullname"]'); // only present/visible in signup mode
  const name = nameField ? nameField.value.trim() : "";

  if (!email || !password) {
    showToast("Please fill in your email and password.", "error");
    return;
  }

  const users = getUsers();

  if (mode === "signup") {
    if (!name) {
      showToast("Please enter your full name.", "error");
      return;
    }
    if (users.some(u => u.email === email)) {
      showToast("That email already has an account — try logging in instead.", "error");
      return;
    }
    users.push({ name, email, password });
    saveUsers(users);
    setSession({ name, email, picture: null, provider: "local" });
    showToast("Account created — welcome to AutoGod!", "success");
  } else {
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      showToast("Incorrect email or password.", "error");
      return;
    }
    setSession({ name: user.name, email: user.email, picture: null, provider: "local" });
    showToast("Welcome back, " + user.name + "!", "success");
  }

  // Small delay so the success toast is visible before we navigate away.
  setTimeout(() => { goToIntendedDestination("profile.html"); }, 500);
}

// Flips the shared login form between "login" and "signup" presentation:
// shows/hides the full-name field, swaps heading/button text, and
// rewrites the "don't have an account? / already have one?" link.
function toggleAuthMode(e) {
  if (e) e.preventDefault();
  const form = document.getElementById("auth-form");
  if (!form) return;
  const isSignup = form.dataset.mode === "signup";
  form.dataset.mode = isSignup ? "login" : "signup";

  const heading = document.getElementById("auth-heading");
  const submitBtn = document.getElementById("auth-submit");
  const fullnameField = document.getElementById("fullname-field");
  const forgotRow = document.getElementById("forgot-row");
  const toggleRow = document.getElementById("toggle-auth-row");

  if (form.dataset.mode === "signup") {
    heading.textContent = "create account";
    submitBtn.value = "sign up";
    fullnameField.style.display = "block";
    fullnameField.required = true;
    forgotRow.style.display = "none"; // "forgot password" doesn't apply while creating an account
    toggleRow.innerHTML = 'already have an account <a href="#" id="toggle-auth-mode">login</a>';
  } else {
    heading.textContent = "user login";
    submitBtn.value = "login";
    fullnameField.style.display = "none";
    fullnameField.required = false;
    forgotRow.style.display = "block";
    toggleRow.innerHTML = "don't have an account <a href=\"#\" id=\"toggle-auth-mode\">create one</a>";
  }
  // toggleRow's innerHTML was just replaced, so the old link element (and
  // its listener) is gone — re-attach to the freshly-inserted one.
  document.getElementById("toggle-auth-mode").addEventListener("click", toggleAuthMode);
}

// Simple local-only "reset" flow using window.prompt — there's no email
// service wired up for this (unlike the contact form / order receipts),
// so it just lets someone with access to this browser set a new password
// for an account that already exists here. Documented as a demo-only
// convenience in SETUP.md, not a secure recovery mechanism.
function handleForgotPassword(e) {
  e.preventDefault();
  const email = window.prompt("Enter the email on your AutoGod account:");
  if (!email) return;
  const users = getUsers();
  const user = users.find(u => u.email === email.trim().toLowerCase());
  if (!user) {
    showToast("We couldn't find an account with that email.", "error");
    return;
  }
  const newPassword = window.prompt("Enter a new password for " + user.email + ":");
  if (!newPassword) return;
  user.password = newPassword;
  saveUsers(users);
  showToast("Password updated — you can log in now.", "success");
}

function closeLoginForm() {
  const modal = document.querySelector(".login-form-container");
  if (modal) modal.classList.remove("active");
}

// "Peek" toggle for the password field — swaps the input between
// type="password" (dots) and type="text" (plain), and flips the
// eye/eye-slash icon + aria-label to match.
function togglePasswordVisibility() {
  const input = document.getElementById("password-input");
  const btn = document.getElementById("toggle-password-btn");
  if (!input || !btn) return;
  const icon = btn.querySelector("i");
  const showing = input.type === "text";
  input.type = showing ? "password" : "text";
  if (icon) icon.className = showing ? "fas fa-eye" : "fas fa-eye-slash";
  btn.setAttribute("aria-label", showing ? "show password" : "hide password");
}


/* =========================================================
   CATEGORY 6: GOOGLE SIGN-IN
   Uses Google's official "Identity Services" client library
   (loaded in each page's <script> tags). We render Google's own
   required button into an off-screen host element, then proxy
   clicks from AutoGod's own styled "google" pill through to it —
   that keeps the black/yellow look while still using Google's
   fully-supported sign-in flow underneath (see initGoogleSignIn).
   ========================================================= */

// Decodes the middle segment of a Google ID token (a JWT) to plain
// JSON — this is NOT signature verification (that would need a real
// backend); it's just reading the name/email/picture Google already
// vouched for when it issued the token to this browser.
function parseJwt(token) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
  );
  return JSON.parse(json);
}

// Registered with Google as the callback for a successful sign-in.
function handleGoogleCredentialResponse(response) {
  const payload = parseJwt(response.credential);
  setSession({
    name: payload.name,
    email: payload.email,
    picture: payload.picture,
    provider: "google"
  });
  closeLoginForm();
  showToast("Signed in with Google — welcome, " + payload.given_name + "!", "success");
  setTimeout(() => { goToIntendedDestination("profile.html"); }, 500);
}

// Called via the `onload` attribute on the Google <script> tag once
// their SDK has finished loading (see the bottom of every HTML page).
function initGoogleSignIn() {
  if (!window.google || !isConfigured(AUTOGOD_CONFIG.GOOGLE_CLIENT_ID)) return; // not configured yet — see SETUP.md
  google.accounts.id.initialize({
    client_id: AUTOGOD_CONFIG.GOOGLE_CLIENT_ID,
    callback: handleGoogleCredentialResponse,
    auto_select: false
  });
  const host = document.getElementById("google-btn-host"); // positioned off-screen via CSS
  if (host) {
    google.accounts.id.renderButton(host, { type: "standard", theme: "outline", size: "large", width: 280 });
  }
}

// Wired to the click on AutoGod's own styled "google" pill in the
// login form — forwards the click to Google's real (hidden) button.
function triggerGoogleLogin() {
  if (!isConfigured(AUTOGOD_CONFIG.GOOGLE_CLIENT_ID)) {
    showToast("Google login needs setup — add your Client ID in js/config.js (see SETUP.md).", "info");
    return;
  }
  const host = document.getElementById("google-btn-host");
  const realBtn = host && host.querySelector('div[role="button"]');
  if (realBtn) {
    realBtn.click();
  } else {
    showToast("Google Sign-In is still loading — try again in a second.", "info");
  }
}


/* =========================================================
   CATEGORY 7: FACEBOOK LOGIN
   Uses Facebook's JS SDK (loaded async in each page). Unlike
   Google above, we don't need a hidden real button here — the
   Facebook SDK's FB.login() can be triggered directly from our
   own styled button.
   ========================================================= */

// Facebook's SDK looks for this exact global function name once
// its own script has finished loading.
window.fbAsyncInit = function () {
  if (!isConfigured(AUTOGOD_CONFIG.FACEBOOK_APP_ID)) return; // not configured yet — see SETUP.md
  FB.init({
    appId: AUTOGOD_CONFIG.FACEBOOK_APP_ID,
    cookie: true,
    xfbml: false,
    version: "v19.0"
  });
};

function triggerFacebookLogin() {
  if (!isConfigured(AUTOGOD_CONFIG.FACEBOOK_APP_ID)) {
    showToast("Facebook login needs setup — add your App ID in js/config.js (see SETUP.md).", "info");
    return;
  }
  if (typeof FB === "undefined") {
    showToast("Facebook SDK is still loading — try again in a second.", "info");
    return;
  }
  FB.login(function (response) {
    if (response.authResponse) {
      // Second call to fetch the profile fields we actually want to store.
      FB.api("/me", { fields: "name,email,picture.width(200).height(200)" }, function (userInfo) {
        setSession({
          name: userInfo.name,
          email: userInfo.email || userInfo.id + "@facebook.local", // some FB accounts hide email
          picture: userInfo.picture && userInfo.picture.data && userInfo.picture.data.url,
          provider: "facebook"
        });
        closeLoginForm();
        showToast("Signed in with Facebook — welcome, " + userInfo.name + "!", "success");
        setTimeout(() => { goToIntendedDestination("profile.html"); }, 500);
      });
    }
  }, { scope: "public_profile,email" });
}


/* =========================================================
   CATEGORY 8: WIRE-UP
   Runs on every page (the login modal markup is duplicated
   across all of them). Attaches every handler above to its
   corresponding element, and — if this page load is the result
   of a requireLogin() redirect — pops the modal open with an
   explanatory toast.
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const authForm = document.getElementById("auth-form");
  if (authForm) authForm.addEventListener("submit", handleLocalAuthSubmit);

  const toggleLink = document.getElementById("toggle-auth-mode");
  if (toggleLink) toggleLink.addEventListener("click", toggleAuthMode);

  const forgotLink = document.getElementById("forgot-password-link");
  if (forgotLink) forgotLink.addEventListener("click", handleForgotPassword);

  const togglePasswordBtn = document.getElementById("toggle-password-btn");
  if (togglePasswordBtn) togglePasswordBtn.addEventListener("click", togglePasswordVisibility);

  const googleBtn = document.getElementById("google-login-btn");
  if (googleBtn) googleBtn.addEventListener("click", (e) => { e.preventDefault(); triggerGoogleLogin(); });

  const facebookBtn = document.getElementById("facebook-login-btn");
  if (facebookBtn) facebookBtn.addEventListener("click", (e) => { e.preventDefault(); triggerFacebookLogin(); });

  // Arrived here via a requireLogin() page-guard redirect (not a
  // requireLoginForNav click-intercept, which opens the modal itself
  // immediately without a page reload) — open the modal automatically.
  if (sessionStorage.getItem("autogod_redirect_reason") === "login-required") {
    sessionStorage.removeItem("autogod_redirect_reason");
    showToast("Please log in to continue.", "info");
    const modal = document.querySelector(".login-form-container");
    if (modal) modal.classList.add("active");
  }
});
