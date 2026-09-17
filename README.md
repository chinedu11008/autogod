# AutoGod — Car Dealership Website

A full front-end car-sales website built on top of an original static
HTML/CSS/JS template: browsing, search & filters, a login-gated shopping
flow (product details → cart → checkout), a customer dashboard, and a
working contact form — all client-side, no backend server required.

> **New here?** This file is the map of the project. For step-by-step
> instructions on turning on Google login, Facebook login, or
> order-confirmation emails, see **[SETUP.md](SETUP.md)** instead.

---

## What's in here

| Area | What it does |
|---|---|
| **Browsing** | Homepage (`index.html`) is open to everyone — hero, popular vehicles, services, featured cars, newsletter, reviews, contact. |
| **Search & filters** | Navbar search bar on every page; a full listing page (`vehicles.html`) with 9 filters (category, brand, model, price, year, mileage, fuel type, transmission, availability) plus an All/Popular/Featured toggle. |
| **Accounts** | Google Sign-In, Facebook Login, or a local email/password demo account — pick any of the three from one shared login/signup form. |
| **Login gating** | Vehicle details, search, filters, category links, "See More", the cart, and checkout all require an account. Clicking any of them while logged out opens the login form and — once you sign in — continues you straight to the page you were trying to reach, instead of dumping you on a generic dashboard. Subscribing to the newsletter and sending a contact message never require an account. |
| **Shopping** | Product detail pages with full specs, add-to-cart / buy-now, a cart page, and a checkout flow (simulated payment — see [Known limitations](#known-limitations)). |
| **Customer dashboard** | Order history, a wishlist ("saved cars"), test-drive booking, and account settings — including editing your name/phone and, for local accounts, uploading a profile photo. |
| **Contact form** | Sends real email today via [Formspree](https://formspree.io) — no setup needed. |

---

## Getting started

No build step, no `npm install` — it's plain HTML/CSS/JS.

```bash
cd autogod
python3 -m http.server 5500
```

Then open `http://localhost:5500`. See **[SETUP.md](SETUP.md)** for:
- turning on real Google / Facebook login,
- turning on order-confirmation emails,
- deploying it (GitHub Pages, Netlify, Vercel, etc).

---

## Project structure

```
autogod/
├── index.html            Public homepage (only ungated page)
├── vehicles.html          Full catalog: search + filters + All/Popular/Featured
├── product.html            One vehicle's full detail page (?id=vehicle-1, etc.)
├── cart.html                Shopping cart
├── checkout.html              Contact/payment form → simulated order
├── profile.html                 Customer dashboard (orders/wishlist/bookings/settings)
│
├── style.css              ONE stylesheet for the whole site. Original template
│                          CSS first, then everything added on top, clearly
│                          divided — see the file's own header comment.
├── script.js              Original template script — index.html ONLY (parallax
│                          hero + the three Swiper carousels).
│
├── js/
│   ├── config.js          All third-party keys/URLs in one place (see SETUP.md)
│   ├── cars-data.js       The car catalog — single source of truth, 14 vehicles
│   ├── auth.js             Login (Google/Facebook/local), sessions, the
│   │                       "continue where you left off after login" system
│   ├── shop.js              Cart, wishlist, orders, test-drive bookings
│   ├── ui.js                  Toast notifications, header login/profile swap
│   ├── contact.js              Contact form → Formspree; EmailJS init
│   ├── layout.js                 Menu/login-modal/scroll behavior for every
│   │                             page except index.html (which uses script.js)
│   ├── nav-search.js               Navbar search bar behavior
│   ├── product.js                    product.html's rendering logic
│   ├── cart-page.js                    cart.html's rendering logic
│   ├── checkout.js                       checkout.html's rendering + order flow
│   ├── vehicles.js                         vehicles.html's search/filter engine
│   └── dashboard.js                          profile.html's rendering logic
│
├── image/                 All photos/icons/favicon
├── SETUP.md                Credential setup + deployment instructions
└── README.md                 This file
```

---

## How it's organized (for anyone editing this)

**One car catalog, everywhere.** `js/cars-data.js` is the only place vehicle
data lives — the homepage cards, the listing page, product pages, the cart,
and the dashboard all read from the same `AUTOGOD_CARS` array. Add a new
car there and it shows up everywhere automatically.

**No server — localStorage is the database.** Sessions, local accounts,
carts, orders, wishlists, and test-drive bookings are all plain JSON in
the browser's `localStorage`/`sessionStorage`. That means:
- data doesn't sync across devices or browsers,
- it's genuinely fast (no network round-trip),
- and it disappears if someone clears their browser data.

See [Known limitations](#known-limitations) below for what a real backend
would change.

**The gating pattern.** Two small helpers in `js/auth.js` do all the
login-gating work on the whole site:
- `requireLoginForNav(event, url)` — used on individual links/buttons on
  public pages (the homepage's "check out", category chips, "See More",
  cart icon, "explore cars"). Lets the click through if logged in;
  otherwise cancels it, remembers the URL, and opens the login modal.
- `requireLogin()` — used at the top of a fully-gated page's own script
  (`product.js`, `vehicles.js`, `cart-page.js`, `checkout.js`,
  `dashboard.js`). Catches direct/bookmarked visits, not just clicks.

Both funnel into the same "remember where you were headed, then continue
there after login" system (`setIntendedDestination()` /
`goToIntendedDestination()`), so however someone reaches the login form,
signing in sends them to the right place.

**Script load order matters.** Every page loads its `<script>` tags in
the same order: `config.js` → `cars-data.js` → `ui.js` → `auth.js` →
`shop.js` → `contact.js` → `nav-search.js`, then the third-party SDKs
(Google/Facebook/EmailJS), then `layout.js` (or `script.js` on
index.html), then that page's own script last. Later files rely on
functions defined in earlier ones being already loaded.

**Comments throughout.** Every JS file opens with a banner explaining
what it's for and lists its own internal categories/sections. HTML files
have `<!-- ... -->` markers on every major section. `style.css` is
divided into labeled blocks, including the *original* template code
(only ever annotated with comments — never functionally changed).

---

## Known limitations

These are deliberate trade-offs of being a pure front-end site with no
backend — not bugs. Full detail and next-step suggestions for each are
in [SETUP.md](SETUP.md#good-to-know):

- **Local email/password login is a demo, not real security.** Plaintext
  passwords in localStorage — fine for trying out the dashboard, not for
  real customer accounts.
- **Checkout doesn't charge a real card.** A browser alone can't safely
  do that; this simulates the full flow (validation, a real saved order,
  an optional email receipt) short of actually moving money.
- **Data is per-browser, not shared.** No account data, orders, or
  uploaded photos sync across devices — there's no database.
- **Google/Facebook login need your own free credentials** to actually
  work (see SETUP.md) — until then those two buttons show a "needs
  setup" message.

## Credits

Built on top of a freely-available car-dealership HTML/CSS/JS template
(Poppins font, Font Awesome icons, Swiper.js carousels). Everything
described above — accounts, gating, cart/checkout, the dashboard, search
& filters, and the contact form's email delivery — was added on top
without changing the original design, layout, or styling.
