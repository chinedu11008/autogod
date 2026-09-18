# AutoGod — Setup Guide

> Looking for a project overview, feature list, or file structure map
> instead? See **[README.md](README.md)**. This file is just the
> credential setup + deployment instructions.

This site is fully working out of the box: browsing, product pages, cart,
checkout, orders, wishlist, test-drive bookings, editing your profile
(including a photo upload), and a local email/password login all work
with zero configuration, stored in your browser's localStorage. The
**contact form is also fully live** — it emails you today, see below.

**Browsing the homepage is open to everyone**, but actually searching,
filtering, viewing a vehicle's full details, opening the cart, or opening
the full listings page (`vehicles.html`) requires an account — clicking
any of those (including the header's cart icon and the hero's "explore
cars" button) opens the login form automatically and, once signed in,
takes you straight to the page you were trying to reach. Subscribing to
the newsletter and sending a message from the contact form never require
an account.

Two things are still stubbed with placeholders because they need *your
own* free credentials to become fully real: **Google login** and
**Facebook login**. The site works without them, just with those two
specific buttons showing a friendly "needs setup" message instead of
doing the real thing.

All credentials/endpoints go in one file: **`js/config.js`**.

---

## 1. Google Sign-In (real login, ~5 minutes)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and
   create a project (or use an existing one).
2. Go to **APIs & Services → OAuth consent screen** and set it up for
   **External** users (fill in an app name, your email — that's enough for
   testing).
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth
   client ID**.
4. Application type: **Web application**.
5. Under **Authorized JavaScript origins**, add every URL you'll open the
   site from, for example:
   - `http://localhost:5500` (or whatever port your local server uses)
   - `https://yourusername.github.io` (if you deploy to GitHub Pages)
6. Click **Create**. Copy the **Client ID** (looks like
   `123456-abc.apps.googleusercontent.com`).
7. Paste it into `js/config.js`:
   ```js
   GOOGLE_CLIENT_ID: "123456-abc.apps.googleusercontent.com",
   ```

That's it — the "google" button in the login form will now run a real
Google sign-in.

---

## 2. Facebook Login (real login, ~10 minutes)

1. Go to [developers.facebook.com](https://developers.facebook.com/) →
   **My Apps → Create App** → choose **Consumer**.
2. In your new app's dashboard, click **Add Product** and set up
   **Facebook Login**.
3. In **Facebook Login → Settings**, add your site's URL to **Valid OAuth
   Redirect URIs** and **Allowed Domains for the JavaScript SDK**.
4. Go to **Settings → Basic** and copy the **App ID**.
5. Paste it into `js/config.js`:
   ```js
   FACEBOOK_APP_ID: "your-app-id",
   ```
6. While your app is in **Development Mode**, only accounts added as
   testers/developers under **Roles** can log in with it. Go to **App
   Review → Make [App Name] public** when you're ready for real users.

---

## 3. Contact form emails — already live (Formspree)

Nothing to set up here. The homepage's "get in touch" form POSTs
straight to Formspree (`AUTOGOD_CONFIG.FORMSPREE_CONTACT_URL` in
`js/config.js`, currently `https://formspree.io/f/xrpgjjao`), which
forwards it to your inbox — no backend, no API key, no account creation
needed on your end. If you ever want messages to go to a different
inbox, create your own form at [formspree.io](https://www.formspree.io/)
and swap in the new URL.

## 4. Order emails — receipt + new-order alert (optional, EmailJS)

Separate from the contact form above. **This is worth setting up before
going live**, not just a nice-to-have: right now, if a customer "buys" a
car, the only record of it is saved in *their own browser* — you, the
dealership, have no way of finding out an order came in unless this is
configured. Once it is, placing an order sends two emails from the same
template: a receipt to the customer, and a new-order alert to you
(`OWNER_EMAIL` below).

1. Create a free account at [emailjs.com](https://www.emailjs.com/).
2. **Email Services** → **Add New Service** → connect your Gmail (or
   Outlook, etc.). Copy the **Service ID**.
3. **Email Templates** → **Create New Template** using:
   `{{order_id}}`, `{{customer_name}}`, `{{customer_email}}`,
   `{{items}}`, `{{total}}`, and set the template's "To Email" field to
   `{{to_email}}` (the code sends this dynamically — once for the
   customer's address, once for yours). Copy the **Template ID**.
4. **Account → General** → copy your **Public Key**.
5. Paste everything into `js/config.js`:
   ```js
   EMAILJS_PUBLIC_KEY: "...",
   EMAILJS_SERVICE_ID: "...",
   EMAILJS_ORDER_TEMPLATE_ID: "...",
   OWNER_EMAIL: "anakorchinedu93@gmail.com"
   ```

Until this is set up, checkout still works exactly the same — orders are
just saved to the dashboard with no email to either side.

---

## Good to know

**The local email/password login is a front-end demo, not real security.**
Accounts and passwords for that option are stored in plain text in the
visitor's own browser (localStorage) — there's no server or database.
It's genuinely useful for demoing the dashboard/orders/wishlist features
without needing Google or Facebook, but don't treat it as a secure account
system for real customer data. A production version of this would need a
real backend (e.g. Node/Express + a database + hashed passwords).

**Profile photos are stored the same way.** In Account Settings, a local
(email/password) account can upload a photo — it's saved as a base64
data-URL directly on the session object in localStorage, capped at
1.5MB, since there's no server to upload a file to. Google/Facebook
accounts keep their provider photo instead (not editable here).

**Checkout is a fully working *demo* transaction, not a live payment
gateway.** A website's front-end alone can't safely charge a real card —
that requires a PCI-compliant backend. What's here validates the form,
"processes" the order, saves it to the customer's dashboard, and can email
a confirmation — everything except actually moving money. When you're
ready to accept real payments, the most common next step is
[Stripe Checkout](https://stripe.com/docs/payments/checkout) (they host
the actual card entry for you) wired up to a small backend endpoint.

**All customer data (accounts, orders, wishlist, bookings, uploaded
photos) lives in each visitor's own browser**, not a shared database —
so it won't show up on a different device or browser, and clearing
browser data clears it. That's inherent to a pure front-end site; a real
multi-device version would need a backend + database.

**Every file is commented.** Each JS file opens with a "CATEGORIES IN
THIS FILE" banner and has labeled sections underneath; HTML files have
`<!-- ... -->` markers on every major section; style.css is divided into
clearly-labeled blocks too — including the original template's CSS/JS,
which were only ever annotated with comments, never functionally changed.

---

## Running it locally

Any static file server works, for example, from the project folder:

```bash
python3 -m http.server 5500
```

Then open `http://localhost:5500` — remember to add that exact origin to
your Google/Facebook app settings (step 1.5 and 2.3 above) or those
buttons won't work on localhost.

## Deploying

This is a static site — GitHub Pages, Netlify, Vercel, or any static host
works with zero build step. Just remember to add your deployed URL to the
Google/Facebook "allowed origins" lists too.
