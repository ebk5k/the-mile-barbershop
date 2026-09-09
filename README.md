# The Mile barbershop — Huntington Park, CA

Mobile-first website for The Mile barbershop (6350 Miles Ave). Static HTML/CSS/JS, no build step.

- `index.html` — page structure; every string carries `data-en` / `data-es` for the language toggle.
- `js/content.js` — every fact (hours, phone, reviews, services, photo captions). Edit here, never in the HTML.
- `js/app.js` — language toggle, live open/closed status (America/Los_Angeles), feed/grid/viewer rendering.
- `assets/img/feed/*.webp` (4:5) and `assets/img/sq/*.webp` (1:1) — enhanced Google Business Profile photos.

Photos were pulled from the shop's public Google Business Profile and enhanced (subject masking, background blur, one unified colour grade). Hours come from the shop's printed business card; Google's listing showed a 10 AM opening for Tuesday — confirm with the owner.
