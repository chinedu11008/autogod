/* =========================================================
   AutoGod — Original template script
   =========================================================
   This is the site's original interactive script (mobile menu,
   login-modal toggle, header scroll shadow, homepage parallax
   hero, and the Swiper carousels) — only used on index.html,
   since it's the only page with a parallax hero + sliders.
   Every other page uses the trimmed-down js/layout.js instead
   (see that file for why).

   Only two things were added to this file beyond the original:
     - `navigation: { nextEl / prevEl }` on the vehicles-slider
       and featured-slider Swiper configs, wiring up the new
       prev/next arrow buttons added to index.html.
     - The featured-slider's swiper-wrapper now contains all 8
       cards in one continuous list (see index.html) — this file
       didn't need any change for that fix, just the HTML did.
   Everything else below is unchanged from the original template.

   CATEGORIES IN THIS FILE
     1. Mobile menu toggle
     2. Login modal open/close
     3. Header scroll shadow
     4. Homepage hero parallax effect
     5. Swiper carousels (vehicles / featured / reviews)
     6. Page loader helpers
   ========================================================= */

/* ---------- CATEGORY 1: Mobile menu toggle ---------- */
let menu = document.querySelector('#menu-btn');
let navbar = document.querySelector('.navbar');

menu.onclick = () =>{
  menu.classList.toggle('fa-times');
  navbar.classList.toggle('active');
}

/* ---------- CATEGORY 2: Login modal open/close ----------
   Note: js/auth.js's requireLoginForNav()/requireLogin() also
   open this same modal programmatically (the gated-link flow) —
   this is just the manual open/close for the header button. */
document.querySelector('#login-btn').onclick = () =>{
  document.querySelector('.login-form-container').classList.toggle('active');
}

document.querySelector('#close-login-form').onclick = () =>{
  document.querySelector('.login-form-container').classList.remove('active');
}

/* ---------- CATEGORY 3: Header scroll shadow ----------
   Also closes the mobile menu if it was left open, and adds
   .header.active (see style.css) once the page has scrolled
   at all, for a background/shadow behind the fixed header. */
window.onscroll = () =>{

  menu.classList.remove('fa-times');
  navbar.classList.remove('active');

  if(window.scrollY > 0){
    document.querySelector('.header').classList.add('active');
  }else{
    document.querySelector('.header').classList.remove('active');
  };

};

/* ---------- CATEGORY 4: Homepage hero parallax effect ----------
   Every element with class="home-parallax" (the hero image
   layers + the "explore cars" button) shifts slightly opposite
   the mouse position, each at its own data-speed — a subtle
   depth effect, purely cosmetic. Only relevant on index.html's
   .home hero section, which is why this file isn't reused as-is
   on the other pages (see the file banner comment above). */
document.querySelector('.home').onmousemove = (e) =>{

  document.querySelectorAll('.home-parallax').forEach(elm =>{

    let speed = elm.getAttribute('data-speed');

    let x = (window.innerWidth - e.pageX * speed) / 90;
    let y = (window.innerHeight - e.pageY * speed) / 90;

    elm.style.transform = `translateX(${y}px) translateY(${x}px)`;

  });

};

// Resets every parallax element back to its resting position
// once the mouse leaves the hero section.
document.querySelector('.home').onmouseleave = (e) =>{

  document.querySelectorAll('.home-parallax').forEach(elm =>{

    elm.style.transform = `translateX(0px) translateY(0px)`;

  });

};

/* ---------- CATEGORY 5: Swiper carousels ----------
   Three separate Swiper instances power the homepage's sliders.
   All three share the same autoplay/pagination/breakpoint setup;
   only vehicles-slider and featured-slider got a `navigation`
   block added (wiring the new prev/next arrow buttons) — see the
   file banner comment at the top of this file. */

// "Popular Vehicles" section (6 cards, image/vehicle-*.png).
var swiper = new Swiper(".vehicles-slider", {
  grabCursor: true,
  centeredSlides: true,  
  spaceBetween: 20,
  loop:true,
  autoplay: {
    delay: 9500,
    disableOnInteraction: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable:true,
  },
  navigation: {
    nextEl: "#vehicles-next",
    prevEl: "#vehicles-prev",
  },
  breakpoints: {
    0: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 2,
    },
    1024: {
      slidesPerView: 3,
    },
  },
});

// "Featured Cars" section (8 cards, image/car-*.png). This selector
// used to match TWO separate swiper-wrapper containers in the
// original template (a bug — only the first 4 cards were ever
// part of a working carousel); index.html now has one continuous
// swiper-wrapper with all 8, so this single Swiper instance
// correctly covers the whole section.
var swiper = new Swiper(".featured-slider", {
  grabCursor: true,
  centeredSlides: true,  
  spaceBetween: 20,
  loop:true,
  autoplay: {
    delay: 9500,
    disableOnInteraction: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable:true,
  },
  navigation: {
    nextEl: "#featured-next",
    prevEl: "#featured-prev",
  },
  breakpoints: {
    0: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 2,
    },
    1024: {
      slidesPerView: 3,
    },
  },
});

// "Reviews" (testimonials) section — no prev/next arrows were
// requested for this one, only pagination dots + autoplay.
var swiper = new Swiper(".review-slider", {
  grabCursor: true,
  centeredSlides: true,  
  spaceBetween: 20,
  loop:true,
  autoplay: {
    delay: 9500,
    disableOnInteraction: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable:true,
  },
  breakpoints: {
    0: {
      slidesPerView: 1,
    },
    768: {
      slidesPerView: 2,
    },
    1024: {
      slidesPerView: 3,
    },
  },
});

/* ---------- CATEGORY 6: Page loader helpers ----------
   These two functions are exactly as the original template shipped
   them — still never called by anything, so still effectively dead
   code. A REAL, working page-transition loader now exists, just not
   here: see js/page-loader.js (shared across every page) and the
   .loader-container element at the top of each page's <body>. */
function loader(){
  document.querySelector('.loader-container').classList.add('active');
}

function fadeOut(){
  setTimeout(loader, 4000);
}