/* =========================================================
   AutoGod — Site Configuration
   =========================================================
   CATEGORY: THIRD-PARTY CREDENTIALS / ENDPOINTS
   One place for every external key/URL the site talks to, so
   nothing is hard-coded inside the feature files themselves.
   Full setup instructions for the placeholder values are in
   SETUP.md at the project root.
   ========================================================= */

const AUTOGOD_CONFIG = {

  /* ---- Google Sign-In ----
     Google Cloud Console → APIs & Services → Credentials →
     "Create Credentials" → OAuth client ID → Web application.
     Still a placeholder — fill in your own to enable this button. */
  GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",

  /* ---- Facebook Login ----
     developers.facebook.com → My Apps → Create App → Consumer
     → add "Facebook Login" product → Settings → Basic → App ID.
     Still a placeholder — fill in your own to enable this button. */
  FACEBOOK_APP_ID: "YOUR_FACEBOOK_APP_ID",

  /* ---- Contact form → your inbox, via Formspree ----
     This one is LIVE — real requests from the homepage contact
     form are POSTed here and Formspree forwards them by email.
     No setup needed; change this URL if you ever move to a
     different Formspree form. */
  FORMSPREE_CONTACT_URL: "https://formspree.io/f/xrpgjjao",

  /* ---- Order-confirmation email, via EmailJS ----
     Optional extra: if configured, checkout.js emails a receipt
     when an order is placed. Still placeholders — see SETUP.md.
     (Contact-form email uses Formspree above, not this.) */
  EMAILJS_PUBLIC_KEY: "YOUR_EMAILJS_PUBLIC_KEY",
  EMAILJS_SERVICE_ID: "YOUR_EMAILJS_SERVICE_ID",
  EMAILJS_ORDER_TEMPLATE_ID: "YOUR_EMAILJS_ORDER_TEMPLATE_ID",

  // Shown to the customer / used as the "to" address for the optional
  // EmailJS order-confirmation email above.
  OWNER_EMAIL: "anakorchinedu93@gmail.com"
};

// Quick check used throughout the codebase: "is this value a real
// credential, or still the placeholder text we shipped it with?"
function isConfigured(value) {
  return typeof value === "string" && value && !value.startsWith("YOUR_");
}
