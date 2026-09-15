/* =========================================================
   AutoGod — Contact form + newsletter
   =========================================================
   CATEGORY: CONTACT FORM (Formspree)
   The homepage "get in touch" form POSTs directly to a
   Formspree endpoint (AUTOGOD_CONFIG.FORMSPREE_CONTACT_URL) —
   Formspree handles the actual email delivery on their end, so
   no backend or API key is needed here at all. We submit it
   via fetch() (instead of a plain HTML form POST) purely so we
   can show a success/error toast without leaving the page.

   CATEGORY: EMAILJS INIT (used by checkout.js for order emails)
   Order-confirmation email is a separate, optional feature over
   in checkout.js — this file just initialises the EmailJS SDK
   once on page load so it's ready if that feature is configured.

   CATEGORY: NEWSLETTER (local only)
   "Subscribe" never required an account and still doesn't — it
   just records the email address in this browser's localStorage.
   Wiring it to a real mailing-list provider (Mailchimp, etc.)
   would follow the exact same fetch() pattern as the contact
   form below.
   ========================================================= */

// Sets up the EmailJS SDK (if its script loaded and a real public
// key is configured) so checkout.js can send order-confirmation
// emails later. Safe to call even if EmailJS isn't configured —
// it just quietly does nothing.
function initEmailJs() {
  if (typeof emailjs === "undefined") return;
  if (!isConfigured(AUTOGOD_CONFIG.EMAILJS_PUBLIC_KEY)) return;
  emailjs.init({ publicKey: AUTOGOD_CONFIG.EMAILJS_PUBLIC_KEY });
}

// Used by checkout.js to check "is the EmailJS order-confirmation
// email actually configured?" before trying to send one.
function emailJsReady(templateKey) {
  return typeof emailjs !== "undefined" &&
    isConfigured(AUTOGOD_CONFIG.EMAILJS_PUBLIC_KEY) &&
    isConfigured(AUTOGOD_CONFIG.EMAILJS_SERVICE_ID) &&
    isConfigured(AUTOGOD_CONFIG[templateKey]);
}

/* ---------- Contact form → Formspree ---------- */
function handleContactSubmit(e) {
  e.preventDefault(); // stop the normal full-page POST; we submit via fetch() instead
  const form = e.target;
  const name = form.querySelector('[name="name"]').value.trim();
  const email = form.querySelector('[name="email"]').value.trim();
  const subject = form.querySelector('[name="subject"]').value.trim();
  const message = form.querySelector('[name="message"]').value.trim();

  if (!name || !email || !message) {
    showToast("Please fill in your name, email, and message.", "error");
    return;
  }

  const submitBtn = form.querySelector('input[type="submit"]');
  const originalLabel = submitBtn.value;
  submitBtn.value = "sending...";
  submitBtn.disabled = true;

  // Formspree accepts a plain FormData POST and returns JSON when
  // asked via the Accept header — no API key needed on this end,
  // the destination inbox is baked into the form URL itself.
  fetch(AUTOGOD_CONFIG.FORMSPREE_CONTACT_URL, {
    method: "POST",
    headers: { "Accept": "application/json" },
    body: new FormData(form)
  })
    .then((response) => {
      if (response.ok) {
        showToast("Message sent — we'll get back to you soon!", "success");
        form.reset();
      } else {
        // Formspree returns { errors: [{ message: "..." }, ...] } on failure
        return response.json().then((data) => {
          const detail = (data.errors || []).map((err) => err.message).join(", ");
          throw new Error(detail || "Formspree rejected the request.");
        });
      }
    })
    .catch((err) => {
      console.error("Contact form send failed:", err);
      showToast("Something went wrong sending that. Please try again.", "error");
    })
    .finally(() => {
      submitBtn.value = originalLabel;
      submitBtn.disabled = false;
    });
}

/* ---------- Newsletter signup (local-only, unchanged) ---------- */
function handleNewsletterSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const emailInput = form.querySelector('input[type="email"]');
  const email = emailInput.value.trim();
  if (!email) return;
  const subs = readJson("autogod_newsletter", []); // readJson/writeJson come from shop.js
  if (!subs.includes(email)) subs.push(email);
  writeJson("autogod_newsletter", subs);
  showToast("Subscribed! Thanks for joining.", "success");
  form.reset();
}

document.addEventListener("DOMContentLoaded", () => {
  initEmailJs();

  const contactForm = document.getElementById("contact-form");
  if (contactForm) contactForm.addEventListener("submit", handleContactSubmit);

  const newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) newsletterForm.addEventListener("submit", handleNewsletterSubmit);
});
